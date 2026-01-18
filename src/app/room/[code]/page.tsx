'use client';

import { use } from 'react';
import { useRoom } from '@/hooks/useRoom';
import { Lobby } from '@/components/game/Lobby';
import { PromptCollection } from '@/components/game/PromptCollection';
import { PhotoUpload } from '@/components/game/PhotoUpload';
import { PhotoReveal } from '@/components/game/PhotoReveal';
import { Voting } from '@/components/game/Voting';
import { RoundResults } from '@/components/game/RoundResults';
import { FinalScores } from '@/components/game/FinalScores';
import { Dice6, AlertCircle, Search } from 'lucide-react';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const { code } = use(params);
  const {
    room,
    players,
    prompts,
    submissions,
    allSubmissions,
    votes,
    myPlayer,
    currentPrompt,
    mySubmission,
    myVote,
    isLoading,
    error,
    isHost,
    startGame,
    submitPrompt,
    submitPhoto,
    submitVote,
    advancePhase,
    nextRound,
    playAgain,
  } = useRoom(code);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-charcoal text-xl flex items-center gap-2">
          <Dice6 size={24} className="animate-pulse-soft text-coral" strokeWidth={1.5} />
          <span className="font-light">Loading...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-paper p-4">
        <div className="card-elevated p-6 text-center max-w-md">
          <AlertCircle size={32} className="text-coral mx-auto mb-4" strokeWidth={1.5} />
          <div className="text-coral text-xl mb-4 font-light">{error}</div>
          <a href="/" className="btn btn-primary inline-block px-6 py-2">Return to home</a>
        </div>
      </main>
    );
  }

  if (!room || !myPlayer) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-paper p-4">
        <div className="card-elevated p-6 text-center max-w-md">
          <Search size={32} className="text-teal mx-auto mb-4" strokeWidth={1.5} />
          <div className="text-charcoal text-xl mb-4 font-light">Room not found</div>
          <a href="/" className="btn btn-primary inline-block px-6 py-2">Return to home</a>
        </div>
      </main>
    );
  }

  // Determine which component to render based on game state
  const renderGamePhase = () => {
    switch (room.status) {
      case 'waiting':
        return (
          <Lobby
            room={room}
            players={players}
            myPlayer={myPlayer}
            isHost={isHost}
            onStartGame={startGame}
          />
        );

      case 'prompts':
        const myPrompt = prompts.find(p => p.player_id === myPlayer.id);
        return (
          <PromptCollection
            players={players}
            prompts={prompts}
            myPrompt={myPrompt}
            myPlayerId={myPlayer.id}
            isHost={isHost}
            onSubmitPrompt={submitPrompt}
            onStartRounds={async () => {
              // Shuffle prompts and assign round numbers
              const { createClient } = await import('@supabase/supabase-js');
              const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              );

              const shuffledPrompts = [...prompts].sort(() => Math.random() - 0.5);
              for (let i = 0; i < shuffledPrompts.length; i++) {
                await supabase
                  .from('prompts')
                  .update({ round_number: i + 1 })
                  .eq('id', shuffledPrompts[i].id);
              }

              // Start the game
              await supabase
                .from('rooms')
                .update({
                  status: 'playing',
                  current_round: 1,
                  round_phase: 'upload',
                  phase_end_time: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
                })
                .eq('id', room.id);
            }}
          />
        );

      case 'playing':
        switch (room.round_phase) {
          case 'upload':
            return (
              <PhotoUpload
                room={room}
                currentPrompt={currentPrompt}
                players={players}
                submissions={submissions}
                mySubmission={mySubmission}
                onSubmitPhoto={submitPhoto}
                onAdvancePhase={advancePhase}
                isHost={isHost}
              />
            );

          case 'reveal':
            return (
              <PhotoReveal
                room={room}
                currentPrompt={currentPrompt}
                submissions={submissions}
                players={players}
                onAdvancePhase={advancePhase}
                isHost={isHost}
              />
            );

          case 'voting':
            return (
              <Voting
                room={room}
                currentPrompt={currentPrompt}
                submissions={submissions}
                players={players}
                myPlayer={myPlayer}
                myVote={myVote}
                onSubmitVote={submitVote}
                onAdvancePhase={advancePhase}
                isHost={isHost}
              />
            );

          case 'results':
            return (
              <RoundResults
                room={room}
                currentPrompt={currentPrompt}
                submissions={submissions}
                players={players}
                totalRounds={players.length}
                onNextRound={nextRound}
                isHost={isHost}
              />
            );

          default:
            return <div className="text-charcoal">Unknown phase</div>;
        }

      case 'finished':
        return (
          <FinalScores
            players={players}
            isHost={isHost}
            onPlayAgain={playAgain}
            prompts={prompts}
            allSubmissions={allSubmissions}
            votes={votes}
          />
        );

      default:
        return <div className="text-charcoal">Unknown game state</div>;
    }
  };

  return (
    <main className="min-h-screen bg-paper">
      {renderGamePhase()}
    </main>
  );
}
