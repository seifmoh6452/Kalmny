import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
}

export function Chat({ isOpen, onClose }: ChatProps) {
  const [message, setMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // TODO: Implement message sending logic
      setMessage("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-border bg-background shadow-lg"
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-medium">Chat</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-accent hover:text-accent-foreground"
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
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${
                  msg.sender === "You" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.sender === "You"
                      ? "bg-primary text-primary-foreground"
                      : "glassmorphism"
                  }`}
                >
                  {msg.sender !== "You" && (
                    <p className="mb-1 text-xs font-medium text-neon-purple">
                      {msg.sender}
                    </p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                </div>
                <span className="mt-1 text-xs text-muted-foreground">
                  {msg.timestamp}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="border-t border-border p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-md border-none bg-accent/50 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="neon-border rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const messages: Message[] = [
  {
    id: "1",
    sender: "John",
    content: "Hey everyone! Ready for the game?",
    timestamp: "2:30 PM",
  },
  {
    id: "2",
    sender: "Sarah",
    content: "Yes! Let's start in 5 minutes",
    timestamp: "2:31 PM",
  },
  {
    id: "3",
    sender: "You",
    content: "I'm ready too!",
    timestamp: "2:32 PM",
  },
  {
    id: "4",
    sender: "Tom",
    content: "Just setting up my controller",
    timestamp: "2:33 PM",
  },
  {
    id: "5",
    sender: "You",
    content: "Perfect, we'll wait for you",
    timestamp: "2:33 PM",
  },
]; 