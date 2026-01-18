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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Round indicator */}
        <div className="text-center mb-4">
          <span className="text-purple-300 text-sm">
            Round {room.current_round} of {totalRounds} - Results
          </span>
        </div>

        {/* Prompt Display */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl mb-6">
          <p className="text-xl font-bold text-white text-center">
            &quot;{currentPrompt?.text || 'Loading...'}&quot;
          </p>
        </div>

        {/* Results */}
        <div className="space-y-4 mb-6">
          {sortedSubmissions.map((submission, idx) => {
            const rank = idx + 1;
            const playerName = getPlayerName(submission.player_id);
            const isWinner = rank === 1 && submission.voteCount > 0;

            return (
              <div
                key={submission.id}
                className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 ${
                  isWinner ? 'ring-2 ring-yellow-400 bg-yellow-500/10' : ''
                }`}
              >
                <div className="flex gap-4">
                  {/* Rank Badge */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    rank === 1 ? 'bg-yellow-500 text-yellow-900' :
                    rank === 2 ? 'bg-gray-300 text-gray-700' :
                    rank === 3 ? 'bg-orange-400 text-orange-900' :
                    'bg-white/20 text-white'
                  }`}>
                    {rank}
                  </div>

                  {/* Photo */}
                  <div className="flex-shrink-0 w-24 h-24">
                    <img
                      src={submission.photo_url}
                      alt={`${playerName}'s submission`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="text-white font-semibold text-lg">
                      {playerName}
                    </div>
                    <div className="text-purple-300">
                      {submission.voteCount} vote{submission.voteCount !== 1 ? 's' : ''}
                    </div>
                    {isWinner && (
                      <div className="text-yellow-400 text-sm font-semibold mt-1">
                        Round Winner!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Points Summary */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl mb-6">
          <h3 className="text-white font-semibold mb-3">Points Earned This Round</h3>
          <div className="space-y-2">
            {sortedSubmissions.map((submission) => {
              const playerName = getPlayerName(submission.player_id);
              return (
                <div key={submission.id} className="flex justify-between text-sm">
                  <span className="text-purple-200">{playerName}</span>
                  <span className="text-white font-semibold">+{submission.voteCount}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Continue Button (Host Only) */}
        {isHost && (
          <button
            onClick={onNextRound}
            className="w-full py-4 px-6 bg-green-500 hover:bg-green-400 text-white font-bold text-lg rounded-xl transition-colors"
          >
            {isLastRound ? 'See Final Scores!' : `Next Round (${room.current_round + 1}/${totalRounds})`}
          </button>
        )}

        {!isHost && (
          <div className="text-center text-purple-200">
            {isLastRound
              ? 'Waiting for host to show final scores...'
              : 'Waiting for host to start next round...'}
          </div>
        )}
      </div>
    </div>
  );
}
