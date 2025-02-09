import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const brands = await prisma.brand.findMany()
        return new Response(JSON.stringify(brands))
    } catch (error) {
        console.error('Error fetching brands:', error)
        return new Response(
            JSON.stringify({ error: 'Failed to fetch brands' }),
            { status: 500 },
        )
    }
}
