"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function UploadPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    category: "Drums",
    code: "",
    author: "",
    tags: "",
    description: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        setFormData((prev) => ({
          ...prev,
          author:
            currentUser.user_metadata?.username ||
            currentUser.email?.split("@")[0] ||
            "",
        }));
      }
      setIsLoadingUser(false);
    };
    loadUser();
  }, []);

  const categories = [
    "Drums",
    "Bass",
    "Synth",
    "Melodic",
    "Ambient",
    "Patterns",
    "Vocal",
    "FX",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.code.trim() || !formData.name.trim()) {
      setError("Please provide a name and code for your pattern");
      return;
    }

    setIsUploading(true);

    try {
      // Parse tags from comma-separated string
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Insert into Supabase
      const { error: supabaseError } = await supabase
        .from("patterns")
        .insert([
          {
            name: formData.name,
            category: formData.category,
            code: formData.code,
            author: formData.author || "anonymous",
            tags: tagsArray,
            description: formData.description,
            user_id: user?.id || null,
          },
        ])
        .select();

      if (supabaseError) {
        throw supabaseError;
      }

      // Success
      alert("Pattern uploaded successfully!");

      // Reset form
      setFormData({
        name: "",
        category: "Drums",
        code: "",
        author: "",
        tags: "",
        description: "",
      });

      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err) {
      console.error("Error uploading pattern:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload pattern. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const examplePatterns = [
    'sound("bd sd ~ sd")',
    'note("c3 eb3 g3").s("sawtooth")',
    'stack(sound("bd*4"), sound("hh*8"))',
  ];

  const insertExample = (pattern: string) => {
    setFormData({ ...formData, code: pattern });
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black/10 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">
              Upload Pattern
            </h1>
            <Link
              href="/"
              className="px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors"
            >
              Back to Samples
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Upload Pattern</h2>
          <p className="text-black/60">
            Share your Strudel code patterns with the community
          </p>
        </div>

        {error && (
          <div className="bg-black text-white px-4 py-3 border border-black">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Code Editor */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold">
                Strudel Code *
              </label>
              <div className="flex gap-2">
                {examplePatterns.map((pattern, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertExample(pattern)}
                    className="text-xs px-2 py-1 border border-black/20 hover:border-black transition-colors"
                  >
                    Example {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative border border-black/20 focus-within:border-black transition-colors">
              <textarea
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                placeholder='sound("bd sd ~ sd").cpm(120)'
                rows={8}
                className="w-full px-4 py-3 font-mono text-sm focus:outline-none resize-none bg-black/5"
              />
              <div className="absolute bottom-2 right-2 text-xs text-black/40">
                {formData.code.length} characters
              </div>
            </div>

            <p className="text-xs text-black/50 mt-2">
              Write your Strudel pattern using the Strudel syntax. Test it in{" "}
              <a
                href="https://strudel.cc"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-black"
              >
                Strudel REPL
              </a>{" "}
              before uploading.
            </p>
          </div>

          {/* Sample Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">
                Pattern Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Basic Kick Pattern"
                className="w-full px-4 py-3 border border-black/20 focus:border-black focus:outline-none transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-black/20 focus:border-black focus:outline-none transition-colors bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Author / Username
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                placeholder="Your username"
                disabled={!!user}
                className={`w-full px-4 py-3 border border-black/20 focus:border-black focus:outline-none transition-colors ${
                  user ? "bg-black/5 cursor-not-allowed" : ""
                }`}
              />
              {user && (
                <p className="text-xs text-black/50 mt-1">
                  Signed in as {user.email}
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Tags</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="kick, bass, groove (comma separated)"
                className="w-full px-4 py-3 border border-black/20 focus:border-black focus:outline-none transition-colors"
              />
              <p className="text-xs text-black/50 mt-1">
                Separate tags with commas
              </p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your pattern, how to use it, or what makes it unique..."
                rows={4}
                className="w-full px-4 py-3 border border-black/20 focus:border-black focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Preview */}
          {formData.code && (
            <div>
              <label className="block text-sm font-semibold mb-3">
                Preview
              </label>
              <div className="border border-black/10">
                <div className="bg-black text-white p-4 font-mono text-sm">
                  <pre className="whitespace-pre-wrap break-words">
                    {formData.code}
                  </pre>
                </div>
                <div className="p-4 bg-black/5">
                  <h3 className="font-semibold mb-1">
                    {formData.name || "Untitled Pattern"}
                  </h3>
                  <p className="text-sm text-black/60">
                    {formData.description || "No description"}
                  </p>
                  {formData.tags && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.split(",").map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 border border-black/10 text-black/70"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={
                !formData.code.trim() || !formData.name.trim() || isUploading
              }
              className={`px-8 py-3 font-semibold transition-colors ${
                !formData.code.trim() || !formData.name.trim() || isUploading
                  ? "bg-black/20 text-black/40 cursor-not-allowed"
                  : "bg-black text-white hover:bg-black/90"
              }`}
            >
              {isUploading ? "Uploading..." : "Share Pattern"}
            </button>

            <Link
              href="/"
              className="px-8 py-3 border border-black/20 hover:border-black transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
