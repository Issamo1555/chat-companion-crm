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

    console.log(`Current role for ${email}: ${user.role}`);

    if (user.role !== 'admin') {
        await prisma.user.update({
            where: { email },
            data: { role: 'admin' }
        });
        console.log(`Role updated to admin for ${email}`);
    } else {
        console.log(`User ${email} is already an admin`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
