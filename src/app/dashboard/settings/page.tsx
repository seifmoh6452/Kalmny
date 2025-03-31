"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-4xl">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 h-0.5 w-full bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      {/* Profile Settings */}
      {activeTab === "profile" && (
        <div className="space-y-8">
          {/* Profile Picture */}
          <div className="glassmorphism rounded-lg p-6">
            <h2 className="mb-4 text-lg font-medium">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 overflow-hidden rounded-full bg-muted">
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-purple/20 to-neon-pink/20">
                    <span className="text-3xl font-medium">JD</span>
                  </div>
                </div>
                <button className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </button>
              </div>
              <div>
                <h3 className="font-medium">Upload new picture</h3>
                <p className="text-sm text-muted-foreground">
                  JPG, GIF or PNG. Max size of 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="glassmorphism rounded-lg p-6">
            <h2 className="mb-4 text-lg font-medium">Personal Information</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  defaultValue="John"
                  className="w-full rounded-md border-none bg-accent/50 px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  defaultValue="Doe"
                  className="w-full rounded-md border-none bg-accent/50 px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  defaultValue="john.doe@example.com"
                  className="w-full rounded-md border-none bg-accent/50 px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  defaultValue="johndoe"
                  className="w-full rounded-md border-none bg-accent/50 px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Save Changes */}
          <div className="flex justify-end">
            <button className="neon-border rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === "notifications" && (
        <div className="glassmorphism space-y-6 rounded-lg p-6">
          <h2 className="text-lg font-medium">Notification Preferences</h2>
          {notificationSettings.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{setting.label}</h3>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  defaultChecked={setting.defaultEnabled}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20"></div>
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Privacy Settings */}
      {activeTab === "privacy" && (
        <div className="glassmorphism space-y-6 rounded-lg p-6">
          <h2 className="text-lg font-medium">Privacy Settings</h2>
          {privacySettings.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{setting.label}</h3>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  defaultChecked={setting.defaultEnabled}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20"></div>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy" },
];

const notificationSettings = [
  {
    id: "friend-requests",
    label: "Friend Requests",
    description: "Get notified when someone sends you a friend request",
    defaultEnabled: true,
  },
  {
    id: "room-invites",
    label: "Room Invites",
    description: "Get notified when someone invites you to a room",
    defaultEnabled: true,
  },
  {
    id: "messages",
    label: "Direct Messages",
    description: "Get notified when you receive a direct message",
    defaultEnabled: true,
  },
  {
    id: "room-activity",
    label: "Room Activity",
    description: "Get notified about activity in rooms you're part of",
    defaultEnabled: false,
  },
];

const privacySettings = [
  {
    id: "online-status",
    label: "Online Status",
    description: "Show your online status to other users",
    defaultEnabled: true,
  },
  {
    id: "friend-list",
    label: "Friend List",
    description: "Allow others to see your friend list",
    defaultEnabled: false,
  },
  {
    id: "room-discovery",
    label: "Room Discovery",
    description: "Allow others to find your public rooms",
    defaultEnabled: true,
  },
  {
    id: "direct-messages",
    label: "Direct Messages",
    description: "Allow direct messages from non-friends",
    defaultEnabled: false,
  },
]; 