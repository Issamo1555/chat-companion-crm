import {
    makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    WAMessage,
    proto,
    getContentType,
    downloadMediaMessage,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import P from 'pino';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { assignmentService } from './services/assignment';
import { socketManager } from './services/socketManager';
import { normalizePhoneNumber } from './utils/phone';

const prisma = new PrismaClient();

// Logger configuration
const logger = P({ level: 'silent' }); // Set to 'debug' for detailed logs

// Store the socket instance
let sock: ReturnType<typeof makeWASocket> | null = null;
let qrCode: string | null = null;
let isConnected = false;
let connectedPhoneNumber: string | null = null;

// Auth folder
const AUTH_FOLDER = path.join(process.cwd(), 'whatsapp-auth');
const UPLOADS_FOLDER = path.join(process.cwd(), 'uploads');

// Ensure folders exist
if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}
if (!fs.existsSync(UPLOADS_FOLDER)) {
    fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
}

// Event emitter for real-time updates
import { EventEmitter } from 'events';
export const whatsappEvents = new EventEmitter();

/**
 * Initialize WhatsApp connection
 */
export async function initializeWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: true,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            generateHighQualityLinkPreview: true,
        });

        // Connection update handler
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Emit QR code for frontend
            if (qr) {
                qrCode = qr;
                whatsappEvents.emit('qr', qr);
                console.log('📱 QR Code generated - scan with WhatsApp');
            }

            if (connection === 'close') {
                const shouldReconnect =
                    (lastDisconnect?.error as Boom)?.output?.statusCode !==
                    DisconnectReason.loggedOut;

                console.log(
                    '❌ Connection closed. Reconnecting:',
                    shouldReconnect
                );

                isConnected = false;
                whatsappEvents.emit('disconnected');

                if (shouldReconnect) {
                    setTimeout(() => initializeWhatsApp(), 3000);
                }
            } else if (connection === 'open') {
                console.log('✅ WhatsApp connected successfully!');
                isConnected = true;
                qrCode = null;

                // Get connected phone number
                if (sock?.user?.id) {
                    // Format: 1234567890:12@s.whatsapp.net -> 1234567890
                    connectedPhoneNumber = sock.user.id.split(':')[0].replace('@s.whatsapp.net', '');
                    console.log(`📞 Connected number: ${connectedPhoneNumber}`);
                }

                whatsappEvents.emit('connected', { phoneNumber: connectedPhoneNumber });
            }
        });

        // Save credentials on update
        sock.ev.on('creds.update', saveCreds);

        // Handle incoming messages
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            for (const msg of messages) {
                await handleIncomingMessage(msg);
            }
        });

        // Handle message status updates (delivered, read)
        sock.ev.on('messages.update', async (updates) => {
            for (const update of updates) {
                await handleMessageStatusUpdate(update);
            }
        });

        console.log('🚀 WhatsApp service initialized');
    } catch (error) {
        console.error('❌ Error initializing WhatsApp:', error);
        throw error;
    }
}

/**
 * Handle incoming WhatsApp messages
 */
