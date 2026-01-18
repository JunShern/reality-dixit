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

  const isTimeLow = timeLeft !== null && timeLeft <= 30;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-paper">
      <div className="w-full max-w-md animate-fade-in">
        {/* Round indicator */}
        <div className="text-center mb-4">
          <span className="badge badge-gold">
            Round {room.current_round} of {totalRounds}
          </span>
        </div>

        {/* Timer */}
        {timeLeft !== null && (
          <div className={`text-center mb-6 ${isTimeLow ? 'animate-pulse-soft' : ''}`}>
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl ${
              isTimeLow ? 'bg-coral/20 border-2 border-coral' : 'bg-teal/10 border-2 border-teal/30'
            }`}>
              <span className="text-2xl">⏱️</span>
              <span className={`text-3xl font-bold font-mono ${isTimeLow ? 'text-coral' : 'text-teal'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <p className="text-gray-medium text-sm mt-2">Time remaining</p>
          </div>
        )}

        {/* Prompt Display */}
        <div className="card-elevated p-5 mb-6">
          <p className="text-teal text-sm font-semibold mb-2 flex items-center gap-2">
            <span>🎯</span>
            <span>This round&apos;s prompt:</span>
          </p>
          <p className="text-display text-2xl font-bold text-charcoal text-center">
            &quot;{currentPrompt?.text || 'Loading...'}&quot;
          </p>
        </div>

        {/* Upload Area */}
        {!mySubmission ? (
          <div className="card-elevated p-6 mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative">
                {/* Polaroid-style frame */}
                <div className="bg-white p-3 pb-12 rounded-lg shadow-lg">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full rounded"
                  />
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-charcoal/60 flex items-center justify-center rounded-lg">
                    <div className="text-white flex items-center gap-2">
                      <span className="animate-pulse-soft">📤</span>
                      <span className="font-semibold">Uploading...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full aspect-square border-3 border-dashed border-coral/40 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-coral hover:bg-coral/5 transition-all"
              >
                <div className="w-20 h-20 bg-coral/10 rounded-full flex items-center justify-center">
                  <span className="text-4xl">📷</span>
                </div>
                <div className="text-center">
                  <p className="text-charcoal font-semibold">Tap to select a photo</p>
                  <p className="text-gray-medium text-sm mt-1">from your camera roll</p>
                </div>
              </button>
            )}
          </div>
        ) : (
          <div className="card p-6 mb-6 bg-sage/10 border-2 border-sage/40">
            <div className="flex items-center gap-2 text-sage-dark mb-4">
              <span className="text-xl">✅</span>
              <span className="font-semibold">Photo Submitted!</span>
            </div>
            {/* Polaroid-style frame */}
            <div className="bg-white p-3 pb-10 rounded-lg shadow-md">
              <img
                src={mySubmission.photo_url}
                alt="Your submission"
                className="w-full rounded"
              />
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="card p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-charcoal-light text-sm font-medium flex items-center gap-2">
              <span>📸</span>
              <span>Submissions</span>
            </span>
            <span className="badge badge-gold">{submissions.length}/{players.length}</span>
          </div>
          <div className="progress-bar h-2.5">
            <div
              className="progress-fill h-full"
              style={{ width: `${(submissions.length / players.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Advance Button (Host Only) */}
        {isHost && allSubmitted && (
          <button
            onClick={onAdvancePhase}
            className="btn btn-success w-full py-4 text-lg font-bold"
          >
            <span className="flex items-center justify-center gap-2">
              <span>🎉</span>
              <span>Everyone&apos;s Ready! Start Reveal</span>
            </span>
          </button>
        )}

        {isHost && !allSubmitted && timeLeft === 0 && (
          <button
            onClick={onAdvancePhase}
            className="btn w-full py-4 text-lg font-bold bg-gold text-white hover:bg-gold-light"
          >
            <span className="flex items-center justify-center gap-2">
              <span>⏰</span>
              <span>Time&apos;s Up! Start Reveal</span>
            </span>
          </button>
        )}

        {!isHost && !mySubmission && (
          <div className="text-center text-gray-medium text-sm">
            <span>Quick! Find a matching photo before time runs out!</span>
          </div>
        )}
      </div>
    </div>
  );
}
