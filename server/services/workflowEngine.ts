import { PrismaClient } from '@prisma/client';

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
                        // This would normally go through the WhatsApp/Meta service
                        // For now, we just create a message record in DB
                        if (config.message) {
                            await prisma.message.create({
                                data: {
                                    clientId,
                                    content: config.message,
                                    direction: 'outbound',
                                    status: 'sent',
                                    channel: 'crm' // Mark as automated response
                                }
                            });
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
