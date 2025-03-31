'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Navigation() {
  const [user, setUser] = useState(auth.currentUser);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 bg-background/50 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="bounce-animation text-2xl font-extrabold text-white">🎉 Kalmny</span>
        </Link>
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link href="/dashboard" className="party-button text-sm">
                Dashboard 🎮
              </Link>
              <button onClick={handleSignOut} className="party-button text-sm">
                Sign Out 👋
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="party-button text-sm">
                Login 🚀
              </Link>
              <Link href="/register" className="party-button text-sm">
                Register ✨
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 