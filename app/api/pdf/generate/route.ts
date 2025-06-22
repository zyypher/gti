import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken } from '@/lib/getUserIdFromToken'

// ✅ Define Product Type
interface ProductWithPDF {
    id: string
    pdfUrl: string | null
}

interface AdditionalPage {
    id: string
    position: number
}

async function createCoverPage(
    client: {
        firstName: string
        lastName: string
        company: string
        primaryNumber: string
    } | null,
) {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontSize = 12

    let y = height - 40
    const addText = (text: string) => {
        if (text) {
            page.drawText(text, {
                x: 50,
                y,
                font,
                size: fontSize,
                color: rgb(0, 0, 0),
            })
            y -= 20
        }
    }

    addText('Generated For:')
    y -= 10

    if (client) {
        addText(`Client: ${client.firstName} ${client.lastName}`)
        addText(`Company: ${client.company}`)
        addText(`Contact: ${client.primaryNumber}`)
    } else {
        addText('Internal Use')
    }

    return pdfDoc
}

export async function POST(req: Request) {
    const userId = getUserIdFromToken(req)
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
        bannerId,
        productIds,
        additionalPages,
        clientId,
        corporateInfoId,
    }: {
        bannerId: string
        productIds: string[]
        additionalPages: AdditionalPage[]
        clientId?: string
        corporateInfoId?: string
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

        let client = null
        if (clientId) {
            client = await prisma.client.findUnique({
                where: { id: clientId },
            })
        }

        const mainPdfDoc = await PDFDocument.create()

        const coverPdf = await createCoverPage(client)
        const copiedCoverPages = await mainPdfDoc.copyPages(
            coverPdf,
            coverPdf.getPageIndices(),
        )
        copiedCoverPages.forEach((page) => mainPdfDoc.addPage(page))

        // Add Corporate Info as the first page (after cover) if selected
        if (corporateInfoId) {
            const corporateInfo = await prisma.promotion.findUnique({
                where: { id: corporateInfoId },
            })
            if (corporateInfo?.filePath) {
                await addPdfToDocument(mainPdfDoc, corporateInfo.filePath)
            }
        }

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
            await addPdfToDocument(mainPdfDoc, page.url)
            console.log(`✅ Page Added: ${page.position}`)
        }

        // ✅ Save and Return Merged PDF
        const mergedPdfBytes = await mainPdfDoc.save()
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