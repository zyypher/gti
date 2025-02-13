import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const recentProducts = await prisma.product.findMany({
            take: 5, // Get latest 5 products
            orderBy: { createdAt: 'desc' },
            include: {
                brand: { select: { name: true } },
            },
        })

        return NextResponse.json(recentProducts)
    } catch (error) {
        console.error('Error fetching recent products:', error)
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 },
        )
    }
}
