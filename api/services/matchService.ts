import {
  supabase,
  isSupabaseConfigured,
} from '../config/database';
import { Match} from '../types';

export class MatchService {
  static async getAllMatches() {
    if (!isSupabaseConfigured) {
      return this.getMockMatches();
    }

    const { data, error } = await supabase
      .from('matches')
      .select(
        `
        *,
        organizer:users!matches_organizer_id_fkey(id, username, email),
        match_players(
          *,
          player:users!match_players_player_id_fkey(id, username, email, rating)
        ),
        match_results(*),
        team_a_club:clubs!matches_team_a_club_id_fkey(id, name, logo_url),
        team_b_club:clubs!matches_team_b_club_id_fkey(id, name, logo_url)
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getMatchById(matchId: string) {
    if (!isSupabaseConfigured) {
      return this.getMockMatches().find((m) => m.id === matchId);
    }

    const { data, error } = await supabase
      .from('matches')
      .select(
        `
        *,
        organizer:users!matches_organizer_id_fkey(id, username, email),
        match_players(
          *,
          player:users!match_players_player_id_fkey(id, username, email, rating)
        ),
        match_results(*),
        team_a_club:clubs!matches_team_a_club_id_fkey(id, name, logo_url),
        team_b_club:clubs!matches_team_b_club_id_fkey(id, name, logo_url)
      `
      )
      .eq('id', matchId)
      .single();

    if (error) throw error;
    return data;
  }

  static async createMatch(userId: string, matchData: Partial<Match>) {
    if (!isSupabaseConfigured) {
      return {
        id: 'mock-match-' + Date.now(),
        ...matchData,
        organizer_id: userId,
        status: 'upcoming',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const { data: match, error } = await supabase
      .from('matches')
      .insert([
        {
          ...matchData,
          organizer_id: userId,
          status: 'upcoming',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // If it's a club vs club match, automatically invite club members
    if (match.team_a_club_id && match.team_b_club_id) {
      await this.inviteClubMembersToMatch(
        match.id,
        match.team_a_club_id,
        match.team_b_club_id
      );
    }

    return match;
  }

  static async joinMatch(
    matchId: string,
    playerId: string,
    team?: string,
    userId?: string
  ) {
    if (!isSupabaseConfigured) {
      return {
        id: 'mock-match-player-' + Date.now(),
        match_id: matchId,
        player_id: playerId,
      };
    }

    // Get match details
    const { data: match } = await supabase
      .from('matches')
      .select('status, max_players')
      .eq('id', matchId)
      .single();

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status === 'completed') {
      throw new Error('Match has already been completed');
    }

    // Check if match is full
    const { data: currentPlayers } = await supabase
      .from('match_players')
      .select('id')
      .eq('match_id', matchId);

    if (currentPlayers && currentPlayers.length >= match.max_players) {
      throw new Error('Match is full');
    }

    // Check if player is already in the match
    const { data: existingPlayer } = await supabase
      .from('match_players')
      .select('id')
      .eq('match_id', matchId)
      .eq('player_id', playerId)
      .single();

    if (existingPlayer) {
      throw new Error('Player is already in this match');
    }

    // Verify the player belongs to the authenticated user if userId is provided
    if (userId) {
      const { data: playerData } = await supabase
        .from('players')
        .select('id')
        .eq('id', playerId)
        .eq('user_id', userId)
        .single();

      if (!playerData) {
        throw new Error('Player does not belong to user');
      }
    }

    const { data, error } = await supabase
      .from('match_players')
      .insert([
        {
          match_id: matchId,
          player_id: playerId,
          team: team || null,
          goals_scored: 0,
          rating: 5.0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async submitMatchResult(
    userId: string,
    resultData: {
      match_id: string;
      team_a_score: number;
      team_b_score: number;
      duration_minutes: number;
      goal_scorers?: Record<string, number>;
    }
  ) {
    if (!isSupabaseConfigured) {
      return { id: 'mock-result-' + Date.now(), ...resultData };
    }

    // Check if user is organizer or admin
    const { data: match } = await supabase
      .from('matches')
      .select('organizer_id')
      .eq('id', resultData.match_id)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (match?.organizer_id !== userId && user?.role !== 'admin') {
      throw new Error('Only match organizer or admin can submit results');
    }

    const { data: result, error } = await supabase
      .from('match_results')
      .insert([resultData])
      .select()
      .single();

    if (error) throw error;

    // Update match status to completed
    await supabase
      .from('matches')
      .update({ status: 'completed' })
      .eq('id', resultData.match_id);

    // Update player statistics
    await this.updatePlayerStatistics(resultData);

    return result;
  }

  static async balanceTeams(matchId: string, userId?: string) {
    if (!isSupabaseConfigured) {
      return { teamA: [], teamB: [] };
    }

    // Check if user has permission (organizer or admin)
    if (userId) {
      const [match, user] = await Promise.all([
        supabase
          .from('matches')
          .select('organizer_id')
          .eq('id', matchId)
          .single(),
        supabase.from('users').select('role').eq('id', userId).single(),
      ]);

      if (match.data?.organizer_id !== userId && user.data?.role !== 'admin') {
        throw new Error('Only match organizer or admin can balance teams');
      }
    }

    // Get all players in the match
    const { data: players } = await supabase
      .from('match_players')
      .select(
        `
        *,
        player:users!match_players_player_id_fkey(id, username, email, rating)
      `
      )
      .eq('match_id', matchId);

    if (!players || players.length === 0) {
      throw new Error('No players found for this match');
    }

    // Sort players by rating (descending)
    const sortedPlayers = players.sort(
      (a, b) => (b.player?.rating || 0) - (a.player?.rating || 0)
    );

    // Balance teams using snake draft
    const teamA: any[] = [];
    const teamB: any[] = [];

    sortedPlayers.forEach((player, index) => {
      if (index % 2 === 0) {
        teamA.push(player);
      } else {
        teamB.push(player);
      }
    });

    // Update team assignments in database
    const updates = [
      ...teamA.map((player) =>
        supabase.from('match_players').update({ team: 'A' }).eq('id', player.id)
      ),
      ...teamB.map((player) =>
        supabase.from('match_players').update({ team: 'B' }).eq('id', player.id)
      ),
    ];

    await Promise.all(updates);

    return { teamA, teamB };
  }

  private static async inviteClubMembersToMatch(
    matchId: string,
    teamAClubId: string,
    teamBClubId: string
  ) {
    // Get members from both clubs
    const [teamAMembers, teamBMembers] = await Promise.all([
      supabase
        .from('club_players')
        .select('player_id')
        .eq('club_id', teamAClubId),
      supabase
        .from('club_players')
        .select('player_id')
        .eq('club_id', teamBClubId),
    ]);

    // Invite all members to the match
    const allMembers = [
      ...(teamAMembers.data || []).map((m) => ({
        player_id: m.player_id,
        team: 'A',
      })),
      ...(teamBMembers.data || []).map((m) => ({
        player_id: m.player_id,
        team: 'B',
      })),
    ];

    if (allMembers.length > 0) {
      await supabase.from('match_players').insert(
        allMembers.map((member) => ({
          match_id: matchId,
          player_id: member.player_id,
          team: member.team,
          goals_scored: 0,
          rating: 5.0,
        }))
      );
    }
  }

  private static async updatePlayerStatistics(resultData: any) {
    try {
      // Update match players with goals scored
      if (
        resultData.goal_scorers &&
        Object.keys(resultData.goal_scorers).length > 0
      ) {
        for (const [playerId, goals] of Object.entries(
          resultData.goal_scorers
        )) {
          const goalsCount = goals as number;
          if (goalsCount > 0) {
            await supabase
              .from('players')
              .update({ goals_scored: goalsCount })
              .eq('user_id', playerId);
          }
        }
      }

      // Update match participants' statistics
      const { data: matchPlayers } = await supabase
        .from('match_players')
        .select('player_id, team')
        .eq('match_id', resultData.match_id);

      if (matchPlayers) {
        for (const player of matchPlayers) {
          await supabase.rpc('update_player_stats', {
            player_uuid: player.player_id,
            match_result:
              resultData.team_a_score > resultData.team_b_score
                ? 'win'
                : resultData.team_a_score < resultData.team_b_score
                ? 'loss'
                : 'draw',
            goals_scored: resultData.goal_scorers?.[player.player_id] || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error updating player statistics:', error);
      // Don't fail the entire operation if stats update fails
    }
  }

  private static getMockMatches(): any[] {
    return [
      {
        id: '1',
        title: 'Weekend Championship',
        description: 'Epic weekend match',
        location: 'Central Park',
        match_date: '2024-01-15T15:00:00Z',
        format: '5v5',
        max_players: 10,
        status: 'upcoming',
        organizer_id: '1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];
  }
}
