import { PrismaClient, Client, User } from '@prisma/client';
import { socketManager } from './socketManager';

const prisma = new PrismaClient();

export class AssignmentService {
    /**
     * Assigns a client to an available online agent using Round Robin logic.
     * Round Robin: Assign to the agent who has the oldest 'last assigned client' timestamp.
     */
    async assignClient(client: Client): Promise<Client> {
        try {
            // 1. Get online agent IDs
            const onlineAgentIds = socketManager.getOnlineAgentIds();

            if (onlineAgentIds.length === 0) {
                console.log(`⚠️ No online agents available to assign client ${client.id}`);
                return client;
            }

            // 2. Fetch online agents with their most recent client assignment
            const availableAgents = await prisma.user.findMany({
                where: {
                    id: { in: onlineAgentIds },
                    isActive: true,
                    // You might strictly want only 'agent' role, removing 'admin' if they don't take calls
                    // role: 'agent' 
                },
                include: {
                    assignedClients: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { createdAt: true }
                    }
                }
            });

            if (availableAgents.length === 0) {
                console.log(`⚠️ Online users found, but none are active agents.`);
                return client;
            }

            // 3. Sort agents by last assignment time (Ascending)
            // Agents with NO clients (undefined/empty) treated as oldest (0)
            availableAgents.sort((a, b) => {
                const lastTimeA = a.assignedClients[0]?.createdAt.getTime() || 0;
                const lastTimeB = b.assignedClients[0]?.createdAt.getTime() || 0;
                return lastTimeA - lastTimeB;
            });

            // 4. Pick the first agent
            const selectedAgent = availableAgents[0];
            console.log(`🎯 Assigning client ${client.name} to agent ${selectedAgent.name} (Last assigned: ${selectedAgent.assignedClients[0]?.createdAt || 'Never'})`);

            // 5. Update client
            const updatedClient = await prisma.client.update({
                where: { id: client.id },
                data: {
                    assignedAgentId: selectedAgent.id,
                    status: 'new' // ensure it's new
                },
                include: {
                    assignedAgent: true,
                    tags: { include: { tag: true } },
                    messages: true,
                    statusHistory: true
                }
            });

            return updatedClient;

        } catch (error) {
            console.error('❌ Error in Round Robin assignment:', error);
            return client; // Return original client if assignment fails
        }
    }
}

export const assignmentService = new AssignmentService();
