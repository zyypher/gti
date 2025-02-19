import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
    req: Request,
    { params }: { params: { slug: string } },
) {
    const { slug } = params

    console.log('Received Slug:', slug)

    const sharedPdf = await prisma.sharedPDF.findUnique({
        where: { uniqueSlug: slug },
    })

    if (!sharedPdf) {
        return NextResponse.json(
            { error: 'Shared link not found' },
            { status: 404 },
        )
    }

    const productIds = sharedPdf.productIds.split(',')

    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { brand: true },
    })

    return NextResponse.json({ products })
}
