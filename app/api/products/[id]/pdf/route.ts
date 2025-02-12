import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const productId = params.id

    try {
        const pdfRecord = await prisma.productPDF.findUnique({
            where: { productId },
            select: { pdfContent: true },
        })

        if (!pdfRecord || !pdfRecord.pdfContent) {
            return NextResponse.json({ error: 'No PDF found' }, { status: 404 })
        }

        // Convert binary data to Base64
        const pdfBase64 = Buffer.from(pdfRecord.pdfContent).toString('base64')
        const pdfUrl = `data:application/pdf;base64,${pdfBase64}`

        return NextResponse.json({ url: pdfUrl })
    } catch (error) {
        console.error('Error fetching PDF:', error)
        return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 })
    }
}
