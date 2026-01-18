'use client';

import { useState, useMemo } from 'react';
import type { Player, Prompt, Submission, Vote } from '@/lib/types';
import { Gamepad2, Trophy, Star, Crown, BarChart3, RotateCcw, Clock, HelpCircle, Dice6, ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface FinalScoresProps {
  players: Player[];
  isHost: boolean;
  onPlayAgain: () => Promise<void>;
  prompts: Prompt[];
  allSubmissions: Submission[];
  votes: Vote[];
}

interface RoundWinner {
  round: number;
  prompt: Prompt;
  winningSubmission: Submission | null;
  winnerPlayer: Player | null;
  voteCount: number;
}

export function FinalScores({ players, isHost, onPlayAgain, prompts, allSubmissions, votes }: FinalScoresProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [recapIndex, setRecapIndex] = useState(0);

  const handlePlayAgain = async () => {
    setIsResetting(true);
    try {
      await onPlayAgain();
    } finally {
      setIsResetting(false);
    }
  };

  // Calculate winners for each round
  const roundWinners = useMemo<RoundWinner[]>(() => {
    // Get prompts sorted by round number
    const sortedPrompts = [...prompts]
      .filter(p => p.round_number !== null)
      .sort((a, b) => (a.round_number ?? 0) - (b.round_number ?? 0));

    return sortedPrompts.map(prompt => {
      const round = prompt.round_number!;
      const roundSubmissions = allSubmissions.filter(s => s.round === round);
      const roundVotes = votes.filter(v => v.round === round);

      // Count votes per submission
      const voteCountBySubmission: Record<string, number> = {};
      for (const vote of roundVotes) {
        voteCountBySubmission[vote.submission_id] = (voteCountBySubmission[vote.submission_id] ?? 0) + 1;
      }

      // Find winning submission (most votes)
      let winningSubmission: Submission | null = null;
      let maxVotes = 0;
      for (const submission of roundSubmissions) {
        const count = voteCountBySubmission[submission.id] ?? 0;
        if (count > maxVotes) {
          maxVotes = count;
          winningSubmission = submission;
        }
      }

      const winnerPlayer = winningSubmission
        ? players.find(p => p.id === winningSubmission!.player_id) ?? null
        : null;

      return {
        round,
        prompt,
        winningSubmission,
        winnerPlayer,
        voteCount: maxVotes,
      };
    });
  }, [prompts, allSubmissions, votes, players]);

  const totalRounds = roundWinners.length;
  const currentRecap = roundWinners[recapIndex];

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const winner = sortedPlayers[0];
  const hasWinner = winner && winner.score > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-paper">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <Gamepad2 size={40} className="text-coral mx-auto" strokeWidth={1.5} />
          <h1 className="text-3xl font-medium text-charcoal mt-2">Game Over!</h1>
        </div>

        {/* Winner Announcement */}
        {hasWinner && (
          <div className="card-elevated p-8 mb-6 bg-gold/10 border-2 border-gold text-center">
            <Trophy size={48} className="text-gold mx-auto mb-4" strokeWidth={1.5} />
            <div className="text-2xl font-semibold text-charcoal mb-2">
              {winner.username}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 rounded-full">
              <span className="text-gold font-semibold text-lg">{winner.score}</span>
              <Star size={18} className="text-gold" strokeWidth={1.5} fill="currentColor" />
              <span className="text-charcoal-light">{winner.score !== 1 ? 'points' : 'point'}</span>
            </div>
            <p className="text-charcoal-light mt-3 text-sm font-light">Champion of the game!</p>
          </div>
        )}

        {!hasWinner && (
          <div className="card-elevated p-6 mb-6 text-center">
            <HelpCircle size={40} className="text-charcoal-light mx-auto mb-4" strokeWidth={1.5} />
            <div className="text-xl text-charcoal font-medium">
              No votes were cast!
            </div>
            <p className="text-charcoal-light mt-2 text-sm font-light">Better luck next time!</p>
          </div>
        )}

        {/* Leaderboard */}
        <div className="card p-5 mb-6">
          <h2 className="text-lg font-medium text-teal mb-4 flex items-center gap-2">
            <BarChart3 size={20} strokeWidth={1.5} />
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
                    {rank === 1 ? <Crown size={16} strokeWidth={2} /> : rank}
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
                  <div className={`font-medium flex items-center gap-1 ${isWinner ? 'text-gold' : 'text-charcoal'}`}>
                    <span>{player.score}</span>
                    <Star size={14} className="text-gold" strokeWidth={1.5} fill="currentColor" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Winning Entries Recap */}
        {totalRounds > 0 && (
          <div className="card p-5 mb-6">
            <h2 className="text-lg font-medium text-teal mb-4 flex items-center gap-2">
              <Camera size={20} strokeWidth={1.5} />
              <span>Winning Entries</span>
            </h2>

            {/* Navigation header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setRecapIndex(i => Math.max(0, i - 1))}
                disabled={recapIndex === 0}
                className="p-2 rounded-full hover:bg-cream-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Previous round"
              >
                <ChevronLeft size={24} strokeWidth={1.5} />
              </button>

              <span className="text-charcoal font-medium">
                Round {recapIndex + 1} of {totalRounds}
              </span>

              <button
                onClick={() => setRecapIndex(i => Math.min(totalRounds - 1, i + 1))}
                disabled={recapIndex === totalRounds - 1}
                className="p-2 rounded-full hover:bg-cream-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Next round"
              >
                <ChevronRight size={24} strokeWidth={1.5} />
              </button>
            </div>

            {currentRecap && (
              <div className="text-center">
                {/* Prompt */}
                <p className="text-charcoal-light font-light mb-4 italic">
                  &ldquo;{currentRecap.prompt.text}&rdquo;
                </p>

                {/* Winning photo */}
                {currentRecap.winningSubmission ? (
                  <>
                    <div className="relative inline-block">
                      <div className="bg-white p-2 pb-10 shadow-lg rotate-1 hover:rotate-0 transition-transform">
                        <img
                          src={currentRecap.winningSubmission.photo_url}
                          alt="Winning submission"
                          className="w-48 h-48 object-cover"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2 text-charcoal">
                      <span className="font-medium">{currentRecap.winnerPlayer?.username ?? 'Unknown'}</span>
                      <span className="text-charcoal-light">•</span>
                      <span className="flex items-center gap-1">
                        {currentRecap.voteCount}
                        <Star size={14} className="text-gold" strokeWidth={1.5} fill="currentColor" />
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-charcoal-light font-light">
                    No submissions this round
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Play Again */}
        {isHost ? (
          <button
            onClick={handlePlayAgain}
            disabled={isResetting}
            className="btn btn-primary w-full py-4 text-lg font-medium"
          >
            {isResetting ? (
              <span className="animate-pulse-soft">Resetting...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <RotateCcw size={20} strokeWidth={1.5} />
                <span>Play Again</span>
              </span>
            )}
          </button>
        ) : (
          <div className="card p-4 text-center">
            <p className="text-charcoal-light font-light flex items-center justify-center gap-2">
              <Clock size={16} className="animate-pulse-soft" strokeWidth={1.5} />
              <span>Waiting for host to start new game...</span>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-gray-medium text-xs font-light flex items-center justify-center gap-1">
          <span>Thanks for playing!</span>
          <Dice6 size={12} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
