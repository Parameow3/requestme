# Expense Approval App

A modern Progressive Web App (PWA) for submitting and managing expense claims. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- 📱 **PWA Support** - Add to home screen for native-like experience
- 🎨 **Beautiful Dark UI** - Modern, elegant design with smooth animations
- 📝 **Expense Submission** - Easy-to-use form with category selection
- 📊 **Dashboard** - Track pending and approved expenses
- 🔐 **Authentication Ready** - Supabase Auth integration (Email/Password)

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (free tier available)

### Installation

1. Clone and install dependencies:
```bash
cd expense-app
npm install
```

2. Configure Supabase:
   - Go to [app.supabase.com](https://app.supabase.com) and create a new project
   - Copy your project URL and anon key from Settings > API
   - Update `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. Create the expenses table in Supabase SQL Editor:
```sql
CREATE TABLE expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  user_id uuid NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own expenses
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert own expenses
CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
expense-app/
├── app/
│   ├── layout.tsx         # Root layout with PWA meta tags
│   ├── page.tsx           # Home/Dashboard page
│   ├── globals.css        # Global styles and CSS variables
│   └── expenses/
│       └── new/
│           └── page.tsx   # New expense submission form
├── lib/
│   └── supabaseClient.ts  # Supabase client configuration
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── icon-192x192.png   # PWA icon (small)
│   └── icon-512x512.png   # PWA icon (large)
└── next.config.js         # Next.js + PWA configuration
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **PWA:** @ducanh2912/next-pwa

## Screenshots

The app features:
- Dark theme with purple/cyan gradient accents
- Glassmorphism effects
- Smooth animations and transitions
- Mobile-first responsive design

## License

MIT
