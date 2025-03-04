import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PDFDocument } from 'pdf-lib'
import fetch from 'node-fetch'

const prisma = new PrismaClient()

// ✅ Define Product Type
interface ProductWithPDF {
    id: string
    pdfUrl: string | null
}

export async function POST(req: Request) {
    const {
        bannerId,
        advertisementId,
        productIds,
    }: { bannerId: string; advertisementId: string; productIds: string[] } =
        await req.json()

    try {
        // ✅ Fetch Banner
        const banner = await prisma.promotion.findUnique({
            where: { id: bannerId, type: 'banner' },
            select: { filePath: true },
        })

        // ✅ Fetch Advertisement
        const advertisement = await prisma.promotion.findUnique({
            where: { id: advertisementId, type: 'advertisement' },
            select: { filePath: true },
        })

        // ✅ Fetch Product PDFs
        const products: ProductWithPDF[] = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, pdfUrl: true },
        })

        // ✅ Preserve order of selected products
        const orderedProducts: ProductWithPDF[] = productIds
            .map((productId: string): ProductWithPDF | null => {
                return products.find((p) => p.id === productId) ?? null
            })
            .filter((product): product is ProductWithPDF => product !== null) // ✅ Ensure TypeScript knows this is a ProductWithPDF

        console.log('## Banner:', banner)
        console.log('## Advertisement:', advertisement)
        console.log('## Ordered Products:', orderedProducts)

        // ✅ Validate Inputs
        if (!banner?.filePath || !advertisement?.filePath) {
            console.error('🚨 Missing banner or advertisement PDF.')
            return NextResponse.json(
                { error: 'Missing banner or advertisement PDF' },
                { status: 400 },
            )
        }

        if (orderedProducts.some((product) => !product.pdfUrl)) {
            console.error('🚨 Some products are missing PDFs.')
        }

        const pdfDoc = await PDFDocument.create()

        // ✅ Add Banner First & Confirm
        await addPdfToDocument(pdfDoc, banner.filePath)
        console.log('✅ Banner Added')

        // ✅ Add Product PDFs in order & Confirm
        for (const product of orderedProducts) {
            if (product.pdfUrl) {
                await addPdfToDocument(pdfDoc, product.pdfUrl)
                console.log(`✅ Product PDF Added: ${product.id}`)
            }
        }

        // ✅ Add Advertisement Last & Confirm
        await addPdfToDocument(pdfDoc, advertisement.filePath)
        console.log('✅ Advertisement Added')

        // ✅ Save and Return Merged PDF
        const mergedPdfBytes = await pdfDoc.save()
        const pdfBase64 = Buffer.from(mergedPdfBytes).toString('base64')
        const pdfUrl = `data:application/pdf;base64,${pdfBase64}`

        return NextResponse.json({ url: pdfUrl })
    } catch (error) {
        console.error('Error generating PDF:', error)
        return NextResponse.json(
            { error: 'Failed to generate PDF' },
            { status: 500 },
        )
    }
}

/**
 * **Helper function to fetch and add PDF to the merged document**
 */
async function addPdfToDocument(pdfDoc: PDFDocument, pdfUrl: string) {
    if (!pdfUrl) {
        console.error('🚨 Missing PDF URL:', pdfUrl);
        return;
    }

    try {
        console.log(`📥 Fetching PDF from: ${pdfUrl}`);
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error(`❌ Failed to fetch PDF: ${pdfUrl}`);

        const pdfBuffer = await response.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBuffer);

        // Copy pages and add to main document
        const copiedPages = await pdfDoc.copyPages(pdf, pdf.getPageIndices());

        if (copiedPages.length === 0) {
            console.error(`🚨 No pages copied from: ${pdfUrl}`);
        } else {
            console.log(`✅ Successfully added ${copiedPages.length} pages from ${pdfUrl}`);
        }

        copiedPages.forEach((page) => pdfDoc.addPage(page));
    } catch (error) {
        console.error(`🚨 Error adding PDF from ${pdfUrl}:`, error);
    }
}