import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    try {
        // 1. Create Agents
        const marie = await prisma.user.upsert({
            where: { email: 'marie.dupont@example.com' },
            update: {},
            create: {
                id: '1',
                name: 'Marie Dupont',
                email: 'marie.dupont@example.com',
                role: 'agent',
                isActive: true,
                clientCount: 24,
                createdAt: new Date('2024-01-15'),
            },
        });

        const pierre = await prisma.user.upsert({
            where: { email: 'pierre.martin@example.com' },
            update: {},
            create: {
                id: '2',
                name: 'Pierre Martin',
                email: 'pierre.martin@example.com',
                role: 'agent',
                isActive: true,
                clientCount: 18,
                createdAt: new Date('2024-02-01'),
            },
        });

        const sophie = await prisma.user.upsert({
            where: { email: 'sophie.bernard@example.com' },
            update: {},
            create: {
                id: '3',
                name: 'Sophie Bernard',
                email: 'sophie.bernard@example.com',
                role: 'admin',
                isActive: true,
                clientCount: 5,
                createdAt: new Date('2024-01-01'),
            },
        });

        console.log('Created Users:', { marie, pierre, sophie });

        // 2. Create Tags
        const tagVIP = await prisma.tag.upsert({
            where: { name: 'VIP' },
            update: {},
            create: { name: 'VIP' },
        });
        const tagUrgent = await prisma.tag.upsert({
            where: { name: 'Urgent' },
            update: {},
            create: { name: 'Urgent' },
        });
        const tagB2B = await prisma.tag.upsert({
            where: { name: 'B2B' },
            update: {},
            create: { name: 'B2B' },
        });
        const tagParticulier = await prisma.tag.upsert({
            where: { name: 'Particulier' },
            update: {},
            create: { name: 'Particulier' },
        });
        const tagRelance = await prisma.tag.upsert({
            where: { name: 'Relance' },
            update: {},
            create: { name: 'Relance' },
        });

        // 3. Create Clients
        // Client 1: Jean
        const client1 = await prisma.client.create({
            data: {
                id: '1',
                name: 'Jean Lefevre',
                phoneNumber: '+33 6 12 34 56 78',
                status: 'new',
                assignedAgentId: '1',
                notes: 'Client prioritaire, demande de devis rapide',
                createdAt: new Date('2025-02-03T09:30:00'),
                updatedAt: new Date('2025-02-03T09:40:00'),
                lastMessageAt: new Date('2025-02-03T09:40:00'),
                tags: {
                    create: [
                        { tagId: tagVIP.id },
                        { tagId: tagUrgent.id }
                    ]
                },
                messages: {
                    create: [
                        {
                            id: 'm1',
                            content: 'Bonjour, je souhaiterais avoir des informations sur vos services.',
                            direction: 'inbound',
                            timestamp: new Date('2025-02-03T09:30:00'),
                            status: 'read'
                        },
                        {
                            id: 'm2',
                            content: 'Bonjour Jean ! Bien sûr, je serais ravi de vous aider. Quel type de service recherchez-vous ?',
                            direction: 'outbound',
                            timestamp: new Date('2025-02-03T09:35:00'),
                            status: 'delivered'
                        },
                        {
                            id: 'm3',
                            content: 'Je recherche une solution CRM pour mon entreprise de 50 employés.',
                            direction: 'inbound',
                            timestamp: new Date('2025-02-03T09:40:00'),
                            status: 'read'
                        }
                    ]
                },
                statusHistory: {
                    create: [
                        {
                            id: 'sh1',
                            fromStatus: 'new',
                            toStatus: 'new',
                            changedBy: '1', // Assuming system or user
                            changedAt: new Date('2025-02-03T09:30:00'),
                            note: 'Fiche créée automatiquement',
                        }
                    ]
                }
            },
        });

        // Client 2: Claire
        await prisma.client.create({
            data: {
                id: '2',
                name: 'Claire Dubois',
                phoneNumber: '+33 6 98 76 54 32',
                status: 'in_progress',
                assignedAgentId: '1',
                notes: 'Intéressée par notre offre entreprise',
                createdAt: new Date('2025-02-01T10:00:00'),
                updatedAt: new Date('2025-02-02T14:25:00'),
                lastMessageAt: new Date('2025-02-02T14:25:00'),
                tags: {
                    create: [{ tagId: tagB2B.id }]
                },
                messages: {
                    create: [
                        {
                            id: 'm4',
                            content: 'Bonjour, pouvez-vous me rappeler concernant notre discussion ?',
                            direction: 'inbound',
                            timestamp: new Date('2025-02-02T14:20:00'),
                            status: 'read'
                        },
                        {
                            id: 'm5',
                            content: 'Bien sûr Claire, je vous appelle dans 10 minutes.',
                            direction: 'outbound',
                            timestamp: new Date('2025-02-02T14:25:00'),
                            status: 'read'
                        }
                    ]
                }
            },
        });

        // Client 3: Marc
        await prisma.client.create({
            data: {
                id: '3',
                name: 'Marc Petit',
                phoneNumber: '+33 6 55 44 33 22',
                status: 'treated',
                assignedAgentId: '2',
                notes: 'Contrat signé le 01/02',
                createdAt: new Date('2025-01-25T08:00:00'),
                updatedAt: new Date('2025-02-01T16:00:00'),
                lastMessageAt: new Date('2025-02-01T16:00:00'),
                tags: { create: [{ tagId: tagParticulier.id }] },
                messages: {
                    create: [
                        {
                            id: 'm6',
                            content: 'Merci pour tout, le service est excellent !',
                            direction: 'inbound',
                            timestamp: new Date('2025-02-01T16:00:00'),
                            status: 'read'
                        }
                    ]
                }
            }
        });

        console.log('Seeding finished.');
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
