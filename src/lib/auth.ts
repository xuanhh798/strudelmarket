import { supabase } from "./supabase";

export interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
}

function ensureSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please check your environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  }
  return supabase;
}

export async function signUp(
  email: string,
  password: string,
  username?: string
) {
  const client = ensureSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username || email.split("@")[0],
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const client = ensureSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const client = ensureSupabaseClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = ensureSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const client = ensureSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  return user;
}

export async function getSession() {
  const client = ensureSupabaseClient();
  const {
    data: { session },
  } = await client.auth.getSession();
  return session;
}

export function onAuthStateChange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (user: any) => void
) {
  const client = ensureSupabaseClient();
  return client.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });
}

// Helper function to check if Supabase is available
export function isSupabaseAvailable(): boolean {
  return supabase !== null;
}
