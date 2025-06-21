import { NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { prisma } from '@/lib/prisma'

// ✅ Define Product Type
interface ProductWithPDF {
    id: string
    pdfUrl: string | null
}

interface AdditionalPage {
    id: string
    position: number
}

export async function POST(req: Request) {
    const {
        bannerId,
        productIds,
        additionalPages,
    }: {
        bannerId: string
        productIds: string[]
        additionalPages: AdditionalPage[]
    } = await req.json()

    try {
        // ✅ Fetch Banner
        const banner = await prisma.promotion.findUnique({
            where: { id: bannerId, type: 'banner' },
            select: { filePath: true },
        })

        if (!banner?.filePath) {
            return NextResponse.json(
                { error: 'Banner PDF is missing.' },
                { status: 400 },
            )
        }

        // ✅ Fetch Product PDFs
        const products: ProductWithPDF[] = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, pdfUrl: true },
        })

        const orderedProducts: ProductWithPDF[] = productIds
            .map((id) => products.find((p) => p.id === id) || null)
            .filter((p): p is ProductWithPDF => p !== null && p.pdfUrl !== null)

        const additionalPageIds = additionalPages.map((p) => p.id)
        const additionalPageDetails = await prisma.promotion.findMany({
            where: { id: { in: additionalPageIds } },
            select: { id: true, filePath: true },
        })

        console.log('## Banner:', banner)
        console.log('## Ordered Products:', orderedProducts)

        // ✅ Validate Inputs
        if (orderedProducts.some((product) => !product.pdfUrl)) {
            console.error('🚨 Some products are missing PDFs.')
        }

        const pdfDoc = await PDFDocument.create()

        // ✅ Add Banner First & Confirm
        await addPdfToDocument(pdfDoc, banner.filePath)
        console.log('✅ Banner Added')

        // ✅ Prepare all pages to be inserted
        const allPages: { position: number; url: string }[] = []
        
        // Add product pages starting from position 2
        orderedProducts.forEach((product, index) => {
            if (product.pdfUrl) {
                allPages.push({ position: index + 2, url: product.pdfUrl })
            }
        })
        
        // Add additional pages
        additionalPages.forEach(page => {
            const detail = additionalPageDetails.find(d => d.id === page.id)
            if (detail?.filePath) {
                allPages.push({ position: page.position, url: detail.filePath })
            }
        })
        
        // Sort all pages by position
        allPages.sort((a, b) => a.position - b.position)

        // ✅ Add all sorted pages to the document & Confirm
        for (const page of allPages) {
            await addPdfToDocument(pdfDoc, page.url)
            console.log(`✅ Page Added: ${page.position}`)
        }

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