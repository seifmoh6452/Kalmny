'use client'

import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar?: string;
  status: "online" | "offline" | "away" | "busy";
  friends?: Array<{
    userId: string;
    username: string;
    status: "online" | "offline" | "away" | "busy";
    timestamp: Date;
  }>;
}

interface Friend extends User {
  lastSeen?: Date;
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

type Notification = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

interface AppState {
  // User state
  currentUser: User | null;
  friends: Friend[];
  onlineFriends: Friend[];
  
  // Room state
  activeRoom: Room | null;
  rooms: Room[];
  
  // UI state
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  notifications: Notification[];
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  addFriend: (friend: Friend) => void;
  removeFriend: (friendId: string) => void;
  updateFriendStatus: (friendId: string, status: User["status"]) => void;
  setActiveRoom: (room: Room | null) => void;
  addRoom: (room: Room) => void;
  removeRoom: (roomId: string) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentUser: null,
  friends: [],
  onlineFriends: [],
  activeRoom: null,
  rooms: [],
  isDarkMode: true,
  isSidebarOpen: true,
  notifications: [],

  // Actions
  setCurrentUser: (user) => set({ currentUser: user }),
  
  addFriend: (friend) =>
    set((state) => ({
      friends: [...state.friends, friend],
      onlineFriends: friend.status === "online"
        ? [...state.onlineFriends, friend]
        : state.onlineFriends,
    })),
  
  removeFriend: (friendId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== friendId),
      onlineFriends: state.onlineFriends.filter((f) => f.id !== friendId),
    })),
  
  updateFriendStatus: (friendId, status) =>
    set((state) => ({
      friends: state.friends.map((f) =>
        f.id === friendId ? { ...f, status } : f
      ),
      onlineFriends: status === "online"
        ? [...state.onlineFriends, state.friends.find((f) => f.id === friendId)!]
        : state.onlineFriends.filter((f) => f.id !== friendId),
    })),
  
  setActiveRoom: (room) => set({ activeRoom: room }),
  
  addRoom: (room) =>
    set((state) => ({
      rooms: [...state.rooms, room],
    })),
  
  removeRoom: (roomId) =>
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== roomId),
      activeRoom: state.activeRoom?.id === roomId ? null : state.activeRoom,
    })),
  
  toggleDarkMode: () =>
    set((state) => ({
      isDarkMode: !state.isDarkMode,
    })),
  
  toggleSidebar: () =>
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    })),
  
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: Math.random().toString(36).substring(7) },
      ],
    })),
  
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
})) 