const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    // Seed admin user
    const password = 'Gulb@h4r_Adm1n#888!';
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.upsert({
        where: { email: 'admin@gulbahartobacco.com' },
        update: {}, // Update if user exists
        create: {
            email: 'admin@gulbahartobacco.com',
            password: hashedPassword,
            role: 'ADMIN',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    console.log('✅ Admin user seeded');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
