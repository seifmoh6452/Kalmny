'use client';

import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardContent() {
  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl">Welcome back, John!</h1>
          <p className="text-muted-foreground">Here's what's happening today.</p>
        </div>
        <Link
          href="/dashboard/rooms/new"
          className="neon-border rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Create Room
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="glassmorphism group relative overflow-hidden rounded-lg p-6"
          >
            <div className="flex items-center gap-4">
              <div
                className={`rounded-full p-3 ${
                  action.color === "purple"
                    ? "bg-neon-purple/20 text-neon-purple"
                    : action.color === "pink"
                    ? "bg-neon-pink/20 text-neon-pink"
                    : "bg-neon-blue/20 text-neon-blue"
                }`}
              >
                <action.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium">{action.label}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
            </div>
            <Link
              href={action.href}
              className="absolute inset-0 rounded-lg ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="sr-only">View {action.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="mb-4 font-heading text-2xl">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="glassmorphism flex items-center gap-4 rounded-lg p-4"
            >
              <div
                className={`rounded-full p-2 ${
                  activity.type === "call"
                    ? "bg-neon-purple/20 text-neon-purple"
                    : activity.type === "message"
                    ? "bg-neon-pink/20 text-neon-pink"
                    : "bg-neon-blue/20 text-neon-blue"
                }`}
              >
                {activity.type === "call" ? (
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
                    <path d="M15 10l5 5-5 5" />
                    <rect width="14" height="14" x="2" y="5" rx="2" ry="2" />
                  </svg>
                ) : activity.type === "message" ? (
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
                ) : (
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
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.time}</p>
              </div>
              <Link
                href={activity.href}
                className="rounded-full p-2 hover:bg-primary/20"
              >
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
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

const quickActions = [
  {
    label: "Start Video Call",
    description: "Create a new video call room",
    href: "/dashboard/rooms/new",
    color: "purple",
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
        <path d="M15 10l5 5-5 5" />
        <rect width="14" height="14" x="2" y="5" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    label: "Find Friends",
    description: "Connect with new people",
    href: "/dashboard/friends",
    color: "pink",
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
    label: "Join Room",
    description: "Enter an existing room",
    href: "/dashboard/rooms/join",
    color: "blue",
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
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
    ),
  },
  {
    label: "Settings",
    description: "Manage your preferences",
    href: "/dashboard/settings",
    color: "purple",
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
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

const recentActivity = [
  {
    id: 1,
    type: "call",
    title: "Video call with Team Alpha",
    time: "2 hours ago",
    href: "/dashboard/calls/123",
  },
  {
    id: 2,
    type: "message",
    title: "New message from Sarah",
    time: "4 hours ago",
    href: "/dashboard/messages/456",
  },
  {
    id: 3,
    type: "room",
    title: "Joined Project Discussion Room",
    time: "Yesterday",
    href: "/dashboard/rooms/789",
  },
]; 