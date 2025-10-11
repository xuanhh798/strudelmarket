/**
 * Seed Script for Strudel Patterns
 *
 * This script populates your Supabase database with demo patterns.
 *
 * Usage:
 * 1. Make sure you have .env.local configured
 * 2. Run: npx tsx scripts/seed-patterns.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const demoPatterns = [
  {
    name: "Basic Kick Pattern",
    category: "Drums",
    code: 'sound("bd bd ~ bd").cpm(120)',
    author: "strudel",
    tags: ["kick", "bass", "4/4"],
    description: "Simple four-on-the-floor kick pattern",
  },
  {
    name: "Hi-Hat Groove",
    category: "Drums",
    code: 'sound("hh*8").fast(2)',
    author: "strudel",
    tags: ["hihat", "groove", "fast"],
    description: "Fast hi-hat pattern for energy",
  },
  {
    name: "Synth Arpeggio",
    category: "Synth",
    code: 'note("<c3 eb3 g3 bb3>").s("sawtooth").lpf(1000)',
    author: "community",
    tags: ["synth", "arpeggio", "melodic"],
    description: "Ascending synth arpeggio with filter",
  },
  {
    name: "Ambient Pad",
    category: "Ambient",
    code: 'note("c2 eb2 g2").s("sawtooth").slow(8).room(0.9).lpf(800)',
    author: "strudel",
    tags: ["pad", "ambient", "slow"],
    description: "Lush ambient pad with reverb",
  },
  {
    name: "Snare Pattern",
    category: "Drums",
    code: 'sound("~ sd ~ sd")',
    author: "strudel",
    tags: ["snare", "backbeat"],
    description: "Classic backbeat snare pattern",
  },
  {
    name: "Bass Line",
    category: "Bass",
    code: 'note("c2 c2 eb2 g2").s("sawtooth").lpf(300)',
    author: "community",
    tags: ["bass", "groove", "low"],
    description: "Deep bass line with low-pass filter",
  },
  {
    name: "Euclidean Rhythm",
    category: "Patterns",
    code: 'sound("bd(3,8)").bank("RolandTR909")',
    author: "community",
    tags: ["euclidean", "rhythm", "generative"],
    description: "3 hits distributed across 8 steps",
  },
  {
    name: "Chord Progression",
    category: "Melodic",
    code: 'note("<Cm7 Fm7 Gm7 Bb7>").voicing().s("piano")',
    author: "strudel",
    tags: ["chords", "progression", "jazz"],
    description: "Jazz chord progression in C minor",
  },
];

async function seedPatterns() {
  console.log("🌱 Starting seed process...\n");

  try {
    // Check if table exists and is accessible
    const { count, error: countError } = await supabase
      .from("patterns")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("❌ Error accessing patterns table:", countError.message);
      console.log("\n💡 Make sure you've run the SQL schema from SETUP.md");
      process.exit(1);
    }

    console.log(`📊 Current patterns in database: ${count || 0}`);

    // Insert demo patterns
    const { data, error } = await supabase
      .from("patterns")
      .insert(demoPatterns)
      .select();

    if (error) {
      console.error("❌ Error inserting patterns:", error.message);
      process.exit(1);
    }

    console.log(`\n✅ Successfully inserted ${data?.length || 0} patterns!`);
    console.log(
      "\n🎉 Seed complete! Visit http://localhost:3000 to see your patterns."
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

seedPatterns();
