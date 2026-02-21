import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  initializeWhatsApp,
  sendWhatsAppMessage,
  sendWhatsAppMedia,
  getConnectionStatus,
  logoutWhatsApp,
  whatsappEvents,
} from './whatsapp';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  createSession,
  deleteSession,
} from './auth';
import { requireAuth, requireRole } from './middleware/auth';
import { socketManager } from './services/socketManager';
import { assignmentService } from './services/assignment';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Initialize Socket Manager
socketManager.initialize(io);

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ============================================
// Authentication API
// ============================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'agent' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        isActive: true,
      },
    });

    // Generate token for auto-login
    const token = generateToken(user.id, user.email, user.role);

    // Capture IP and user agent
    const ipAddress = req.ip || req.socket.remoteAddress || undefined;
    const userAgent = req.headers['user-agent'] || undefined;

    // Create session
    await createSession(user.id, token, ipAddress, userAgent);

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Capture IP address and user agent for activity tracking
    const ipAddress = req.ip || req.socket.remoteAddress || undefined;
    const userAgent = req.headers['user-agent'] || undefined;

    // Create session with tracking info
    await createSession(user.id, token, ipAddress, userAgent);

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Logout
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await deleteSession(token);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Get current user
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        clientCount: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ============================================
// Users API (Protected)
// ============================================
app.get('/api/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null, // Exclude soft-deleted users
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        clientCount: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get activity logs (Admin only)
app.get('/api/admin/activity-logs', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { userId, startDate, endDate, limit = '50', offset = '0' } = req.query;

    const where: any = {};

    // Filter by user ID if provided
    if (userId && typeof userId === 'string') {
      where.userId = userId;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate && typeof startDate === 'string') {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit), 100), // Max 100 records
        skip: Number(offset),
      }),
      prisma.session.count({ where }),
    ]);

    res.json({ logs, total });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Create new user (Admin only)
