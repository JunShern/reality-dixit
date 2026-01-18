'use client';

import type { Player } from '@/lib/types';

interface FinalScoresProps {
  players: Player[];
}

export function FinalScores({ players }: FinalScoresProps) {
  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const winner = sortedPlayers[0];
  const hasWinner = winner && winner.score > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Winner Announcement */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Game Over!</h1>
          {hasWinner && (
            <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-2xl p-6">
              <div className="text-6xl mb-4">👑</div>
              <div className="text-2xl font-bold text-yellow-300">
                {winner.username}
              </div>
              <div className="text-yellow-200">
                wins with {winner.score} point{winner.score !== 1 ? 's' : ''}!
              </div>
            </div>
          )}
          {!hasWinner && (
            <div className="bg-purple-500/20 border border-purple-400/30 rounded-2xl p-6">
              <div className="text-4xl mb-4">🤷</div>
              <div className="text-xl text-purple-200">
                No votes were cast!
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Final Standings</h2>
          <div className="space-y-3">
            {sortedPlayers.map((player, idx) => {
              const rank = idx + 1;
              const isWinner = rank === 1 && player.score > 0;

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-3 rounded-lg ${
                    isWinner ? 'bg-yellow-500/20' : 'bg-white/5'
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    rank === 1 ? 'bg-yellow-500 text-yellow-900' :
                    rank === 2 ? 'bg-gray-300 text-gray-700' :
                    rank === 3 ? 'bg-orange-400 text-orange-900' :
                    'bg-white/20 text-white'
                  }`}>
                    {rank}
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <span className={`font-semibold ${isWinner ? 'text-yellow-300' : 'text-white'}`}>
                      {player.username}
                    </span>
                  </div>

                  {/* Score */}
                  <div className={`font-bold ${isWinner ? 'text-yellow-300' : 'text-white'}`}>
                    {player.score} pt{player.score !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Play Again */}
        <a
          href="/"
          className="block w-full py-4 px-6 bg-purple-500 hover:bg-purple-400 text-white font-bold text-lg rounded-xl transition-colors text-center"
        >
          Play Again
        </a>
      </div>
    </div>
  );
}
