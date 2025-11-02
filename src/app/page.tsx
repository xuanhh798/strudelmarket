"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StrudelPlayer } from "@/components/StrudelPlayer";
import { supabase } from "@/lib/supabase";
import { AuthModal } from "@/components/AuthModal";
import { UserMenu } from "@/components/UserMenu";
import { onAuthStateChange } from "@/lib/auth";

interface Sample {
  id: string;
  name: string;
  category: string;
  code: string;
  author: string;
  tags: string[];
  description: string;
  created_at?: string;
  likes_count?: number;
  is_liked?: boolean;
}

// Demo data for when Supabase is not configured
const demoSamples: Sample[] = [
  {
    id: "demo-1",
    name: "Basic Kick Pattern",
    category: "Drums",
    code: 'sound("bd bd ~ bd").cpm(120)',
    author: "strudel",
    tags: ["kick", "bass", "4/4"],
    description: "Simple four-on-the-floor kick pattern",
  },
  {
    id: "demo-2",
    name: "Hi-Hat Groove",
    category: "Drums",
    code: 'sound("hh*8").fast(2)',
    author: "strudel",
    tags: ["hihat", "groove", "fast"],
    description: "Fast hi-hat pattern for energy",
  },
  {
    id: "demo-3",
    name: "Synth Arpeggio",
    category: "Synth",
    code: 'note("<c3 eb3 g3 bb3>").s("sawtooth").lpf(1000)',
    author: "community",
    tags: ["synth", "arpeggio", "melodic"],
    description: "Ascending synth arpeggio with filter",
  },
  {
    id: "demo-4",
    name: "Breakbeat Loop",
    category: "Drums",
    code: 'samples("github:tidalcycles/Dirt-Samples/master/breaks/breaks165.wav").speed("[1 1.1 0.9]*2")',
    author: "community",
    tags: ["breaks", "loop", "drum"],
    description: "Classic breakbeat with speed variations",
  },
  {
    id: "demo-5",
    name: "Ambient Pad",
    category: "Ambient",
    code: 'note("c2 eb2 g2").s("sawtooth").slow(8).room(0.9).lpf(800)',
    author: "strudel",
    tags: ["pad", "ambient", "slow"],
    description: "Lush ambient pad with reverb",
  },
  {
    id: "demo-6",
    name: "Snare Pattern",
    category: "Drums",
    code: 'sound("~ sd ~ sd")',
    author: "strudel",
    tags: ["snare", "backbeat"],
    description: "Classic backbeat snare pattern",
  },
  {
    id: "demo-7",
    name: "Bass Line",
    category: "Bass",
    code: 'note("c2 c2 eb2 g2").s("sawtooth").lpf(300)',
    author: "community",
    tags: ["bass", "groove", "low"],
    description: "Deep bass line with low-pass filter",
  },
  {
    id: "demo-8",
    name: "Euclidean Rhythm",
    category: "Patterns",
    code: 'sound("bd(3,8)").bank("RolandTR909")',
    author: "community",
    tags: ["euclidean", "rhythm", "generative"],
    description: "3 hits distributed across 8 steps",
  },
  {
    id: "demo-9",
    name: "Chord Progression",
    category: "Melodic",
    code: 'note("<Cm7 Fm7 Gm7 Bb7>").voicing().s("piano")',
    author: "strudel",
    tags: ["chords", "progression", "jazz"],
    description: "Jazz chord progression in C minor",
  },
  {
    id: "demo-10",
    name: "Clap Shuffle",
    category: "Drums",
    code: 'sound("~ ~ cp ~").degradeBy(0.3)',
    author: "community",
    tags: ["clap", "shuffle", "random"],
    description: "Shuffled clap pattern with randomization",
  },
];

