'use client';

import type { Room, Player } from '@/lib/types';
import { Gamepad2, Users, Crown, Dice6, Play, Clock, PenLine } from 'lucide-react';

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
            <Gamepad2 size={20} className="text-teal" strokeWidth={1.5} />
            <span className="text-teal text-sm font-medium uppercase tracking-wide">Room Code</span>
          </div>
          <div className="room-code text-5xl font-medium text-charcoal mb-2">
            {room.code}
          </div>
          <p className="text-gray-medium text-sm font-light">Share this code with friends to join</p>
        </div>

        {/* Players List */}
        <div className="card-elevated p-6 mb-6">
          <h2 className="text-lg font-medium text-teal mb-4 flex items-center gap-2">
            <Users size={20} strokeWidth={1.5} />
            <span>Players</span>
            <span className="ml-auto badge badge-gold">{players.length}</span>
          </h2>
          <ul className="space-y-2 stagger-children">
            {players.map((player) => (
              <li
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  player.id === myPlayer.id
                    ? 'bg-coral-light/20 border-2 border-coral/40'
                    : 'bg-cream-dark border-2 border-transparent'
                }`}
              >
                {/* Player avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  player.is_host ? 'bg-gold text-white' : 'bg-teal text-white'
                }`}>
                  {player.is_host ? <Crown size={18} strokeWidth={1.5} /> : <Dice6 size={18} strokeWidth={1.5} />}
                </div>

                <div className="flex-1">
                  <span className="font-medium text-charcoal">
                    {player.username}
                  </span>
                  {player.id === myPlayer.id && (
                    <span className="text-coral text-sm ml-2 font-light">(you)</span>
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
              <p className="text-charcoal-light text-sm font-light flex items-center justify-center gap-2">
                <Clock size={16} strokeWidth={1.5} className="text-gold" />
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
            className={`btn w-full py-4 px-6 text-lg ${
              canStart
                ? 'btn-success'
                : 'bg-gray-light text-gray-medium cursor-not-allowed'
            }`}
          >
            {canStart ? (
              <span className="flex items-center justify-center gap-2">
                <Play size={20} strokeWidth={1.5} />
                <span>Start Game</span>
              </span>
            ) : (
              <span className="font-light">Need {3 - players.length} more player{3 - players.length !== 1 ? 's' : ''}</span>
            )}
          </button>
        )}

        {!isHost && (
          <div className="card p-4 text-center">
            <p className="text-charcoal-light font-light flex items-center justify-center gap-2">
              <Clock size={16} className="animate-pulse-soft" strokeWidth={1.5} />
              <span>Waiting for host to start the game...</span>
            </p>
          </div>
        )}

        {/* How it works hint */}
        <div className="mt-6 text-center text-gray-medium text-xs font-light flex items-center justify-center gap-1">
          <span>Once started, everyone will submit prompts</span>
          <PenLine size={12} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
