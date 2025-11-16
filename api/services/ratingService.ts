import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/database'
import { PlayerRating, User } from '../types'

export class RatingService {
  static async createRating(raterId: string, ratingData: {
    rated_player_id: string;
    match_id: string;
    rating: number;
    category: string;
    comment?: string;
  }) {
    if (!isSupabaseConfigured) {
      return {
        id: 'mock-rating-' + Date.now(),
        ...ratingData,
        rater_id: raterId,
        created_at: new Date().toISOString()
      }
    }

    // Validate rating
    if (ratingData.rating < 1 || ratingData.rating > 10) {
      throw new Error('Rating must be between 1 and 10')
    }

    // Check if rater is trying to rate themselves
    if (raterId === ratingData.rated_player_id) {
      throw new Error('You cannot rate yourself')
    }

    // Check if match exists and is completed
    const { data: match } = await supabase
      .from('matches')
      .select('status')
      .eq('id', ratingData.match_id)
      .single()

    if (!match) {
      throw new Error('Match not found')
    }

    if (match.status !== 'completed') {
      throw new Error('Can only rate players after match is completed')
    }

    // Check if both players were in the match
    const [{ data: raterInMatch }, { data: ratedInMatch }] = await Promise.all([
      supabase
        .from('match_players')
        .select('id')
        .eq('match_id', ratingData.match_id)
        .eq('player_id', raterId)
        .single(),
      supabase
        .from('match_players')
        .select('id')
        .eq('match_id', ratingData.match_id)
        .eq('player_id', ratingData.rated_player_id)
        .single()
    ])

    if (!raterInMatch || !ratedInMatch) {
      throw new Error('Both players must have participated in the match to rate each other')
    }

    // Check if rating already exists
    const { data: existingRating } = await supabase
      .from('player_ratings')
      .select('id')
      .eq('rater_id', raterId)
      .eq('rated_player_id', ratingData.rated_player_id)
      .eq('match_id', ratingData.match_id)
      .single()

    if (existingRating) {
      throw new Error('You have already rated this player for this match')
    }

    // Create rating
    const { data: playerRating, error } = await supabase
      .from('player_ratings')
      .insert([{
        rater_id: raterId,
        ...ratingData,
        comment: ratingData.comment || null,
      }])
      .select(`
        *,
        rater:users!player_ratings_rater_id_fkey(id, username, email),
        rated_player:users!player_ratings_rated_player_id_fkey(id, username, email),
        match:matches!player_ratings_match_id_fkey(id, title, match_date)
      `)
      .single()

    if (error) throw error

    // Update player's overall rating
    await this.updatePlayerRating(ratingData.rated_player_id)

    return playerRating
  }

  static async getPlayerRatings(playerId: string) {
    if (!isSupabaseConfigured) {
      return []
    }

    const { data, error } = await supabase
      .from('player_ratings')
      .select(`
        *,
        rater:users!player_ratings_rater_id_fkey(id, username, email),
        match:matches!player_ratings_match_id_fkey(id, title, match_date)
      `)
      .eq('rated_player_id', playerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async getMatchRatings(matchId: string) {
    if (!isSupabaseConfigured) {
      return []
    }

    const { data, error } = await supabase
      .from('player_ratings')
      .select(`
        *,
        rater:users!player_ratings_rater_id_fkey(id, username, email),
        rated_player:users!player_ratings_rated_player_id_fkey(id, username, email)
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  private static async updatePlayerRating(playerId: string) {
    // Get all ratings for the player
    const { data: ratings } = await supabase
      .from('player_ratings')
      .select('rating')
      .eq('rated_player_id', playerId)

    if (!ratings || ratings.length === 0) return

    // Calculate average rating
    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length

    // Update user's rating
    await supabase
      .from('users')
      .update({ rating: averageRating })
      .eq('id', playerId)
  }
}