import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWorkflows() {
    console.log('🌱 Seeding workflows...');

    // 1. Welcome Workflow
    const welcomeWorkflow = await prisma.workflow.upsert({
        where: { id: 'wf-welcome' },
        update: {},
        create: {
            id: 'wf-welcome',
            name: 'Bienvenue Automatique',
            description: 'Envoie un message de bienvenue aux nouveaux clients créés.',
            isActive: true,
            triggers: {
                create: {
                    type: 'on_client_created',
                    config: JSON.stringify({})
                }
            },
            actions: {
                createMany: {
                    data: [
                        {
                            type: 'send_message',
                            config: JSON.stringify({ message: 'Bonjour ! Bienvenue chez BEQ CRM. Comment pouvons-nous vous aider aujourd\'hui ?' }),
                            order: 0
                        },
                        {
                            type: 'add_tag',
                            config: JSON.stringify({ tagId: 1 }), // Assuming tag 1 is 'Lead' or similar
                            order: 1
                        }
                    ]
                }
            }
        }
    });

    // 2. Keyword Workflow (Price)
    const priceWorkflow = await prisma.workflow.upsert({
        where: { id: 'wf-price' },
        update: {},
        create: {
            id: 'wf-price',
            name: 'Réponse Tarifs',
            description: 'Répond automatiquement aux questions sur les prix.',
            isActive: true,
            triggers: {
                create: {
                    type: 'on_message_received',
                    config: JSON.stringify({ keyword: 'prix' })
                }
            },
            actions: {
                create: {
                    type: 'send_message',
                    config: JSON.stringify({ message: 'Voici nos tarifs : [Lien vers catalogue]. N\'hésitez pas si vous avez des questions !' }),
                    order: 0
                }
            }
        }
    });

    console.log('✅ Workflows seeded successfully!');
}

seedWorkflows()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
