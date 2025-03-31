import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVideoCall } from "@/hooks/use-video-call";
import { VideoStream } from "@/components/video-stream";
import { useAppStore } from "@/store/use-app-store";
import { db } from "@/lib/firebase";
import { doc, updateDoc, onSnapshot, getDoc, serverTimestamp, collection, addDoc, query, orderBy, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  BsMicFill,
  BsMicMuteFill,
  BsCameraVideoFill,
  BsCameraVideoOffFill,
  BsThreeDotsVertical,
  BsPeopleFill,
  BsChatFill,
  BsRecord2Fill,
  BsShareFill,
  BsGrid3X3GapFill,
  BsGrid1X2Fill,
  BsDoorOpenFill
} from "react-icons/bs";
import { IoCallOutline } from "react-icons/io5";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: any;
}

interface Room {
  id: string;
  name: string;
  type: 'chat' | 'voice' | 'video';
  createdBy: string;
  createdAt: any;
  participants: Array<{
    id: string;
    username: string;
    role: string;
  }>;
  isActive: boolean;
  messages?: ChatMessage[];
}

interface VideoRoomProps {
  roomId: string;
  onLeave?: () => void;
}

export function VideoRoom({ roomId, onLeave }: VideoRoomProps) {
  const router = useRouter();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [gridLayout, setGridLayout] = useState<'grid' | 'spotlight'>('grid');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const currentUser = useAppStore((state) => state.currentUser);
  const addNotification = useAppStore((state) => state.addNotification);

  const {
    isConnected,
    localStream,
    remoteStreams,
    peers,
    connectToPeer,
    toggleAudio,
    toggleVideo,
  } = useVideoCall({
    roomId,
    userId: currentUser?.id || "anonymous",
    onPeerJoin: (peerId) => {
      addNotification({ message: `${peerId} joined the room`, type: "info" });
    },
    onPeerLeave: (peerId) => {
      addNotification({ message: `${peerId} left the call`, type: "info" });
    },
    onError: (error) => {
      addNotification({ message: error.message, type: "error" });
    },
  });

  useEffect(() => {
    if (activeRoom?.participants) {
      console.log("Active room participants:", activeRoom.participants);
      console.log("Current user:", currentUser?.id);
      console.log("Remote streams:", remoteStreams);
      console.log("Peers:", peers);
      
      if (Array.isArray(activeRoom.participants)) {
        activeRoom.participants.forEach((participant) => {
          if (participant.id !== currentUser?.id) {
            console.log("Attempting to connect to peer:", participant.id);
            connectToPeer(participant.id);
          }
        });
      } else {
        console.log("Participants is not an array:", activeRoom.participants);
      }
    }
  }, [activeRoom?.participants, currentUser?.id, connectToPeer]);

  // Add effect to fetch room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const roomRef = doc(db, "rooms", roomId);
        const unsubscribe = onSnapshot(roomRef, (snapshot) => {
          if (snapshot.exists()) {
            const roomData = snapshot.data() as Room;
            console.log("Room data updated:", roomData);
            // Ensure participants is always an array and has the correct structure
            if (!Array.isArray(roomData.participants)) {
              roomData.participants = [];
            }
            // Ensure each participant has the required fields
            roomData.participants = roomData.participants.map(participant => ({
              id: participant.id || '',
              username: participant.username || 'Anonymous',
              role: participant.role || 'participant'
            }));
            setActiveRoom(roomData);
          }
        });
        return unsubscribe;
      } catch (error) {
        console.error("Error fetching room:", error);
      }
    };

    fetchRoom();
  }, [roomId]);

  // Add effect to fetch chat messages
  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, "rooms", roomId, "messages");
    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"), limit(100));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        newMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(newMessages);
      // Scroll to bottom when new messages arrive
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [roomId]);

  const handleToggleAudio = () => {
    const isEnabled = toggleAudio();
    setIsAudioEnabled(isEnabled);
  };

  const handleToggleVideo = () => {
    const isEnabled = toggleVideo();
    setIsVideoEnabled(isEnabled);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const remoteStreamCount = Object.keys(remoteStreams).length;
  const totalParticipants = remoteStreamCount + (localStream ? 1 : 0);

  const deactivateRoom = async () => {
    try {
      const roomRef = doc(db, "rooms", roomId);
      console.log("Attempting to deactivate room:", roomId);
      
      // First verify the room exists and get its current data
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        console.error("Room does not exist");
        addNotification({ message: "Room not found", type: "error" });
        return;
      }

      const roomData = roomSnap.data();
      console.log("Current room data:", roomData);

      // Update the room
      await updateDoc(roomRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
      
      console.log("Room deactivated successfully");
      addNotification({ message: "Room ended successfully", type: "success" });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deactivating room:", error);
      addNotification({ 
        message: `Failed to deactivate room: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: "error" 
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      const messagesRef = collection(db, "rooms", roomId, "messages");
      await addDoc(messagesRef, {
        senderId: currentUser.id,
        senderName: currentUser.username,
        content: newMessage.trim(),
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      addNotification({ 
        message: "Failed to send message", 
        type: "error" 
      });
    }
  };

  return (
    <div className="relative flex h-screen w-full bg-[#0A0A0F] overflow-hidden">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showParticipants || showChat ? 'md:mr-96' : ''}`}>
        {/* Top Controls */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGridLayout(gridLayout === 'grid' ? 'spotlight' : 'grid')}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-lg transition-all duration-200"
          >
            {gridLayout === 'grid' ? (
              <BsGrid3X3GapFill className="w-5 h-5" />
            ) : (
              <BsGrid1X2Fill className="w-5 h-5" />
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-lg transition-all duration-200"
          >
            {isFullscreen ? (
              <FiMinimize2 className="w-5 h-5" />
            ) : (
              <FiMaximize2 className="w-5 h-5" />
            )}
          </motion.button>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-2 md:p-6">
          <div 
            className={cn(
              "grid h-full gap-2 md:gap-4",
              gridLayout === 'grid' ? [
                totalParticipants <= 1 && "place-items-center",
                totalParticipants === 2 && "grid-cols-1 md:grid-cols-2",
                totalParticipants === 3 && "grid-cols-1 md:grid-cols-2",
                totalParticipants === 4 && "grid-cols-1 md:grid-cols-2",
                totalParticipants > 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              ].filter(Boolean).join(" ") :
              "grid-cols-1 md:grid-cols-[1fr_300px]"
            )}
          >
            {/* Local Video */}
        {localStream && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "relative rounded-2xl overflow-hidden bg-slate-900/50 backdrop-blur-sm border border-white/10 min-h-[60vh] md:min-h-0",
                  gridLayout === 'grid' ? (
                    totalParticipants === 1 ? 'w-full max-w-4xl aspect-video' : 'w-full h-full'
                  ) : (
                    remoteStreamCount === 0 ? 'col-span-2' : 'row-span-1'
                  )
                )}
              >
          <VideoStream
            stream={localStream}
            isMuted
            isLocal
                  className="rounded-2xl h-full w-full object-cover"
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-3xl font-semibold text-white">
                        {(currentUser?.username?.[0] || 'Y').toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Remote Videos */}
            {Object.entries(remoteStreams).map(([peerId, stream], index) => (
              <motion.div
                key={peerId}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative rounded-2xl overflow-hidden bg-slate-900/50 backdrop-blur-sm border border-white/10 w-full min-h-[60vh] md:min-h-[240px]",
                  gridLayout === 'spotlight' && index > 0 && "col-start-2"
                )}
              >
          <VideoStream
            stream={stream}
                  className="rounded-2xl h-full w-full object-cover"
                />
                {activeRoom?.participants.find(p => p.id === peerId) && (
                  <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-sm">
                    {activeRoom.participants.find(p => p.id === peerId)?.username}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
      </div>

        {/* Bottom Controls */}
        <div className="relative px-2 py-4 md:px-6 md:py-6 z-50">
          <div className="flex items-center justify-center">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/10"
            >
              {/* Left Controls */}
              <div className="flex items-center gap-2 pr-2 md:pr-4 border-r border-white/10">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
          onClick={handleToggleAudio}
                  className={cn(
                    "p-2 md:p-3 rounded-xl transition-all duration-200",
            isAudioEnabled
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                  )}
          >
            {isAudioEnabled ? (
                    <BsMicFill className="w-5 h-5" />
                  ) : (
                    <BsMicMuteFill className="w-5 h-5" />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
          onClick={handleToggleVideo}
                  className={cn(
                    "p-2 md:p-3 rounded-xl transition-all duration-200",
            isVideoEnabled
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                  )}
          >
            {isVideoEnabled ? (
                    <BsCameraVideoFill className="w-5 h-5" />
                  ) : (
                    <BsCameraVideoOffFill className="w-5 h-5" />
                  )}
                </motion.button>
              </div>

              {/* Center Controls */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowParticipants(!showParticipants)}
                  className={cn(
                    "p-2 md:p-3 rounded-xl transition-all duration-200",
                    showParticipants
                      ? "bg-indigo-500 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                >
                  <BsPeopleFill className="w-5 h-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowChat(!showChat)}
                  className={cn(
                    "p-2 md:p-3 rounded-xl transition-all duration-200",
                    showChat
                      ? "bg-indigo-500 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                >
                  <BsChatFill className="w-5 h-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsRecording(!isRecording)}
                  className={cn(
                    "p-2 md:p-3 rounded-xl transition-all duration-200",
                    isRecording
                      ? "bg-red-500 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                >
                  <BsRecord2Fill className={cn("w-5 h-5", isRecording && "animate-pulse")} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 md:p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
                >
                  <BsShareFill className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2 pl-2 md:pl-4 border-l border-white/10">
                {currentUser?.id === activeRoom?.createdBy && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={deactivateRoom}
                    className="p-2 md:p-3 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all duration-200"
                    title="End Room"
                  >
                    <BsDoorOpenFill className="w-5 h-5" />
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
          onClick={onLeave}
                  className="p-2 md:p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
                >
                  <IoCallOutline className="w-5 h-5 rotate-[135deg]" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sidebars */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            className="fixed md:absolute right-0 top-0 bottom-0 w-96 bg-slate-900/70 backdrop-blur-xl border-l border-white/10 z-50"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-white">Participants</h2>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-sm font-medium text-white">
                  {Array.isArray(activeRoom?.participants) ? activeRoom.participants.length : 0}
                </span>
              </div>
              <div className="space-y-3">
                {Array.isArray(activeRoom?.participants) && activeRoom.participants.length > 0 ? (
                  activeRoom.participants.map((participant) => (
                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      key={participant.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-base font-medium text-white">
                          {participant.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {participant.username || 'Anonymous'}
                          {participant.id === currentUser?.id && " (You)"}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <p className="text-xs text-white/60">Online</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <BsMicFill className="w-4 h-4 text-white/60" />
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <BsCameraVideoFill className="w-4 h-4 text-white/60" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center text-white/60 py-4">
                    No participants available
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {showChat && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            className="fixed md:absolute right-0 top-0 bottom-0 w-96 bg-slate-900/70 backdrop-blur-xl border-l border-white/10 z-50"
          >
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-lg font-medium text-white">Chat</h2>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className={cn(
                        "flex flex-col",
                        message.senderId === currentUser?.id ? "items-end" : "items-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2",
                        message.senderId === currentUser?.id
                          ? "bg-indigo-500 text-white rounded-br-none"
                          : "bg-white/10 text-white rounded-bl-none"
                      )}>
                        {message.senderId !== currentUser?.id && (
                          <p className="text-xs text-white/60 mb-1">{message.senderName}</p>
                        )}
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
              <div className="p-4 border-t border-white/10">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }} 
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                  >
                    <BsChatFill className="w-5 h-5" />
                  </motion.button>
                </form>
          </div>
        </div>
          </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
} 