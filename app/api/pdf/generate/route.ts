import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PDFDocument } from 'pdf-lib'

const prisma = new PrismaClient()

export async function POST(req: Request) {
    const { bannerId, advertisementId, productIds } = await req.json()

    try {
        // Fetch Banner from Promotion table
        const banner = await prisma.promotion.findUnique({
            where: { id: bannerId, type: 'banner' },
            select: { fileData: true }
        })

        console.log('##banner', banner)

        // Fetch Advertisement from Promotion table
        const advertisement = await prisma.promotion.findUnique({
            where: { id: advertisementId, type: 'advertisement' },
            select: { fileData: true }
        })
        console.log('##advertisement', advertisement)

        // Fetch Product PDFs from ProductPDF table
        const products = await prisma.productPDF.findMany({
            where: { productId: { in: productIds } },
            select: { pdfContent: true }
        })

        console.log('##products', products)


        // Check if all required files exist
        if (!banner || !advertisement || products.length === 0) {
            return NextResponse.json({ error: 'Invalid selection: Missing banner, advertisement, or product PDFs' }, { status: 400 })
        }

        const pdfDoc = await PDFDocument.create()

        // Add Banner first
        if (banner.fileData) {
            const bannerPdf = await PDFDocument.load(banner.fileData)
            const copiedPages = await pdfDoc.copyPages(bannerPdf, bannerPdf.getPageIndices())
            copiedPages.forEach((page) => pdfDoc.addPage(page))
        }

        // Add Products in order
        for (const product of products) {
            if (product.pdfContent) {
                const productPdf = await PDFDocument.load(product.pdfContent)
                const copiedPages = await pdfDoc.copyPages(productPdf, productPdf.getPageIndices())
                copiedPages.forEach((page) => pdfDoc.addPage(page))
            }
        }

        // Add Advertisement last
        if (advertisement.fileData) {
            const adPdf = await PDFDocument.load(advertisement.fileData)
            const copiedPages = await pdfDoc.copyPages(adPdf, adPdf.getPageIndices())
            copiedPages.forEach((page) => pdfDoc.addPage(page))
        }

        const mergedPdfBytes = await pdfDoc.save()
        const pdfBase64 = Buffer.from(mergedPdfBytes).toString('base64')
        const pdfUrl = `data:application/pdf;base64,${pdfBase64}`

        return NextResponse.json({ url: pdfUrl })
    } catch (error) {
        console.error('Error generating PDF:', error)
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
