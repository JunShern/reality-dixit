# Reality Dixit

A web-based party game where players submit photos from their camera rolls to match prompts, then vote on the best submissions. Similar to Dixit but with real photos.

## Features

- Create or join game rooms with a simple 4-letter code
- Real-time multiplayer with Supabase subscriptions
- Upload photos from your device to match prompts
- Vote on the best photo submissions
- Live leaderboard and scoring

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase Postgres
- **Real-time**: Supabase Realtime subscriptions
- **File Storage**: Supabase Storage
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL in `/supabase/schema.sql` to create tables
   - Create a storage bucket called `photos` with public access
   - Run `/supabase/storage-setup.sql` for storage policies

4. Create `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Game Rules

1. Each player submits 1 prompt
2. N players = N rounds (one round per prompt)
3. 2-minute upload timer per round
4. 5-second reveal per photo
5. Vote for the best photo (not your own)
6. Points = number of votes received
7. Most total points wins

## Design System

The game uses an elegant, board game-inspired aesthetic:

- **Typography**: DM Sans (sans-serif) with light to medium weights
- **Icons**: Lucide React with thin stroke (1.5) for clean appearance
- **Colors**: Warm palette with cream backgrounds, coral accents, teal secondary, and gold highlights

See `CLAUDE.md` for detailed design documentation.

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run linter
```

## License

MIT