const categories = [
  "All",
  "Drums",
  "Bass",
  "Synth",
  "Melodic",
  "Ambient",
  "Patterns",
  "Vocal",
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingCode, setPlayingCode] = useState<string>("");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const { data, error } = await supabase
          .from("patterns")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Supabase error, using demo data:", error);
          setSamples(demoSamples);
          setIsDemoMode(true);
        } else if (!data || data.length === 0) {
          console.log("No patterns in database, using demo data");
          setSamples(demoSamples);
          setIsDemoMode(true);
        } else {
          // Fetch likes data
          const { data: likesData } = await supabase
            .from("pattern_likes")
            .select("pattern_id, user_id");

          // Count likes per pattern
          const likesCount: { [key: string]: number } = {};
          const userLikes = new Set<string>();

          if (likesData) {
            likesData.forEach((like) => {
              likesCount[like.pattern_id] =
                (likesCount[like.pattern_id] || 0) + 1;
              if (user && like.user_id === user.id) {
                userLikes.add(like.pattern_id);
              }
            });
          }

          // Add likes info to patterns
          const patternsWithLikes = data.map((pattern) => ({
            ...pattern,
            likes_count: likesCount[pattern.id] || 0,
            is_liked: userLikes.has(pattern.id),
          }));

          setSamples(patternsWithLikes as Sample[]);
          setIsDemoMode(false);
        }
      } catch (err) {
        console.error("Failed to fetch patterns:", err);
        setSamples(demoSamples);
        setIsDemoMode(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatterns();

    // Subscribe to auth changes
    const { data: authListener } = onAuthStateChange((authUser) => {
      setUser(authUser);
      // Re-fetch patterns when auth state changes to update liked status
      if (authUser !== user) {
        setIsLoading(true);
        fetchPatterns();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [user]);

  const filteredSamples = samples.filter((sample) => {
    const matchesCategory =
      selectedCategory === "All" || sample.category === selectedCategory;
    const matchesSearch =
      sample.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const handlePlay = (id: string, code: string) => {
    if (playingId === id) {
      // Stop if clicking the same pattern
      setPlayingId(null);
      setPlayingCode("");
    } else {
      // Play new pattern
      setPlayingId(id);
      setPlayingCode(code);
    }
  };

  const handleLike = async (
    e: React.MouseEvent,
    patternId: string,
    isLiked: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (isDemoMode) {
      alert("Likes are not available in demo mode. Please configure Supabase.");
      return;
    }

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from("pattern_likes")
          .delete()
          .eq("pattern_id", patternId)
          .eq("user_id", user.id);

        // Update local state
        setSamples(
          samples.map((s) =>
            s.id === patternId
              ? {
                  ...s,
                  likes_count: Math.max((s.likes_count || 0) - 1, 0),
                  is_liked: false,
                }
              : s
          )
        );
      } else {
        // Like
        await supabase.from("pattern_likes").insert({
          pattern_id: patternId,
          user_id: user.id,
        });

        // Update local state
        setSamples(
          samples.map((s) =>
            s.id === patternId
              ? {
                  ...s,
                  likes_count: (s.likes_count || 0) + 1,
                  is_liked: true,
                }
              : s
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Failed to update like");
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black/10 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight ml-12 lg:ml-0">
              Samples
            </h1>
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  <Link
                    href="/upload"
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-black hover:bg-black hover:text-white transition-colors"
                  >
                    Upload
                  </Link>
                  <UserMenu user={user} onSignOut={() => setUser(null)} />
                </>
              ) : (
                <>
                  <Link
                    href="/upload"
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-black hover:bg-black hover:text-white transition-colors"
                  >
                    Upload
                  </Link>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-black hover:bg-black hover:text-white transition-colors"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search patterns, tags, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-black/20 focus:border-black focus:outline-none transition-colors"
            />
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="mb-6 bg-black/5 border border-black/10 px-4 py-3 text-center sm:text-left">
            <p className="text-xs sm:text-sm text-black/70">
              📝 Demo Mode: Showing example patterns. Configure Supabase to
              store real patterns. See{" "}
              <a
                href="/SETUP.md"
                className="underline hover:text-black"
                target="_blank"
              >
                SETUP.md
              </a>
            </p>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 sm:px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? "bg-black text-white"
                  : "border border-black/20 hover:border-black"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-black/60">
          {isLoading ? (
            "Loading patterns..."
          ) : (
            <>
              {filteredSamples.length}{" "}
              {filteredSamples.length === 1 ? "pattern" : "patterns"}
            </>
          )}
        </div>

        {/* Sample Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-black/40">
            <p className="text-lg">Loading patterns...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSamples.map((sample) => (
              <Link
                key={sample.id}
                href={`/pattern/${sample.id}`}
                className="border border-black/10 hover:border-black transition-all group cursor-pointer block"
              >
                {/* Code Preview */}
                <div className="relative h-32 overflow-hidden">
                  <div className="bg-black text-white p-4 font-mono text-sm h-full">
                    <pre className="whitespace-pre-wrap break-words overflow-hidden">
                      {sample.code}
                    </pre>
                  </div>

                  {/* Play Button Overlay */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePlay(sample.id, sample.code);
                    }}
                    className="absolute top-2 right-2 w-10 h-10 border border-white/30 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all group-hover:scale-110"
                    title={playingId === sample.id ? "Stop" : "Play"}
                  >
                    {playingId === sample.id ? (
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
                      navigator.clipboard.writeText(sample.code);
                    }}
                    className="absolute bottom-2 right-2 px-2 py-1 text-xs border border-white/30 text-white hover:bg-white/10 transition-colors"
                    title="Copy code"
                  >
                    Copy
                  </button>
                </div>

                {/* Sample Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{sample.name}</h3>
                    <span className="text-xs text-black/50 ml-2">
                      @{sample.author}
                    </span>
                  </div>

                  <p className="text-sm text-black/60 mb-3 line-clamp-2">
                    {sample.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {sample.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 border border-black/10 text-black/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Like Button */}
                  {!isDemoMode && (
                    <button
                      onClick={(e) =>
                        handleLike(e, sample.id, sample.is_liked || false)
                      }
                      className="flex items-center gap-1.5 text-sm text-black/70 hover:text-black transition-colors"
                      title={sample.is_liked ? "Unlike" : "Like"}
                    >
                      <svg
                        className={`w-5 h-5 ${
                          sample.is_liked ? "fill-black" : "fill-none"
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
                      <span>{sample.likes_count || 0}</span>
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && filteredSamples.length === 0 && (
          <div className="text-center py-20 text-black/40">
            <p className="text-lg">No patterns found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-black/10 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-sm text-black/60">
            <p>Strudel Patterns Library</p>
            <div className="flex gap-6">
              <a
                href="https://strudel.cc"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black transition-colors"
              >
                Strudel REPL
              </a>
              <a
                href="https://strudel.cc/learn"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black transition-colors"
              >
                Learn
              </a>
              <a
                href="https://codeberg.org/uzu/strudel/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black transition-colors"
              >
                Codeberg
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Strudel Player */}
      {playingId !== null && (
        <StrudelPlayer
          code={playingCode}
          isPlaying={true}
          onStop={() => setPlayingId(null)}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          // Refresh patterns after auth
          window.location.reload();
        }}
      />
    </div>
  );
}