app.post('/api/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role = 'agent' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user details (Admin only)
app.put('/api/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: { email, NOT: { id } }
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user role (admin only)
app.put('/api/users/:id/role', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validation
    if (!role || !['admin', 'agent'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "admin" or "agent"' });
    }

    // Prevent self-role change
    if (id === req.user!.userId) {
      return res.status(403).json({ error: 'You cannot change your own role' });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Update user status (admin only)
app.put('/api/users/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validation
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    // Prevent self-deactivation
    if (id === req.user!.userId && !isActive) {
      return res.status(403).json({ error: 'You cannot deactivate your own account' });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If deactivating an admin, ensure at least one admin remains active
    if (!isActive && targetUser.role === 'admin') {
      const activeAdminsCount = await prisma.user.count({
        where: {
          role: 'admin',
          isActive: true,
          id: { not: id },
        },
      });

      if (activeAdminsCount === 0) {
        return res.status(403).json({
          error: 'Cannot deactivate the last active admin. At least one admin must remain active.'
        });
      }
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete user (admin only) - Optional
app.delete('/api/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user!.userId) {
      return res.status(403).json({ error: 'You cannot delete your own account' });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If deleting an admin, ensure at least one admin remains
    if (targetUser.role === 'admin') {
      const activeAdminsCount = await prisma.user.count({
        where: {
          role: 'admin',
          isActive: true,
          id: { not: id },
        },
      });

      if (activeAdminsCount === 0) {
        return res.status(403).json({
          error: 'Cannot delete the last active admin. At least one admin must remain.'
        });
      }
    }

    // Soft delete: Set deletedAt timestamp instead of deleting
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false, // Also deactivate the account
      },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============================================
// Clients API (Protected)
// ============================================
app.get('/api/clients', requireAuth, async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        assignedAgent: true,
        tags: { include: { tag: true } },
        messages: { orderBy: { timestamp: 'asc' } },
        statusHistory: { orderBy: { changedAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Transform data to match frontend expectations if necessary
    // Prisma returns client_tags as { tag: { ... } }, frontend might expect flat array
    // But let's assume the frontend handles the shape or we fix it here.
    // The type in crm.ts says tags: string[], but the prisma return is different.
    // We should map it.

    const formattedClients = clients.map(client => ({
      ...client,
      tags: client.tags.map(t => t.tag.name), // Flatten tags to strings as per Client type
    }));

    res.json(formattedClients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

app.post('/api/clients', requireAuth, async (req, res) => {
  try {
    const { name, phoneNumber, email, company, address, source, status, notes } = req.body;

    // Check if client with this phone number already exists
    const existingClient = await prisma.client.findFirst({
      where: { phoneNumber },
    });

    let client;

    if (existingClient) {
      // If client exists, update it with provided info if necessary (or just return it)
      // For now, let's update basic info but keep status if not provided
      client = await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          name: name || existingClient.name,
          email: email || existingClient.email,
          company: company || existingClient.company,
          address: address || existingClient.address,
          source: source || existingClient.source,
          // Don't override status unless explicitly requested
          // status: status || existingClient.status, 
          updatedAt: new Date(),
        },
      });
      console.log(`Updated existing client: ${client.name} (${client.phoneNumber})`);
    } else {
      // Create new client
      client = await prisma.client.create({
        data: {
          name,
          phoneNumber,
          email,
          company,
          address,
          source,
          status: status || 'new',
          notes,
          updatedAt: new Date(),
        },
      });
      console.log(`Created new client: ${client.name} (${client.phoneNumber})`);
    }

    try {
      // Attempt Round Robin assignment (only if not already assigned)
      if (!client.assignedAgentId) {
        client = await assignmentService.assignClient(client);

        // If assigned, we might want to notify via socket (optional, but good)
        if (client.assignedAgentId) {
          socketManager.emitToUser(client.assignedAgentId, 'client:assigned', client);
        }
      }
    } catch (assignmentError) {
      console.error('Assignment error:', assignmentError);
      // We don't fail the request if assignment fails, we just log it
    }

    // Also emit to admins or general update
    socketManager.emitToAll('client:new', client);

    res.json(client);
  } catch (error) {
    console.error('Create client error:', error);
    // @ts-ignore
    res.status(500).json({ error: 'Failed to create client', details: error.message });
  }
});

// ============================================
// Templates API (Protected)
// ============================================

// Get all templates
app.get('/api/templates', requireAuth, async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(templates);
  } catch (error) {
    console.error('Fetch templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create template
app.post('/api/templates', requireAuth, async (req, res) => {
  try {
    const { name, content, category } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    const template = await prisma.template.create({
      data: {
        name,
        content,
        category,
        createdBy: req.user!.userId
      }
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
app.put('/api/templates/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, category } = req.body;

    const template = await prisma.template.update({
      where: { id },
      data: {
        name,
        content,
        category
      }
    });

    res.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
app.delete('/api/templates/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.template.delete({
      where: { id }
    });
    res.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

app.patch('/api/clients/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...req.body,
        updatedAt: new Date(),
      },
    });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// ============================================
// Messages API (Protected)
// ============================================
app.get('/api/messages', requireAuth, async (req, res) => {
  try {
    const { clientId } = req.query; // Expect clientId as query parameter for GET

    if (!clientId) {
      return res.status(400).json({ error: 'clientId is required' });
    }

    const messages = await prisma.message.findMany({
      where: { clientId: String(clientId) },
      orderBy: { timestamp: 'asc' },
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', requireAuth, async (req, res) => {
  try {
    const { clientId, content, direction, status = 'sent' } = req.body;

    // Get client to retrieve phone number
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // If outbound, send via WhatsApp
    if (direction === 'outbound') {
      const sent = await sendWhatsAppMessage(client.phoneNumber, content);
      if (!sent) {
        return res.status(500).json({ error: 'Failed to send WhatsApp message' });
      }
    }

    const message = await prisma.message.create({
      data: {
        clientId,
        content,
        direction,
        status,
        timestamp: new Date(),
      },
    });

    // Update client's last interaction
    await prisma.client.update({
      where: { id: clientId },
      data: {
        lastMessageAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Emit to connected clients via Socket.IO
    io.emit('message:new', { clientId, message });

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Status History / Update Status
app.post('/api/clients/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, userId } = req.body;

    const currentClient = await prisma.client.findUnique({ where: { id } });

    if (!currentClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const result = await prisma.$transaction(async (prisma) => {
      // Update client status
      const updatedClient = await prisma.client.update({
        where: { id },
        data: { status, updatedAt: new Date() }
      });

      // Add history entry
      await prisma.statusHistory.create({
        data: {
          clientId: id,
          fromStatus: currentClient.status,
          toStatus: status,
          changedBy: userId, // Optional, can be null
          note: note,
          changedAt: new Date()
        }
      });

      return updatedClient;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Send Media Message
app.post('/api/messages/media', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { clientId, direction = 'outbound' } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Determine media type
    const mimeType = file.mimetype;
    let mediaType: 'image' | 'video' | 'audio' | 'document' = 'document';

    if (mimeType.startsWith('image/')) mediaType = 'image';
    else if (mimeType.startsWith('video/')) mediaType = 'video';
    else if (mimeType.startsWith('audio/')) mediaType = 'audio';

    const mediaUrl = `/uploads/${file.filename}`;

    // Get client to retrieve phone number
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // If outbound, send via WhatsApp
    if (direction === 'outbound') {
      const sent = await sendWhatsAppMedia(
        client.phoneNumber,
        file.path,
        '', // Caption could be added here if supported in frontend
        mediaType
      );

      if (!sent) {
        return res.status(500).json({ error: 'Failed to send WhatsApp media' });
      }
    }

    const message = await prisma.message.create({
      data: {
        clientId,
        content: `[${mediaType.toUpperCase()}]`,
        mediaUrl,
        mediaType,
        direction,
        status: 'sent',
        timestamp: new Date(),
      },
    });

    // Update client's last interaction
    await prisma.client.update({
      where: { id: clientId },
      data: {
        lastMessageAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Emit to connected clients via Socket.IO
    io.emit('message:new', { clientId, message });

    res.json(message);
  } catch (error) {
    console.error('Error sending media:', error);
    res.status(500).json({ error: 'Failed to send media message' });
  }
});

// ============================================
// Dashboard API (Protected)
// ============================================
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const [
      totalClients,
      newClients,
      inProgressClients,
      treatedClients,
      relaunchedClients,
      closedClients,
      totalMessages,
      users,
      messagesByDay
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: 'new' } }),
      prisma.client.count({ where: { status: 'in_progress' } }),
      prisma.client.count({ where: { status: 'treated' } }),
      prisma.client.count({ where: { status: 'relaunched' } }),
      prisma.client.count({ where: { status: 'closed' } }),
      prisma.message.count(),
      prisma.user.findMany({ include: { assignedClients: true } }),
      prisma.$queryRaw`
                SELECT DATE(timestamp / 1000, 'unixepoch') as date, COUNT(*) as count 
                FROM messages 
                GROUP BY date 
                ORDER BY date DESC 
                LIMIT 7
            `
    ]);

    // Calculate average response time
    // Find all inbound messages
    const inboundMessages = await prisma.message.findMany({
      where: { direction: 'inbound' },
      orderBy: { timestamp: 'asc' },
      select: { clientId: true, timestamp: true }
    });

    let totalResponseTime = 0;
    let responseCount = 0;

    // For each inbound message, find the first subsequent outbound message for the same client
    for (const inbound of inboundMessages) {
      const firstReply = await prisma.message.findFirst({
        where: {
          clientId: inbound.clientId,
          direction: 'outbound',
          timestamp: { gt: inbound.timestamp }
        },
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true }
      });

      if (firstReply) {
        const diffInMinutes = (firstReply.timestamp.getTime() - inbound.timestamp.getTime()) / (1000 * 60);
        // Filter out unreasonable outliers if necessary, e.g., > 48 hours, but for now keep all
        totalResponseTime += diffInMinutes;
        responseCount++;
      }
    }

    const averageResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;

    // Clients by Agent
    const clientsByAgent = users.map(user => ({
      agentName: user.name,
      count: user.assignedClients.length
    }));

    // Activity by Day (formatting queryRaw result)
    // SQLite returns dates as strings. We need to format properly for frontend if needed.
    // Also need newClients count per day.
    // For simplicity, let's just return the message count for activity now.

    // Note: prisma.$queryRaw returns unknown. We cast or map carefully.
    // SQLite timestamp storage in Prisma is usually BigInt or similar if not DateTime.
    // Prisma stores DateTime as numeric timestamp or ISO string in SQLite depending on config.
    // Let's use a Javascript aggregation for simplicity and robustness across DBs for this small scale.

    const allMessages = await prisma.message.findMany({
      where: { timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    });

    const allNewClients = await prisma.client.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    });

    const activityMap = new Map<string, { messages: number, newClients: number }>();

    // Initialize last 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      activityMap.set(dateStr, { messages: 0, newClients: 0 });
    }

    allMessages.forEach(m => {
      const dateStr = m.timestamp.toISOString().split('T')[0];
      if (activityMap.has(dateStr)) {
        activityMap.get(dateStr)!.messages++;
      }
    });

    allNewClients.forEach(c => {
      const dateStr = c.createdAt.toISOString().split('T')[0];
      if (activityMap.has(dateStr)) {
        activityMap.get(dateStr)!.newClients++;
      }
    });

    const activityByDay = Array.from(activityMap.entries()).map(([date, counts]) => ({
      date,
      ...counts
    })).sort((a, b) => a.date.localeCompare(b.date));

    const stats = {
      totalClients,
      newClients,
      inProgressClients,
      treatedClients,
      relaunchedClients,
      closedClients,
      totalMessages,
      averageResponseTime,
      clientsByAgent,
      clientsByStatus: [
        { status: 'new', count: newClients },
        { status: 'in_progress', count: inProgressClients },
        { status: 'treated', count: treatedClients },
        { status: 'relaunched', count: relaunchedClients },
        { status: 'closed', count: closedClients },
      ],
      activityByDay
    };

    res.json(stats);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// WhatsApp Connection Status API
app.get('/api/whatsapp/status', (req, res) => {
  const status = getConnectionStatus();
  res.json(status);
});

// WhatsApp Logout API
app.post('/api/whatsapp/logout', async (req, res) => {
  try {
    await logoutWhatsApp();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Send current WhatsApp status
  socket.emit('whatsapp:status', getConnectionStatus());

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// ============================================
// Reminders API (Protected)
// ============================================

// Get all reminders
app.get('/api/reminders', requireAuth, async (req, res) => {
  try {
    const { clientId, status } = req.query;

    const where: any = {};
    if (req.user!.role !== 'admin') {
      where.userId = req.user!.userId;
    }

    if (clientId) where.clientId = String(clientId);
    if (status) where.status = String(status);

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, phoneNumber: true } },
        user: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json(reminders);
  } catch (error) {
    console.error('Fetch reminders error:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Create reminder
app.post('/api/reminders', requireAuth, async (req, res) => {
  try {
    const { clientId, title, description, dueDate } = req.body;

    if (!clientId || !title || !dueDate) {
      return res.status(400).json({ error: 'clientId, title, and dueDate are required' });
    }

    const reminder = await prisma.reminder.create({
      data: {
        clientId,
        userId: req.user!.userId,
        title,
        description,
        dueDate: new Date(dueDate)
      },
      include: {
        client: { select: { id: true, name: true, phoneNumber: true } },
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error('Create reminder error:', error);
    // @ts-ignore
    res.status(500).json({ error: 'Failed to create reminder', details: error.message });
  }
});

// Update reminder
app.put('/api/reminders/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, description, dueDate } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (title) data.title = title;
    if (description !== undefined) data.description = description;
    if (dueDate) data.dueDate = new Date(dueDate);
    data.updatedAt = new Date();

    const reminder = await prisma.reminder.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, name: true, phoneNumber: true } },
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    res.json(reminder);
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// Delete reminder
app.delete('/api/reminders/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.reminder.delete({ where: { id } });
    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// WhatsApp event listeners
whatsappEvents.on('qr', (qr) => {
  console.log('📱 QR Code generated');
  io.emit('whatsapp:qr', qr);
});

whatsappEvents.on('connected', () => {
  console.log('✅ WhatsApp connected - broadcasting to clients');
  io.emit('whatsapp:connected');
});

whatsappEvents.on('disconnected', () => {
  console.log('❌ WhatsApp disconnected - broadcasting to clients');
  io.emit('whatsapp:disconnected');
});

whatsappEvents.on('message:new', async (data) => {
  console.log('📨 New message event - broadcasting to clients');

  // Fetch updated client with all relations
  const updatedClient = await prisma.client.findUnique({
    where: { id: data.client.id },
    include: {
      assignedAgent: true,
      tags: { include: { tag: true } },
      messages: { orderBy: { timestamp: 'asc' } },
      statusHistory: { orderBy: { changedAt: 'desc' } },
    },
  });

  if (updatedClient) {
    const formattedClient = {
      ...updatedClient,
      tags: updatedClient.tags.map(t => t.tag.name),
    };

    io.emit('message:new', {
      client: formattedClient,
      message: data.message,
    });
  }
});

whatsappEvents.on('message:status', (data) => {
  console.log('📬 Message status update - broadcasting to clients');
  io.emit('message:status', data);
});

whatsappEvents.on('logout', () => {
  console.log('👋 WhatsApp logged out - broadcasting to clients');
  io.emit('whatsapp:logout');
});

// Initialize WhatsApp on server start
initializeWhatsApp().catch((error) => {
  console.error('❌ Failed to initialize WhatsApp:', error);
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready for connections`);
});
