import { prisma } from '@/lib/prisma'
const bcrypt = require('bcrypt')

async function main() {
    // Hash password
    const password = 'Gulb@h4r_Adm1n#888!'
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create or update admin user
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@gulbahartobacco.com' },
        update: {}, // No updates needed
        create: {
            email: 'admin@gulbahartobacco.com',
            password: hashedPassword,
            role: 'ADMIN',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    })

    console.log('✅ Admin user seeded successfully with ID:', adminUser.id)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
