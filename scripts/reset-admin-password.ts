import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'issamo1555@gmail.com';
    const password = 'admin123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash,
            role: 'admin',
            isActive: true
        },
        create: {
            email,
            name: 'Admin User',
            passwordHash,
            role: 'admin',
            isActive: true
        }
    });

    console.log(`Password reset for ${email} to ${password}`);
    console.log(`User ID: ${user.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
