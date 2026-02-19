import { Server, Socket } from 'socket.io';
import { verifyToken } from '../auth';

class SocketManager {
    private io: Server | null = null;
    private onlineUsers: Map<string, string[]> = new Map(); // userId -> socketIds

    initialize(io: Server) {
        this.io = io;

        this.io.use(async (socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = verifyToken(token);
            if (!decoded) {
                return next(new Error('Authentication error'));
            }

            // Attach user info to socket
            (socket as any).user = decoded;
            next();
        });

        this.io.on('connection', (socket: Socket) => {
            const user = (socket as any).user;
            console.log(`✅ User connected: ${user.email} (${user.userId})`);

            this.addUser(user.userId, socket.id);

            socket.on('disconnect', () => {
                console.log(`❌ User disconnected: ${user.email}`);
                this.removeUser(user.userId, socket.id);
            });
        });
    }

    private addUser(userId: string, socketId: string) {
        if (!this.onlineUsers.has(userId)) {
            this.onlineUsers.set(userId, []);
        }
        this.onlineUsers.get(userId)?.push(socketId);
    }

    private removeUser(userId: string, socketId: string) {
        if (this.onlineUsers.has(userId)) {
            const sockets = this.onlineUsers.get(userId) || [];
            const updatedSockets = sockets.filter(id => id !== socketId);

            if (updatedSockets.length === 0) {
                this.onlineUsers.delete(userId);
            } else {
                this.onlineUsers.set(userId, updatedSockets);
            }
        }
    }

    public getOnlineAgentIds(): string[] {
        return Array.from(this.onlineUsers.keys());
    }

    public isUserOnline(userId: string): boolean {
        return this.onlineUsers.has(userId);
    }

    public emitToUser(userId: string, event: string, data: any) {
        const socketIds = this.onlineUsers.get(userId);
        if (socketIds && this.io) {
            socketIds.forEach(socketId => {
                this.io?.to(socketId).emit(event, data);
            });
        }
    }

    public emitToAll(event: string, data: any) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
}

export const socketManager = new SocketManager();
