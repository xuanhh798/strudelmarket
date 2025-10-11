"use client";

import { useState, useEffect } from "react";
import { supabase, Post, Comment } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { AuthModal } from "@/components/AuthModal";
import { UserMenu } from "@/components/UserMenu";

interface PostWithComments extends Post {
  comments: Comment[];
  showComments: boolean;
}

export default function FeedPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<PostWithComments[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [commentContent, setCommentContent] = useState<{
    [key: string]: string;
  }>({});
  const [isCommenting, setIsCommenting] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    loadUser();
    loadPosts();
  }, []);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const loadPosts = async () => {
    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Fetch all comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      // Combine posts with their comments
      const postsWithComments = (postsData || []).map((post) => ({
        ...post,
        comments: (commentsData || []).filter(
          (comment) => comment.post_id === post.id
        ),
        showComments: false,
      }));

      setPosts(postsWithComments);
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!newPostContent.trim()) return;

    setIsPosting(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            content: newPostContent,
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
        setPosts([{ ...data, comments: [], showComments: false }, ...posts]);
        setNewPostContent("");
      }
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const content = commentContent[postId]?.trim();
    if (!content) return;

    setIsCommenting({ ...isCommenting, [postId]: true });
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([
          {
            content,
            post_id: postId,
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
        setPosts(
          posts.map((post) =>
            post.id === postId
              ? { ...post, comments: [...post.comments, data] }
              : post
          )
        );
        setCommentContent({ ...commentContent, [postId]: "" });
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment");
    } finally {
      setIsCommenting({ ...isCommenting, [postId]: false });
    }
  };

  const toggleComments = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? { ...post, showComments: !post.showComments }
          : post
      )
    );
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;

      setPosts(posts.filter((post) => post.id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post");
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;

      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.filter((c) => c.id !== commentId),
              }
            : post
        )
      );
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment");
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

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black/10 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Feed</h1>
            <div className="flex items-center gap-3">
              {user ? (
                <UserMenu user={user} onSignOut={() => setUser(null)} />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Create Post */}
        <div className="mb-8 border border-black/10 p-6">
          <h2 className="text-lg font-semibold mb-4">Share your thoughts</h2>
          {user ? (
            <form onSubmit={handleCreatePost}>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                className="w-full px-4 py-3 border border-black/20 focus:border-black focus:outline-none transition-colors resize-none mb-3"
              />
              <button
                type="submit"
                disabled={!newPostContent.trim() || isPosting}
                className={`px-6 py-2 font-semibold transition-colors ${
                  !newPostContent.trim() || isPosting
                    ? "bg-black/20 text-black/40 cursor-not-allowed"
                    : "bg-black text-white hover:bg-black/90"
                }`}
              >
                {isPosting ? "Posting..." : "Post"}
              </button>
            </form>
          ) : (
            <div className="text-center py-8 bg-black/5">
              <p className="text-black/60 mb-4">
                Sign in to share your thoughts
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2 border border-black hover:bg-black hover:text-white transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-black/60">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 border border-black/10">
            <p className="text-black/60">
              No posts yet. Be the first to share!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="border border-black/10">
                {/* Post Header */}
                <div className="p-6 border-b border-black/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{post.author}</p>
                      <p className="text-sm text-black/50">
                        {formatTimeAgo(post.created_at)}
                      </p>
                    </div>
                    {user && user.id === post.user_id && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-black/40 hover:text-black text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-black/90 whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {/* Post Actions */}
                <div className="px-6 py-3 bg-black/5 border-b border-black/10">
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="text-sm text-black/70 hover:text-black transition-colors"
                  >
                    {post.comments.length}{" "}
                    {post.comments.length === 1 ? "comment" : "comments"}
                  </button>
                </div>

                {/* Comments Section */}
                {post.showComments && (
                  <div className="p-6 bg-white">
                    {/* Add Comment */}
                    {user ? (
                      <div className="mb-6">
                        <textarea
                          value={commentContent[post.id] || ""}
                          onChange={(e) =>
                            setCommentContent({
                              ...commentContent,
                              [post.id]: e.target.value,
                            })
                          }
                          placeholder="Write a comment..."
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-black/20 focus:border-black focus:outline-none transition-colors resize-none mb-2"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={
                            !commentContent[post.id]?.trim() ||
                            isCommenting[post.id]
                          }
                          className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
                            !commentContent[post.id]?.trim() ||
                            isCommenting[post.id]
                              ? "bg-black/20 text-black/40 cursor-not-allowed"
                              : "bg-black text-white hover:bg-black/90"
                          }`}
                        >
                          {isCommenting[post.id] ? "Commenting..." : "Comment"}
                        </button>
                      </div>
                    ) : (
                      <div className="mb-6 text-center py-4 bg-black/5">
                        <p className="text-sm text-black/60">
                          <button
                            onClick={() => setShowAuthModal(true)}
                            className="underline hover:text-black"
                          >
                            Sign in
                          </button>{" "}
                          to comment
                        </p>
                      </div>
                    )}

                    {/* Comments List */}
                    {post.comments.length === 0 ? (
                      <p className="text-sm text-black/40 text-center py-4">
                        No comments yet
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {post.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="border-l-2 border-black/10 pl-4"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <span className="text-sm font-semibold">
                                  {comment.author}
                                </span>
                                <span className="text-xs text-black/50 ml-2">
                                  {formatTimeAgo(comment.created_at)}
                                </span>
                              </div>
                              {user && user.id === comment.user_id && (
                                <button
                                  onClick={() =>
                                    handleDeleteComment(comment.id, post.id)
                                  }
                                  className="text-black/40 hover:text-black text-xs"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-black/80">
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
