import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/database'
import { Player, User } from '../types'

export class PlayerService {
  static async getAllPlayers() {
    if (!isSupabaseConfigured) {
      return this.getMockPlayers()
    }

    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        users!inner(id, email, role, created_at)
      `)
      .order('overall_rating', { ascending: false })

    if (error) throw error
    return data
  }

  static async getPlayerById(playerId: string) {
    if (!isSupabaseConfigured) {
      return this.getMockPlayers().find(p => p.id === playerId)
    }

    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        users!inner(id, email, role, created_at)
      `)
      .eq('id', playerId)
      .single()

    if (error) throw error
    return data
  }

  static async getPlayerByEmail(email: string) {
    if (!isSupabaseConfigured) {
      return this.getMockPlayers().find(p => p.email === email)
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        players!inner(*)
      `)
      .eq('email', email)
      .single()

    if (error) throw error
    return data?.players
  }

  static async updatePlayer(playerId: string, updateData: Partial<Player>) {
    if (!isSupabaseConfigured) {
      const player = this.getMockPlayers().find(p => p.id === playerId)
      if (!player) throw new Error('Player not found')
      
      return {
        ...player,
        ...updateData,
        updated_at: new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('players')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', playerId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updatePlayerStats(playerId: string, stats: Partial<Player>) {
    if (!isSupabaseConfigured) {
      return { success: true }
    }

    const { error } = await supabase
      .from('players')
      .update(stats)
      .eq('id', playerId)

    if (error) throw error
    return { success: true }
  }

  private static getMockPlayers(): any[] {
    return [
      {
        id: '1',
        user_id: '1',
        nickname: 'Lionel Messi',
        photo_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=football+player+cartoon+avatar+with+goat+horns+funny+playful&image_size=square',
        overall_rating: 4.8,
        matches_played: 25,
        wins: 20,
        goals_scored: 45,
        position_preference: 'forward',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        user_id: '2',
        nickname: 'Cristiano Ronaldo',
        photo_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=football+player+cartoon+avatar+with+sunglasses+confident+funny&image_size=square',
        overall_rating: 4.7,
        matches_played: 23,
        wins: 18,
        goals_scored: 42,
        position_preference: 'forward',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }
    ]
  }
}