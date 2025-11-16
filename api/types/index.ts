import { Request } from 'express'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    userId?: string;
  };
  supabase?: any;
  supabaseAdmin?: any;
}

export interface Player {
  id: string;
  user_id: string;
  nickname: string;
  photo_url: string | null;
  overall_rating: number;
  matches_played: number;
  wins: number;
  goals_scored: number;
  position_preference: string;
  email?: string;
  username?: string;
  position?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'player' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  title: string;
  description: string;
  location: string;
  match_date: string;
  format: string;
  max_players: number;
  status: 'upcoming' | 'in_progress' | 'completed';
  organizer_id: string;
  team_a_club_id: string | null;
  team_b_club_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchPlayer {
  id: string;
  match_id: string;
  player_id: string;
  team: 'A' | 'B' | null;
  goals_scored: number;
  is_present: boolean;
  joined_at: string;
}

export interface MatchResult {
  id: string;
  match_id: string;
  team_a_score: number;
  team_b_score: number;
  duration_minutes: number;
  goal_scorers: Record<string, number>;
  created_at: string;
}

export interface PlayerRating {
  id: string;
  rater_id: string;
  rated_player_id: string;
  match_id: string;
  rating: number;
  category: string;
  comment: string | null;
  created_at: string;
}