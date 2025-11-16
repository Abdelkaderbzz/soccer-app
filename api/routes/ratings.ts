import express, { Request, Response } from 'express';
import { RatingService } from '../services/ratingService';
import { ResponseUtils } from '../utils/response';
import { ValidationUtils } from '../utils/validation';
import { authenticate } from '../utils/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Submit a player rating
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rated_player_id, match_id, rating, category, comment } = req.body

    // Validate rating
    if (!ValidationUtils.isValidRating(rating)) {
      return ResponseUtils.error(res, 'Rating must be between 1 and 10')
    }

    const ratingData = {
      rated_player_id,
      match_id,
      rating,
      category: category || 'overall',
      comment: comment || undefined
    }

    const playerRating = await RatingService.createRating(req.user!.id, ratingData)
    
    ResponseUtils.success(res, playerRating, 'Rating submitted successfully', 201)
  } catch (error: any) {
    console.error('Error in POST /ratings:', error)
    
    if (error.message.includes('yourself')) {
      ResponseUtils.error(res, 'You cannot rate yourself', 400)
    } else if (error.message.includes('Match not found')) {
      ResponseUtils.notFound(res, 'Match')
    } else if (error.message.includes('completed')) {
      ResponseUtils.error(res, 'Can only rate players after match is completed', 400)
    } else if (error.message.includes('participated')) {
      ResponseUtils.error(res, 'Both players must have participated in the match to rate each other', 400)
    } else if (error.message.includes('already')) {
      ResponseUtils.error(res, 'You have already rated this player for this match', 400)
    } else {
      ResponseUtils.serverError(res, 'Failed to submit rating')
    }
  }
})

// Get ratings for a specific player
router.get('/player/:playerId', authenticate, async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params

    // Validate UUID
    if (!ValidationUtils.isValidUUID(playerId)) {
      return ResponseUtils.error(res, 'Invalid player ID format')
    }

    const ratings = await RatingService.getPlayerRatings(playerId)
    
    ResponseUtils.success(res, ratings)
  } catch (error) {
    console.error('Error in GET /ratings/player/:playerId:', error)
    ResponseUtils.serverError(res, 'Failed to fetch ratings')
  }
})

// Get ratings for a specific match
router.get('/match/:matchId', authenticate, async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params

    // Validate UUID
    if (!ValidationUtils.isValidUUID(matchId)) {
      return ResponseUtils.error(res, 'Invalid match ID format')
    }

    const ratings = await RatingService.getMatchRatings(matchId)
    
    ResponseUtils.success(res, ratings)
  } catch (error) {
    console.error('Error in GET /ratings/match/:matchId:', error)
    ResponseUtils.serverError(res, 'Failed to fetch match ratings')
  }
})

export default router;