import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { prisma } from '@/lib/prisma'

type ProductWithPDF = { id: string; pdfUrl: string } // <- non-null
type AdditionalPage = { id: string; position: number }

type GeneratePayload = {
    frontCorporateId: string
    backCorporateId: string
    productIds: string[]
    additionalPages: AdditionalPage[]
    clientId?: string
}

async function createCoverPage(
    client:
        | {
            firstName: string
            lastName: string
            company: string
            primaryNumber: string
        }
        | null,
) {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontSize = 12

    let y = height - 40
    const addText = (text: string) => {
        if (!text) return
        page.drawText(text, {
            x: 50,
            y,
            font,
            size: fontSize,
            color: rgb(0, 0, 0),
        })
        y -= 20
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
    let payload: GeneratePayload
    try {
        payload = (await req.json()) as GeneratePayload
    } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const { frontCorporateId, backCorporateId, productIds, additionalPages, clientId } = payload

    if (!frontCorporateId || !backCorporateId) {
        return NextResponse.json(
            { error: 'frontCorporateId and backCorporateId are required' },
            { status: 400 },
        )
    }

    try {
        // Optional client (for cover page)
        const client = clientId
            ? await prisma.client.findUnique({
                where: { id: clientId },
                select: {
                    firstName: true,
                    lastName: true,
                    company: true,
                    primaryNumber: true,
                },
            })
            : null

        const main = await PDFDocument.create()

        // 1) Cover
        const coverPdf = await createCoverPage(client)
        const coverPages = await main.copyPages(coverPdf, coverPdf.getPageIndices())
        coverPages.forEach((p) => main.addPage(p))

        // 2) Corporate FRONT (must exist) – added immediately after cover
        const front = await prisma.promotion.findUnique({
            where: { id: frontCorporateId },
            select: { filePath: true },
        })
        if (!front?.filePath) {
            return NextResponse.json({ error: 'Front corporate info missing' }, { status: 400 })
        }
        await addPdfToDocument(main, front.filePath)

        // 3) Build queue for Products & Additional pages (adverts/promotions)
        //    Keep existing positions mapping:
        //    - Product 1 => position 2 (after corporate front), Product 2 => 3, etc.
        //    - Additional "After Corporate Info" also uses position 2.
        //    Tie-break: extras come BEFORE products at the same position.

        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, pdfUrl: true }, // pdfUrl is string (non-null) in your schema
        })

        const productsById = new Map(products.map((p) => [p.id, p]))
        const orderedProducts: ProductWithPDF[] = productIds
            .map((id) => productsById.get(id)) // (ProductWithPDF | undefined)[]
            .filter((p): p is ProductWithPDF => !!p) // narrow to ProductWithPDF

        // Fetch additional pages file paths
        const addlIds = additionalPages.map((a) => a.id)
        const addl = await prisma.promotion.findMany({
            where: { id: { in: addlIds } },
            select: { id: true, filePath: true },
        })
        const addlById = new Map(addl.map((x) => [x.id, x.filePath ?? null]))

        type QueueItem = { position: number; url: string; kind: 'extra' | 'product' }
        const queue: QueueItem[] = []

        // Products: keep original positions (index + 2)
        orderedProducts.forEach((p, i) => {
            if (p.pdfUrl) queue.push({ position: i + 2, url: p.pdfUrl, kind: 'product' })
        })

        // Additional pages with chosen positions
        additionalPages.forEach((a) => {
            const fp = addlById.get(a.id)
            if (fp) queue.push({ position: a.position, url: fp, kind: 'extra' })
        })

        // Sort by position; extras BEFORE products on ties
        queue.sort((a, b) =>
            a.position === b.position ? (a.kind === 'extra' ? -1 : 1) : a.position - b.position,
        )

        // Append all queued pages in order
        for (const item of queue) {
            await addPdfToDocument(main, item.url)
        }

        // 4) Corporate BACK (must exist) – appended as the final page
        const back = await prisma.promotion.findUnique({
            where: { id: backCorporateId },
            select: { filePath: true },
        })
        if (!back?.filePath) {
            return NextResponse.json({ error: 'Back corporate info missing' }, { status: 400 })
        }
        await addPdfToDocument(main, back.filePath)

        // 5) Return merged PDF as data URL
        const merged = await main.save()
        const pdfUrl = `data:application/pdf;base64,${Buffer.from(merged).toString('base64')}`
        return NextResponse.json({ url: pdfUrl })
    } catch (e) {
        console.error('Failed to generate PDF:', e)
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}

/** Fetch a PDF by URL and append all its pages into pdfDoc */
async function addPdfToDocument(pdfDoc: PDFDocument, pdfUrl: string): Promise<void> {
    if (!pdfUrl) return
    try {
        const res = await fetch(pdfUrl)
        if (!res.ok) throw new Error(`Failed to fetch PDF: ${pdfUrl}`)
        const buf = await res.arrayBuffer()
        const donor = await PDFDocument.load(buf)
        const pages = await pdfDoc.copyPages(donor, donor.getPageIndices())
        pages.forEach((p) => pdfDoc.addPage(p))
    } catch (err) {
        console.error(`Error adding PDF from ${pdfUrl}:`, err)
    }
}
