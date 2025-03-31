'use client';

import { motion } from "framer-motion";
import Link from "next/link";

export default function RoomsContent() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl">Video Rooms</h1>
          <p className="text-muted-foreground">Join an existing room or create a new one.</p>
        </div>
        <Link
          href="/dashboard/rooms/new"
          className="neon-border rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Create Room
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search rooms..."
            className="glassmorphism w-full rounded-md border-none bg-background/50 px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select className="glassmorphism rounded-md border-none bg-background/50 px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="all">All Rooms</option>
          <option value="public">Public Rooms</option>
          <option value="private">Private Rooms</option>
        </select>
        <select className="glassmorphism rounded-md border-none bg-background/50 px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="recent">Most Recent</option>
          <option value="popular">Most Popular</option>
          <option value="active">Most Active</option>
        </select>
      </div>

      {/* Room Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room, index) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="glassmorphism group relative overflow-hidden rounded-lg"
          >
            {/* Room Preview */}
            <div className="aspect-video w-full bg-gradient-to-br from-neon-purple/20 to-neon-pink/20">
              {room.participants.length > 0 && (
                <div className="grid h-full w-full grid-cols-2 gap-1 p-1">
                  {room.participants.slice(0, 4).map((participant, i) => (
                    <div
                      key={i}
                      className="relative overflow-hidden rounded bg-muted"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {participant.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Room Info */}
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="flex-1 font-medium">{room.name}</h3>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    room.type === "public"
                      ? "bg-neon-purple/20 text-neon-purple"
                      : "bg-neon-pink/20 text-neon-pink"
                  }`}
                >
                  {room.type}
                </span>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                {room.participants.length} participants
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href={`/dashboard/rooms/${room.id}`}
                  className="neon-border flex-1 rounded-md bg-primary px-3 py-1.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Join Room
                </Link>
                {room.type === "private" && (
                  <button className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                    Request Access
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {rooms.length === 0 && (
        <div className="glassmorphism flex flex-col items-center justify-center gap-4 rounded-lg py-12">
          <div className="rounded-full bg-muted p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-muted-foreground"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="font-medium">No Rooms Found</h3>
            <p className="text-sm text-muted-foreground">
              Create a new room or try different filters
            </p>
          </div>
          <Link
            href="/dashboard/rooms/new"
            className="neon-border rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create Room
          </Link>
        </div>
      )}
    </div>
  );
}

const rooms = [
  {
    id: "1",
    name: "Gaming Night",
    type: "public",
    participants: ["John", "Sarah", "Tom", "Alex"],
  },
  {
    id: "2",
    name: "Team Meeting",
    type: "private",
    participants: ["Emily", "James"],
  },
  {
    id: "3",
    name: "Movie Watch Party",
    type: "public",
    participants: ["Mike", "Lisa", "David"],
  },
  {
    id: "4",
    name: "Study Group",
    type: "private",
    participants: ["Anna", "Peter", "Sophie", "Chris"],
  },
  {
    id: "5",
    name: "Fitness Class",
    type: "public",
    participants: ["Mark", "Rachel"],
  },
]; 