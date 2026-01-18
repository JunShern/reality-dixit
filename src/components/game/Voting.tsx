'use client';

import { useState } from 'react';
import type { Room, Prompt, Player, Vote, SubmissionWithVotes } from '@/lib/types';

interface VotingProps {
  room: Room;
  currentPrompt: Prompt | null;
  submissions: SubmissionWithVotes[];
  players: Player[];
  myPlayer: Player;
  myVote: Vote | null;
  onSubmitVote: (submissionId: string) => Promise<void>;
  onAdvancePhase: () => Promise<void>;
  isHost: boolean;
}

export function Voting({
  room,
  currentPrompt,
  submissions,
  players,
  myPlayer,
  myVote,
  onSubmitVote,
  onAdvancePhase,
  isHost,
}: VotingProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totalRounds = players.length;

  // Find my submission (can't vote for own)
  const mySubmission = submissions.find(s => s.player_id === myPlayer.id);

  // Sort submissions by vote count for live ranking
  const sortedSubmissions = [...submissions].sort((a, b) => b.voteCount - a.voteCount);

  // Count how many players have voted
  const votedPlayerIds = new Set(submissions.flatMap(s => s.votes.map(v => v.voter_id)));
  // Players who submitted can vote (minus the player whose photo would get their own vote)
  const eligibleVoters = players.filter(p => {
    // A player can vote if they're in the room
    return true;
  });
  const votesNeeded = eligibleVoters.length;
  const votesCast = votedPlayerIds.size;
  const allVoted = votesCast >= players.length;

  const handleVote = async (submissionId: string) => {
    if (myVote || isVoting) return;

    setSelectedId(submissionId);
    setIsVoting(true);

    try {
      await onSubmitVote(submissionId);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-paper">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Round indicator */}
        <div className="text-center mb-4">
          <span className="badge badge-gold">
            Round {room.current_round} of {totalRounds}
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

        {/* Voting Status */}
        <div className="text-center mb-6">
          {myVote ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sage/20 rounded-full text-sage-dark font-medium">
              <span>✅</span>
              <span>You&apos;ve voted! Waiting for others...</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-coral/10 rounded-full text-coral font-medium">
              <span>⭐</span>
              <span>Vote for the best photo!</span>
            </div>
          )}
        </div>

        {/* Photos Grid with Vote Counts */}
        <div className="space-y-3 mb-6">
          {sortedSubmissions.map((submission, idx) => {
            const isOwn = submission.player_id === myPlayer.id;
            const isVoted = myVote?.submission_id === submission.id;
            const canVote = !myVote && !isOwn;
            const rank = idx + 1;

            return (
              <div
                key={submission.id}
                className={`relative card p-3 transition-all ${
                  canVote ? 'cursor-pointer hover:shadow-lg hover:border-coral' : ''
                } ${isVoted ? 'border-2 border-sage bg-sage/5' : ''} ${isOwn ? 'opacity-60' : ''}`}
                onClick={() => canVote && handleVote(submission.id)}
              >
                <div className="flex gap-4">
                  {/* Rank */}
                  <div className={`flex-shrink-0 rank-circle ${
                    rank === 1 ? 'rank-1' :
                    rank === 2 ? 'rank-2' :
                    rank === 3 ? 'rank-3' :
                    'rank-other'
                  }`}>
                    {rank}
                  </div>

                  {/* Photo */}
                  <div className="flex-shrink-0 w-20 h-20 bg-white p-1 rounded-lg shadow-sm">
                    <img
                      src={submission.photo_url}
                      alt={`Submission ${idx + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>

                  {/* Vote Info */}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="text-2xl font-bold text-charcoal flex items-center gap-1">
                      <span>{submission.voteCount}</span>
                      <span className="text-gold text-lg">⭐</span>
                    </div>
                    <span className="text-charcoal-light text-sm">
                      {submission.voteCount === 1 ? 'vote' : 'votes'}
                    </span>
                    {isOwn && (
                      <span className="text-coral text-xs font-medium mt-1">Your photo</span>
                    )}
                    {isVoted && (
                      <span className="text-sage-dark text-xs font-medium mt-1">Your vote ✓</span>
                    )}
                  </div>

                  {/* Vote Button */}
                  {canVote && (
                    <div className="flex items-center">
                      <button
                        className="btn btn-primary px-4 py-2 text-sm"
                        disabled={isVoting && selectedId === submission.id}
                      >
                        {isVoting && selectedId === submission.id ? (
                          <span className="animate-pulse-soft">...</span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <span>⭐</span>
                            <span>Vote</span>
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Voting Progress */}
        <div className="card p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-charcoal-light text-sm font-medium flex items-center gap-2">
              <span>🗳️</span>
              <span>Votes cast</span>
            </span>
            <span className="badge badge-gold">{votesCast}/{votesNeeded}</span>
          </div>
          <div className="progress-bar h-2.5">
            <div
              className="progress-fill h-full"
              style={{ width: `${(votesCast / votesNeeded) * 100}%` }}
            />
          </div>
        </div>

        {/* Continue Button (Host Only) */}
        {isHost && allVoted && (
          <button
            onClick={onAdvancePhase}
            className="btn btn-success w-full py-4 text-lg font-bold"
          >
            <span className="flex items-center justify-center gap-2">
              <span>🏆</span>
              <span>Show Results!</span>
            </span>
          </button>
        )}

        {isHost && !allVoted && (
          <button
            onClick={onAdvancePhase}
            className="btn w-full py-4 text-lg font-bold bg-gold/70 text-white hover:bg-gold"
          >
            <span className="flex items-center justify-center gap-2">
              <span>⏭️</span>
              <span>Skip to Results</span>
            </span>
          </button>
        )}

        {!isHost && !myVote && (
          <div className="text-center text-gray-medium text-sm">
            <span>Can&apos;t vote for your own photo!</span>
          </div>
        )}
      </div>
    </div>
  );
}
