import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AuthenticatedRequest } from '../types'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export default function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Access token required' })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.user = decoded
    next()
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' })
  }
}
