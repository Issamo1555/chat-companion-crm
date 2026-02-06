import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany();
    console.table(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));

    console.log('\n--- CLIENTS ---');
    const clients = await prisma.client.findMany({
        include: {
            tags: { include: { tag: true } }
        }
    });
    console.table(clients.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        agent: c.assignedAgentId,
        tags: c.tags.map(t => t.tag.name).join(', ')
    })));

    console.log('\n--- MESSAGES ---');
    const messages = await prisma.message.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' }
    });
    console.table(messages.map(m => ({
        id: m.id,
        client: m.clientId,
        direction: m.direction,
        content: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '')
    })));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
