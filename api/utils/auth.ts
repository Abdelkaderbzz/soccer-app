import {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
} from '../config/database';
import { AuthenticatedRequest } from '../types';
import { Response, NextFunction } from 'express';
import { ResponseUtils } from './response';

export const AuthUtils = {
  // Extract token from Authorization header
  extractToken(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  },

  // Verify JWT token and get user
  async verifyToken(token: string): Promise<any> {
    if (!isSupabaseConfigured) {
      // Mock user for development
      return {
        id: 'mock-user-id',
        email: 'mock@example.com',
        user_metadata: {
          username: 'mockuser',
        },
      };
    }

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error) {
        throw error;
      }

      return user;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  },

  // Get user by ID
  async getUserById(userId: string): Promise<any> {
    if (!isSupabaseConfigured) {
      return {
        id: userId,
        email: 'mock@example.com',
        username: 'mockuser',
        role: 'player',
      };
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error('User not found');
    }

    return user;
  },

  // Check if user has required role
  hasRole(user: any, requiredRole: string | string[]): boolean {
    if (!user || !user.role) return false;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  },

  // Check if user is admin
  isAdmin(user: any): boolean {
    return this.hasRole(user, 'admin');
  },

  // Check if user is club admin
  async isClubAdmin(userId: string, clubId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return true; // Mock for development
    }

    const { data: membership } = await supabase
      .from('club_members')
      .select('role')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .single();

    return membership?.role === 'admin';
  },

  // Check if user is match organizer
  async isMatchOrganizer(userId: string, matchId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return true; // Mock for development
    }

    const { data: match } = await supabase
      .from('matches')
      .select('organizer_id')
      .eq('id', matchId)
      .single();

    return match?.organizer_id === userId;
  },
};

// Middleware for authentication
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractToken(authHeader || '');

    if (!token) {
      ResponseUtils.unauthorized(res, 'No token provided');
      return;
    }

    const user = await AuthUtils.verifyToken(token);
    req.user = {
      id: user.id,
      email: user.email,
      userId: user.id,
    };

    next();
  } catch (error) {
    ResponseUtils.unauthorized(res, 'Invalid token');
    return;
  }
};

// Middleware for role-based authorization
export const authorize = (roles: string | string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        ResponseUtils.unauthorized(res, 'User not authenticated');
        return;
      }

      const user = await AuthUtils.getUserById(req.user.id);
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      if (!AuthUtils.hasRole(user, requiredRoles)) {
        ResponseUtils.forbidden(res, 'Insufficient permissions');
        return;
      }

      next();
    } catch (error) {
      ResponseUtils.serverError(res, 'Authorization check failed');
      return;
    }
  };
};