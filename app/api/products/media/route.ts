import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const idsParam = url.searchParams.get('ids')

        if (!idsParam) {
            return NextResponse.json({ items: [] })
        }

        const ids = idsParam
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)

        if (ids.length === 0) {
            return NextResponse.json({ items: [] })
        }

        const items = await prisma.product.findMany({
            where: {
                id: { in: ids },
            },
            select: {
                id: true,
                image: true,
                pdfUrl: true,
            },
        })

        return NextResponse.json({ items })
    } catch (error) {
        console.error('Error fetching product media:', error)
        return NextResponse.json({ error: 'Failed to fetch product media' }, { status: 500 })
    }
}
