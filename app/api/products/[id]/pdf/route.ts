import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const productId = params.id

    try {
        // ✅ Fetch PDF URL from the `product` table instead of `productPDF`
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { pdfUrl: true }, // ✅ Use `pdfUrl` instead of `pdfContent`
        })

        if (!product || !product.pdfUrl) {
            return NextResponse.json({ error: 'No PDF found' }, { status: 404 })
        }

        return NextResponse.json({ url: product.pdfUrl }) // ✅ Directly return the S3 URL
    } catch (error) {
        console.error('Error fetching PDF:', error)
        return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 })
    }
}
