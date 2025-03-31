"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { VideoRoom } from "@/components/video-room";
import { useAppStore } from "@/store/use-app-store";

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
        setActiveRoom({
          id: doc.id,
          ...doc.data(),
        });
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