const express = require('express');
const { supabase } = require('../supabase');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Get all clubs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: clubs, error } = await supabase
      .from('clubs')
      .select(`
        *,
        created_by_user:users!clubs_created_by_fkey(id, username, email),
        club_players!inner(
          player:users!club_players_player_id_fkey(id, username, email, rating)
        )
      `);

    if (error) {
      console.error('Error fetching clubs:', error);
      return res.status(500).json({ error: 'Failed to fetch clubs' });
    }

    res.json(clubs);
  } catch (error) {
    console.error('Error in GET /clubs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single club by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data: club, error } = await supabase
      .from('clubs')
      .select(`
        *,
        created_by_user:users!clubs_created_by_fkey(id, username, email),
        club_players!inner(
          player:users!club_players_player_id_fkey(id, username, email, rating, avatar_url)
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      console.error('Error fetching club:', error);
      return res.status(500).json({ error: 'Failed to fetch club' });
    }

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    res.json(club);
  } catch (error) {
    console.error('Error in GET /clubs/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new club (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create clubs' });
    }

    const { name, description, logo_url } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Club name is required' });
    }

    const { data: club, error } = await supabase
      .from('clubs')
      .insert([{
        name,
        description,
        logo_url,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating club:', error);
      return res.status(500).json({ error: 'Failed to create club' });
    }

    // Automatically add creator as club member
    const { error: memberError } = await supabase
      .from('club_players')
      .insert([{
        club_id: club.id,
        player_id: req.user.id,
        role: 'manager'
      }]);

    if (memberError) {
      console.error('Error adding creator as club member:', memberError);
      // Don't fail the entire operation, just log the error
    }

    res.status(201).json(club);
  } catch (error) {
    console.error('Error in POST /clubs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite player to club
router.post('/:id/invite', authenticateToken, async (req, res) => {
  try {
    const clubId = req.params.id;
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Check if user is club manager or admin
    const { data: membership, error: membershipError } = await supabase
      .from('club_players')
      .select('role')
      .eq('club_id', clubId)
      .eq('player_id', req.user.id)
      .single();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (membershipError && userError) {
      return res.status(403).json({ error: 'Not authorized to invite players' });
    }

    const isManager = membership && (membership.role === 'manager' || membership.role === 'captain');
    const isAdmin = user && user.role === 'admin';

    if (!isManager && !isAdmin) {
      return res.status(403).json({ error: 'Only club managers and admins can invite players' });
    }

    // Check if player is already in club
    const { data: existingMember } = await supabase
      .from('club_players')
      .select('id')
      .eq('club_id', clubId)
      .eq('player_id', playerId)
      .single();

    if (existingMember) {
      return res.status(400).json({ error: 'Player is already a member of this club' });
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('club_invitations')
      .select('id')
      .eq('club_id', clubId)
      .eq('player_id', playerId)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return res.status(400).json({ error: 'Invitation already sent to this player' });
    }

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('club_invitations')
      .insert([{
        club_id: clubId,
        player_id: playerId,
        invited_by: req.user.id,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return res.status(500).json({ error: 'Failed to send invitation' });
    }

    res.status(201).json(invitation);
  } catch (error) {
    console.error('Error in POST /clubs/:id/invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept club invitation
router.post('/invitations/:invitationId/accept', authenticateToken, async (req, res) => {
  try {
    const invitationId = req.params.invitationId;

    // Get invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('club_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('player_id', req.user.id)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Accept invitation
    const { error: updateError } = await supabase
      .from('club_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error accepting invitation:', updateError);
      return res.status(500).json({ error: 'Failed to accept invitation' });
    }

    // Add player to club
    const { error: memberError } = await supabase
      .from('club_players')
      .insert([{
        club_id: invitation.club_id,
        player_id: req.user.id,
        role: 'player'
      }]);

    if (memberError) {
      console.error('Error adding player to club:', memberError);
      return res.status(500).json({ error: 'Failed to add player to club' });
    }

    res.json({ message: 'Invitation accepted successfully' });
  } catch (error) {
    console.error('Error in POST /clubs/invitations/:invitationId/accept:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject club invitation
router.post('/invitations/:invitationId/reject', authenticateToken, async (req, res) => {
  try {
    const invitationId = req.params.invitationId;

    // Get invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('club_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('player_id', req.user.id)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Reject invitation
    const { error: updateError } = await supabase
      .from('club_invitations')
      .update({ status: 'rejected' })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error rejecting invitation:', updateError);
      return res.status(500).json({ error: 'Failed to reject invitation' });
    }

    res.json({ message: 'Invitation rejected successfully' });
  } catch (error) {
    console.error('Error in POST /clubs/invitations/:invitationId/reject:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get player's club invitations
router.get('/invitations/my', authenticateToken, async (req, res) => {
  try {
    const { data: invitations, error } = await supabase
      .from('club_invitations')
      .select(`
        *,
        club:clubs!club_invitations_club_id_fkey(*),
        invited_by_user:users!club_invitations_invited_by_fkey(id, username)
      `)
      .eq('player_id', req.user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching invitations:', error);
      return res.status(500).json({ error: 'Failed to fetch invitations' });
    }

    res.json(invitations);
  } catch (error) {
    console.error('Error in GET /clubs/invitations/my:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;