'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Room, Player, Prompt, Submission, Vote, SubmissionWithVotes } from '@/lib/types';

// Create supabase client lazily
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(url, key);
}

interface PlayerSession {
  sessionToken: string;
  playerId: string;
  roomId: string;
  roomCode: string;
}

interface UseRoomResult {
  room: Room | null;
  players: Player[];
  prompts: Prompt[];
  submissions: SubmissionWithVotes[];
  votes: Vote[];
  myPlayer: Player | null;
  currentPrompt: Prompt | null;
  mySubmission: Submission | null;
  myVote: Vote | null;
  isLoading: boolean;
  error: string | null;
  isHost: boolean;
  // Actions
  startGame: () => Promise<void>;
  submitPrompt: (text: string) => Promise<void>;
  submitPhoto: (photoUrl: string) => Promise<void>;
  submitVote: (submissionId: string) => Promise<void>;
  advancePhase: () => Promise<void>;
  nextRound: () => Promise<void>;
  playAgain: () => Promise<void>;
}

export function useRoom(roomCode: string): UseRoomResult {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const currentPrompt = prompts.find(p => p.round_number === room?.current_round) || null;
  const currentRoundSubmissions = submissions.filter(s => s.round === room?.current_round);
  const currentRoundVotes = votes.filter(v => v.round === room?.current_round);

  const submissionsWithVotes: SubmissionWithVotes[] = currentRoundSubmissions.map(s => ({
    ...s,
    votes: currentRoundVotes.filter(v => v.submission_id === s.id),
    voteCount: currentRoundVotes.filter(v => v.submission_id === s.id).length,
  }));

  const mySubmission = currentRoundSubmissions.find(s => s.player_id === myPlayer?.id) || null;
  const myVote = currentRoundVotes.find(v => v.voter_id === myPlayer?.id) || null;
  const isHost = myPlayer?.is_host ?? false;

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get player session from localStorage
      const sessionStr = localStorage.getItem('playerSession');
      if (!sessionStr) {
        setError('No session found. Please rejoin the room.');
        return;
      }

      const session: PlayerSession = JSON.parse(sessionStr);
      if (session.roomCode !== roomCode) {
        setError('Session mismatch. Please rejoin the room.');
        return;
      }

      const supabase = getSupabase();

      // Load room
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
        .single();

      if (roomError || !roomData) {
        setError('Room not found.');
        return;
      }
      setRoom(roomData);

      // Load players
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomData.id)
        .order('created_at');

      setPlayers(playersData || []);

      // Find my player
      const me = playersData?.find(p => p.id === session.playerId);
      if (!me) {
        setError('Player not found in room.');
        return;
      }
      setMyPlayer(me);

      // Load prompts
      const { data: promptsData } = await supabase
        .from('prompts')
        .select('*')
        .eq('room_id', roomData.id);

      setPrompts(promptsData || []);

      // Load submissions
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('*')
        .eq('room_id', roomData.id);

      setSubmissions(submissionsData || []);

      // Load votes
      const { data: votesData } = await supabase
        .from('votes')
        .select('*')
        .eq('room_id', roomData.id);

      setVotes(votesData || []);
    } catch (err) {
      console.error('Error loading room data:', err);
      setError('Failed to load room data.');
    } finally {
      setIsLoading(false);
    }
  }, [roomCode]);

  // Subscribe to real-time updates
  useEffect(() => {
    loadData();

    const supabase = getSupabase();

    // Set up real-time subscriptions
    const channel = supabase
      .channel(`room:${roomCode}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `code=eq.${roomCode}`,
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setRoom(payload.new as Room);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPlayers(prev => [...prev, payload.new as Player]);
        } else if (payload.eventType === 'UPDATE') {
          setPlayers(prev => prev.map(p => p.id === (payload.new as Player).id ? payload.new as Player : p));
          // Update myPlayer if it's me
          if ((payload.new as Player).id === myPlayer?.id) {
            setMyPlayer(payload.new as Player);
          }
        } else if (payload.eventType === 'DELETE') {
          setPlayers(prev => prev.filter(p => p.id !== (payload.old as Player).id));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'prompts',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPrompts(prev => [...prev, payload.new as Prompt]);
        } else if (payload.eventType === 'UPDATE') {
          setPrompts(prev => prev.map(p => p.id === (payload.new as Prompt).id ? payload.new as Prompt : p));
        } else if (payload.eventType === 'DELETE') {
          setPrompts(prev => prev.filter(p => p.id !== (payload.old as Prompt).id));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'submissions',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSubmissions(prev => [...prev, payload.new as Submission]);
        } else if (payload.eventType === 'DELETE') {
          setSubmissions(prev => prev.filter(s => s.id !== (payload.old as Submission).id));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setVotes(prev => [...prev, payload.new as Vote]);
        } else if (payload.eventType === 'DELETE') {
          setVotes(prev => prev.filter(v => v.id !== (payload.old as Vote).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, loadData, myPlayer?.id]);

  // Actions
  const startGame = useCallback(async () => {
    if (!room || !isHost) return;

    await getSupabase()
      .from('rooms')
      .update({ status: 'prompts' })
      .eq('id', room.id);
  }, [room, isHost]);

  const submitPrompt = useCallback(async (text: string) => {
    if (!room || !myPlayer) return;

    await getSupabase()
      .from('prompts')
      .insert({
        room_id: room.id,
        player_id: myPlayer.id,
        text,
      });
  }, [room, myPlayer]);

  const submitPhoto = useCallback(async (photoUrl: string) => {
    if (!room || !myPlayer) return;

    await getSupabase()
      .from('submissions')
      .insert({
        room_id: room.id,
        round: room.current_round,
        player_id: myPlayer.id,
        photo_url: photoUrl,
      });
  }, [room, myPlayer]);

  const submitVote = useCallback(async (submissionId: string) => {
    if (!room || !myPlayer) return;

    // Insert vote
    await getSupabase()
      .from('votes')
      .insert({
        room_id: room.id,
        round: room.current_round,
        voter_id: myPlayer.id,
        submission_id: submissionId,
      });
  }, [room, myPlayer]);

  const advancePhase = useCallback(async () => {
    if (!room || !isHost) return;

    const phases = ['upload', 'reveal', 'voting', 'results'] as const;
    const currentPhaseIndex = room.round_phase ? phases.indexOf(room.round_phase) : -1;
    const nextPhase = phases[currentPhaseIndex + 1];

    if (nextPhase) {
      const updates: Partial<Room> = { round_phase: nextPhase };

      // Set timer for upload phase
      if (nextPhase === 'upload') {
        updates.phase_end_time = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 minutes
      } else {
        updates.phase_end_time = null;
      }

      // Reset reveal index for reveal phase
      if (nextPhase === 'reveal') {
        updates.reveal_index = 0;
      }

      await getSupabase()
        .from('rooms')
        .update(updates)
        .eq('id', room.id);
    }
  }, [room, isHost]);

  const nextRound = useCallback(async () => {
    if (!room || !isHost) return;

    const supabase = getSupabase();
    const totalRounds = players.length;
    const nextRoundNum = room.current_round + 1;

    if (nextRoundNum > totalRounds) {
      // Game over - update scores and finish
      // First, calculate final scores
      for (const player of players) {
        const playerVotes = votes.filter(v => {
          const submission = submissions.find(s => s.id === v.submission_id);
          return submission?.player_id === player.id;
        }).length;

        await supabase
          .from('players')
          .update({ score: playerVotes })
          .eq('id', player.id);
      }

      await supabase
        .from('rooms')
        .update({ status: 'finished' })
        .eq('id', room.id);
    } else {
      // Move to next round
      await supabase
        .from('rooms')
        .update({
          current_round: nextRoundNum,
          round_phase: 'upload',
          reveal_index: 0,
          phase_end_time: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        })
        .eq('id', room.id);
    }
  }, [room, isHost, players, votes, submissions]);

  const playAgain = useCallback(async () => {
    if (!room || !isHost) return;

    const supabase = getSupabase();

    // Delete all game data for this room
    await supabase.from('votes').delete().eq('room_id', room.id);
    await supabase.from('submissions').delete().eq('room_id', room.id);
    await supabase.from('prompts').delete().eq('room_id', room.id);

    // Reset all player scores to 0
    await supabase
      .from('players')
      .update({ score: 0 })
      .eq('room_id', room.id);

    // Reset room to waiting state
    await supabase
      .from('rooms')
      .update({
        status: 'waiting',
        current_round: 0,
        round_phase: null,
        reveal_index: 0,
        phase_end_time: null,
      })
      .eq('id', room.id);

    // Clear local state
    setPrompts([]);
    setSubmissions([]);
    setVotes([]);
  }, [room, isHost]);

  return {
    room,
    players,
    prompts,
    submissions: submissionsWithVotes,
    votes,
    myPlayer,
    currentPrompt,
    mySubmission,
    myVote,
    isLoading,
    error,
    isHost,
    startGame,
    submitPrompt,
    submitPhoto,
    submitVote,
    advancePhase,
    nextRound,
    playAgain,
  };
}
