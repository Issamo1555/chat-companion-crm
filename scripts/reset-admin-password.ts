import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'issamo1555@gmail.com';
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error(`User ${email} not found`);
        return;
    }

    await prisma.user.update({
        where: { email },
        data: {
            passwordHash: hashedPassword,
            role: 'admin' // Double check role as well
        }
    });

    console.log(`Password reset for ${email} to ${newPassword}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
