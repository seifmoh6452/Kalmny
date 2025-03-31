import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { useAppStore } from "@/store/use-app-store";

interface VideoCallOptions {
  roomId: string;
  userId: string;
  onPeerJoin?: (peerId: string) => void;
  onPeerLeave?: (peerId: string) => void;
  onError?: (error: Error) => void;
}

export function useVideoCall({
  roomId,
  userId,
  onPeerJoin,
  onPeerLeave,
  onError,
}: VideoCallOptions) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [peers, setPeers] = useState<string[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [error, setError] = useState<string | null>(null);
  
  const peerRef = useRef<Peer>();
  const connectionsRef = useRef<Record<string, any>>({});
  
  const addNotification = useAppStore((state) => state.addNotification);

  useEffect(() => {
    console.log('useVideoCall effect triggered with userId:', userId);
    
    const initializePeer = async () => {
      try {
        console.log('Initializing peer connection...');
        
        // Initialize local media stream with explicit audio constraints
        console.log('Requesting media stream...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        // Verify audio track is present and enabled
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          console.log('Audio track initialized:', audioTrack.label);
          audioTrack.enabled = true;
        } else {
          console.error('No audio track found in media stream');
          throw new Error('Failed to initialize audio');
        }

        console.log('Media stream obtained:', stream.id);
        setLocalStream(stream);

        // Initialize PeerJS with cloud server
        const peerOptions = {
          debug: 3,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' },
              { urls: 'stun:stun.twilio.com:3478' }
            ]
          }
        };
        
        console.log('Creating peer with options:', { userId, ...peerOptions });
        const peer = new Peer(userId + '_' + roomId, peerOptions);

        peer.on("open", (id) => {
          console.log('PeerJS connection opened with ID:', id);
          setIsConnected(true);
          addNotification({ message: "Connected to video server", type: "success" });
          
          // After connection is established, try to connect to existing peers in the room
          console.log('Attempting to connect to peers in room:', roomId);
          const currentPeers = peers;
          console.log('Current peers:', currentPeers);
        });

        peer.on("connection", (conn) => {
          console.log('Incoming peer connection:', conn.peer);
          handlePeerConnection(conn);
        });

        peer.on("call", (call) => {
          console.log('Incoming call from peer:', call.peer);
          if (!localStream) {
            console.error("Local stream not available for incoming call");
            return;
          }

          call.answer(localStream);
          console.log('Answered call with local stream');

          call.on("stream", (remoteStream) => {
            console.log('Received remote stream from:', call.peer);
            setRemoteStreams((prev) => ({ ...prev, [call.peer]: remoteStream }));
            addNotification({ message: "Connected to peer's video stream", type: "success" });
          });

          call.on("error", (err) => {
            console.error('Call error:', err);
            addNotification({ message: "Call error: " + err.message, type: "error" });
          });

          call.on("close", () => {
            console.log('Call closed with peer:', call.peer);
            setRemoteStreams((prev) => {
              const newStreams = { ...prev };
              delete newStreams[call.peer];
              return newStreams;
            });
          });
        });

        peer.on("error", (err) => {
          console.error('PeerJS error:', err);
          setIsConnected(false);
          addNotification({ message: err.message, type: "error" });
          if (onError) onError(err);
        });

        peer.on("disconnected", () => {
          console.log('Peer disconnected');
          setIsConnected(false);
          addNotification({ message: "Disconnected from server", type: "info" });
          
          // Try to reconnect
          console.log('Attempting to reconnect...');
          peer.reconnect();
        });

        peerRef.current = peer;

        return () => {
          console.log('Cleaning up peer connection...');
          if (stream) {
            stream.getTracks().forEach(track => {
              console.log('Stopping track:', track.kind);
              track.stop();
            });
          }
          peer.destroy();
        };
      } catch (err) {
        console.error("Failed to initialize video call:", err);
        onError?.(err as Error);
        addNotification({ message: "Failed to access camera/microphone", type: "error" });
      }
    };

    if (userId) {
      initializePeer();
    }

    return () => {
      console.log('Cleanup: Destroying peer connection');
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [userId, roomId]);

  const handlePeerConnection = (conn: any) => {
    conn.on("open", () => {
      connectionsRef.current[conn.peer] = conn;
      setPeers((prev) => [...prev, conn.peer]);
      onPeerJoin?.(conn.peer);
      addNotification({ message: `${conn.peer} joined the call`, type: "info" });
    });

    conn.on("close", () => {
      delete connectionsRef.current[conn.peer];
      setPeers((prev) => prev.filter((p) => p !== conn.peer));
      onPeerLeave?.(conn.peer);
      addNotification({ message: `${conn.peer} left the call`, type: "info" });
    });
  };

  const connectToPeer = async (peerId: string) => {
    if (!peerRef.current || !localStream) {
      console.error("Cannot connect to peer - peer or local stream not initialized");
      return;
    }

    try {
      console.log('Connecting to peer:', peerId);
      const peerIdWithRoom = peerId + '_' + roomId;
      
      // Create data connection
      const conn = peerRef.current.connect(peerIdWithRoom);
      handlePeerConnection(conn);

      // Create media connection
      console.log('Initiating call to peer:', peerIdWithRoom);
      const call = peerRef.current.call(peerIdWithRoom, localStream);
      
      call.on("stream", (remoteStream: MediaStream) => {
        console.log('Received remote stream from peer:', peerIdWithRoom);
        setRemoteStreams((prev) => ({
          ...prev,
          [peerId]: remoteStream,
        }));
        addNotification({ message: "Connected to peer's video stream", type: "success" });
      });

      call.on("error", (err) => {
        console.error('Call error with peer:', peerIdWithRoom, err);
        addNotification({ message: "Call error: " + err.message, type: "error" });
      });

      call.on("close", () => {
        console.log('Call closed with peer:', peerIdWithRoom);
        setRemoteStreams((prev) => {
          const newStreams = { ...prev };
          delete newStreams[peerId];
          return newStreams;
        });
        addNotification({ message: "Call ended", type: "info" });
      });
    } catch (err) {
      console.error("Error connecting to peer:", err);
      onError?.(err as Error);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        console.log('Toggling audio track:', audioTrack.label);
        audioTrack.enabled = !audioTrack.enabled;
        console.log('Audio track enabled:', audioTrack.enabled);
        return audioTrack.enabled;
      } else {
        console.error('No audio track found');
      }
    } else {
      console.error('No local stream available');
    }
    return false;
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  };

  const handlePeerState = (state: string) => {
    switch (state) {
      case "open":
        setIsConnected(true);
        addNotification({ message: "Connected to video server", type: "success" });
        break;
      case "disconnected":
        setIsConnected(false);
        addNotification({ message: "Disconnected from video server", type: "error" });
        break;
      case "error":
        setIsConnected(false);
        addNotification({ message: "Video server error", type: "error" });
        break;
      default:
        break;
    }
  };

  return {
    isConnected,
    localStream,
    remoteStreams,
    peers,
    connectToPeer,
    toggleAudio,
    toggleVideo,
  };
} 