import express, { Request, Response } from 'express';
import { ClubService } from '../services/clubService';
import { ResponseUtils } from '../utils/response';
import { ValidationUtils } from '../utils/validation';
import { authenticate } from '../utils/auth';
import { AuthenticatedRequest } from '../types';
import { supabase } from '../config/database';

const router = express.Router();

// Get all clubs
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clubs = await ClubService.getAllClubs()
    ResponseUtils.success(res, clubs)
  } catch (error) {
    console.error('Error in GET /clubs:', error)
    ResponseUtils.serverError(res, 'Failed to fetch clubs')
  }
})

// Get user's clubs
router.get('/my-clubs', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clubs = await ClubService.getUserClubs(req.user!.id)
    ResponseUtils.success(res, clubs)
  } catch (error) {
    console.error('Error in GET /clubs/my-clubs:', error)
    ResponseUtils.serverError(res, 'Failed to fetch user clubs')
  }
})

// Create a new club (admin only)
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, logo_url } = req.body

    // Validate input data
    const validationErrors = ValidationUtils.validateClubData({
      name,
      description,
      logo_url
    })

    if (validationErrors.length > 0) {
      return ResponseUtils.validationError(res, validationErrors)
    }

    const clubData = {
      name,
      description,
      logo_url
    }

    const club = await ClubService.createClub(req.user!.id, clubData)
    
    ResponseUtils.success(res, club, 'Club created successfully', 201)
  } catch (error: any) {
    console.error('Error in POST /clubs:', error)
    
    if (error.message.includes('permission')) {
      ResponseUtils.forbidden(res, error.message)
    } else if (error.message.includes('exists')) {
      ResponseUtils.error(res, 'Club with this name already exists', 409)
    } else {
      ResponseUtils.serverError(res, 'Failed to create club')
    }
  }
})

// Get club details
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    // Validate UUID
    if (!ValidationUtils.isValidUUID(id)) {
      return ResponseUtils.error(res, 'Invalid club ID format')
    }

    const club = await ClubService.getClubById(id)
    
    if (!club) {
      return ResponseUtils.notFound(res, 'Club')
    }

    ResponseUtils.success(res, club)
  } catch (error) {
    console.error('Error in GET /clubs/:id:', error)
    ResponseUtils.serverError(res, 'Failed to fetch club')
  }
})

// Invite player to club (club manager/admin only)
router.post(
  '/:id/invite',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: clubId } = req.params;
      const { playerId } = req.body;
      const userId = req.user.id;

      // Check if user is club manager or admin
      const { data: clubPlayer, error: clubPlayerError } = await supabase
        .from('club_players')
        .select('role')
        .eq('club_id', clubId)
        .eq('player_id', userId)
        .single();

      if (clubPlayerError || !clubPlayer) {
        return res.status(403).json({ error: 'You are not a member of this club' });
      }

      if (clubPlayer.role !== 'manager' && clubPlayer.role !== 'admin') {
        return res.status(403).json({ error: 'Only club managers can invite players' });
      }

      // Check if player is already a member
      const { data: existingMember } = await supabase
        .from('club_players')
        .select('id')
        .eq('club_id', clubId)
        .eq('player_id', playerId)
        .single();

      if (existingMember) {
        return res.status(400).json({ error: 'Player is already a member of this club' });
      }

      // Create invitation
      const { data: invitation, error } = await supabase
        .from('club_invitations')
        .insert([
          {
            club_id: clubId,
            player_id: playerId,
            invited_by: userId,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating invitation:', error);
        return res.status(500).json({ error: 'Failed to create invitation' });
      }

      res.status(201).json(invitation);
    } catch (error) {
      console.error('Error in POST /clubs/:id/invite:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Join club (accept invitation)
router.post(
  '/:id/join',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: clubId } = req.params;
      const userId = req.user.id;

      // Check if there's a pending invitation
      const { data: invitation, error: invitationError } = await supabase
        .from('club_invitations')
        .select('id, status')
        .eq('club_id', clubId)
        .eq('player_id', userId)
        .eq('status', 'pending')
        .single();

      if (invitationError || !invitation) {
        return res.status(404).json({ error: 'No pending invitation found' });
      }

      // Add player to club
      const { data: clubPlayer, error: joinError } = await supabase
        .from('club_players')
        .insert([
          {
            club_id: clubId,
            player_id: userId,
            role: 'member',
          },
        ])
        .select()
        .single();

      if (joinError) {
        console.error('Error joining club:', joinError);
        return res.status(500).json({ error: 'Failed to join club' });
      }

      // Update invitation status
      await supabase
        .from('club_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      res.status(201).json(clubPlayer);
    } catch (error) {
      console.error('Error in POST /clubs/:id/join:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get club members
router.get(
  '/:id/members',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: clubId } = req.params;

      const { data: members, error } = await supabase
        .from('club_players')
        .select(
          `
          player:users!club_players_player_id_fkey(id, username, email, rating, photo_url),
          role,
          joined_at
        `
        )
        .eq('club_id', clubId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching club members:', error);
        return res.status(500).json({ error: 'Failed to fetch club members' });
      }

      res.json(members);
    } catch (error) {
      console.error('Error in GET /clubs/:id/members:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
