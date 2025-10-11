import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found. Using demo mode.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Pattern {
  id: string;
  created_at: string;
  name: string;
  category: string;
  code: string;
  author: string;
  tags: string[];
  description: string;
}

export type PatternInsert = Omit<Pattern, "id" | "created_at">;
