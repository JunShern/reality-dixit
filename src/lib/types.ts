// Database types for Supabase

export type RoomStatus = 'waiting' | 'prompts' | 'playing' | 'finished';

export type RoundPhase = 'upload' | 'reveal' | 'voting' | 'results';

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          code: string;
          status: RoomStatus;
          current_round: number;
          round_phase: RoundPhase | null;
          reveal_index: number;
          phase_end_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          status?: RoomStatus;
          current_round?: number;
          round_phase?: RoundPhase | null;
          reveal_index?: number;
          phase_end_time?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          status?: RoomStatus;
          current_round?: number;
          round_phase?: RoundPhase | null;
          reveal_index?: number;
          phase_end_time?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          room_id: string;
          username: string;
          score: number;
          is_host: boolean;
          session_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          username: string;
          score?: number;
          is_host?: boolean;
          session_token: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          username?: string;
          score?: number;
          is_host?: boolean;
          session_token?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      prompts: {
        Row: {
          id: string;
          room_id: string;
          player_id: string;
          text: string;
          round_number: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          player_id: string;
          text: string;
          round_number?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          player_id?: string;
          text?: string;
          round_number?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          room_id: string;
          round: number;
          player_id: string;
          photo_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          round: number;
          player_id: string;
          photo_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          round?: number;
          player_id?: string;
          photo_url?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          id: string;
          room_id: string;
          round: number;
          voter_id: string;
          submission_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          round: number;
          voter_id: string;
          submission_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          round?: number;
          voter_id?: string;
          submission_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      room_status: RoomStatus;
      round_phase: RoundPhase;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Convenience types
export type Room = Database['public']['Tables']['rooms']['Row'];
export type Player = Database['public']['Tables']['players']['Row'];
export type Prompt = Database['public']['Tables']['prompts']['Row'];
export type Submission = Database['public']['Tables']['submissions']['Row'];
export type Vote = Database['public']['Tables']['votes']['Row'];

// Extended types with relations
export interface SubmissionWithVotes extends Submission {
  votes: Vote[];
  voteCount: number;
}

export interface PlayerWithSubmission extends Player {
  submission?: Submission;
  hasVoted?: boolean;
}

// Game state for client
export interface GameState {
  room: Room;
  players: Player[];
  currentPrompt: Prompt | null;
  submissions: SubmissionWithVotes[];
  myPlayer: Player | null;
  mySubmission: Submission | null;
  myVote: Vote | null;
}
