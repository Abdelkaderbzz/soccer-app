import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/database'
import { Club, User } from '../types'

export class ClubService {
  static async getAllClubs() {
    if (!isSupabaseConfigured) {
      return this.getMockClubs()
    }

    const { data, error } = await supabase
      .from('clubs')
      .select(`
        *,
        created_by_user:users!clubs_created_by_fkey(id, username, email),
        club_players(
          player:users!club_players_player_id_fkey(id, username, email, rating)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async getUserClubs(userId: string) {
    if (!isSupabaseConfigured) {
      return this.getMockClubs().filter(c => c.created_by === userId)
    }

    const { data, error } = await supabase
      .from('club_players')
      .select(`
        club:clubs!club_players_club_id_fkey(
          *,
          created_by_user:users!clubs_created_by_fkey(id, username, email),
          club_players(
            player:users!club_players_player_id_fkey(id, username, email, rating)
          )
        )
      `)
      .eq('player_id', userId)

    if (error) throw error
    return data?.map(cp => cp.club) || []
  }

  static async createClub(userId: string, clubData: Partial<Club>) {
    if (!isSupabaseConfigured) {
      return {
        id: 'mock-club-' + Date.now(),
        ...clubData,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (user?.role !== 'admin') {
      throw new Error('Only admins can create clubs')
    }

    const { data: club, error } = await supabase
      .from('clubs')
      .insert([{
        ...clubData,
        created_by: userId,
      }])
      .select()
      .single()

    if (error) throw error

    // Add creator as first club member
    await supabase.from('club_players').insert([{
      club_id: club.id,
      player_id: userId,
      role: 'manager',
    }])

    return club
  }

  static async getClubById(clubId: string) {
    if (!isSupabaseConfigured) {
      return this.getMockClubs().find(c => c.id === clubId)
    }

    const { data, error } = await supabase
      .from('clubs')
      .select(`
        *,
        created_by_user:users!clubs_created_by_fkey(id, username, email),
        club_players(
          player:users!club_players_player_id_fkey(id, username, email, rating),
          role,
          joined_at
        )
      `)
      .eq('id', clubId)
      .single()

    if (error) throw error
    return data
  }

  static async invitePlayer(clubId: string, invitedByUserId: string, playerId: string) {
    if (!isSupabaseConfigured) {
      return { id: 'mock-invite-' + Date.now(), status: 'pending' }
    }

    // Check if user is club manager or admin
    const { data: clubPlayer } = await supabase
      .from('club_players')
      .select('role')
      .eq('club_id', clubId)
      .eq('player_id', invitedByUserId)
      .single()

    if (!clubPlayer || (clubPlayer.role !== 'manager' && clubPlayer.role !== 'admin')) {
      throw new Error('Only club managers can invite players')
    }

    // Check if player is already a member
    const { data: existingMember } = await supabase
      .from('club_players')
      .select('id')
      .eq('club_id', clubId)
      .eq('player_id', playerId)
      .single()

    if (existingMember) {
      throw new Error('Player is already a member of this club')
    }

    const { data: invitation, error } = await supabase
      .from('club_invitations')
      .insert([{
        club_id: clubId,
        player_id: playerId,
        invited_by: invitedByUserId,
        status: 'pending',
      }])
      .select()
      .single()

    if (error) throw error
    return invitation
  }

  static async joinClub(clubId: string, playerId: string) {
    if (!isSupabaseConfigured) {
      return { id: 'mock-member-' + Date.now(), club_id: clubId, player_id: playerId }
    }

    // Check if there's a pending invitation
    const { data: invitation } = await supabase
      .from('club_invitations')
      .select('id, status')
      .eq('club_id', clubId)
      .eq('player_id', playerId)
      .eq('status', 'pending')
      .single()

    if (!invitation) {
      throw new Error('No pending invitation found')
    }

    // Add player to club
    const { data: clubPlayer, error } = await supabase
      .from('club_players')
      .insert([{
        club_id: clubId,
        player_id: playerId,
        role: 'member',
      }])
      .select()
      .single()

    if (error) throw error

    // Update invitation status
    await supabase
      .from('club_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    return clubPlayer
  }

  static async getClubMembers(clubId: string) {
    if (!isSupabaseConfigured) {
      return []
    }

    const { data, error } = await supabase
      .from('club_players')
      .select(`
        player:users!club_players_player_id_fkey(id, username, email, rating, photo_url),
        role,
        joined_at
      `)
      .eq('club_id', clubId)
      .order('joined_at', { ascending: true })

    if (error) throw error
    return data
  }

  private static getMockClubs(): any[] {
    return [
      {
        id: 'mock-club-1',
        name: 'FC Barcelona',
        description: 'Elite football club',
        logo_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=fc+barcelona+logo+crest+blue+red&image_size=square',
        created_by: '1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]
  }
}