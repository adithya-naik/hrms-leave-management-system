import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    role: UserRole;
    email: string;
    firstName: string;
    lastName: string;
    department: string;
    isActive: boolean;
  };
}

// Main authentication middleware
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify user still exists and is active
    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user deactivated.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    req.user = {
      id: user._id.toString(),
      userId: user._id.toString(),
      role: user.role as UserRole,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      isActive: user.isActive
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

// Authorization middleware for specific roles (THIS WAS MISSING)
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Admin-only access
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Manager or Admin access
export const requireManagerOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!['ADMIN', 'MANAGER'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Manager or Admin access required'
    });
  }

  next();
};

// Backwards compatibility aliases
export const authenticateToken = authenticate;
export const adminAuth = requireAdmin;
