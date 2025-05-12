import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const totalUsers = await prisma.user.count();
        const totalBrands = await prisma.brand.count();
        const totalProducts = await prisma.product.count();
        const totalBanners = await prisma.promotion.count({ where: { type: 'banner' } });
        const totalAds = await prisma.promotion.count({ where: { type: 'advertisement' } });
        const totalSharedPdfs = await prisma.sharedPDF.count();
        const totalOrders = await prisma.order.count();

        return NextResponse.json({
            totalUsers,
            totalBrands,
            totalProducts,
            totalBanners,
            totalAds,
            totalSharedPdfs,
            totalOrders,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
            { error: 'Failed to load dashboard stats' },
            { status: 500 },
        );
    }
}
