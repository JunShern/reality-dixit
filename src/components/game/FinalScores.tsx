'use client';

import { useState } from 'react';
import type { Player } from '@/lib/types';

interface FinalScoresProps {
  players: Player[];
  isHost: boolean;
  onPlayAgain: () => Promise<void>;
}

export function FinalScores({ players, isHost, onPlayAgain }: FinalScoresProps) {
  const [isResetting, setIsResetting] = useState(false);

  const handlePlayAgain = async () => {
    setIsResetting(true);
    try {
      await onPlayAgain();
    } finally {
      setIsResetting(false);
    }
  };
  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const winner = sortedPlayers[0];
  const hasWinner = winner && winner.score > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-paper">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-4xl">🎮</span>
          <h1 className="text-display text-3xl font-bold text-charcoal mt-2">Game Over!</h1>
        </div>

        {/* Winner Announcement */}
        {hasWinner && (
          <div className="card-elevated p-8 mb-6 bg-gold/10 border-2 border-gold text-center">
            <div className="text-6xl mb-4">🏆</div>
            <div className="text-display text-2xl font-bold text-charcoal mb-2">
              {winner.username}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 rounded-full">
              <span className="text-gold font-bold text-lg">{winner.score}</span>
              <span className="text-gold">⭐</span>
              <span className="text-charcoal-light">{winner.score !== 1 ? 'points' : 'point'}</span>
            </div>
            <p className="text-charcoal-light mt-3 text-sm">Champion of the game!</p>
          </div>
        )}

        {!hasWinner && (
          <div className="card-elevated p-6 mb-6 text-center">
            <div className="text-4xl mb-4">🤷</div>
            <div className="text-display text-xl text-charcoal">
              No votes were cast!
            </div>
            <p className="text-charcoal-light mt-2 text-sm">Better luck next time!</p>
          </div>
        )}

        {/* Leaderboard */}
        <div className="card p-5 mb-6">
          <h2 className="text-display text-lg font-bold text-teal mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Final Standings</span>
          </h2>
          <div className="space-y-3 stagger-children">
            {sortedPlayers.map((player, idx) => {
              const rank = idx + 1;
              const isWinner = rank === 1 && player.score > 0;

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                    isWinner ? 'bg-gold/15 border-2 border-gold/50' : 'bg-cream-dark'
                  }`}
                >
                  {/* Rank with medal badge */}
                  <div className={`rank-circle ${
                    rank === 1 ? 'rank-1' :
                    rank === 2 ? 'rank-2' :
                    rank === 3 ? 'rank-3' :
                    'rank-other'
                  }`}>
                    {rank === 1 ? '👑' : rank}
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <span className={`font-semibold ${isWinner ? 'text-charcoal' : 'text-charcoal'}`}>
                      {player.username}
                    </span>
                    {rank === 1 && hasWinner && (
                      <span className="ml-2 badge badge-gold text-xs">Winner</span>
                    )}
                    {rank === 2 && (
                      <span className="ml-2 badge badge-silver text-xs">2nd</span>
                    )}
                    {rank === 3 && (
                      <span className="ml-2 badge badge-bronze text-xs">3rd</span>
                    )}
                  </div>

                  {/* Score */}
                  <div className={`font-bold flex items-center gap-1 ${isWinner ? 'text-gold' : 'text-charcoal'}`}>
                    <span>{player.score}</span>
                    <span className="text-gold text-sm">⭐</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Play Again */}
        {isHost ? (
          <button
            onClick={handlePlayAgain}
            disabled={isResetting}
            className="btn btn-primary w-full py-4 text-lg font-bold"
          >
            {isResetting ? (
              <span className="animate-pulse-soft">Resetting...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>🔄</span>
                <span>Play Again</span>
              </span>
            )}
          </button>
        ) : (
          <div className="card p-4 text-center">
            <p className="text-charcoal-light flex items-center justify-center gap-2">
              <span className="animate-pulse-soft">⏳</span>
              <span>Waiting for host to start new game...</span>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-gray-medium text-xs">
          <span>Thanks for playing! 🎲</span>
        </div>
      </div>
    </div>
  );
}
