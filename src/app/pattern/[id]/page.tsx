"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, Pattern, PatternComment } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { StrudelPlayer } from "@/components/StrudelPlayer";
import { AuthModal } from "@/components/AuthModal";
import { UserMenu } from "@/components/UserMenu";

export default function PatternDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patternId = params.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [comments, setComments] = useState<PatternComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [playingCode, setPlayingCode] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const loadPattern = async () => {
    try {
      // Fetch pattern
      const { data: patternData, error: patternError } = await supabase
        .from("patterns")
        .select("*")
        .eq("id", patternId)
        .single();

      if (patternError) throw patternError;

      setPattern(patternData);

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("pattern_comments")
        .select("*")
        .eq("pattern_id", patternId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      setComments(commentsData || []);
    } catch (err) {
      console.error("Error loading pattern:", err);
      // Pattern not found, redirect to home
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    loadPattern();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const content = commentContent.trim();
    if (!content) return;

    setIsCommenting(true);
    try {
      const { data, error } = await supabase
        .from("pattern_comments")
        .insert([
          {
            content,
            pattern_id: patternId,
            user_id: user.id,
            author:
              user.user_metadata?.username ||
              user.email?.split("@")[0] ||
              "Anonymous",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setComments([...comments, data]);
        setCommentContent("");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      const { error } = await supabase
        .from("pattern_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment");
    }
  };

  const handlePlay = () => {
    if (pattern) {
      setPlayingCode(pattern.code);
      setIsPlaying(true);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <p>Loading pattern...</p>
      </div>
    );
  }

  if (!pattern) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black/10 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm sm:text-base text-black/60 hover:text-black transition-colors ml-12 lg:ml-0"
              >
                ← Back
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <UserMenu user={user} onSignOut={() => setUser(null)} />
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Pattern Info */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                {pattern.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-black/60">
                <span>by {pattern.author}</span>
                <span>•</span>
                <span className="px-2 py-1 bg-black/5 border border-black/10">
                  {pattern.category}
                </span>
                {pattern.created_at && (
                  <>
                    <span>•</span>
                    <span>{formatTimeAgo(pattern.created_at)}</span>
                  </>
                )}
              </div>
              {pattern.description && (
                <p className="mt-3 text-black/80">{pattern.description}</p>
              )}
              {pattern.tags && pattern.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {pattern.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 border border-black/20 text-black/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={handlePlay}
              className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-black text-white hover:bg-black/90 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play in Strudel REPL
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(pattern.code)}
              className="px-4 sm:px-6 py-2 text-sm sm:text-base border border-black hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy Code
            </button>
          </div>

          {/* Code Display - GitHub Style */}
          <div className="border border-black/20 rounded-lg overflow-hidden">
            <div className="bg-black/5 px-4 py-2 border-b border-black/20 flex items-center justify-between">
              <span className="text-sm font-semibold font-mono">
                pattern.strudel
              </span>
              <span className="text-xs text-black/50">
                {pattern.code.split("\n").length} lines
              </span>
            </div>
            <div className="bg-black text-white p-6">
              <pre className="font-mono text-sm whitespace-pre-wrap break-words overflow-x-auto">
                <code>{pattern.code}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="border-t border-black/10 pt-8">
          <h2 className="text-2xl font-bold mb-6">
            Comments ({comments.length})
          </h2>

          {/* Add Comment */}
          {user ? (
            <form onSubmit={handleAddComment} className="mb-8">
              <div className="border border-black/20 rounded-lg overflow-hidden">
                <div className="bg-black/5 px-4 py-2 border-b border-black/20">
                  <span className="text-sm font-semibold">Add a comment</span>
                </div>
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Share your thoughts about this pattern..."
                  rows={4}
                  className="w-full px-4 py-3 focus:outline-none resize-none"
                />
                <div className="bg-black/5 px-4 py-3 border-t border-black/20 flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentContent.trim() || isCommenting}
                    className={`px-6 py-2 font-semibold transition-colors ${
                      !commentContent.trim() || isCommenting
                        ? "bg-black/20 text-black/40 cursor-not-allowed"
                        : "bg-black text-white hover:bg-black/90"
                    }`}
                  >
                    {isCommenting ? "Posting..." : "Comment"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 text-center py-8 border border-black/10 rounded-lg bg-black/5">
              <p className="text-black/60 mb-4">Sign in to leave a comment</p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2 border border-black hover:bg-black hover:text-white transition-colors"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-12 border border-black/10 rounded-lg">
              <p className="text-black/40">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border border-black/10 rounded-lg"
                >
                  <div className="px-6 py-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="font-semibold">{comment.author}</span>
                        <span className="text-sm text-black/50 ml-3">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      {user && user.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-sm text-black/40 hover:text-black transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-black/90 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <StrudelPlayer
        code={playingCode}
        isPlaying={isPlaying}
        onStop={() => setIsPlaying(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          loadUser();
        }}
      />
    </div>
  );
}
