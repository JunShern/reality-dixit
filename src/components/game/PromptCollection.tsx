'use client';

import { useState } from 'react';
import type { Player, Prompt } from '@/lib/types';

interface PromptCollectionProps {
  players: Player[];
  prompts: Prompt[];
  myPrompt: Prompt | undefined;
  isHost: boolean;
  onSubmitPrompt: (text: string) => Promise<void>;
  onStartRounds: () => Promise<void>;
}

export function PromptCollection({
  players,
  prompts,
  myPrompt,
  isHost,
  onSubmitPrompt,
  onStartRounds,
}: PromptCollectionProps) {
  const [promptText, setPromptText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const allPromptsSubmitted = prompts.length === players.length;

  const handleSubmit = async () => {
    if (!promptText.trim() || myPrompt) return;

    setIsSubmitting(true);
    try {
      await onSubmitPrompt(promptText.trim());
      setPromptText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartRounds = async () => {
    setIsStarting(true);
    try {
      await onStartRounds();
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Submit Your Prompt</h1>
          <p className="text-purple-200">
            Think of a caption that your friends will need to match with their photos!
          </p>
        </div>

        {/* Prompt Input */}
        {!myPrompt ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Your Prompt
              </label>
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="e.g., &quot;This literally made my day&quot;"
                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-purple-300 border border-purple-400/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
                maxLength={100}
              />
              <p className="text-purple-300 text-xs mt-2">
                {promptText.length}/100 characters
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!promptText.trim() || isSubmitting}
              className="w-full py-3 px-4 bg-purple-500 hover:bg-purple-400 disabled:bg-purple-500/50 text-white font-semibold rounded-lg transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Prompt'}
            </button>

            {/* Example prompts */}
            <div className="mt-4">
              <p className="text-purple-300 text-xs mb-2">Need inspiration?</p>
              <div className="flex flex-wrap gap-2">
                {[
                  '3am energy',
                  'Life saver',
                  "I shouldn't have",
                  'What a view!',
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setPromptText(example)}
                    className="text-xs px-2 py-1 bg-white/10 text-purple-200 rounded hover:bg-white/20 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-500/20 border border-green-400/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 text-green-300 mb-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Prompt Submitted!</span>
            </div>
            <p className="text-white italic">&quot;{myPrompt.text}&quot;</p>
          </div>
        )}

        {/* Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Waiting for prompts ({prompts.length}/{players.length})
          </h2>
          <div className="space-y-2">
            {players.map((player) => {
              const hasSubmitted = prompts.some(p => p.player_id === player.id);
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                >
                  <span className="text-white">{player.username}</span>
                  {hasSubmitted ? (
                    <span className="text-green-400 text-sm">Ready</span>
                  ) : (
                    <span className="text-yellow-400 text-sm animate-pulse">Thinking...</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Button (Host Only) */}
        {isHost && allPromptsSubmitted && (
          <button
            onClick={handleStartRounds}
            disabled={isStarting}
            className="w-full py-4 px-6 bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-white font-bold text-lg rounded-xl transition-colors"
          >
            {isStarting ? 'Starting...' : 'Start Rounds!'}
          </button>
        )}

        {!isHost && allPromptsSubmitted && (
          <div className="text-center text-purple-200">
            All prompts submitted! Waiting for host to start...
          </div>
        )}
      </div>
    </div>
  );
}
