import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
        { userId, email, role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): { userId: string; email: string; role: string } | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
        return decoded;
    } catch (error) {
        return null;
    }
}

/**
 * Create a session in the database
 */
export async function createSession(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string
): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    await prisma.session.create({
        data: {
            userId,
            token,
            expiresAt,
            ipAddress,
            userAgent,
        },
    });
}

/**
 * Delete a session from the database (soft delete - sets loggedOutAt)
 */
export async function deleteSession(token: string): Promise<void> {
    await prisma.session.updateMany({
        where: { token },
        data: { loggedOutAt: new Date() },
    });
}

/**
 * Validate a session exists and is not expired
 */
export async function validateSession(token: string): Promise<boolean> {
    const session = await prisma.session.findUnique({
        where: { token },
    });

    if (!session) {
        return false;
    }

    if (session.expiresAt < new Date()) {
        // Session expired, delete it
        await deleteSession(token);
        return false;
    }

    return true;
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({
        where: {
            expiresAt: {
                lt: new Date(),
            },
        },
    });
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
