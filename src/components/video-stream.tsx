import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VideoStreamProps {
  stream: MediaStream;
  isMuted?: boolean;
  isLocal?: boolean;
  className?: string;
}

export function VideoStream({
  stream,
  isMuted = false,
  isLocal = false,
  className,
}: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "relative overflow-hidden rounded-lg bg-black",
        isLocal ? "aspect-[4/3]" : "aspect-video",
        className
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className={cn(
          "h-full w-full object-cover",
          isLocal && "scale-x-[-1]" // Mirror local video
        )}
      />

      {/* Video indicators */}
      {stream.getVideoTracks()[0]?.enabled === false && (
        <div className="rounded-full bg-red-500/80 p-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-white"
          >
            <path d="M18.6 18.6L5.4 5.4" />
            <path d="M2 2l20 20" />
            <rect width="14" height="14" x="2" y="5" rx="2" ry="2" />
          </svg>
        </div>
      )}
      {stream.getAudioTracks()[0]?.enabled === false && (
        <div className="rounded-full bg-red-500/80 p-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-white"
          >
            <path d="M18.6 18.6L5.4 5.4" />
            <path d="M2 2l20 20" />
            <path d="M12 1a3 3 0 0 0-3 3v8.3" />
            <path d="M15 6a3 3 0 0 1 3 3v5" />
            <path d="M9.3 9.3a4 4 0 0 1 5.4 5.4" />
          </svg>
        </div>
      )}

      {/* Loading state */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
    </motion.div>
  );
} 