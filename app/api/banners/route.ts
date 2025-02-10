import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const banners = await prisma.advertisement.findMany({
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
