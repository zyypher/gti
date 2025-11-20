import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    try {
        const totalUsers = await prisma.user.count()
        const totalBrands = await prisma.brand.count()
        const totalProducts = await prisma.product.count()

        // Corporate info = banner_front + banner_back
        const totalBanners = await prisma.promotion.count({
            where: {
                type: {
                    in: ['banner_front', 'banner_back'],
                },
            },
        })

        const totalAds = await prisma.promotion.count({
            where: { type: 'advertisement' },
        })

        const totalSharedPdfs = await prisma.sharedPDF.count()
        const totalOrders = await prisma.order.count()

        return NextResponse.json(
            {
                totalUsers,
                totalBrands,
                totalProducts,
                totalBanners,        // used by your "Corporate Info" card
                totalAds,
                totalSharedPdfs,
                totalOrders,
            },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                },
            },
        )
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return NextResponse.json(
            { error: 'Failed to load dashboard stats' },
            { status: 500 },
        )
    }
}
