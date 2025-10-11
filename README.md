# Strudel Patterns

A beautiful, minimalist platform for sharing and discovering Strudel live coding patterns. Built with Next.js, Supabase, and the Strudel audio engine.

## Features

- 🎵 **Play Patterns** - Open patterns in Strudel REPL for immediate playback
- 📝 **Share Your Patterns** - Upload and share your own Strudel compositions
- 🔍 **Search & Filter** - Find patterns by category, tags, or keywords
- 📋 **Copy Code** - One-click copy for any pattern
- 📄 **Pattern Detail Pages** - GitHub-style code viewer with syntax highlighting
- 💬 **Pattern Comments** - Discuss and share feedback on individual patterns
- 🔐 **User Authentication** - Sign up/in with email or Google OAuth
- 👤 **User Profiles** - View and manage all your uploaded patterns
- 🗑️ **Pattern Management** - Delete your own patterns from your profile
- 💬 **Community Feed** - Share posts and engage with the community through comments
- 🧭 **Sidebar Navigation** - Easy access to Samples and Feed sections
- 🎨 **Clean Black & White Design** - Minimalist, aesthetic interface
- 💾 **Database-Backed** - Real-time pattern storage with Supabase

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase (Optional - works in demo mode without it)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. **Enable Authentication Providers:**
   - Go to **Authentication → Providers**
   - Enable **Email** provider
   - Enable **Google** provider (optional but recommended):
     - Click on Google provider
     - Enable it and save (you can use Supabase's default OAuth credentials for testing)
     - For production, add your own Google OAuth client ID and secret
4. Run this SQL in your Supabase SQL Editor:

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

-- Create indexes
CREATE INDEX idx_patterns_category ON patterns(category);
CREATE INDEX idx_patterns_created_at ON patterns(created_at DESC);
CREATE INDEX idx_patterns_user_id ON patterns(user_id);

-- Enable Row Level Security
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access" ON patterns
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow users to update own patterns" ON patterns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own patterns" ON patterns
  FOR DELETE USING (auth.uid() = user_id);
```

5. Create `.env.local` in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from **Project Settings → API** in Supabase.

### 3. (Optional) Seed Demo Patterns

After setting up the database, populate it with example patterns:

```bash
npm run seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Demo Mode

Without Supabase configuration, the app runs in **Demo Mode** with example patterns. This is perfect for:

- Testing the interface
- Local development
- Understanding how it works

To enable real pattern storage, just add your Supabase credentials.

## Tech Stack

- **Next.js 15** - React framework
- **Supabase** - PostgreSQL database
- **Strudel** - Live coding music engine
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main patterns browser
│   ├── upload/page.tsx   # Pattern upload form
│   └── layout.tsx        # Root layout
├── components/
│   └── StrudelPlayer.tsx # Audio playback engine
└── lib/
    └── supabase.ts       # Database client
```

## Learn More

- [Strudel Documentation](https://strudel.cc/learn)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT
