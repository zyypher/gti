import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const totalProducts = await prisma.product.count()
        const totalBrands = await prisma.brand.count()
        const totalAdvertisements = await prisma.advertisement.count()

        return NextResponse.json({
            totalProducts,
            totalBrands,
            totalAdvertisements,
        })
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return NextResponse.json(
            { error: 'Failed to load dashboard stats' },
            { status: 500 },
        )
    }
}
