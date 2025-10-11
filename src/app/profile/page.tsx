"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { StrudelPlayer } from "@/components/StrudelPlayer";

interface Pattern {
  id: string;
  name: string;
  category: string;
  code: string;
  author: string;
  tags: string[];
  description: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingCode, setPlayingCode] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        // Redirect to home if not logged in
        router.push("/");
        return;
      }

      setUser(currentUser);

      // Fetch user's patterns
      const { data, error } = await supabase
        .from("patterns")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPatterns(data as Pattern[]);
      }

      setIsLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pattern?")) {
      return;
    }

    setDeletingId(id);

    try {
      const { error } = await supabase.from("patterns").delete().eq("id", id);

      if (error) throw error;

      // Remove from local state
      setPatterns(patterns.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting pattern:", error);
      alert("Failed to delete pattern");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePlay = (id: string, code: string) => {
    if (playingId === id) {
      setPlayingId(null);
      setPlayingCode("");
    } else {
      setPlayingId(id);
      setPlayingCode(code);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const username = user.user_metadata?.username || user.email?.split("@")[0];

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black/10 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
            <div className="flex items-center gap-3">
              <Link
                href="/upload"
                className="px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors"
              >
                Upload
              </Link>
              <Link
                href="/"
                className="px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors"
              >
                Browse Samples
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-3xl font-bold">
              {username[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-bold">{username}</h2>
              <p className="text-black/60">{user.email}</p>
              <p className="text-sm text-black/50 mt-1">
                {patterns.length}{" "}
                {patterns.length === 1 ? "pattern" : "patterns"} uploaded
              </p>
            </div>
          </div>
        </div>

        {/* User's Patterns */}
        <div>
          <h3 className="text-2xl font-bold mb-6">Your Patterns</h3>

          {patterns.length === 0 ? (
            <div className="text-center py-20 border border-black/10">
              <p className="text-lg text-black/40 mb-4">No patterns yet</p>
              <Link
                href="/upload"
                className="inline-block px-6 py-3 bg-black text-white hover:bg-black/90 transition-colors"
              >
                Upload Your First Pattern
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="border border-black/10 hover:border-black transition-all group"
                >
                  <Link href={`/pattern/${pattern.id}`}>
                    {/* Code Preview */}
                    <div className="relative h-32 overflow-hidden cursor-pointer">
                      <div className="bg-black text-white p-4 font-mono text-sm h-full">
                        <pre className="whitespace-pre-wrap break-words overflow-hidden">
                          {pattern.code}
                        </pre>
                      </div>

                      {/* Play Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePlay(pattern.id, pattern.code);
                        }}
                        className="absolute top-2 right-2 w-10 h-10 border border-white/30 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all group-hover:scale-110"
                        title={playingId === pattern.id ? "Stop" : "Play"}
                      >
                        {playingId === pattern.id ? (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4 ml-0.5 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>

                      {/* Copy Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigator.clipboard.writeText(pattern.code);
                        }}
                        className="absolute bottom-2 right-2 px-2 py-1 text-xs border border-white/30 text-white hover:bg-white/10 transition-colors"
                        title="Copy code"
                      >
                        Copy
                      </button>
                    </div>
                  </Link>

                  {/* Pattern Info */}
                  <div className="p-4">
                    <Link href={`/pattern/${pattern.id}`}>
                      <h3 className="font-semibold mb-2 hover:underline cursor-pointer">
                        {pattern.name}
                      </h3>
                    </Link>

                    <p className="text-sm text-black/60 mb-3 line-clamp-2">
                      {pattern.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {pattern.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 border border-black/10 text-black/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-black/10">
                      <Link
                        href={`/pattern/${pattern.id}`}
                        className="flex-1 py-2 text-sm text-center border border-black/20 hover:border-black hover:bg-black hover:text-white transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(pattern.id);
                        }}
                        disabled={deletingId === pattern.id}
                        className={`flex-1 py-2 text-sm border border-black/20 hover:border-black hover:bg-black hover:text-white transition-colors ${
                          deletingId === pattern.id
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {deletingId === pattern.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Strudel Player */}
      {playingId !== null && (
        <StrudelPlayer
          code={playingCode}
          isPlaying={true}
          onStop={() => setPlayingId(null)}
        />
      )}
    </div>
  );
}
