# Strudel Patterns - Setup Guide

## Database Setup (Supabase)

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project

### 2. Enable Authentication Providers

1. Go to **Authentication → Providers** in your Supabase dashboard
2. Enable **Email** provider
3. Enable **Google** provider (recommended):
   - Click on Google provider
   - Toggle it on and save
   - For testing, use Supabase's built-in OAuth credentials
   - For production, configure your own Google OAuth 2.0 credentials from [Google Cloud Console](https://console.cloud.google.com/)

### 3. Create the Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create patterns table
CREATE TABLE patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  author TEXT DEFAULT 'anonymous',
  tags TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX idx_patterns_category ON patterns(category);
CREATE INDEX idx_patterns_created_at ON patterns(created_at DESC);
CREATE INDEX idx_patterns_user_id ON patterns(user_id);

-- Enable Row Level Security
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON patterns
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create policy to allow users to update their own patterns
CREATE POLICY "Allow users to update own patterns" ON patterns
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own patterns
CREATE POLICY "Allow users to delete own patterns" ON patterns
  FOR DELETE USING (auth.uid() = user_id);

-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author TEXT NOT NULL
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  content TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author TEXT NOT NULL
);

-- Create indexes for posts
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- Create indexes for comments
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Enable Row Level Security for posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to posts
CREATE POLICY "Allow public read access" ON posts
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert posts
CREATE POLICY "Allow authenticated insert" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own posts
CREATE POLICY "Allow users to update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own posts
CREATE POLICY "Allow users to delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Enable Row Level Security for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to comments
CREATE POLICY "Allow public read access" ON comments
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert comments
CREATE POLICY "Allow authenticated insert" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own comments
CREATE POLICY "Allow users to update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own comments
CREATE POLICY "Allow users to delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create pattern_comments table
CREATE TABLE pattern_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  content TEXT NOT NULL,
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author TEXT NOT NULL
);

-- Create indexes for pattern_comments
CREATE INDEX idx_pattern_comments_pattern_id ON pattern_comments(pattern_id);
CREATE INDEX idx_pattern_comments_created_at ON pattern_comments(created_at DESC);

-- Enable Row Level Security for pattern_comments
ALTER TABLE pattern_comments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to pattern_comments
CREATE POLICY "Allow public read access" ON pattern_comments
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert pattern_comments
CREATE POLICY "Allow authenticated insert" ON pattern_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own pattern_comments
CREATE POLICY "Allow users to update own pattern_comments" ON pattern_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own pattern_comments
CREATE POLICY "Allow users to delete own pattern_comments" ON pattern_comments
  FOR DELETE USING (auth.uid() = user_id);
```

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from:

- **Project Settings** → **API**
- URL: `Project URL`
- Anon Key: `anon/public` key

### 5. (Optional) Seed Demo Patterns

To populate your database with example patterns:

```bash
npm run seed
```

### 6. Start the Development Server

```bash
npm run dev
```

## Features

- ✅ Upload Strudel code patterns
- ✅ Browse and search patterns
- ✅ Play patterns directly in the browser
- ✅ Copy code snippets
- ✅ Filter by category
- ✅ Tag-based search
