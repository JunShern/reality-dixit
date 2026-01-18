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
  const [countdown, setCountdown] = useState(5);

  const totalRounds = players.length;
  const revealComplete = currentIndex >= submissions.length;
  const currentSubmission = submissions[currentIndex];

  // Countdown timer
  useEffect(() => {
    if (revealComplete) return;

    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 5;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, revealComplete]);

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

  // Get previously revealed submissions (all before current index)
  const revealedSubmissions = submissions.slice(0, currentIndex);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-paper">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Round indicator */}
        <div className="text-center mb-4">
          <span className="badge badge-gold">
            Round {room.current_round} of {totalRounds}
          </span>
        </div>

        {/* Prompt Display */}
        <div className="card-elevated p-5 mb-6">
          <p className="text-teal text-sm font-semibold mb-2 flex items-center justify-center gap-2">
            <span>🎯</span>
            <span>The Prompt</span>
          </p>
          <p className="text-display text-xl font-bold text-charcoal text-center">
            &quot;{currentPrompt?.text || 'Loading...'}&quot;
          </p>
        </div>

        {/* Reveal Progress */}
        <div className="text-center mb-4">
          <span className="text-charcoal-light text-sm">
            Revealing photo {Math.min(currentIndex + 1, submissions.length)} of {submissions.length}
          </span>
        </div>

        {/* Current Photo (Large) */}
        {currentSubmission && !revealComplete && (
          <div className={`mb-6 transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="card-elevated p-4">
              {/* Polaroid-style frame */}
              <div className="bg-white p-3 pb-10 rounded-lg shadow-md">
                <img
                  src={currentSubmission.photo_url}
                  alt={`Submission ${currentIndex + 1}`}
                  className="w-full rounded"
                />
              </div>
              <div className="text-center mt-3">
                <span className="text-teal font-semibold">Photo #{currentIndex + 1}</span>
              </div>
            </div>
          </div>
        )}

        {/* Revealed Photos (Thumbnails) */}
        {revealedSubmissions.length > 0 && !revealComplete && (
          <div className="mb-6">
            <p className="text-charcoal-light text-sm mb-3 flex items-center gap-2">
              <span>📸</span>
              <span>Previous reveals:</span>
            </p>
            <div className="grid grid-cols-4 gap-2">
              {revealedSubmissions.map((submission, idx) => (
                <div key={submission.id} className="aspect-square bg-white p-1 rounded-lg shadow-sm">
                  <img
                    src={submission.photo_url}
                    alt={`Submission ${idx + 1}`}
                    className="w-full h-full object-cover rounded opacity-70"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Photos (when reveal complete) */}
        {revealComplete && (
          <div className="mb-6">
            <div className="card p-4 bg-sage/10 border-2 border-sage/40 mb-4">
              <p className="text-sage-dark text-center font-semibold flex items-center justify-center gap-2">
                <span>✨</span>
                <span>All photos revealed!</span>
                <span>✨</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {submissions.map((submission, idx) => (
                <div key={submission.id} className="card p-3">
                  {/* Mini polaroid style */}
                  <div className="bg-white p-2 pb-6 rounded shadow-sm">
                    <img
                      src={submission.photo_url}
                      alt={`Submission ${idx + 1}`}
                      className="w-full rounded"
                    />
                  </div>
                  <p className="text-charcoal-light text-xs text-center mt-2 font-medium">Photo #{idx + 1}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue to Voting Button (Host Only) */}
        {isHost && revealComplete && (
          <button
            onClick={onAdvancePhase}
            className="btn btn-success w-full py-4 text-lg font-bold"
          >
            <span className="flex items-center justify-center gap-2">
              <span>⭐</span>
              <span>Start Voting!</span>
            </span>
          </button>
        )}

        {!isHost && revealComplete && (
          <div className="card p-4 text-center">
            <p className="text-charcoal-light flex items-center justify-center gap-2">
              <span className="animate-pulse-soft">⏳</span>
              <span>Waiting for host to start voting...</span>
            </p>
          </div>
        )}

        {/* Countdown */}
        {!revealComplete && (
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-teal/10 rounded-2xl border-2 border-teal/30">
              <span className="text-xl">⏱️</span>
              <span className="text-4xl font-bold text-teal font-mono">{countdown}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
