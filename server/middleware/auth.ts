import { Request, Response, NextFunction } from 'express';
import { verifyToken, validateSession } from '../auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: string;
            };
        }
    }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify JWT token
        const decoded = verifyToken(token);
        if (!decoded) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }

        // Validate session exists and is not expired
        const isValidSession = await validateSession(token);
        if (!isValidSession) {
            res.status(401).json({ error: 'Session expired' });
            return;
        }

        // Verify user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user || !user.isActive) {
            res.status(401).json({ error: 'User not found or inactive' });
            return;
        }

        // Attach user info to request
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
}

/**
 * Middleware to require a specific role
 */
export function requireRole(role: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (req.user.role !== role && req.user.role !== 'admin') {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
export async function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);

            if (decoded) {
                const isValidSession = await validateSession(token);
                if (isValidSession) {
                    req.user = decoded;
                }
            }
        }

        next();
    } catch (error) {
        // Don't fail, just continue without user
        next();
    }
}