async function handleIncomingMessage(msg: WAMessage) {
    try {
        if (!msg.message || msg.key.fromMe) return;

        const messageType = getContentType(msg.message);
        if (!messageType) return;

        const remoteJid = msg.key.remoteJid || '';

        // Filter out non-personal JIDs that we don't want:
        // @newsletter - Channels/Newsletters (Still filtered as requested)
        if (remoteJid.includes('@newsletter')) {
            console.log(`ℹ️ Ignoring message from newsletter: ${remoteJid}`);
            return;
        }

        // Identify special JID types
        const isGroup = remoteJid.includes('@g.us');
        const isBroadcast = remoteJid.includes('@broadcast');
        const isLid = remoteJid.includes('@lid');

        // Extract phone number or JID
        // For regular users: normalize (digits only)
        // For groups/broadcasts/lid: keep full JID to serve as unique identifier
        let phoneNumber: string;
        if (isGroup || isBroadcast || isLid) {
            phoneNumber = remoteJid;
        } else {
            const rawPhoneNumber = remoteJid.replace('@s.whatsapp.net', '') || '';
            phoneNumber = normalizePhoneNumber(rawPhoneNumber);
        }

        // Extract message content
        let content = '';
        let mediaUrl: string | null = null;
        let mediaType: string | null = null;

        if (messageType === 'conversation') {
            content = msg.message.conversation || '';
        } else if (messageType === 'extendedTextMessage') {
            content = msg.message.extendedTextMessage?.text || '';
        } else if (
            messageType === 'imageMessage' ||
            messageType === 'videoMessage' ||
            messageType === 'audioMessage' ||
            messageType === 'documentMessage'
        ) {
            // Download media
            const buffer = await downloadMediaMessage(
                msg,
                'buffer',
                {},
                {
                    logger,
                    reuploadRequest: sock ? (msg: WAMessage) => sock!.updateMediaMessage(msg) : undefined
                } as any
            );

            // Determine extension and type
            let extension = '';
            if (messageType === 'imageMessage') {
                content = msg.message.imageMessage?.caption || '[Image]';
                mediaType = 'image';
                extension = 'jpg'; // Default, maybe improve based on mimetype
            } else if (messageType === 'videoMessage') {
                content = msg.message.videoMessage?.caption || '[Video]';
                mediaType = 'video';
                extension = 'mp4';
            } else if (messageType === 'audioMessage') {
                content = '[Audio]';
                mediaType = 'audio';
                extension = 'mp3'; // WhatsApp audio usually ogg/mp4/aac, saving as mp3/ogg might need check
                // For simplicity, let's trust browsers can play it or just download
                // Actually whatsapp audios are often .ogg.
                extension = 'ogg';
            } else if (messageType === 'documentMessage') {
                content = msg.message.documentMessage?.fileName || '[Document]';
                mediaType = 'document';
                extension = path.extname(msg.message.documentMessage?.fileName || '').replace('.', '') || 'bin';
            }

            // Save file
            const fileName = `${Date.now()}_${Math.round(Math.random() * 1000)}.${extension}`;
            const filePath = path.join(UPLOADS_FOLDER, fileName);
            fs.writeFileSync(filePath, buffer);

            mediaUrl = `/uploads/${fileName}`;
            console.log(`📥 Media saved: ${mediaUrl}`);
        } else {
            // Unsupported type
            return;
        }

        if (!content && !mediaUrl) return;

        // Find or create client
        let client = await prisma.client.findFirst({
            where: { phoneNumber },
        });

        if (!client) {
            // Extract contact name from WhatsApp
            let contactName = msg.pushName || phoneNumber;

            // If it's a group, try to fetch its real subject/name
            if (isGroup && sock) {
                try {
                    const metadata = await sock.groupMetadata(remoteJid);
                    if (metadata && metadata.subject) {
                        contactName = metadata.subject;
                        console.log(`🏠 Fetched group name: ${contactName}`);
                    }
                } catch (err) {
                    console.error(`⚠️ Failed to fetch group metadata for ${remoteJid}:`, err);
                    contactName = 'Groupe WhatsApp';
                }
            } else if (isBroadcast) {
                contactName = 'Liste de diffusion';
            }

            client = await prisma.client.create({
                data: {
                    name: contactName,
                    phoneNumber,
                    status: 'new',
                    lastMessageAt: new Date(),
                },
            });

            // Round Robin Assignment
            client = await assignmentService.assignClient(client);

            // Notify assigned agent
            if (client.assignedAgentId) {
                socketManager.emitToUser(client.assignedAgentId, 'client:assigned', client);
            }
            // Notify all (for admin dashboards etc)
            socketManager.emitToAll('client:new', client);

            console.log(`✨ New client created: ${contactName} (${phoneNumber})`);
        } else {
            // Client exists - Check if name needs synchronization
            const contactName = msg.pushName;

            // If the current name is just the phone number or generic, update it
            const isGenericName = client.name === client.phoneNumber ||
                client.name.includes('Client ') ||
                client.name === 'Inconnu' ||
                (isGroup && client.name === 'Groupe WhatsApp');

            if (isGenericName) {
                let newName = contactName;

                // If it's a group, prioritize fetching fresh metadata
                if (isGroup && sock) {
                    try {
                        const metadata = await sock.groupMetadata(remoteJid);
                        if (metadata && metadata.subject) {
                            newName = metadata.subject;
                        }
                    } catch (err) {
                        console.error(`⚠️ Failed to sync group metadata for ${remoteJid}:`, err);
                    }
                }

                if (newName && newName !== client.name) {
                    console.log(`🔄 Syncing name for ${client.phoneNumber}: ${client.name} -> ${newName}`);
                    await prisma.client.update({
                        where: { id: client.id },
                        data: { name: newName }
                    });
                    client.name = newName; // Update local object
                }
            }

            // Update last message timestamp
            await prisma.client.update({
                where: { id: client.id },
                data: {
                    lastMessageAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        }

        // Save message to database
        const savedMessage = await prisma.message.create({
            data: {
                clientId: client.id,
                content,
                mediaUrl,
                mediaType,
                direction: 'inbound',
                status: 'delivered',
                timestamp: new Date((msg.messageTimestamp as number) * 1000),
            },
        });

        // Emit event for real-time updates
        whatsappEvents.emit('message:new', {
            client,
            message: savedMessage,
        });

        console.log(`📨 Message from ${client.name}: ${content}`);
    } catch (error) {
        console.error('❌ Error handling incoming message:', error);
    }
}

/**
 * Handle message status updates
 */
async function handleMessageStatusUpdate(update: any) {
    try {
        const { key, update: statusUpdate } = update;

        if (!statusUpdate) return;

        let status: string | null = null;
        if (statusUpdate.status === 1) status = 'delivered';
        if (statusUpdate.status === 2) status = 'read';

        if (!status) return;

        // Update message status in database
        // Note: We need to store WhatsApp message ID to match
        console.log(`📬 Message status updated to: ${status}`);

        whatsappEvents.emit('message:status', {
            messageId: key.id,
            status,
        });
    } catch (error) {
        console.error('❌ Error handling message status:', error);
    }
}

/**
 * Send a text message via WhatsApp
 */
export async function sendWhatsAppMessage(
    phoneNumber: string,
    content: string
): Promise<boolean> {
    try {
        if (!sock || !isConnected) {
            throw new Error('WhatsApp is not connected');
        }

        // Format phone number (add @s.whatsapp.net if not already a JID)
        const jid = phoneNumber.includes('@')
            ? phoneNumber
            : `${phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`;

        await sock.sendMessage(jid, { text: content });

        console.log(`✉️ Message sent to ${jid}: ${content}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending message:', error);
        return false;
    }
}

/**
 * Send media via WhatsApp
 */
export async function sendWhatsAppMedia(
    phoneNumber: string,
    mediaPath: string,
    caption?: string,
    mediaType: 'image' | 'video' | 'document' | 'audio' = 'image'
): Promise<boolean> {
    try {
        if (!sock || !isConnected) {
            throw new Error('WhatsApp is not connected');
        }

        const jid = phoneNumber.includes('@')
            ? phoneNumber
            : `${phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`;

        const mediaBuffer = fs.readFileSync(mediaPath);

        const messageContent: any = {};

        if (mediaType === 'image') {
            messageContent.image = mediaBuffer;
            messageContent.caption = caption;
        } else if (mediaType === 'video') {
            messageContent.video = mediaBuffer;
            messageContent.caption = caption;
        } else if (mediaType === 'document') {
            messageContent.document = mediaBuffer;
            messageContent.fileName = path.basename(mediaPath);
            messageContent.caption = caption;
        } else if (mediaType === 'audio') {
            messageContent.audio = mediaBuffer;
            messageContent.mimetype = 'audio/mp4';
        }

        await sock.sendMessage(jid, messageContent);

        console.log(`📎 Media sent to ${jid}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending media:', error);
        return false;
    }
}

/**
 * Get connection status
 */
export function getConnectionStatus() {
    return {
        isConnected,
        qrCode,
        phoneNumber: connectedPhoneNumber,
    };
}

/**
 * Get group metadata
 */
export async function getGroupMetadata(jid: string) {
    if (!sock || !isConnected) {
        throw new Error('WhatsApp is not connected');
    }
    return await sock.groupMetadata(jid);
}

/**
 * Logout and clear session
 */
export async function logoutWhatsApp() {
    try {
        if (sock) {
            await sock.logout();
            sock = null;
            isConnected = false;
            qrCode = null;
            connectedPhoneNumber = null;

            // Clear auth folder
            if (fs.existsSync(AUTH_FOLDER)) {
                fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
            }

            console.log('👋 WhatsApp logged out');
            whatsappEvents.emit('logout');
        }
    } catch (error) {
        console.error('❌ Error logging out:', error);
    }
}
