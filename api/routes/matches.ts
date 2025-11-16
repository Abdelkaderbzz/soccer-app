import express, { Request, Response } from 'express';
import { MatchService } from '../services/matchService';
import { ResponseUtils } from '../utils/response';
import { ValidationUtils } from '../utils/validation';
import { authenticate, authorize } from '../utils/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Get all matches
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const matches = await MatchService.getAllMatches()
    ResponseUtils.success(res, matches)
  } catch (error) {
    console.error('Error in GET /matches:', error)
    ResponseUtils.serverError(res, 'Failed to fetch matches')
  }
})

// Create a new match
router.post('/', authenticate, authorize(['admin', 'organizer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      location,
      match_date,
      format,
      max_players,
      team_a_club_id,
      team_b_club_id,
    } = req.body

    // Validate input data
    const validationErrors = ValidationUtils.validateMatchData({
      title,
      description,
      location,
      match_date,
      format,
      max_players
    })

    if (validationErrors.length > 0) {
      return ResponseUtils.validationError(res, validationErrors)
    }

    const matchData = {
      title,
      description,
      location,
      match_date,
      format,
      max_players,
      team_a_club_id,
      team_b_club_id,
      organizer_id: req.user!.id,
      status: 'upcoming' as const,
    }

    const match = await MatchService.createMatch(req.user!.id, matchData)
    
    ResponseUtils.success(res, match, 'Match created successfully', 201)
  } catch (error: unknown) {
    console.error('Error in POST /matches:', error)
    if (error instanceof Error && error.message.includes('permission')) {
      ResponseUtils.forbidden(res, error.message)
    } else if (error instanceof Error && error.message.includes('club')) {
      ResponseUtils.notFound(res, error.message)
    } else {
      ResponseUtils.serverError(res, 'Failed to create match')
    }
  }
})

// Get match details
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Validate UUID
    if (!ValidationUtils.isValidUUID(id)) {
      return ResponseUtils.error(res, 'Invalid match ID format')
    }

    const match = await MatchService.getMatchById(id)
    
    if (!match) {
      return ResponseUtils.notFound(res, 'Match')
    }

    ResponseUtils.success(res, match)
  } catch (error) {
    console.error('Error in GET /matches/:id:', error)
    ResponseUtils.serverError(res, 'Failed to fetch match')
  }
})

// Join a match
router.post('/:id/join', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { player_id, team } = req.body

    // Validate UUID
    if (!ValidationUtils.isValidUUID(id)) {
      return ResponseUtils.error(res, 'Invalid match ID format')
    }

    if (!ValidationUtils.isValidUUID(player_id)) {
      return ResponseUtils.error(res, 'Invalid player ID format')
    }

    await MatchService.joinMatch(id, player_id, team, req.user!.id)
    
    ResponseUtils.success(res, null, 'Successfully joined match')
  } catch (error: any) {
    console.error('Error in POST /matches/:id/join:', error)
    
    if (error.message.includes('not found')) {
      ResponseUtils.notFound(res, 'Match or player')
    } else if (error.message.includes('full')) {
      ResponseUtils.error(res, 'Match is full', 400)
    } else if (error.message.includes('already')) {
      ResponseUtils.error(res, 'Player is already in this match', 400)
    } else if (error.message.includes('completed')) {
      ResponseUtils.error(res, 'Match has already been completed', 400)
    } else {
      ResponseUtils.serverError(res, 'Failed to join match')
    }
  }
})

// Balance teams for a match
router.post('/:id/balance-teams', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    // Validate UUID
    if (!ValidationUtils.isValidUUID(id)) {
      return ResponseUtils.error(res, 'Invalid match ID format')
    }

    const result = await MatchService.balanceTeams(id, req.user!.id)
    
    ResponseUtils.success(res, result, 'Teams balanced successfully')
  } catch (error: any) {
    console.error('Error in POST /matches/:id/balance-teams:', error)
    
    if (error.message.includes('not found')) {
      ResponseUtils.notFound(res, 'Match')
    } else if (error.message.includes('players')) {
      ResponseUtils.error(res, 'No players in this match', 400)
    } else if (error.message.includes('permission')) {
      ResponseUtils.forbidden(res, error.message)
    } else {
      ResponseUtils.serverError(res, 'Failed to balance teams')
    }
  }
})

// Submit match result
router.post('/results', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      match_id,
      team_a_score,
      team_b_score,
      duration_minutes,
      goal_scorers,
    } = req.body

    // Validate input
    if (!match_id || team_a_score === undefined || team_b_score === undefined) {
      return ResponseUtils.error(res, 'Missing required fields')
    }

    if (team_a_score < 0 || team_b_score < 0) {
      return ResponseUtils.error(res, 'Scores cannot be negative')
    }

    const resultData = {
      match_id,
      team_a_score,
      team_b_score,
      duration_minutes,
      goal_scorers: goal_scorers || {},
    }

    const result = await MatchService.submitMatchResult(req.user!.id, resultData)
    
    ResponseUtils.success(res, result, 'Match result submitted successfully', 201)
  } catch (error: any) {
    console.error('Error in POST /matches/results:', error)
    
    if (error.message.includes('not found')) {
      ResponseUtils.notFound(res, 'Match')
    } else if (error.message.includes('permission')) {
      ResponseUtils.forbidden(res, error.message)
    } else if (error.message.includes('already')) {
      ResponseUtils.error(res, 'Match result already submitted', 400)
    } else {
      ResponseUtils.serverError(res, 'Failed to submit match result')
    }
  }
})

export default router;