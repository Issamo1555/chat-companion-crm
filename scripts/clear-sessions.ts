import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'issamo1555@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error(`User ${email} not found`);
        return;
    }

    const deleted = await prisma.session.deleteMany({
        where: { userId: user.id }
    });

    console.log(`Cleared ${deleted.count} sessions for ${email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
