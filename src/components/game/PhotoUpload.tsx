'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Room, Prompt, Player, Submission } from '@/lib/types';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(url, key);
}

interface PhotoUploadProps {
  room: Room;
  currentPrompt: Prompt | null;
  players: Player[];
  submissions: Submission[];
  mySubmission: Submission | null;
  onSubmitPhoto: (photoUrl: string) => Promise<void>;
  onAdvancePhase: () => Promise<void>;
  isHost: boolean;
}

export function PhotoUpload({
  room,
  currentPrompt,
  players,
  submissions,
  mySubmission,
  onSubmitPhoto,
  onAdvancePhase,
  isHost,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allSubmitted = submissions.length === players.length;
  const totalRounds = players.length;

  // Timer countdown
  useEffect(() => {
    if (!room.phase_end_time) return;

    const updateTimer = () => {
      const endTime = new Date(room.phase_end_time!).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);

      // Auto-advance when timer expires (host only)
      if (remaining === 0 && isHost && !allSubmitted) {
        // Give a small delay before auto-advancing
        setTimeout(() => {
          onAdvancePhase();
        }, 1000);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [room.phase_end_time, isHost, allSubmitted, onAdvancePhase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const supabase = getSupabase();
      const fileExt = file.name.split('.').pop();
      const fileName = `${room.id}/${room.current_round}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      // Submit the photo
      await onSubmitPhoto(publicUrl);
    } catch (err) {
      console.error('Error uploading photo:', err);
      alert('Failed to upload photo. Please try again.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Round indicator */}
        <div className="text-center mb-4">
          <span className="text-purple-300 text-sm">
            Round {room.current_round} of {totalRounds}
          </span>
        </div>

        {/* Timer */}
        {timeLeft !== null && (
          <div className={`text-center mb-6 ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            <span className="text-4xl font-bold font-mono">{formatTime(timeLeft)}</span>
            <p className="text-sm text-purple-300 mt-1">Time remaining</p>
          </div>
        )}

        {/* Prompt Display */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl mb-6">
          <p className="text-purple-300 text-sm mb-2">This round&apos;s prompt:</p>
          <p className="text-2xl font-bold text-white text-center">
            &quot;{currentPrompt?.text || 'Loading...'}&quot;
          </p>
        </div>

        {/* Upload Area */}
        {!mySubmission ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full rounded-lg mb-4"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-white">Uploading...</div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full aspect-square border-2 border-dashed border-purple-400/50 rounded-xl flex flex-col items-center justify-center gap-4 hover:border-purple-400 hover:bg-white/5 transition-colors"
              >
                <svg className="w-16 h-16 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-purple-200">Tap to select a photo</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-green-500/20 border border-green-400/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 text-green-300 mb-4">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Photo Submitted!</span>
            </div>
            <img
              src={mySubmission.photo_url}
              alt="Your submission"
              className="w-full rounded-lg"
            />
          </div>
        )}

        {/* Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-purple-200 text-sm">Submissions</span>
            <span className="text-white font-semibold">{submissions.length}/{players.length}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(submissions.length / players.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Advance Button (Host Only) */}
        {isHost && allSubmitted && (
          <button
            onClick={onAdvancePhase}
            className="w-full py-4 px-6 bg-green-500 hover:bg-green-400 text-white font-bold text-lg rounded-xl transition-colors"
          >
            Everyone&apos;s Ready! Start Reveal
          </button>
        )}

        {isHost && !allSubmitted && timeLeft === 0 && (
          <button
            onClick={onAdvancePhase}
            className="w-full py-4 px-6 bg-yellow-500 hover:bg-yellow-400 text-white font-bold text-lg rounded-xl transition-colors"
          >
            Time&apos;s Up! Start Reveal
          </button>
        )}
      </div>
    </div>
  );
}
