'use client';

import type { Room, Prompt, Player, SubmissionWithVotes } from '@/lib/types';

interface RoundResultsProps {
  room: Room;
  currentPrompt: Prompt | null;
  submissions: SubmissionWithVotes[];
  players: Player[];
  totalRounds: number;
  onNextRound: () => Promise<void>;
  isHost: boolean;
}

export function RoundResults({
  room,
  currentPrompt,
  submissions,
  players,
  totalRounds,
  onNextRound,
  isHost,
}: RoundResultsProps) {
  // Sort submissions by vote count
  const sortedSubmissions = [...submissions].sort((a, b) => b.voteCount - a.voteCount);

  // Get player name for each submission
  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.username || 'Unknown';
  };

  const isLastRound = room.current_round >= totalRounds;
  const winner = sortedSubmissions[0];
  const hasWinner = winner && winner.voteCount > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-paper">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Round indicator */}
        <div className="text-center mb-4">
          <span className="badge badge-gold">
            Round {room.current_round} of {totalRounds} - Results
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

        {/* Winner Highlight */}
        {hasWinner && (
          <div className="card-elevated p-6 mb-6 bg-gold/10 border-2 border-gold">
            <div className="text-center mb-4">
              <span className="text-3xl">🏆</span>
              <h3 className="text-display text-xl font-bold text-charcoal mt-2">Round Winner!</h3>
            </div>
            <div className="flex flex-col items-center gap-4">
              {/* Winner's photo - polaroid style */}
              <div className="bg-white p-3 pb-10 rounded-lg shadow-lg max-w-[200px]">
                <img
                  src={winner.photo_url}
                  alt={`${getPlayerName(winner.player_id)}'s winning submission`}
                  className="w-full rounded"
                />
              </div>
              <div className="text-center">
                <p className="text-display text-xl font-bold text-charcoal">{getPlayerName(winner.player_id)}</p>
                <p className="text-gold font-semibold flex items-center justify-center gap-1">
                  <span>{winner.voteCount}</span>
                  <span>⭐</span>
                  <span>{winner.voteCount === 1 ? 'vote' : 'votes'}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Other Results */}
        <div className="space-y-3 mb-6">
          {sortedSubmissions.slice(hasWinner ? 1 : 0).map((submission, idx) => {
            const actualRank = hasWinner ? idx + 2 : idx + 1;
            const playerName = getPlayerName(submission.player_id);

            return (
              <div
                key={submission.id}
                className="card p-3"
              >
                <div className="flex gap-4 items-center">
                  {/* Rank Badge */}
                  <div className={`flex-shrink-0 rank-circle ${
                    actualRank === 2 ? 'rank-2' :
                    actualRank === 3 ? 'rank-3' :
                    'rank-other'
                  }`}>
                    {actualRank}
                  </div>

                  {/* Photo */}
                  <div className="flex-shrink-0 w-16 h-16 bg-white p-1 rounded-lg shadow-sm">
                    <img
                      src={submission.photo_url}
                      alt={`${playerName}'s submission`}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="text-charcoal font-semibold">
                      {playerName}
                    </div>
                    <div className="text-charcoal-light text-sm flex items-center gap-1">
                      <span>{submission.voteCount}</span>
                      <span className="text-gold">⭐</span>
                      <span>{submission.voteCount === 1 ? 'vote' : 'votes'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Points Summary */}
        <div className="card p-5 mb-6">
          <h3 className="text-display text-lg font-bold text-teal mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Points Earned This Round</span>
          </h3>
          <div className="space-y-2">
            {sortedSubmissions.map((submission) => {
              const playerName = getPlayerName(submission.player_id);
              return (
                <div key={submission.id} className="flex justify-between items-center p-2 rounded-lg bg-cream-dark">
                  <span className="text-charcoal-light font-medium">{playerName}</span>
                  <span className="font-bold text-sage flex items-center gap-1">
                    <span>+{submission.voteCount}</span>
                    <span className="text-gold">⭐</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Continue Button (Host Only) */}
        {isHost && (
          <button
            onClick={onNextRound}
            className="btn btn-success w-full py-4 text-lg font-bold"
          >
            {isLastRound ? (
              <span className="flex items-center justify-center gap-2">
                <span>🏆</span>
                <span>See Final Scores!</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>▶️</span>
                <span>Next Round ({room.current_round + 1}/{totalRounds})</span>
              </span>
            )}
          </button>
        )}

        {!isHost && (
          <div className="card p-4 text-center">
            <p className="text-charcoal-light flex items-center justify-center gap-2">
              <span className="animate-pulse-soft">⏳</span>
              <span>
                {isLastRound
                  ? 'Waiting for host to show final scores...'
                  : 'Waiting for host to start next round...'}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
