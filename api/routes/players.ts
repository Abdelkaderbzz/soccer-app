/**
 * Players management routes
 */
import { Router, type Request, type Response } from 'express';
import { PlayerService } from '../services/playerService';
import { ResponseUtils } from '../utils/response';
import { ValidationUtils } from '../utils/validation';
import { authenticate } from '../utils/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * Get all players
 * GET /api/players
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const players = await PlayerService.getAllPlayers()
    ResponseUtils.success(res, players)
  } catch (error) {
    console.error('Error in GET /players:', error)
    ResponseUtils.serverError(res, 'Failed to fetch players')
  }
})

/**
 * Get player by ID
 * GET /api/players/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Validate UUID
    if (!ValidationUtils.isValidUUID(id)) {
      ResponseUtils.error(res, 'Invalid player ID format')
      return
    }

    const player = await PlayerService.getPlayerById(id)
    
    if (!player) {
      ResponseUtils.notFound(res, 'Player')
      return
    }

    ResponseUtils.success(res, player)
  } catch (error) {
    console.error('Error in GET /players/:id:', error)
    ResponseUtils.serverError(res, 'Failed to fetch player')
  }
})

/**
 * Find player by email
 * GET /api/players/email/:email
 */
router.get('/email/:email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params

    // Validate email format
    if (!ValidationUtils.isValidEmail(email)) {
      ResponseUtils.error(res, 'Invalid email format')
      return
    }

    const player = await PlayerService.getPlayerByEmail(email)
    
    if (!player) {
      ResponseUtils.notFound(res, 'Player with this email')
      return
    }

    ResponseUtils.success(res, player)
  } catch (error) {
    console.error('Error in GET /players/email/:email:', error)
    ResponseUtils.serverError(res, 'Failed to fetch player by email')
  }
})

/**
 * Update player profile
 * PUT /api/players/:id
 */
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { nickname, position_preference, photo_url } = req.body

    // Validate UUID
    if (!ValidationUtils.isValidUUID(id)) {
      ResponseUtils.error(res, 'Invalid player ID format')
      return
    }

    // Validate input data
    const validationErrors = ValidationUtils.validatePlayerData({
      nickname,
      position: position_preference
    })

    if (validationErrors.length > 0) {
      ResponseUtils.validationError(res, validationErrors)
      return
    }

    // Check if user owns this player profile
    const player = await PlayerService.getPlayerById(id)
    if (!player) {
      ResponseUtils.notFound(res, 'Player')
      return
    }

    if (player.user_id !== req.user?.id) {
      ResponseUtils.forbidden(res, 'You can only update your own player profile')
      return
    }

    // Update player
    const updatedPlayer = await PlayerService.updatePlayer(id, {
      nickname,
      position_preference,
      photo_url
    })

    ResponseUtils.success(res, updatedPlayer, 'Player profile updated successfully')
  } catch (error) {
    console.error('Error in PUT /players/:id:', error)
    ResponseUtils.serverError(res, 'Failed to update player')
  }
})

export default router;
