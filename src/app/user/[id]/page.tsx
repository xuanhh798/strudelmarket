"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { StrudelPlayer } from "@/components/StrudelPlayer";
import { AuthModal } from "@/components/AuthModal";
import { UserMenu } from "@/components/UserMenu";
import { onAuthStateChange } from "@/lib/auth";

interface Pattern {
  id: string;
  name: string;
  category: string;
  code: string;
  author: string;
  tags: string[];
  description: string;
  created_at: string;
  user_id: string | null;
  likes_count?: number;
  is_liked?: boolean;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [likedPatterns, setLikedPatterns] = useState<Pattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingCode, setPlayingCode] = useState<string>("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"uploaded" | "liked">("uploaded");

  const [profileName, setProfileName] = useState<string>("");
  const [totalLikesReceived, setTotalLikesReceived] = useState(0);

  useEffect(() => {
    const loadUserProfile = async (authUser?: { id: string } | null) => {
      try {
        const { data: userPatterns, error } = await supabase
          .from("patterns")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (userPatterns && userPatterns.length > 0) {
          setProfileName(userPatterns[0].author);
        }

        const likesCount: { [key: string]: number } = {};
        const userLikes = new Set<string>();

        try {
          if (userPatterns && userPatterns.length > 0) {
            const patternIds = userPatterns.map((p) => p.id);
            const { data: likesData } = await supabase
              .from("pattern_likes")
              .select("pattern_id, user_id")
              .in("pattern_id", patternIds);

            if (likesData) {
              likesData.forEach((like) => {
                likesCount[like.pattern_id] =
                  (likesCount[like.pattern_id] || 0) + 1;
                if (authUser && like.user_id === authUser.id) {
                  userLikes.add(like.pattern_id);
                }
              });
            }
          }
        } catch {
          // pattern_likes table might not exist yet
        }

        const patternsWithLikes = (userPatterns || []).map((pattern) => ({
          ...pattern,
          likes_count: likesCount[pattern.id] || 0,
          is_liked: userLikes.has(pattern.id),
        }));

        const total = patternsWithLikes.reduce(
          (sum, p) => sum + (p.likes_count || 0),
          0,
        );
        setTotalLikesReceived(total);
        setPatterns(patternsWithLikes as Pattern[]);

        // Fetch patterns this user has liked
        const { data: likedData } = await supabase
          .from("pattern_likes")
          .select("pattern_id")
          .eq("user_id", userId);

        if (likedData && likedData.length > 0) {
          const likedIds = likedData.map((l) => l.pattern_id);
          const { data: likedPatternsData } = await supabase
            .from("patterns")
            .select("*")
            .in("id", likedIds)
            .order("created_at", { ascending: false });

          if (likedPatternsData) {
            setLikedPatterns(likedPatternsData as Pattern[]);
          }
        }

        // If we didn't get a name from patterns, try liked patterns or fall back
        if ((!userPatterns || userPatterns.length === 0) && !profileName) {
          setProfileName("User");
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile(currentUser);

    const { data: authListener } = onAuthStateChange((authUser) => {
      setCurrentUser(authUser);
      loadUserProfile(authUser);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handlePlay = (id: string, code: string) => {
    if (playingId === id) {
      setPlayingId(null);
      setPlayingCode("");
    } else {
      setPlayingId(id);
      setPlayingCode(code);
    }
  };

  const handleLike = async (
    e: React.MouseEvent,
    patternId: string,
    isLiked: boolean,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from("pattern_likes")
          .delete()
          .eq("pattern_id", patternId)
          .eq("user_id", currentUser.id);

        setPatterns(
          patterns.map((p) =>
            p.id === patternId
              ? {
                  ...p,
                  likes_count: Math.max((p.likes_count || 0) - 1, 0),
                  is_liked: false,
                }
              : p,
          ),
        );
        setTotalLikesReceived((prev) => Math.max(prev - 1, 0));
      } else {
        await supabase.from("pattern_likes").insert({
          pattern_id: patternId,
          user_id: currentUser.id,
        });

        setPatterns(
          patterns.map((p) =>
            p.id === patternId
              ? {
                  ...p,
                  likes_count: (p.likes_count || 0) + 1,
                  is_liked: true,
                }
              : p,
          ),
        );
        setTotalLikesReceived((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return past.toLocaleDateString();
  };

  const isOwnProfile = currentUser?.id === userId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  const displayPatterns = activeTab === "uploaded" ? patterns : likedPatterns;

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-black/10 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-sm sm:text-base text-black/60 hover:text-black transition-colors ml-12 lg:ml-0"
            >
              ← Back
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              {currentUser ? (
                <UserMenu
                  user={currentUser}
                  onSignOut={() => setCurrentUser(null)}
                />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-black hover:bg-black hover:text-white transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-3xl font-bold">
              {profileName?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-3xl font-bold">{profileName}</h2>
              <div className="flex gap-4 text-sm text-black/50 mt-1">
                <p>
                  {patterns.length}{" "}
                  {patterns.length === 1 ? "pattern" : "patterns"} uploaded
                </p>
                <p>·</p>
                <p>
                  {totalLikesReceived}{" "}
                  {totalLikesReceived === 1 ? "like" : "likes"} received
                </p>
                <p>·</p>
                <p>
                  {likedPatterns.length}{" "}
                  {likedPatterns.length === 1 ? "pattern" : "patterns"} liked
                </p>
              </div>
              {isOwnProfile && (
                <Link
                  href="/profile"
                  className="inline-block mt-2 text-sm text-black/50 hover:text-black transition-colors underline"
                >
                  Edit profile
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-black/10">
          <div className="flex gap-4 sm:gap-8">
            <button
              onClick={() => setActiveTab("uploaded")}
              className={`pb-4 px-2 text-lg font-semibold transition-colors relative ${
                activeTab === "uploaded"
                  ? "text-black"
                  : "text-black/40 hover:text-black/60"
              }`}
            >
              Uploaded ({patterns.length})
              {activeTab === "uploaded" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("liked")}
              className={`pb-4 px-2 text-lg font-semibold transition-colors relative ${
                activeTab === "liked"
                  ? "text-black"
                  : "text-black/40 hover:text-black/60"
              }`}
            >
              Liked ({likedPatterns.length})
              {activeTab === "liked" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
              )}
            </button>
          </div>
        </div>

        {/* Patterns Grid */}
        {displayPatterns.length === 0 ? (
          <div className="text-center py-20 border border-black/10">
            <p className="text-lg text-black/40 mb-2">
              {activeTab === "uploaded"
                ? "No patterns uploaded yet"
                : "No liked patterns yet"}
            </p>
            <p className="text-sm text-black/30">
              {activeTab === "uploaded"
                ? "This user hasn't shared any patterns."
                : "This user hasn't liked any patterns."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayPatterns.map((pattern) => (
              <Link
                key={pattern.id}
                href={`/pattern/${pattern.id}`}
                className="border border-black/10 hover:border-black transition-all group cursor-pointer block"
              >
                {/* Code Preview */}
                <div className="relative h-32 overflow-hidden">
                  <div className="bg-black text-white p-4 font-mono text-sm h-full">
                    <pre className="whitespace-pre-wrap break-words overflow-hidden">
                      {pattern.code}
                    </pre>
                  </div>

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

                {/* Pattern Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{pattern.name}</h3>
                    {activeTab === "liked" && (
                      <span className="text-xs text-black/50 ml-2">
                        @{pattern.author}
                      </span>
                    )}
                    {activeTab === "uploaded" && pattern.created_at && (
                      <span className="text-xs text-black/50 ml-2">
                        {formatTimeAgo(pattern.created_at)}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-black/60 mb-3 line-clamp-2">
                    {pattern.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {pattern.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 border border-black/10 text-black/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {activeTab === "uploaded" && (
                    <div className="flex items-center">
                      <button
                        onClick={(e) =>
                          handleLike(e, pattern.id, pattern.is_liked || false)
                        }
                        className="flex items-center gap-1.5 text-sm text-black/70 hover:text-black transition-colors"
                        title={pattern.is_liked ? "Unlike" : "Like"}
                      >
                        <svg
                          className={`w-5 h-5 ${
                            pattern.is_liked ? "fill-black" : "fill-none"
                          }`}
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span>{pattern.likes_count || 0}</span>
                      </button>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {playingId !== null && (
        <StrudelPlayer
          code={playingCode}
          isPlaying={true}
          onStop={() => setPlayingId(null)}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
