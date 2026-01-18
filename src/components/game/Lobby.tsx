'use client';

import type { Room, Player } from '@/lib/types';

interface LobbyProps {
  room: Room;
  players: Player[];
  myPlayer: Player;
  isHost: boolean;
  onStartGame: () => Promise<void>;
}

export function Lobby({ room, players, myPlayer, isHost, onStartGame }: LobbyProps) {
  const canStart = players.length >= 3;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Room Code Display */}
        <div className="text-center mb-8">
          <p className="text-purple-200 text-sm mb-2">Room Code</p>
          <div className="text-5xl font-bold text-white tracking-widest font-mono">
            {room.code}
          </div>
          <p className="text-purple-300 text-sm mt-2">Share this code with friends</p>
        </div>

        {/* Players List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Players ({players.length})
          </h2>
          <ul className="space-y-2">
            {players.map((player) => (
              <li
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.id === myPlayer.id
                    ? 'bg-purple-500/30 border border-purple-400/50'
                    : 'bg-white/5'
                }`}
              >
                <span className="text-white">
                  {player.username}
                  {player.id === myPlayer.id && (
                    <span className="text-purple-300 ml-2">(you)</span>
                  )}
                </span>
                {player.is_host && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                    Host
                  </span>
                )}
              </li>
            ))}
          </ul>

          {players.length < 3 && (
            <p className="text-purple-300 text-sm mt-4 text-center">
              Waiting for at least {3 - players.length} more player{3 - players.length !== 1 ? 's' : ''}...
            </p>
          )}
        </div>

        {/* Start Game Button (Host Only) */}
        {isHost && (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className="w-full py-4 px-6 bg-green-500 hover:bg-green-400 disabled:bg-gray-500/50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-colors"
          >
            {canStart ? 'Start Game' : `Need ${3 - players.length} more players`}
          </button>
        )}

        {!isHost && (
          <div className="text-center text-purple-200">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}
