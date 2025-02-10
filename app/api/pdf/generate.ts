import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PDFDocument } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export async function POST(req: Request) {
    const { productIds } = await req.json()

    try {
        // Fetch products with the correct field name
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
            },
            select: {
                pdfPath: true,  // Adjusted to match your schema
            },
        })

        if (!products.length) {
            return NextResponse.json({ error: 'No products found' }, { status: 404 })
        }

        const pdfDoc = await PDFDocument.create()

        for (const product of products) {
            if (product.pdfPath && fs.existsSync(product.pdfPath)) {
                const pdfBytes = fs.readFileSync(product.pdfPath)
                const productPdf = await PDFDocument.load(pdfBytes)
                const copiedPages = await pdfDoc.copyPages(productPdf, productPdf.getPageIndices())
                copiedPages.forEach((page) => pdfDoc.addPage(page))
            }
        }

        const mergedPdfBytes = await pdfDoc.save()
        const outputPath = path.join('/tmp', 'merged-document.pdf')
        fs.writeFileSync(outputPath, mergedPdfBytes)

        return NextResponse.json({ url: `/api/pdf/download?file=${outputPath}` })
    } catch (error) {
        console.error('Error generating PDF:', error)
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
