"use client";

import { useState, useEffect, useRef } from "react";
import { signOut } from "@/lib/auth";

interface UserMenuProps {
  user: {
    email: string;
    user_metadata?: {
      username?: string;
    };
  };
  onSignOut: () => void;
}

export function UserMenu({ user, onSignOut }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const username = user.user_metadata?.username || user.email.split("@")[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      onSignOut();
      setIsOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors flex items-center gap-2"
      >
        <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
          {username[0].toUpperCase()}
        </div>
        <span className="hidden sm:inline">{username}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-black/10 shadow-lg z-50">
          <div className="p-4 border-b border-black/10">
            <p className="font-semibold truncate">{username}</p>
            <p className="text-xs text-black/60 truncate">{user.email}</p>
          </div>
          <div className="p-2">
            <a
              href="/profile"
              className="block w-full text-left px-4 py-2 hover:bg-black/5 transition-colors"
            >
              Profile
            </a>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 hover:bg-black/5 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
