'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  orderBy 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useAppStore } from '@/store/use-app-store';
import { BsChatDots, BsMicFill, BsCameraVideo } from 'react-icons/bs';
import { IoMdSend } from 'react-icons/io';
import { RiEmotionHappyLine } from 'react-icons/ri';
import { FiLogOut } from 'react-icons/fi';

interface Friend {
  id: string;
  username: string;
  name: string;
  status: string;
  photoURL?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: any;
}

interface User {
  id: string;
  username: string;
  email: string;
  photoURL?: string;
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
}

export default function Dashboard() {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'chat' | 'voice' | 'video'>('chat');
  const [activeRooms, setActiveRooms] = useState<Room[]>([]);
  const router = useRouter();

  const addNotification = useAppStore((state) => state.addNotification);
  const currentUser = useAppStore((state) => state.currentUser);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  useEffect(() => {
    console.log('Dashboard mounted, setting up auth listener');
    
    // Add auth state listener
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed. User:', user ? 'exists' : 'null');
      console.log('User details:', user);
      
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      try {
        console.log('Fetching user data from Firestore for:', user.uid);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        console.log('Firestore response:', userDoc.exists() ? 'Document exists' : 'No document');
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data from Firestore:', userData);
          setCurrentUser({
            id: user.uid,
            username: userData.username || user.email?.split('@')[0] || 'User',
            email: userData.email || user.email || '',
            name: userData.displayName || userData.username || 'User',
            status: 'online'
          });
        } else {
          console.log('Creating new user document in Firestore');
          try {
            const newUserData = {
              uid: user.uid,
              email: user.email,
              username: user.email?.split('@')[0] || 'User',
              usernameLower: (user.email?.split('@')[0] || 'user').toLowerCase(),
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              createdAt: new Date(),
              friends: [],
              rooms: []
            };
            
            await setDoc(doc(db, 'users', user.uid), newUserData);
            console.log('New user document created');
            
            setCurrentUser({
              id: user.uid,
              username: newUserData.username,
              email: newUserData.email || '',
              name: newUserData.displayName,
              status: 'online'
            });
          } catch (error) {
            console.error('Error creating user document:', error);
            addNotification({ message: 'Error creating user document', type: 'error' });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        addNotification({ message: 'Error fetching user data', type: 'error' });
      }
    });

    // Cleanup subscription
    return () => {
      console.log('Dashboard unmounting, cleaning up auth listener');
      unsubscribe();
    };
  }, [router, setCurrentUser, addNotification]);

  // Add friend requests listener
  useEffect(() => {
    if (!auth.currentUser) {
      console.log('No authenticated user, skipping friend requests listener');
      return;
    }

    console.log('Setting up friend requests listener for user:', auth.currentUser.uid);
    const friendRequestsRef = collection(db, 'friendRequests');
    const q = query(
      friendRequestsRef,
      where('receiverId', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Friend requests update received, count:', snapshot.docs.length);
      const requests = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Friend request data:', {
          id: doc.id,
          senderId: data.senderId,
          senderUsername: data.senderUsername,
          timestamp: data.timestamp
        });
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate()
        };
      });
      console.log('Processed friend requests:', requests);
      setFriendRequests(requests);
    }, (error) => {
      console.error('Error in friend requests listener:', error);
      addNotification({ message: 'Error fetching friend requests', type: 'error' });
    });

    return () => {
      console.log('Cleaning up friend requests listener');
      unsubscribe();
    };
  }, [addNotification]);

  // Update friends fetching
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log('Setting up friends listener for user:', currentUser.id);
    
    // Get the user's document to listen to their friends array
    const userRef = doc(db, 'users', currentUser.id);
    
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (!snapshot.exists()) return;
      
      const userData = snapshot.data();
      const friendsData = userData.friends || [];
      console.log('Friends data from user document:', friendsData);
      
      setFriends(friendsData.map((friend: any) => ({
        id: friend.id,
        username: friend.username,
        name: friend.username,
        status: 'online', // You can implement real status tracking later
        photoURL: friend.photoURL
      })));
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // Add messages listener when chat is opened
  useEffect(() => {
    if (!showChat || !selectedFriend || !auth.currentUser) {
      console.log('Chat prerequisites not met:', {
        showChat,
        selectedFriend: selectedFriend ? 'exists' : 'null',
        authUser: auth.currentUser ? 'exists' : 'null'
      });
      return;
    }

    try {
      console.log('Setting up messages listener for chat with:', selectedFriend);
      const chatId = [auth.currentUser.uid, selectedFriend.id].sort().join('_');
      console.log('Using chat ID:', chatId);
      
      const messagesRef = collection(db, 'messages');
      
      // Try a simpler query first to debug
      const q = query(
        messagesRef,
        where('chatId', '==', chatId)
      );

      console.log('Starting messages listener with simplified query');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('Received snapshot with', snapshot.docs.length, 'messages');
        const newMessages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            content: data.content,
            timestamp: data.timestamp?.toDate()
          } as Message;
        }).sort((a, b) => {
          if (!a.timestamp) return 1;
          if (!b.timestamp) return -1;
          return a.timestamp.getTime() - b.timestamp.getTime();
        });

        console.log('Processed and sorted messages:', newMessages);
        setMessages(newMessages);

        // Scroll to bottom when new messages arrive
        const chatContainer = document.querySelector('.chat-messages');
        if (chatContainer) {
          setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }, 100);
        }
      }, (error) => {
        console.error('Error in messages listener:', error);
        addNotification({ message: 'Error loading messages', type: 'error' });
      });

      return () => {
        console.log('Cleaning up messages listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up messages listener:', error);
      addNotification({ message: 'Error setting up chat', type: 'error' });
    }
  }, [showChat, selectedFriend, addNotification]);

  // Initialize rooms collection if it doesn't exist
  useEffect(() => {
    const initializeRooms = async () => {
      try {
        // Create a test room to ensure the collection exists
        const roomsRef = collection(db, 'rooms');
        await addDoc(roomsRef, {
          name: "Test Room",
          type: "video",
          createdBy: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
          participants: [],
          isActive: false
        });
        console.log("Rooms collection initialized");
      } catch (error) {
        console.error("Error initializing rooms:", error);
      }
    };

    if (auth.currentUser) {
      initializeRooms();
    }
  }, []);

  // Subscribe to active rooms
  useEffect(() => {
    if (!auth.currentUser) return;

    const roomsQuery = query(
      collection(db, 'rooms'),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Room[];
      setActiveRooms(rooms);
      console.log("Active rooms updated:", rooms);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleOpenChat = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowChat(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedFriend || !auth.currentUser || !currentUser) {
      console.log('Cannot send message:', {
        message: message.trim() ? 'Has message' : 'No message',
        selectedFriend: selectedFriend ? 'Has friend' : 'No friend',
        authUser: auth.currentUser ? 'Has auth' : 'No auth',
        currentUser: currentUser ? 'Has user' : 'No user'
      });
      return;
    }

    try {
      console.log('Sending message to friend:', selectedFriend);
      const chatId = [auth.currentUser.uid, selectedFriend.id].sort().join('_');
      console.log('Using chat ID:', chatId);
      
      const messagesRef = collection(db, 'messages');
      const newMessage = {
        chatId,
        content: message.trim(),
        senderId: auth.currentUser.uid,
        senderName: currentUser.username,
        receiverId: selectedFriend.id,
        timestamp: serverTimestamp()
      };
      
      console.log('Creating new message:', newMessage);
      const docRef = await addDoc(messagesRef, newMessage);
      console.log('Message sent successfully with ID:', docRef.id);

      setMessage('');
    } catch (error) {
      console.error('Detailed error sending message:', error);
      addNotification({ message: 'Error sending message', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0A0A0F] via-[#13111C] to-[#0A0A0F]" />
        <div className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full bg-[#7C3AED] opacity-[0.03] blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-[#DB2777] opacity-[0.03] blur-[100px] animate-pulse-slow" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-[#4F46E5] opacity-[0.02] blur-[150px] animate-pulse-slow" style={{ animationDelay: '-4s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Top Actions */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center mb-10"
        >
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
              Dashboard
            </h1>
            {currentUser && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#DB2777] p-[1px]">
                    <div className="w-full h-full rounded-full bg-[#13111C] flex items-center justify-center text-white/90 font-medium">
                      {currentUser.username[0].toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90">{currentUser.username}</p>
                    <p className="text-xs text-white/40">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-white/60 hover:text-white/90 transition-all duration-300"
                  title="Logout"
                >
                  <FiLogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowAddFriend(true)}
              className="group px-6 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] backdrop-blur-xl transition-all duration-300"
            >
              <span className="text-sm font-medium bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent group-hover:text-white transition-all duration-300">
                Add Friend
              </span>
            </button>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="group px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#DB2777] hover:opacity-90 transition-all duration-300"
            >
              <span className="text-sm font-medium">Create Room</span>
            </button>
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-[1.5fr,1fr] gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Friend Requests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative group rounded-2xl"
            >
              <div className="absolute -inset-[1px] bg-gradient-to-r from-[#7C3AED] via-[#DB2777] to-[#F59E0B] rounded-2xl opacity-25 group-hover:opacity-40 blur transition-all duration-500" />
              <div className="relative bg-[#13111C]/90 backdrop-blur-xl p-6 rounded-2xl border border-white/[0.05]">
                <h2 className="text-xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-6">
                  Friend Requests
                </h2>
                <div className="space-y-4">
                  {friendRequests.length === 0 ? (
                    <p className="text-white/40 text-center py-4">No pending friend requests</p>
                  ) : (
                    friendRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-all duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#DB2777] p-[1px]">
                            <div className="w-full h-full rounded-full bg-[#13111C] flex items-center justify-center text-white/90 font-medium">
                              {(request.senderUsername || 'U')[0].toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium text-white/90">{request.senderUsername || 'Unknown User'}</h3>
                            <p className="text-sm text-white/40">
                              {request.timestamp ? new Date(request.timestamp).toLocaleDateString() : 'Just now'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                // Update request status
                                const requestRef = doc(db, 'friendRequests', request.id);
                                await updateDoc(requestRef, { status: 'accepted' });
                                
                                // Add friend to current user's friends list
                                const currentUserRef = doc(db, 'users', auth.currentUser!.uid);
                                await updateDoc(currentUserRef, {
                                  friends: arrayUnion({
                                    id: request.senderId,
                                    username: request.senderUsername
                                  })
                                });
                                
                                // Add current user to sender's friends list
                                const senderRef = doc(db, 'users', request.senderId);
                                await updateDoc(senderRef, {
                                  friends: arrayUnion({
                                    id: auth.currentUser!.uid,
                                    username: currentUser?.username || auth.currentUser!.email?.split('@')[0] || 'User'
                                  })
                                });
                                
                                console.log('Friend request accepted and friends lists updated');
                                addNotification({ message: 'Friend request accepted!', type: 'success' });
                              } catch (error) {
                                console.error('Error accepting friend request:', error);
                                addNotification({ message: 'Error accepting friend request', type: 'error' });
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#DB2777] hover:opacity-90 text-sm font-medium transition-all duration-300"
                          >
                            Accept
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const requestRef = doc(db, 'friendRequests', request.id);
                                await updateDoc(requestRef, { status: 'rejected' });
                                addNotification({ message: 'Friend request rejected', type: 'success' });
                              } catch (error) {
                                console.error('Error rejecting friend request:', error);
                                addNotification({ message: 'Error rejecting friend request', type: 'error' });
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] text-sm font-medium transition-all duration-300"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>

            {/* Active Rooms */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
                  Active Rooms
                </h2>
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
                  {activeRooms.length} Rooms Live
                </div>
              </div>

              {activeRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeRooms.map((room) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 hover:bg-white/[0.04] transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED]/10 via-[#DB2777]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-white">{room.name || 'Unnamed Room'}</h3>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            (room.type || 'chat') === 'video' 
                              ? 'bg-[#7C3AED]/10 text-[#7C3AED]' 
                              : (room.type || 'chat') === 'voice'
                              ? 'bg-[#DB2777]/10 text-[#DB2777]'
                              : 'bg-white/10 text-white/80'
                          }`}>
                            {((room.type || 'chat').charAt(0).toUpperCase() + (room.type || 'chat').slice(1))}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <div className="flex -space-x-2">
                            {room.participants.slice(0, 3).map((participant: any, index: number) => (
                              <div
                                key={participant.id}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#DB2777] flex items-center justify-center ring-2 ring-black"
                              >
                                <span className="text-xs font-medium text-white">
                                  {participant.username[0].toUpperCase()}
                                </span>
                              </div>
                            ))}
                          </div>
                          <span>
                            {room.participants.length} participant{room.participants.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <button
                          onClick={() => router.push(`/dashboard/rooms/${room.id}`)}
                          className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#DB2777] text-sm font-medium text-white hover:opacity-90 transition-opacity duration-300"
                        >
                          Join Room
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-8 text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.02]">
                    <BsCameraVideo className="h-6 w-6 text-white/40" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-white">No Active Rooms</h3>
                  <p className="mb-4 text-sm text-white/60">
                    Create a room to start a conversation with others
                  </p>
                  <button
                    onClick={() => setShowCreateRoom(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#DB2777] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity duration-300"
                  >
                    <BsCameraVideo className="h-4 w-4" />
                    <span>Create Room</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Friends List with Chat */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative group rounded-2xl"
          >
            <div className="absolute -inset-[1px] bg-gradient-to-r from-[#7C3AED] via-[#DB2777] to-[#F59E0B] rounded-2xl opacity-25 group-hover:opacity-40 blur transition-all duration-500" />
            <div className="relative bg-[#13111C]/90 backdrop-blur-xl p-6 rounded-2xl border border-white/[0.05] h-[calc(100vh-10rem)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
                  Friends
                </h2>
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
                  {friends.length} Friends
                </div>
              </div>

              <div className="space-y-2 h-full overflow-y-auto custom-scrollbar pr-2">
                {friends.length === 0 ? (
                  <p className="text-white/40 text-center py-4">No friends added yet</p>
                ) : (
                  friends.map((friend) => (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#DB2777] flex items-center justify-center">
                            <span className="text-lg font-medium text-white">
                              {friend.username[0].toUpperCase()}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#13111C] ${
                            friend.status === 'online' ? 'bg-emerald-500' : 'bg-gray-500'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{friend.username}</h3>
                          <p className="text-sm text-white/60">{friend.status}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenChat(friend)}
                        className="px-4 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] text-sm font-medium transition-all duration-300"
                      >
                        Message
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Create Room Modal */}
        {showCreateRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateRoom(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md"
            >
              <div className="absolute -inset-[1px] bg-gradient-to-r from-[#7C3AED] via-[#DB2777] to-[#F59E0B] rounded-2xl opacity-40 blur transition-all duration-500" />
              <div className="relative bg-[#13111C]/95 backdrop-blur-xl p-6 rounded-2xl border border-white/[0.05]">
                <h2 className="text-xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-6">
                  Create Room
                </h2>
                <div className="space-y-4 mb-6">
                  <input
                    type="text"
                    placeholder="Room name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full bg-white/[0.02] text-white/90 border border-white/[0.05] rounded-xl px-6 py-4
                             focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/25
                             transition-all duration-300 placeholder:text-white/20"
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setRoomType('chat')}
                      className={`flex-1 px-4 py-3 rounded-xl ${
                        roomType === 'chat' 
                          ? 'bg-gradient-to-r from-[#7C3AED] to-[#DB2777] text-white' 
                          : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05]'
                      } text-sm font-medium transition-all duration-300`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <BsChatDots className="w-4 h-4" />
                        <span>Chat Only</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => setRoomType('voice')}
                      className={`flex-1 px-4 py-3 rounded-xl ${
                        roomType === 'voice' 
                          ? 'bg-gradient-to-r from-[#7C3AED] to-[#DB2777] text-white' 
                          : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05]'
                      } text-sm font-medium transition-all duration-300`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <BsMicFill className="w-4 h-4" />
                        <span>Voice</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => setRoomType('video')}
                      className={`flex-1 px-4 py-3 rounded-xl ${
                        roomType === 'video' 
                          ? 'bg-gradient-to-r from-[#7C3AED] to-[#DB2777] text-white' 
                          : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05]'
                      } text-sm font-medium transition-all duration-300`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <BsCameraVideo className="w-4 h-4" />
                        <span>Video</span>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateRoom(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] text-white/90 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      if (!roomName.trim()) {
                        addNotification({ message: 'Please enter a room name', type: 'error' });
                        return;
                      }

                      try {
                        const roomsRef = collection(db, 'rooms');
                        const newRoom = {
                          name: roomName.trim(),
                          type: roomType,
                          createdBy: auth.currentUser?.uid,
                          createdAt: serverTimestamp(),
                          participants: [{
                            id: auth.currentUser?.uid,
                            username: currentUser?.username,
                            role: 'host'
                          }],
                          isActive: true
                        };

                        const docRef = await addDoc(roomsRef, newRoom);
                        addNotification({ message: 'Room created successfully!', type: 'success' });
                        setShowCreateRoom(false);
                        router.push(`/dashboard/rooms/${docRef.id}`);
                      } catch (error) {
                        console.error('Error creating room:', error);
                        addNotification({ message: 'Failed to create room', type: 'error' });
                      }
                    }}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#DB2777] hover:opacity-90 transition-all duration-300"
                  >
                    Create Room
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Chat Modal */}
        {showChat && selectedFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowChat(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl h-[600px]"
            >
              <div className="absolute -inset-[1px] bg-gradient-to-r from-[#7C3AED] via-[#DB2777] to-[#F59E0B] rounded-2xl opacity-40 blur transition-all duration-500" />
              <div className="relative bg-[#13111C]/95 backdrop-blur-xl rounded-2xl border border-white/[0.05] h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#DB2777] p-[1px]">
                      <div className="w-full h-full rounded-full bg-[#13111C] flex items-center justify-center text-white/90 font-medium">
                        {selectedFriend.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-white/90">{selectedFriend.name}</h3>
                      <p className="text-sm text-white/40">{selectedFriend.status}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] transition-all duration-300">
                      <BsMicFill className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] transition-all duration-300">
                      <BsCameraVideo className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowChat(false)}
                      className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] transition-all duration-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 p-4 overflow-y-auto chat-messages">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <p className="text-center text-white/40 py-4">No messages yet. Start the conversation!</p>
                    ) : (
                      messages.map((msg) => {
                        const isOwnMessage = msg.senderId === auth.currentUser?.uid;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                isOwnMessage
                                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#DB2777] text-white'
                                  : 'bg-white/[0.03] border border-white/[0.05]'
                              }`}
                            >
                              {!isOwnMessage && (
                                <p className="text-xs text-white/40 mb-1">{msg.senderName}</p>
                              )}
                              <p className="text-white/90">{msg.content}</p>
                              <p className="text-xs text-white/40 text-right mt-1">
                                {msg.timestamp?.toDate ? 
                                  msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                                  msg.timestamp instanceof Date ?
                                    msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                                    typeof msg.timestamp === 'number' ?
                                      new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                                      ''
                                }
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-white/[0.05]">
                  <div className="flex gap-3">
                    <button className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] transition-all duration-300">
                      <RiEmotionHappyLine className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="flex-1 bg-white/[0.02] text-white/90 border border-white/[0.05] rounded-xl px-4
                               focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/25
                               transition-all duration-300 placeholder:text-white/20"
                    />
                    <button 
                      onClick={sendMessage}
                      className="p-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#DB2777] hover:opacity-90 transition-all duration-300"
                    >
                      <IoMdSend className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Add Friend Modal */}
        {showAddFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddFriend(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md"
            >
              <div className="absolute -inset-[1px] bg-gradient-to-r from-[#7C3AED] via-[#DB2777] to-[#F59E0B] rounded-2xl opacity-40 blur transition-all duration-500" />
              <div className="relative bg-[#13111C]/95 backdrop-blur-xl p-6 rounded-2xl border border-white/[0.05]">
                <h2 className="text-xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-6">
                  Add Friend
                </h2>
                <input
                  type="text"
                  placeholder="Search by username"
                  value={searchQuery}
                  onChange={async (e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length >= 3) {
                      setIsSearching(true);
                      setSearchError('');
                      try {
                        const usersRef = collection(db, 'users');
                        // Log the search query
                        console.log('Searching for:', e.target.value);
                        
                        // Create a case-insensitive query
                        const searchValue = e.target.value.toLowerCase();
                        const q = query(
                          usersRef,
                          where('usernameLower', '>=', searchValue),
                          where('usernameLower', '<=', searchValue + '\uf8ff')
                        );
                        
                        const querySnapshot = await getDocs(q);
                        console.log('Query results:', querySnapshot.size);
                        
                        const users: User[] = [];
                        querySnapshot.forEach((doc) => {
                          const userData = doc.data();
                          console.log('Found user:', userData);
                          if (doc.id !== auth.currentUser?.uid) {
                            users.push({
                              id: doc.id,
                              username: userData.username,
                              email: userData.email,
                              photoURL: userData.photoURL
                            });
                          }
                        });
                        setSearchResults(users);
                        
                        if (users.length === 0) {
                          console.log('No users found after filtering');
                        }
                      } catch (error) {
                        console.error('Detailed search error:', error);
                        setSearchError('Error searching for users');
                      }
                      setIsSearching(false);
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  className="w-full bg-white/[0.02] text-white/90 border border-white/[0.05] rounded-xl px-6 py-4
                           focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/25
                           transition-all duration-300 placeholder:text-white/20 mb-4"
                />

                {/* Search Results */}
                <div className="max-h-60 overflow-y-auto mb-6 space-y-2">
                  {isSearching && (
                    <div className="text-center text-white/60 py-2">
                      Searching...
                    </div>
                  )}
                  
                  {searchError && (
                    <div className="text-red-400 text-center py-2">
                      {searchError}
                    </div>
                  )}

                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#DB2777] p-[1px]">
                          <div className="w-full h-full rounded-full bg-[#13111C] flex items-center justify-center text-white/90 font-medium">
                            {user.username[0].toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-white/90">{user.username}</h3>
                          <p className="text-sm text-white/40">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            if (!auth.currentUser) {
                              console.error('No authenticated user');
                              addNotification({ message: 'You must be logged in to send friend requests', type: 'error' });
                              return;
                            }

                            const senderUsername = currentUser?.username || auth.currentUser.email?.split('@')[0] || 'User';
                            console.log('Sending friend request with data:', {
                              senderId: auth.currentUser.uid,
                              senderUsername,
                              receiverId: user.id
                            });

                            const friendRequestsRef = collection(db, 'friendRequests');
                            await addDoc(friendRequestsRef, {
                              senderId: auth.currentUser.uid,
                              senderUsername,
                              receiverId: user.id,
                              status: 'pending',
                              timestamp: serverTimestamp()
                            });

                            console.log('Friend request sent successfully');
                            addNotification({ message: 'Friend request sent successfully!', type: 'success' });
                            setShowAddFriend(false);
                          } catch (error) {
                            console.error('Error sending friend request:', error);
                            addNotification({ message: 'Failed to send friend request', type: 'error' });
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#DB2777] hover:opacity-90 text-sm font-medium transition-all duration-300"
                      >
                        Send Request
                      </button>
                    </div>
                  ))}

                  {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                    <div className="text-center text-white/60 py-2">
                      No users found
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddFriend(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] text-white/90 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#DB2777] hover:opacity-90 transition-all duration-300">
                    Send Request
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm"
            >
              <div className="absolute -inset-[1px] bg-gradient-to-r from-[#7C3AED] via-[#DB2777] to-[#F59E0B] rounded-2xl opacity-40 blur transition-all duration-500" />
              <div className="relative bg-[#13111C]/95 backdrop-blur-xl p-6 rounded-2xl border border-white/[0.05]">
                <h2 className="text-xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-4">
                  Confirm Logout
                </h2>
                <p className="text-white/60 mb-6">
                  Are you sure you want to log out? You'll need to sign in again to access your account.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] text-white/90 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#DB2777] hover:opacity-90 transition-all duration-300"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 