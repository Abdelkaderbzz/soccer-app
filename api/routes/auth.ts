/**
 * Complete authentication system with JWT tokens and user management
 */
import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/database'
import crypto from 'crypto'
import { ResponseUtils } from '../utils/response'
import { ValidationUtils } from '../utils/validation'

const router = Router()

// Mock data for development
let mockUsers = [
  {
    id: '1',
    email: 'test@example.com',
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..q', // password123
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-01-01T00:00:00Z'
  }
]

let mockPlayers = [
  {
    id: '1',
    user_id: '1',
    nickname: 'TestPlayer',
    photo_url: 'https://ui-avatars.com/api/?name=TestPlayer&background=random',
    overall_rating: 5.0,
    matches_played: 0,
    wins: 0,
    goals_scored: 0,
    position_preference: 'forward',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

let mockTokens = new Map() // Store valid tokens for mock authentication

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  nickname: z.string().min(2, 'Nickname must be at least 2 characters').max(50, 'Nickname too long'),
  position_preference: z.enum(['goalkeeper', 'defender', 'midfielder', 'forward']).optional().default('forward')
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

// JWT secret from environment or fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = registerSchema.safeParse(req.body)
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      })
      return
    }

    const { email, password, nickname, position_preference } = validation.data

    let userId: string
    let playerId: string
    let userEmail: string
    let playerData: any

    if (supabase) {
      // Use Supabase for production (direct database approach)
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        res.status(409).json({ error: 'User already exists with this email' })
        return
      }

      // Check if nickname is already taken
      const { data: existingPlayer } = await supabaseAdmin
        .from('players')
        .select('id')
        .eq('nickname', nickname)
        .single()

      if (existingPlayer) {
        res.status(409).json({ error: 'Nickname already taken' })
        return
      }

      // Hash password
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(password, saltRounds)

      // Generate a UUID for the new user
      const newUserId = crypto.randomUUID()

      // Create user record in our users table using service role (bypasses RLS)
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: newUserId,
          email,
          password_hash: passwordHash
        }])
        .select()
        .single()

      if (userError || !user) {
        console.error('User creation error:', userError)
        res.status(500).json({ error: 'Failed to create user profile' })
        return
      }

      // Create player profile using service role (bypasses RLS)
      const { data: player, error: playerError } = await supabaseAdmin
        .from('players')
        .insert([{
          user_id: newUserId,
          nickname,
          photo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=random`,
          overall_rating: 5.0, // Default rating for new players
          matches_played: 0,
          wins: 0,
          goals_scored: 0,
          position_preference: position_preference || 'forward'
        }])
        .select()
        .single()

      if (playerError || !player) {
        console.error('Player creation error:', playerError)
        // Rollback user creation if player creation fails
        await supabaseAdmin.from('users').delete().eq('id', newUserId)
        res.status(500).json({ error: 'Failed to create player profile' })
        return
      }

      userId = newUserId
      playerId = player.id
      userEmail = email
      playerData = player
    } else {
      // Use mock data for development
      // Check if user already exists
      const existingUser = mockUsers.find(u => u.email === email)
      if (existingUser) {
        res.status(409).json({ error: 'User already exists with this email' })
        return
      }

      // Check if nickname is already taken
      const existingPlayer = mockPlayers.find(p => p.nickname === nickname)
      if (existingPlayer) {
        res.status(409).json({ error: 'Nickname already taken' })
        return
      }

      // Hash password
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(password, saltRounds)

      // Create user
      const newUserId = String(mockUsers.length + 1)
      const user = {
        id: newUserId,
        email,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        last_login: null
      }
      mockUsers.push(user)

      // Create player profile
      const newPlayerId = String(mockPlayers.length + 1)
      const player = {
        id: newPlayerId,
        user_id: newUserId,
        nickname,
        photo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=random`,
        overall_rating: 5.0,
        matches_played: 0,
        wins: 0,
        goals_scored: 0,
        position_preference: position_preference || 'forward',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      mockPlayers.push(player)

      userId = user.id
      playerId = player.id
      userEmail = user.email
      playerData = player
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: userId, 
        email: userEmail,
        playerId: playerId 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // Store token in mock tokens map for development
    if (!supabase) {
      mockTokens.set(token, { userId, playerId, email: userEmail })
    }

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email: userEmail,
        player: {
          id: playerId,
          nickname: playerData.nickname,
          photo_url: playerData.photo_url,
          overall_rating: playerData.overall_rating
        }
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = loginSchema.safeParse(req.body)
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      })
      return
    }

    const { email, password } = validation.data

    let user: any
    let player: any

    if (supabase) {
      // Use Supabase for production (direct database approach)
      // Get user from our users table
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (!userData) {
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }

      // Verify password using bcrypt
      const isValidPassword = await bcrypt.compare(password, userData.password_hash)
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }
      
      user = userData

      // Get player profile
      const { data: playerData } = await supabaseAdmin
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single()

      player = playerData
    } else {
      // Use mock data for development
      user = mockUsers.find(u => u.email === email)
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }

      player = mockPlayers.find(p => p.user_id === user.id)
    }

    // Verify password (only for mock data - Supabase Auth handles this)
    if (!supabase) {
      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        playerId: player?.id 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // Store token in mock tokens map for development
    if (!supabase) {
      mockTokens.set(token, { userId: user.id, playerId: player?.id, email: user.email })
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        player: player ? {
          id: player.id,
          nickname: player.nickname,
          photo_url: player.photo_url,
          overall_rating: player.overall_rating
        } : null
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // We can optionally maintain a token blacklist here
    res.json({ message: 'Logout successful' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Get Current User
 * GET /api/auth/me
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' })
      return
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    let user: any
    let player: any

    if (supabase) {
      // Use Supabase for production
      // Get user and player data
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, created_at')
        .eq('id', decoded.userId)
        .single()

      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', decoded.userId)
        .single()

      user = userData
      player = playerData
    } else {
      // Use mock data for development
      // Verify token exists in our mock tokens
      if (!mockTokens.has(token)) {
        res.status(401).json({ error: 'Invalid token' })
        return
      }

      user = mockUsers.find(u => u.id === decoded.userId)
      player = mockPlayers.find(p => p.user_id === decoded.userId)
    }

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        player: player || null
      }
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router