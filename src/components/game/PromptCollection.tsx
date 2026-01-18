'use client';

import { useState, useMemo } from 'react';
import type { Player, Prompt } from '@/lib/types';
import { FileText, PenLine, Lightbulb, CheckCircle, Clock, Play, Sparkles, Check } from 'lucide-react';

const INSPIRATION_PROMPTS = [
  'take me back',
  'Simpler times',
  'the one that got away',
  'Before everything changed',
  'main character energy',
  'Questionable decisions',
  'peak happiness',
  'Instant regret',
  'worth every penny',
  'Against all odds',
  'proof that magic exists',
  'Time stood still',
  'the universe said yes',
  'Home is where...',
  '3am energy',
  'life saver',
  "i shouldn't have",
  'MVP',
  'OOTD',
  'what a view!',
  "i don't even know what was going on",
  'Best day ever',
  'what a beautiful planet <3',
  "you miss every shot you don't take",
  'Evidence for the divorce lawyer',
  'my villain origin story',
  'Not my proudest moment',
  'delete before mom sees',
  'My FBI agent is concerned',
  'explain this to HR',
  "the reason i'm going to hell",
  'intrusive thoughts won',
  'Breakfast of Kings',
  'travel pics',
  'eating healthy',
  'best meal ever',
  'Best drink ever',
  'Training montage',
  'wOrKiNG HaRd',
  'no caption',
  'roadtrip',
  'fancy pants',
  'people of culture',
];

interface PromptCollectionProps {
  players: Player[];
  prompts: Prompt[];
  myPrompt: Prompt | undefined;
  myPlayerId: string;
  isHost: boolean;
  onSubmitPrompt: (text: string) => Promise<void>;
  onStartRounds: () => Promise<void>;
}

// Simple hash function to get a stable number from a string
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function PromptCollection({
  players,
  prompts,
  myPrompt,
  myPlayerId,
  isHost,
  onSubmitPrompt,
  onStartRounds,
}: PromptCollectionProps) {
  const [promptText, setPromptText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const allPromptsSubmitted = prompts.length === players.length;

  // Select 3 random prompts based on player ID (so each player sees different ones)
  const inspirationPrompts = useMemo(() => {
    const shuffled = [...INSPIRATION_PROMPTS].sort((a, b) => {
      const hashA = hashCode(a + myPlayerId);
      const hashB = hashCode(b + myPlayerId);
      return hashA - hashB;
    });
    return shuffled.slice(0, 3);
  }, [myPlayerId]);

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-paper">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <FileText size={28} className="text-teal" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-medium text-charcoal mb-2">Submit Your Prompt</h1>
          <p className="text-charcoal-light font-light">
            Think of a caption that your friends will match with their photos!
          </p>
        </div>

        {/* Prompt Input */}
        {!myPrompt ? (
          <div className="card-elevated p-6 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-teal mb-2">
                Your Prompt
              </label>
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder='e.g., "This literally made my day"'
                className="input w-full px-4 py-3"
                maxLength={100}
              />
              <p className="text-gray-medium text-xs mt-2 font-light">
                {promptText.length}/100 characters
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!promptText.trim() || isSubmitting}
              className="btn btn-primary w-full py-3 text-lg"
            >
              {isSubmitting ? (
                <span className="animate-pulse-soft">Submitting...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <PenLine size={18} strokeWidth={1.5} />
                  <span>Submit Prompt</span>
                </span>
              )}
            </button>

            {/* Example prompts */}
            <div className="mt-5 pt-4 border-t-2 border-dashed border-gray-light">
              <p className="text-gray-medium text-xs mb-2 flex items-center gap-1 font-light">
                <Lightbulb size={14} strokeWidth={1.5} />
                <span>Need inspiration?</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {inspirationPrompts.map((example) => (
                  <button
                    key={example}
                    onClick={() => setPromptText(example)}
                    className="text-xs px-3 py-1.5 bg-cream-dark text-charcoal-light rounded-full hover:bg-coral-light/30 hover:text-coral-dark transition-colors border border-gray-light font-light"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-6 mb-6 bg-sage/10 border-2 border-sage/40">
            <div className="flex items-center gap-2 text-sage-dark mb-2">
              <CheckCircle size={20} strokeWidth={1.5} />
              <span className="font-medium">Prompt Submitted!</span>
            </div>
            <p className="text-charcoal text-lg italic font-light">&quot;{myPrompt.text}&quot;</p>
          </div>
        )}

        {/* Progress */}
        <div className="card p-5 mb-6">
          <h2 className="text-lg font-medium text-teal mb-4 flex items-center gap-2">
            <Clock size={20} strokeWidth={1.5} />
            <span>Waiting for prompts</span>
            <span className="ml-auto badge badge-gold">{prompts.length}/{players.length}</span>
          </h2>

          {/* Progress bar */}
          <div className="progress-bar h-2 mb-4">
            <div
              className="progress-fill h-full"
              style={{ width: `${(prompts.length / players.length) * 100}%` }}
            />
          </div>

          <div className="space-y-2">
            {players.map((player) => {
              const hasSubmitted = prompts.some(p => p.player_id === player.id);
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    hasSubmitted ? 'bg-sage/10' : 'bg-cream-dark'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      hasSubmitted ? 'bg-sage text-white' : 'bg-gray-light text-gray-medium'
                    }`}>
                      {hasSubmitted ? <Check size={14} strokeWidth={2} /> : '?'}
                    </span>
                    <span className="text-charcoal">{player.username}</span>
                  </div>
                  {hasSubmitted ? (
                    <span className="text-sage-dark text-sm">Ready</span>
                  ) : (
                    <span className="text-gold text-sm animate-pulse-soft">Thinking...</span>
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
            className="btn btn-success w-full py-4 text-lg"
          >
            {isStarting ? (
              <span className="animate-pulse-soft">Starting...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Play size={20} strokeWidth={1.5} />
                <span>Start Rounds!</span>
              </span>
            )}
          </button>
        )}

        {!isHost && allPromptsSubmitted && (
          <div className="card p-4 text-center">
            <p className="text-charcoal-light font-light flex items-center justify-center gap-2">
              <Sparkles size={16} strokeWidth={1.5} />
              <span>All prompts in! Waiting for host to start...</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
