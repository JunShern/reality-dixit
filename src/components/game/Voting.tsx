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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Round indicator */}
        <div className="text-center mb-4">
          <span className="text-purple-300 text-sm">
            Round {room.current_round} of {totalRounds}
          </span>
        </div>

        {/* Prompt Display */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl mb-6">
          <p className="text-xl font-bold text-white text-center">
            &quot;{currentPrompt?.text || 'Loading...'}&quot;
          </p>
        </div>

        {/* Voting Status */}
        <div className="text-center mb-6">
          {myVote ? (
            <span className="text-green-300">You&apos;ve voted! Waiting for others...</span>
          ) : (
            <span className="text-purple-200">Vote for the best photo (can&apos;t vote for your own!)</span>
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
                className={`relative bg-white/10 backdrop-blur-sm rounded-xl p-3 transition-all ${
                  canVote ? 'cursor-pointer hover:bg-white/20' : ''
                } ${isVoted ? 'ring-2 ring-green-400' : ''} ${isOwn ? 'opacity-60' : ''}`}
                onClick={() => canVote && handleVote(submission.id)}
              >
                <div className="flex gap-4">
                  {/* Rank */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    rank === 1 ? 'bg-yellow-500 text-yellow-900' :
                    rank === 2 ? 'bg-gray-300 text-gray-700' :
                    rank === 3 ? 'bg-orange-400 text-orange-900' :
                    'bg-white/20 text-white'
                  }`}>
                    {rank}
                  </div>

                  {/* Photo */}
                  <div className="flex-shrink-0 w-20 h-20">
                    <img
                      src={submission.photo_url}
                      alt={`Submission ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  {/* Vote Info */}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="text-2xl font-bold text-white">
                      {submission.voteCount} vote{submission.voteCount !== 1 ? 's' : ''}
                    </div>
                    {isOwn && (
                      <span className="text-purple-300 text-sm">Your photo</span>
                    )}
                    {isVoted && (
                      <span className="text-green-300 text-sm">Your vote</span>
                    )}
                  </div>

                  {/* Vote Button */}
                  {canVote && (
                    <div className="flex items-center">
                      <button
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg text-sm font-semibold transition-colors"
                        disabled={isVoting && selectedId === submission.id}
                      >
                        {isVoting && selectedId === submission.id ? '...' : 'Vote'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Voting Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-purple-200 text-sm">Votes cast</span>
            <span className="text-white font-semibold">{votesCast}/{votesNeeded}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(votesCast / votesNeeded) * 100}%` }}
            />
          </div>
        </div>

        {/* Continue Button (Host Only) */}
        {isHost && allVoted && (
          <button
            onClick={onAdvancePhase}
            className="w-full py-4 px-6 bg-green-500 hover:bg-green-400 text-white font-bold text-lg rounded-xl transition-colors"
          >
            Show Results!
          </button>
        )}

        {isHost && !allVoted && (
          <button
            onClick={onAdvancePhase}
            className="w-full py-4 px-6 bg-yellow-500/50 hover:bg-yellow-500 text-white font-bold text-lg rounded-xl transition-colors"
          >
            Skip to Results (not all voted)
          </button>
        )}
      </div>
    </div>
  );
}
