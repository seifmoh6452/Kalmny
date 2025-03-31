'use client';

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAppStore } from "@/store/use-app-store";

interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: any;
}

interface Friend {
  userId: string;
  username: string;
  status: "online" | "offline" | "away" | "busy";
  timestamp: Date;
}

export default function FriendsContent() {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const addNotification = useAppStore((state) => state.addNotification);
  const currentUser = useAppStore((state) => state.currentUser);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Query friend requests where the current user is the receiver
    const friendRequestsQuery = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(friendRequestsQuery, (snapshot) => {
      const requests: FriendRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as FriendRequest);
      });
      setFriendRequests(requests);
    }, (error) => {
      console.error("Error fetching friend requests:", error);
      addNotification({ message: "Error fetching friend requests", type: "error" });
    });

    return () => unsubscribe();
  }, [addNotification]);

  const handleAcceptRequest = async (request: FriendRequest) => {
    try {
      // Update request status
      await updateDoc(doc(db, 'friendRequests', request.id), {
        status: 'accepted'
      });

      // Add to friends collection for both users
      const friendData = {
        userId: request.senderId,
        username: request.senderUsername,
        status: 'online',
        timestamp: new Date()
      };

      await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
        friends: [...(currentUser?.friends || []), friendData]
      });

      // Add current user to sender's friends list
      await updateDoc(doc(db, 'users', request.senderId), {
        friends: [...(currentUser?.friends || []), {
          userId: auth.currentUser!.uid,
          username: currentUser?.username || '',
          status: 'online',
          timestamp: new Date()
        }]
      });

      addNotification({ message: "Friend request accepted", type: "success" });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      addNotification({ message: "Error accepting friend request", type: "error" });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
      addNotification({ message: "Friend request declined", type: "info" });
    } catch (error) {
      console.error("Error declining friend request:", error);
      addNotification({ message: "Error declining friend request", type: "error" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl">Friends</h1>
          <p className="text-muted-foreground">Manage your connections</p>
        </div>
        <button className="neon-border rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          Add Friend
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search friends..."
            className="glassmorphism w-full rounded-md border-none bg-background/50 px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select className="glassmorphism rounded-md border-none bg-background/50 px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="all">All Friends</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {/* Friends List */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {currentUser?.friends?.map((friend: Friend, index: number) => (
          <motion.div
            key={friend.userId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="glassmorphism group relative overflow-hidden rounded-lg p-6"
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-purple/20 to-neon-pink/20">
                    <span className="text-lg font-medium">
                      {friend.username.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                    friend.status === "online"
                      ? "bg-neon-green"
                      : friend.status === "away"
                      ? "bg-neon-yellow"
                      : "bg-muted"
                  }`}
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-medium">{friend.username}</h3>
                <p className="text-sm text-muted-foreground">
                  {friend.status === 'online' ? 'Online' : 'Offline'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="rounded-full p-2 hover:bg-accent hover:text-accent-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Friend Requests */}
      <div>
        <h2 className="mb-4 font-heading text-2xl">Friend Requests</h2>
        <div className="space-y-4">
          {friendRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="glassmorphism flex items-center gap-4 rounded-lg p-4"
            >
              {/* Avatar */}
              <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-purple/20 to-neon-pink/20">
                  <span className="text-sm font-medium">
                    {request.senderUsername.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-medium">{request.senderUsername}</h3>
                <p className="text-sm text-muted-foreground">
                  Wants to be your friend
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAcceptRequest(request)}
                  className="neon-border rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDeclineRequest(request.id)}
                  className="rounded-md border border-destructive bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                >
                  Decline
                </button>
              </div>
            </motion.div>
          ))}
          {friendRequests.length === 0 && (
            <p className="text-center text-muted-foreground">No pending friend requests</p>
          )}
        </div>
      </div>
    </div>
  );
} 