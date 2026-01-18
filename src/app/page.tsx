'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateRoomCode, generateSessionToken } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Create supabase client lazily to avoid build-time issues
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(url, key);
}

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const createRoom = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Generate a unique room code
      let code = generateRoomCode();
      let attempts = 0;

      // Try to create room, regenerating code if it exists
      while (attempts < 5) {
        const { data: existingRoom } = await getSupabase()
          .from('rooms')
          .select('id')
          .eq('code', code)
          .single();

        if (!existingRoom) break;
        code = generateRoomCode();
        attempts++;
      }

      // Create the room
      const { data: room, error: roomError } = await getSupabase()
        .from('rooms')
        .insert({ code })
        .select()
        .single();

      if (roomError) throw roomError;

      // Create the host player
      const sessionToken = generateSessionToken();
      const { data: player, error: playerError } = await getSupabase()
        .from('players')
        .insert({
          room_id: room.id,
          username: username.trim(),
          is_host: true,
          session_token: sessionToken,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Store session in localStorage
      localStorage.setItem('playerSession', JSON.stringify({
        sessionToken,
        playerId: player.id,
        roomId: room.id,
        roomCode: code,
      }));

      // Navigate to room
      router.push(`/room/${code}`);
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      // Find the room
      const { data: room, error: roomError } = await getSupabase()
        .from('rooms')
        .select('*')
        .eq('code', roomCode.toUpperCase().trim())
        .single();

      if (roomError || !room) {
        setError('Room not found. Check the code and try again.');
        return;
      }

      if (room.status !== 'waiting') {
        setError('This game has already started.');
        return;
      }

      // Check if username is taken in this room
      const { data: existingPlayer } = await getSupabase()
        .from('players')
        .select('id')
        .eq('room_id', room.id)
        .eq('username', username.trim())
        .single();

      if (existingPlayer) {
        setError('Username already taken in this room.');
        return;
      }

      // Create the player
      const sessionToken = generateSessionToken();
      const { data: player, error: playerError } = await getSupabase()
        .from('players')
        .insert({
          room_id: room.id,
          username: username.trim(),
          is_host: false,
          session_token: sessionToken,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Store session in localStorage
      localStorage.setItem('playerSession', JSON.stringify({
        sessionToken,
        playerId: player.id,
        roomId: room.id,
        roomCode: room.code,
      }));

      // Navigate to room
      router.push(`/room/${room.code}`);
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-900 to-indigo-900">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-2">
          Reality Dixit
        </h1>
        <p className="text-center text-purple-200 mb-8">
          Match your photos to prompts
        </p>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          {/* Username input */}
          <div className="mb-6">
            <label htmlFor="username" className="block text-sm font-medium text-purple-200 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-purple-300 border border-purple-400/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
              maxLength={20}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Create Room Button */}
          <button
            onClick={createRoom}
            disabled={isCreating || isJoining}
            className="w-full py-3 px-4 bg-purple-500 hover:bg-purple-400 disabled:bg-purple-500/50 text-white font-semibold rounded-lg transition-colors mb-4"
          >
            {isCreating ? 'Creating...' : 'Create New Room'}
          </button>

          {/* Divider */}
          <div className="flex items-center mb-4">
            <div className="flex-1 border-t border-purple-400/30"></div>
            <span className="px-4 text-purple-300 text-sm">or join existing</span>
            <div className="flex-1 border-t border-purple-400/30"></div>
          </div>

          {/* Join Room */}
          <div className="flex gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="WXYZ"
              className="flex-1 px-4 py-3 rounded-lg bg-white/20 text-white placeholder-purple-300 border border-purple-400/30 focus:outline-none focus:ring-2 focus:ring-purple-400 uppercase tracking-widest text-center font-mono"
              maxLength={4}
            />
            <button
              onClick={joinRoom}
              disabled={isCreating || isJoining}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/50 text-white font-semibold rounded-lg transition-colors"
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>

        {/* How to play */}
        <div className="mt-8 text-center">
          <h2 className="text-lg font-semibold text-white mb-2">How to Play</h2>
          <ol className="text-purple-200 text-sm space-y-1">
            <li>1. Create or join a room with friends</li>
            <li>2. Everyone submits a prompt</li>
            <li>3. Each round, upload a photo matching the prompt</li>
            <li>4. Vote for the best photo (not your own!)</li>
            <li>5. Most votes wins!</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
