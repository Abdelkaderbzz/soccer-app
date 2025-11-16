import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          created_at?: string
          last_login?: string | null
        }
      }
      players: {
        Row: {
          id: string
          user_id: string
          nickname: string
          photo_url: string | null
          overall_rating: number
          matches_played: number
          wins: number
          goals_scored: number
          position_preference: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nickname: string
          photo_url?: string | null
          overall_rating?: number
          matches_played?: number
          wins?: number
          goals_scored?: number
          position_preference?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nickname?: string
          photo_url?: string | null
          overall_rating?: number
          matches_played?: number
          wins?: number
          goals_scored?: number
          position_preference?: string
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          location: string
          match_date: string
          format: string
          max_players: number
          status: string
          organizer_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          location: string
          match_date: string
          format: string
          max_players: number
          status?: string
          organizer_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location?: string
          match_date?: string
          format?: string
          max_players?: number
          status?: string
          organizer_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      match_players: {
        Row: {
          id: string
          match_id: string
          player_id: string
          team: string | null
          goals_scored: number
          is_present: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          match_id: string
          player_id: string
          team?: string | null
          goals_scored?: number
          is_present?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          player_id?: string
          team?: string | null
          goals_scored?: number
          is_present?: boolean
          joined_at?: string
        }
      }
      player_ratings: {
        Row: {
          id: string
          rater_id: string
          rated_player_id: string
          match_id: string
          rating: number
          category: string
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          rater_id: string
          rated_player_id: string
          match_id: string
          rating: number
          category: string
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          rater_id?: string
          rated_player_id?: string
          match_id?: string
          rating?: number
          category?: string
          comment?: string | null
          created_at?: string
        }
      }
      match_results: {
        Row: {
          id: string
          match_id: string
          team_a_score: number
          team_b_score: number
          duration_minutes: number
          goal_scorers: any
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          team_a_score: number
          team_b_score: number
          duration_minutes: number
          goal_scorers?: any
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          team_a_score?: number
          team_b_score?: number
          duration_minutes?: number
          goal_scorers?: any
          created_at?: string
        }
      }
    }
  }
}