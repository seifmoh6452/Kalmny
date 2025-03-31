"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { VideoRoom } from "@/components/video-room";
import { useAppStore } from "@/store/use-app-store";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar?: string;
  status: "online" | "offline" | "away" | "busy";
}

interface Room {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  participants: User[];
  createdAt: Date;
  updatedAt: Date;
}

interface RoomPageProps {
  params: {
    roomId: string;
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  const setActiveRoom = useAppStore((state) => state.setActiveRoom);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "rooms", params.roomId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setActiveRoom({
          id: doc.id,
          name: data.name || 'Unnamed Room',
          description: data.description,
          isPrivate: data.isPrivate ?? false,
          participants: data.participants || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Room);
      }
    });

    return () => {
      unsubscribe();
      setActiveRoom(null);
    };
  }, [params.roomId, setActiveRoom]);

  return (
    <div className="h-screen">
      <VideoRoom
        roomId={params.roomId}
        onLeave={() => router.push("/dashboard")}
      />
    </div>
  );
} 