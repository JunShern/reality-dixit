'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Room, Prompt, Submission, Player } from '@/lib/types';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(url, key);
}

interface PhotoRevealProps {
  room: Room;
  currentPrompt: Prompt | null;
  submissions: Submission[];
  players: Player[];
  onAdvancePhase: () => Promise<void>;
  isHost: boolean;
}

export function PhotoReveal({
  room,
  currentPrompt,
  submissions,
  players,
  onAdvancePhase,
  isHost,
}: PhotoRevealProps) {
  const [currentIndex, setCurrentIndex] = useState(room.reveal_index || 0);
  const [isAnimating, setIsAnimating] = useState(false);

  const totalRounds = players.length;
  const revealComplete = currentIndex >= submissions.length;

  // Auto-advance reveals every 5 seconds (host controls this)
  useEffect(() => {
    if (!isHost || revealComplete) return;

    const timer = setTimeout(async () => {
      const nextIndex = currentIndex + 1;
      setIsAnimating(true);

      // Update room reveal_index
      await getSupabase()
        .from('rooms')
        .update({ reveal_index: nextIndex })
        .eq('id', room.id);

      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setIsAnimating(false);
      }, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isHost, currentIndex, revealComplete, room.id]);

  // Sync with room state for non-hosts
  useEffect(() => {
    setCurrentIndex(room.reveal_index || 0);
  }, [room.reveal_index]);

  // Get revealed submissions (all up to current index)
  const revealedSubmissions = submissions.slice(0, currentIndex);
  const currentSubmission = submissions[currentIndex - 1];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Round indicator */}
        <div className="text-center mb-4">
          <span className="text-purple-300 text-sm">
            Round {room.current_round} of {totalRounds}
          </span>
        </div>

        {/* Prompt Display */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl mb-6">
          <p className="text-xl font-bold text-white text-center">
            &quot;{currentPrompt?.text || 'Loading...'}&quot;
          </p>
        </div>

        {/* Reveal Progress */}
        <div className="text-center mb-6">
          <span className="text-purple-200">
            Revealing photo {Math.min(currentIndex, submissions.length)} of {submissions.length}
          </span>
        </div>

        {/* Current Photo (Large) */}
        {currentSubmission && !revealComplete && (
          <div className={`mb-6 transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
              <img
                src={currentSubmission.photo_url}
                alt={`Submission ${currentIndex}`}
                className="w-full rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Revealed Photos (Thumbnails) */}
        {revealedSubmissions.length > 1 && !revealComplete && (
          <div className="mb-6">
            <p className="text-purple-300 text-sm mb-2">Previous reveals:</p>
            <div className="grid grid-cols-4 gap-2">
              {revealedSubmissions.slice(0, -1).map((submission, idx) => (
                <div key={submission.id} className="aspect-square">
                  <img
                    src={submission.photo_url}
                    alt={`Submission ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg opacity-60"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Photos (when reveal complete) */}
        {revealComplete && (
          <div className="mb-6">
            <p className="text-green-300 text-center font-semibold mb-4">All photos revealed!</p>
            <div className="grid grid-cols-2 gap-3">
              {submissions.map((submission, idx) => (
                <div key={submission.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
                  <img
                    src={submission.photo_url}
                    alt={`Submission ${idx + 1}`}
                    className="w-full rounded-lg"
                  />
                  <p className="text-purple-300 text-xs text-center mt-1">Photo #{idx + 1}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue to Voting Button (Host Only) */}
        {isHost && revealComplete && (
          <button
            onClick={onAdvancePhase}
            className="w-full py-4 px-6 bg-green-500 hover:bg-green-400 text-white font-bold text-lg rounded-xl transition-colors"
          >
            Start Voting!
          </button>
        )}

        {!isHost && revealComplete && (
          <div className="text-center text-purple-200">
            Waiting for host to start voting...
          </div>
        )}

        {!revealComplete && (
          <div className="text-center text-purple-300 animate-pulse">
            Next photo in 5 seconds...
          </div>
        )}
      </div>
    </div>
  );
}
