import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const sizes = await prisma.product.findMany({
            distinct: ['size'],
            select: {
                size: true,
            },
            orderBy: {
                size: 'asc',
            },
        })

        const uniqueSizes = sizes.map((product) => product.size)

        return NextResponse.json(uniqueSizes)
    } catch (error) {
        console.error('Error fetching unique product sizes:', error)
        return NextResponse.json(
            { error: 'Failed to fetch unique product sizes' },
            { status: 500 },
        )
    }
} 