import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration...');

    const clients = await prisma.client.findMany({
        where: {
            OR: [
                { platformId: null },
                { platformId: '' }
            ]
        }
    });

    console.log(`Found ${clients.length} clients to migrate.`);

    for (const client of clients) {
        if (client.phoneNumber) {
            console.log(`Migrating client: ${client.name} (${client.phoneNumber})`);
            await prisma.client.update({
                where: { id: client.id },
                data: {
                    platformId: client.phoneNumber,
                    platform: 'whatsapp'
                }
            });
        }
    }

    console.log('Migration completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
