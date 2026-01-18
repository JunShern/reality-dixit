# Reality Dixit - Development Guide

## Project Overview

A web-based party game where players submit photos from their camera rolls to match prompts, then vote on the best submissions. Similar to Dixit but with real photos.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Database**: Supabase Postgres
- **Real-time**: Supabase Realtime subscriptions
- **File Storage**: Supabase Storage
- **Hosting**: Railway (frontend)

## Game Flow

1. **Lobby Phase** (`waiting`)
   - Host creates room, gets 4-letter code
   - Players join with username (no auth required)
   - Host starts game when ready (min 3 players)

2. **Prompt Collection Phase** (`prompts`)
   - Each player submits one prompt
   - Prompts are shuffled and assigned to rounds

3. **Playing Phase** (`playing`) - Repeats for N rounds (N = player count)
   - **Upload**: 2-minute timer to upload a photo matching the prompt
   - **Reveal**: Photos shown one-by-one (5 seconds each)
   - **Voting**: Players vote (can't vote for own), live vote counts shown
   - **Results**: Points awarded, move to next round

4. **Finished Phase** (`finished`)
   - Final leaderboard displayed
   - Option to play again

## Database Schema

### Tables

- `rooms` - Game rooms with status and current round
- `players` - Players with usernames and scores
- `prompts` - Player-submitted prompts
- `submissions` - Photo submissions per round
- `votes` - Player votes on submissions

### Key Design Decisions

- Session tokens stored in localStorage for reconnection
- Photos stored in Supabase Storage: `photos/{room_id}/{round}/{player_id}.jpg`
- Rooms auto-delete after 24 hours (via Supabase cron or edge function)
- RLS policies ensure players can only access their room's data

## Project Structure

```
/app
  /page.tsx                    # Home - create/join room
  /room/[code]/page.tsx        # Main game view
/components
  /ui/                         # Reusable UI components
  /game/                       # Game-specific components
    /Lobby.tsx
    /PromptCollection.tsx
    /PhotoUpload.tsx
    /PhotoReveal.tsx
    /Voting.tsx
    /Results.tsx
    /FinalScores.tsx
/lib
  /supabase.ts                 # Supabase client
  /types.ts                    # TypeScript types
  /utils.ts                    # Utility functions
/hooks
  /useRoom.ts                  # Room subscription hook
  /usePlayer.ts                # Current player hook
  /useGameState.ts             # Game state management
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Supabase Setup Instructions

1. Create a new Supabase project
2. Run the SQL in `/supabase/schema.sql` to create tables
3. Create a storage bucket called `photos` with public access
4. Set up RLS policies as defined in `/supabase/policies.sql`
5. (Optional) Set up a cron job to delete old rooms

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run linter
```

## Current Implementation Status

- [x] Project documentation (CLAUDE.md)
- [x] Next.js project setup
- [x] Supabase schema (in /supabase/schema.sql)
- [x] Supabase storage setup (in /supabase/storage-setup.sql)
- [x] Home page (create/join)
- [x] Room lobby with real-time player list
- [x] Prompt collection phase
- [x] Photo upload phase (with 2-min timer)
- [x] Photo reveal phase (5 seconds per photo)
- [x] Voting phase (live vote counts)
- [x] Round results display
- [x] Final scores / leaderboard
- [ ] Room cleanup automation (needs Supabase cron setup)
- [ ] Testing with actual Supabase instance

## Next Steps to Deploy

1. Set up Supabase project and run schema.sql
2. Create storage bucket "photos" (public)
3. Run storage-setup.sql for storage policies
4. Create `.env.local` with Supabase credentials
5. Test locally with `npm run dev`
6. Deploy to Railway

## Game Rules Summary

- Each player submits 1 prompt
- N players = N rounds (one round per prompt)
- 2-minute upload timer per round
- 5-second reveal per photo
- Can't vote for own photo
- Points = number of votes received
- Winner = most total points

## Resume Instructions

If resuming development in a new session:
1. Check this file for current status
2. Review the todo list above
3. Run `npm run dev` to start the dev server
4. Continue from the next unchecked item
