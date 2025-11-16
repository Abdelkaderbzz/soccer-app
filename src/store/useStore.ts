import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface Club {
  id: string
  name: string
  description: string
  logo_url: string
  created_by: string
  created_at: string
  updated_at: string
  club_players: ClubPlayer[]
  created_by_user: {
    nickname: string
    email: string
  }
}

interface ClubPlayer {
  id: string
  club_id: string
  player_id: string
  role: 'captain' | 'member'
  joined_at: string
  players: Player
}

interface Player {
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

interface Match {
  id: string
  location: string
  match_date: string
  format: string
  max_players: number
  status: string
  organizer_id: string
  created_at: string
  updated_at: string
  players?: Player
  match_players?: MatchPlayer[]
  match_results?: MatchResult[]
  team_a_club?: Club
  team_b_club?: Club
}

interface MatchPlayer {
  id: string
  match_id: string
  player_id: string
  team: string | null
  goals_scored: number
  is_present: boolean
  joined_at: string
  players?: Player
}

interface MatchResult {
  id: string
  match_id: string
  team_a_score: number
  team_b_score: number
  duration_minutes: number
  goal_scorers: any
  created_at: string
}

interface PlayerRating {
  id: string
  rater_id: string
  rated_player_id: string
  match_id: string
  rating: number
  category: string
  comment: string | null
  created_at: string
  rater?: Player
  match?: Match
}

interface User {
  id: string
  email: string
  created_at: string
  player?: Player
}

interface AppState {
  currentPlayer: Player | null
  currentUser: User | null
  token: string | null
  matches: Match[]
  players: Player[]
  clubs: Club[]
  myClubs: ClubPlayer[]
  loading: boolean
  error: string | null
  
  // Actions
  setCurrentPlayer: (player: Player | null) => void
  setCurrentUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setMatches: (matches: Match[]) => void
  setPlayers: (players: Player[]) => void
  setClubs: (clubs: Club[]) => void
  setMyClubs: (clubs: ClubPlayer[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // API calls
  fetchPlayers: () => Promise<void>
  fetchMatches: () => Promise<void>
  fetchClubs: () => Promise<void>
  fetchMyClubs: () => Promise<void>
  joinMatch: (matchId: string, playerId: string) => Promise<void>
  createMatch: (matchData: Partial<Match>) => Promise<void>
  submitRating: (ratingData: Partial<PlayerRating>) => Promise<void>
  balanceTeams: (matchId: string) => Promise<void>
  
  // Auth calls
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  getCurrentUser: () => Promise<void>
  
  // Match result submission
  submitMatchResult: (resultData: any) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  currentPlayer: null,
  currentUser: null,
  token: localStorage.getItem('token'),
  matches: [],
  players: [],
  clubs: [],
  myClubs: [],
  loading: false,
  error: null,

  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setToken: (token) => {
    set({ token })
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  },
  setMatches: (matches) => set({ matches }),
  setPlayers: (players) => set({ players }),
  setClubs: (clubs) => set({ clubs }),
  setMyClubs: (clubs) => set({ myClubs: clubs }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchPlayers: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/players')
      if (!response.ok) throw new Error('Failed to fetch players')
      const data = await response.json()
      set({ players: data, loading: false })
    } catch (error) {
      set({ error: 'Failed to fetch players', loading: false })
    }
  },

  fetchMatches: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/matches')
      if (!response.ok) throw new Error('Failed to fetch matches')
      const data = await response.json()
      set({ matches: data, loading: false })
    } catch (error) {
      set({ error: 'Failed to fetch matches', loading: false })
    }
  },

  fetchClubs: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/clubs')
      if (!response.ok) throw new Error('Failed to fetch clubs')
      const data = await response.json()
      set({ clubs: data, loading: false })
    } catch (error) {
      set({ error: 'Failed to fetch clubs', loading: false })
    }
  },

  fetchMyClubs: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/clubs/my')
      if (!response.ok) throw new Error('Failed to fetch my clubs')
      const data = await response.json()
      set({ myClubs: data, loading: false })
    } catch (error) {
      set({ error: 'Failed to fetch my clubs', loading: false })
    }
  },

  joinMatch: async (matchId: string, playerId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(`/api/matches/${matchId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId })
      })
      if (!response.ok) throw new Error('Failed to join match')
      await get().fetchMatches()
      set({ loading: false })
    } catch (error) {
      set({ error: 'Failed to join match', loading: false })
    }
  },

  createMatch: async (matchData: Partial<Match>) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData)
      })
      if (!response.ok) throw new Error('Failed to create match')
      await get().fetchMatches()
      set({ loading: false })
    } catch (error) {
      set({ error: 'Failed to create match', loading: false })
    }
  },

  submitRating: async (ratingData: Partial<PlayerRating>) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingData)
      })
      if (!response.ok) throw new Error('Failed to submit rating')
      set({ loading: false })
    } catch (error) {
      set({ error: 'Failed to submit rating', loading: false })
    }
  },

  balanceTeams: async (matchId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(`/api/matches/${matchId}/balance-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!response.ok) throw new Error('Failed to balance teams')
      await get().fetchMatches()
      set({ loading: false })
    } catch (error) {
      set({ error: 'Failed to balance teams', loading: false })
    }
  },

  // Authentication methods
  login: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }
      
      const data = await response.json()
      get().setToken(data.token)
      get().setCurrentUser(data.user)
      if (data.user.player) {
        get().setCurrentPlayer(data.user.player)
      }
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  register: async (userData: any) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Registration failed')
      }
      
      const data = await response.json()
      get().setToken(data.token)
      get().setCurrentUser(data.user)
      if (data.user.player) {
        get().setCurrentPlayer(data.user.player)
      }
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  logout: () => {
    get().setToken(null)
    get().setCurrentUser(null)
    get().setCurrentPlayer(null)
  },

  getCurrentUser: async () => {
    const token = get().token
    if (!token) return

    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        // Token is invalid, clear it
        get().logout()
        return
      }
      
      const data = await response.json()
      get().setCurrentUser(data.user)
      if (data.user.player) {
        get().setCurrentPlayer(data.user.player)
      }
      set({ loading: false })
    } catch (error) {
      // Token is invalid, clear it
      get().logout()
      set({ loading: false })
    }
  },

  submitMatchResult: async (resultData: any) => {
    set({ loading: true, error: null })
    try {
      const token = get().token
      const response = await fetch('/api/matches/results', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(resultData)
      })
      
      if (!response.ok) throw new Error('Failed to submit match result')
      await get().fetchMatches()
      set({ loading: false })
    } catch (error) {
      set({ error: 'Failed to submit match result', loading: false })
      throw error
    }
  }
}))