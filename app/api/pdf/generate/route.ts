import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PDFDocument } from 'pdf-lib'

const prisma = new PrismaClient()

export async function POST(req: Request) {
    const { productIds } = await req.json()

    try {
        // Fetch products and get their PDF content
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
            },
            select: {
                pdfContent: true,  // Select the binary PDF content
            },
        })

        if (!products.length) {
            return NextResponse.json({ error: 'No products found' }, { status: 404 })
        }

        const pdfDoc = await PDFDocument.create()

        // Process each product's PDF content
        for (const product of products) {
            if (product.pdfContent) {
                const productPdf = await PDFDocument.load(product.pdfContent)
                const copiedPages = await pdfDoc.copyPages(productPdf, productPdf.getPageIndices())
                copiedPages.forEach((page) => pdfDoc.addPage(page))
            }
        }

        // Save the merged PDF to a buffer
        const mergedPdfBytes = await pdfDoc.save()

        // Convert the PDF buffer to a base64 string
        const pdfBase64 = Buffer.from(mergedPdfBytes).toString('base64')
        const pdfUrl = `data:application/pdf;base64,${pdfBase64}`

        return NextResponse.json({ url: pdfUrl })
    } catch (error) {
        console.error('Error generating PDF:', error)
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
