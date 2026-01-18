-- Reality Dixit Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE room_status AS ENUM ('waiting', 'prompts', 'playing', 'finished');
CREATE TYPE round_phase AS ENUM ('upload', 'reveal', 'voting', 'results');

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  status room_status DEFAULT 'waiting',
  current_round INTEGER DEFAULT 0,
  round_phase round_phase DEFAULT NULL,
  reveal_index INTEGER DEFAULT 0,
  phase_end_time TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for room code lookups
CREATE INDEX idx_rooms_code ON rooms(code);

-- Index for cleanup job (find old rooms)
CREATE INDEX idx_rooms_created_at ON rooms(created_at);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  is_host BOOLEAN DEFAULT FALSE,
  session_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding players in a room
CREATE INDEX idx_players_room_id ON players(room_id);

-- Index for session token lookups (reconnection)
CREATE INDEX idx_players_session_token ON players(session_token);

-- Prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  round_number INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding prompts in a room
CREATE INDEX idx_prompts_room_id ON prompts(room_id);

-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- One submission per player per round
  UNIQUE(room_id, round, player_id)
);

-- Index for finding submissions in a room/round
CREATE INDEX idx_submissions_room_round ON submissions(room_id, round);

-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  voter_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- One vote per player per round
  UNIQUE(room_id, round, voter_id)
);

-- Index for counting votes per submission
CREATE INDEX idx_votes_submission_id ON votes(submission_id);

-- Index for finding votes in a room/round
CREATE INDEX idx_votes_room_round ON votes(room_id, round);

-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Rooms: Anyone can read and create, but updates require being in the room
CREATE POLICY "Rooms are viewable by everyone" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create a room" ON rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Room updates allowed" ON rooms
  FOR UPDATE USING (true);

-- Players: Anyone can view players in any room, can insert, and update their own
CREATE POLICY "Players are viewable by everyone" ON players
  FOR SELECT USING (true);

CREATE POLICY "Anyone can join as a player" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Players can update themselves" ON players
  FOR UPDATE USING (true);

-- Prompts: Viewable by room members, insertable by players
CREATE POLICY "Prompts are viewable by everyone" ON prompts
  FOR SELECT USING (true);

CREATE POLICY "Players can submit prompts" ON prompts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Prompts can be updated" ON prompts
  FOR UPDATE USING (true);

-- Submissions: Viewable by room members, insertable by players
CREATE POLICY "Submissions are viewable by everyone" ON submissions
  FOR SELECT USING (true);

CREATE POLICY "Players can submit photos" ON submissions
  FOR INSERT WITH CHECK (true);

-- Votes: Viewable by room members, insertable by players
CREATE POLICY "Votes are viewable by everyone" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Players can vote" ON votes
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- Cleanup Function (for 24-hour room deletion)
-- =====================================================

-- Function to delete old rooms and their associated storage files
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete rooms older than 24 hours
  -- CASCADE will handle players, prompts, submissions, votes
  DELETE FROM rooms
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Note: To run this automatically, set up a pg_cron job in Supabase:
-- SELECT cron.schedule('cleanup-old-rooms', '0 * * * *', 'SELECT cleanup_old_rooms();');
-- This runs every hour to check for and delete old rooms.

-- =====================================================
-- Realtime Setup
-- =====================================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE prompts;
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
