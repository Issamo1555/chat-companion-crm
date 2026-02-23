import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { socketManager } from './socketManager';
import { assignmentService } from './assignment';
import { workflowEngine } from './workflowEngine';

const prisma = new PrismaClient();

// Meta API configuration (to be filled by user in .env)
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_API_VERSION = 'v18.0';

export class MetaService {
    /**
     * Handle incoming webhook events from Meta (Instagram/Messenger)
     */
    async handleWebhook(data: any) {
        if (data.object !== 'instagram' && data.object !== 'page') {
            return;
        }

        const platform = data.object === 'instagram' ? 'instagram' : 'messenger';

        for (const entry of data.entry) {
            const messaging = entry.messaging || entry.changes;
            if (!messaging) continue;

            for (const event of messaging) {
                if (event.message && !event.message.is_echo) {
                    await this.handleIncomingMessage(platform, event);
                }
            }
        }
    }

    /**
     * Handle incoming messages from Instagram/Messenger
     */
    private async handleIncomingMessage(platform: 'instagram' | 'messenger', event: any) {
        const platformId = event.sender.id;
        const recipientId = event.recipient.id;
        const content = event.message.text || '[Media]';

        // Find or create client
        let client = await prisma.client.findUnique({
            where: {
                platform_platformId: {
                    platform,
                    platformId
                }
            }
        });

        if (!client) {
            // In a real scenario, we might want to fetch the user profile from Meta
            // For now, use a placeholder name
            const contactName = `${platform.charAt(0).toUpperCase() + platform.slice(1)} User ${platformId.slice(-4)}`;

            client = await prisma.client.create({
                data: {
                    name: contactName,
                    platform,
                    platformId,
                    status: 'new',
                    lastMessageAt: new Date(),
                }
            });

            // Assign via Round Robin
            client = await assignmentService.assignClient(client);

            if (client.assignedAgentId) {
                socketManager.emitToUser(client.assignedAgentId, 'client:assigned', client);
            }
            socketManager.emitToAll('client:new', client);

            // Trigger workflow: on_client_created
            workflowEngine.processEvent({
                type: 'on_client_created',
                clientId: client.id
            });
        } else {
            // Update last message
            await prisma.client.update({
                where: { id: client.id },
                data: {
                    lastMessageAt: new Date(),
                    updatedAt: new Date(),
                }
            });
        }

        // Save message
        const savedMessage = await prisma.message.create({
            data: {
                clientId: client.id,
                content,
                direction: 'inbound',
                status: 'delivered',
                platform,
                timestamp: new Date(),
            }
        });

        // Notify via socket
        socketManager.emitToAll('message:new', {
            client,
            message: savedMessage
        });

        console.log(`📨 [${platform.toUpperCase()}] Message from ${client.name}: ${content}`);
    }

    /**
     * Send message via Meta Graph API
     */
    async sendMessage(platform: string, platformId: string, content: string): Promise<boolean> {
        try {
            if (!META_ACCESS_TOKEN) {
                console.error('❌ Meta Access Token is missing');
                return false;
            }

            const endpoint = platform === 'instagram'
                ? `https://graph.facebook.com/${META_API_VERSION}/me/messages`
                : `https://graph.facebook.com/${META_API_VERSION}/me/messages`;

            await axios.post(
                endpoint,
                {
                    recipient: { id: platformId },
                    message: { text: content },
                },
                {
                    params: { access_token: META_ACCESS_TOKEN }
                }
            );

            console.log(`✉️ [${platform.toUpperCase()}] Message sent to ${platformId}`);
            return true;
        } catch (error: any) {
            console.error(`❌ Error sending ${platform} message:`, error.response?.data || error.message);
            return false;
        }
    }
}

export const metaService = new MetaService();
