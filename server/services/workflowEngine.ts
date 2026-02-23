import { PrismaClient } from '@prisma/client';
import { sendWhatsAppMessage } from '../whatsapp';
import { emailService } from './emailService';
import { metaService } from './meta';
import { aiService } from './aiService';


const prisma = new PrismaClient();

export type WorkflowEventType = 'on_client_created' | 'on_status_change' | 'on_message_received' | 'on_opportunity_stage_change';

export interface WorkflowEvent {
    type: WorkflowEventType;
    clientId: string;
    data?: any; // Additional payload (e.g., status, message content, stageId)
}

class WorkflowEngine {
    async processEvent(event: WorkflowEvent) {
        console.log(`[WorkflowEngine] Processing event: ${event.type} for client: ${event.clientId}`);

        try {
            // Find all active workflows that have a trigger matching this event type
            const activeWorkflows = await prisma.workflow.findMany({
                where: { isActive: true },
                include: {
                    triggers: {
                        where: { type: event.type }
                    },
                    actions: {
                        orderBy: { order: 'asc' }
                    }
                }
            });

            for (const workflow of activeWorkflows) {
                // Evaluate triggers
                for (const trigger of workflow.triggers) {
                    const config = JSON.parse(trigger.config);

                    if (this.shouldTrigger(event, trigger.type, config)) {
                        console.log(`[WorkflowEngine] Workflow "${workflow.name}" triggered!`);
                        await this.executeActions(workflow.actions, event.clientId);
                        break; // Move to next workflow after one trigger match (or keep going for multiple?)
                    }
                }
            }
        } catch (error) {
            console.error('[WorkflowEngine] Error processing event:', error);
        }
    }

    private shouldTrigger(event: WorkflowEvent, triggerType: string, config: any): boolean {
        switch (triggerType) {
            case 'on_client_created':
                return true; // No extra config for now

            case 'on_status_change':
                return !config.status || event.data?.toStatus === config.status;

            case 'on_message_received':
                if (!config.keyword) return true;
                const content = event.data?.content || '';
                return content.toLowerCase().includes(config.keyword.toLowerCase());

            case 'on_opportunity_stage_change':
                return !config.stageId || event.data?.stageId === config.stageId;

            default:
                return false;
        }
    }

    private async executeActions(actions: any[], clientId: string) {
        for (const action of actions) {
            const config = JSON.parse(action.config);
            console.log(`[WorkflowEngine] Executing action: ${action.type} for client: ${clientId}`);

            try {
                switch (action.type) {
                    case 'add_tag':
                        if (config.tagId) {
                            await prisma.clientTag.upsert({
                                where: {
                                    clientId_tagId: { clientId, tagId: Number(config.tagId) }
                                },
                                update: {},
                                create: { clientId, tagId: Number(config.tagId) }
                            });
                        }
                        break;

                    case 'send_message':
                        if (config.content || config.message) {
                            const messageText = config.content || config.message;
                            const client = await prisma.client.findUnique({ where: { id: clientId } });
                            if (!client) break;

                            let sent = false;
                            if (client.platform === 'whatsapp' && client.platformId) {
                                sent = await sendWhatsAppMessage(client.platformId, messageText);
                            } else if (client.platform === 'instagram' || client.platform === 'messenger') {
                                sent = await metaService.sendMessage(client.platform, client.platformId!, messageText);
                            } else if (client.email) {
                                // Find first available email account to send from
                                const account = await prisma.emailAccount.findFirst();
                                if (account) {
                                    await emailService.sendEmail(account.id, client.email, 'Notification CRM', messageText);
                                    sent = true;
                                }
                            }

                            if (sent) {
                                await prisma.message.create({
                                    data: {
                                        clientId,
                                        content: messageText,
                                        direction: 'outbound',
                                        status: 'sent',
                                        platform: client.platform || 'crm',
                                        channel: 'crm'
                                    }
                                });
                            }
                        }
                        break;

                    case 'ai_reply':
                        if (config.instructions) {
                            const client = await prisma.client.findUnique({
                                where: { id: clientId },
                                include: { messages: { orderBy: { timestamp: 'desc' }, take: 10 } }
                            });
                            if (!client) break;

                            // Format context from last messages
                            const context = client.messages
                                .reverse()
                                .map(m => `${m.direction === 'inbound' ? 'Client' : 'Agent'}: ${m.content}`)
                                .join('\n');

                            const aiDraft = await aiService.generateEmailDraft({
                                toName: client.name,
                                context: context,
                                intent: config.instructions,
                                tone: 'professional'
                            });

                            let sent = false;
                            if (client.platform === 'whatsapp' && client.platformId) {
                                sent = await sendWhatsAppMessage(client.platformId, aiDraft);
                            } else if (client.platform === 'instagram' || client.platform === 'messenger') {
                                sent = await metaService.sendMessage(client.platform, client.platformId!, aiDraft);
                            } else if (client.email) {
                                const account = await prisma.emailAccount.findFirst();
                                if (account) {
                                    await emailService.sendEmail(account.id, client.email, 'Réponse Assistant CRM', aiDraft);
                                    sent = true;
                                }
                            }

                            if (sent) {
                                await prisma.message.create({
                                    data: {
                                        clientId,
                                        content: aiDraft,
                                        direction: 'outbound',
                                        status: 'sent',
                                        platform: client.platform || 'crm',
                                        channel: 'ai_workflow'
                                    }
                                });
                            }
                        }
                        break;

                    case 'update_status':
                        if (config.status) {
                            await prisma.client.update({
                                where: { id: clientId },
                                data: { status: config.status }
                            });
                        }
                        break;

                    case 'assign_agent':
                        if (config.agentId) {
                            await prisma.client.update({
                                where: { id: clientId },
                                data: { assignedAgentId: config.agentId }
                            });
                        }
                        break;

                    case 'create_opportunity':
                        if (config.stageId) {
                            await prisma.opportunity.create({
                                data: {
                                    clientId,
                                    stageId: config.stageId,
                                    value: config.value || 0,
                                    status: 'active'
                                }
                            });
                        }
                        break;

                    default:
                        console.warn(`[WorkflowEngine] Unknown action type: ${action.type}`);
                }
            } catch (error) {
                console.error(`[WorkflowEngine] Error executing action ${action.type}:`, error);
            }
        }
    }
}

export const workflowEngine = new WorkflowEngine();
