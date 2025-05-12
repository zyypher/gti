import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const banners = await prisma.promotion.findMany({
            where: {
                type: 'banner',
            },
        })
        return NextResponse.json(banners)
    } catch (error) {
        console.error('Error fetching banners:', error)
        return NextResponse.json(
            { error: 'Failed to fetch banners' },
            { status: 500 },
        )
    }
}
