# Strudel Patterns - Setup Guide

## Database Setup (Supabase)

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project

### 2. Create the Database Table

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
  description TEXT DEFAULT ''
);

-- Create index for faster queries
CREATE INDEX idx_patterns_category ON patterns(category);
CREATE INDEX idx_patterns_created_at ON patterns(created_at DESC);

-- Enable Row Level Security
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read
CREATE POLICY "Allow public read access" ON patterns
  FOR SELECT USING (true);

-- Create policy to allow public insert
CREATE POLICY "Allow public insert access" ON patterns
  FOR INSERT WITH CHECK (true);
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from:

- **Project Settings** → **API**
- URL: `Project URL`
- Anon Key: `anon/public` key

### 4. (Optional) Seed Demo Patterns

To populate your database with example patterns:

```bash
npm run seed
```

### 5. Start the Development Server

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
