'use client';

import { motion } from "framer-motion";
import Link from "next/link";

export default function NewRoomContent() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-4xl">Create New Room</h1>
        <p className="text-muted-foreground">Configure your video call room settings.</p>
      </div>

      <form className="space-y-6">
        {/* Room Name */}
        <div className="space-y-2">
          <label htmlFor="roomName" className="text-sm font-medium">
            Room Name
          </label>
          <input
            type="text"
            id="roomName"
            placeholder="Enter room name..."
            className="glassmorphism w-full rounded-md border-none bg-background/50 px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Room Type */}
        <div className="space-y-4">
          <label className="text-sm font-medium">Room Type</label>
          <div className="grid gap-4 sm:grid-cols-2">
            {roomTypes.map((type) => (
              <motion.div
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glassmorphism group relative cursor-pointer rounded-lg p-4 transition-colors hover:bg-primary/10"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`rounded-full p-3 ${
                      type.id === "public"
                        ? "bg-neon-purple/20 text-neon-purple"
                        : "bg-neon-pink/20 text-neon-pink"
                    }`}
                  >
                    <type.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">{type.name}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="roomType"
                  value={type.id}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transform"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Room Settings */}
        <div className="space-y-4">
          <label className="text-sm font-medium">Room Settings</label>
          <div className="glassmorphism space-y-4 rounded-lg p-6">
            {roomSettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{setting.name}</h3>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="neon-border flex-1 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create Room
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border border-input bg-background px-4 py-2 font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

const roomTypes = [
  {
    id: "public",
    name: "Public Room",
    description: "Anyone with the link can join",
    icon: ({ className }: { className?: string }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "private",
    name: "Private Room",
    description: "Only invited users can join",
    icon: ({ className }: { className?: string }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
];

const roomSettings = [
  {
    id: "mute-on-join",
    name: "Mute participants on join",
    description: "Participants will join with their microphone muted",
  },
  {
    id: "video-off-join",
    name: "Turn off video on join",
    description: "Participants will join with their camera turned off",
  },
  {
    id: "waiting-room",
    name: "Enable waiting room",
    description: "Participants need approval before joining",
  },
  {
    id: "chat",
    name: "Enable chat",
    description: "Allow participants to send messages in the room",
  },
]; 