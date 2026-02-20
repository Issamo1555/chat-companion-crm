import { PrismaClient } from '@prisma/client';
import { hashPassword } from './auth';

const prisma = new PrismaClient();

async function main() {
    const email = 'issamo1555@gmail.com';
    const newPassword = 'admin123';

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log(`User ${email} not found.`);
        return;
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
        where: { email },
        data: { passwordHash }
    });

    console.log(`Password for ${email} has been reset to: ${newPassword}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
