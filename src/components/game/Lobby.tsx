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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-paper">
      <div className="w-full max-w-md animate-fade-in">
        {/* Room Code Display */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-2xl">🎮</span>
            <span className="text-teal text-sm font-semibold uppercase tracking-wide">Room Code</span>
          </div>
          <div className="room-code text-5xl font-bold text-charcoal mb-2">
            {room.code}
          </div>
          <p className="text-gray-medium text-sm">Share this code with friends to join</p>
        </div>

        {/* Players List */}
        <div className="card-elevated p-6 mb-6">
          <h2 className="text-display text-lg font-bold text-teal mb-4 flex items-center gap-2">
            <span>👥</span>
            <span>Players</span>
            <span className="ml-auto badge badge-gold">{players.length}</span>
          </h2>
          <ul className="space-y-2 stagger-children">
            {players.map((player, index) => (
              <li
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  player.id === myPlayer.id
                    ? 'bg-coral-light/20 border-2 border-coral/40'
                    : 'bg-cream-dark border-2 border-transparent'
                }`}
              >
                {/* Player avatar with meeple style */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  player.is_host ? 'bg-gold text-white' : 'bg-teal text-white'
                }`}>
                  {player.is_host ? '👑' : '🎲'}
                </div>

                <div className="flex-1">
                  <span className="font-semibold text-charcoal">
                    {player.username}
                  </span>
                  {player.id === myPlayer.id && (
                    <span className="text-coral text-sm ml-2">(you)</span>
                  )}
                </div>

                {player.is_host && (
                  <span className="badge badge-gold">
                    Host
                  </span>
                )}
              </li>
            ))}
          </ul>

          {players.length < 3 && (
            <div className="mt-4 p-3 bg-gold-light/20 border-2 border-dashed border-gold/40 rounded-xl text-center">
              <p className="text-charcoal-light text-sm">
                <span className="text-lg mr-2">⏳</span>
                Waiting for {3 - players.length} more player{3 - players.length !== 1 ? 's' : ''}...
              </p>
            </div>
          )}
        </div>

        {/* Start Game Button (Host Only) */}
        {isHost && (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={`btn w-full py-4 px-6 text-lg font-bold ${
              canStart
                ? 'btn-success'
                : 'bg-gray-light text-gray-medium cursor-not-allowed'
            }`}
          >
            {canStart ? (
              <span className="flex items-center justify-center gap-2">
                <span>🚀</span>
                <span>Start Game</span>
              </span>
            ) : (
              <span>Need {3 - players.length} more player{3 - players.length !== 1 ? 's' : ''}</span>
            )}
          </button>
        )}

        {!isHost && (
          <div className="card p-4 text-center">
            <p className="text-charcoal-light flex items-center justify-center gap-2">
              <span className="animate-pulse-soft">⏳</span>
              <span>Waiting for host to start the game...</span>
            </p>
          </div>
        )}

        {/* How it works hint */}
        <div className="mt-6 text-center text-gray-medium text-xs">
          <span>Once started, everyone will submit prompts 📝</span>
        </div>
      </div>
    </div>
  );
}
