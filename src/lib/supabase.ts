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
  user_id: string | null;
}

export interface Post {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  author: string;
}

export interface Comment {
  id: string;
  created_at: string;
  content: string;
  post_id: string;
  user_id: string;
  author: string;
}

export interface PatternComment {
  id: string;
  created_at: string;
  content: string;
  pattern_id: string;
  user_id: string;
  author: string;
}

export interface PatternLike {
  id: string;
  created_at: string;
  pattern_id: string;
  user_id: string;
}

export type PatternInsert = Omit<Pattern, "id" | "created_at">;
export type PostInsert = Omit<Post, "id" | "created_at">;
export type CommentInsert = Omit<Comment, "id" | "created_at">;
export type PatternCommentInsert = Omit<PatternComment, "id" | "created_at">;
export type PatternLikeInsert = Omit<PatternLike, "id" | "created_at">;
