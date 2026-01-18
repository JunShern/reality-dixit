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
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-paper">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header with board game feel */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-3">
            <span className="text-3xl">📸</span>
            <h1 className="text-display text-4xl font-bold text-charcoal tracking-tight">
              Reality Dixit
            </h1>
            <span className="text-3xl">🎲</span>
          </div>
          <p className="text-charcoal-light font-body">
            Match your photos to prompts
          </p>
        </div>

        {/* Main card */}
        <div className="card-elevated p-6 mb-6">
          {/* Username input */}
          <div className="mb-6">
            <label htmlFor="username" className="block text-sm font-semibold text-teal mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="input w-full px-4 py-3"
              maxLength={20}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-coral-light/20 border-2 border-coral/30 rounded-xl text-coral-dark text-sm font-medium">
              {error}
            </div>
          )}

          {/* Create Room Button */}
          <button
            onClick={createRoom}
            disabled={isCreating || isJoining}
            className="btn btn-primary w-full py-3.5 px-4 text-lg mb-4"
          >
            {isCreating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-pulse-soft">Creating...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>🎯</span>
                <span>Create New Room</span>
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-1 border-t-2 border-dashed border-gray-light"></div>
            <span className="px-4 text-gray-medium text-sm font-medium">or join existing</span>
            <div className="flex-1 border-t-2 border-dashed border-gray-light"></div>
          </div>

          {/* Join Room */}
          <div className="flex gap-3">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="WXYZ"
              className="input flex-1 px-4 py-3 room-code text-center text-lg"
              maxLength={4}
            />
            <button
              onClick={joinRoom}
              disabled={isCreating || isJoining}
              className="btn btn-secondary px-6 py-3"
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>

        {/* How to play card */}
        <div className="card p-5">
          <h2 className="text-display text-lg font-bold text-teal mb-3 flex items-center gap-2">
            <span>🃏</span>
            <span>How to Play</span>
          </h2>
          <ol className="text-charcoal-light text-sm space-y-2 stagger-children">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-coral text-white text-xs font-bold flex items-center justify-center">1</span>
              <span>Create or join a room with friends</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-coral text-white text-xs font-bold flex items-center justify-center">2</span>
              <span>Everyone submits a prompt</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-coral text-white text-xs font-bold flex items-center justify-center">3</span>
              <span>Each round, upload a photo matching the prompt</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-coral text-white text-xs font-bold flex items-center justify-center">4</span>
              <span>Vote for the best photo (not your own!)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-coral text-white text-xs font-bold flex items-center justify-center">5</span>
              <span>Most votes wins! 🏆</span>
            </li>
          </ol>
        </div>

        {/* Footer decoration */}
        <div className="mt-6 text-center text-gray-medium text-xs">
          <span>Made with ❤️ for game nights</span>
        </div>
      </div>
    </main>
  );
}
