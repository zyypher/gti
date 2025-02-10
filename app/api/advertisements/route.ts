import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const advertisements = await prisma.advertisement.findMany({
            where: {
                type: 'advertisement',
            },
        })
        return NextResponse.json(advertisements)
    } catch (error) {
        console.error('Error fetching advertisements:', error)
        return NextResponse.json(
            { error: 'Failed to fetch advertisements' },
            { status: 500 },
        )
    }
}
