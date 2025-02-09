const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
    const adminEmail = 'admin@gulbahartobacco.com'
    const plainPassword = 'Gulb@h4r_Adm1n#888!'
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    await prisma.user.create({
        data: {
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
        },
    })

    console.log(`Admin user created with email: ${adminEmail}`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
