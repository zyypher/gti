import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { prisma } from '@/lib/prisma'

type ProductWithPDF = { id: string; pdfUrl: string }
type AdditionalPage = { id: string; position: number }

type GeneratePayload = {
    frontCorporateId: string
    backCorporateId: string
    productIds: string[]
    additionalPages: AdditionalPage[]
    clientId?: string
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

/** Draw the “Generated for …” panel on the FIRST page of the given PDF bytes. */
async function overlayClientPanelOnFirstPage(
    pdfBytes: ArrayBuffer,
    client:
        | {
            firstName: string
            lastName: string
            company: string
            primaryNumber: string
        }
        | null
): Promise<Uint8Array> {
    const donor = await PDFDocument.load(pdfBytes)

    // Fonts
    const helv = await donor.embedFont(StandardFonts.Helvetica)
    const helvBold = await donor.embedFont(StandardFonts.HelveticaBold)

    const page = donor.getPages()[0]

    const { width, height } = page.getSize()

    // Box geometry (bottom-right)
    const paddingX = 12
    const paddingY = 10
    const panelWidth = 320
    const lineH = 14
    const lines = client
        ? [
            { t: 'Generated For', bold: true },
            { t: `${client.firstName} ${client.lastName}` },
            { t: client.company },
            { t: client.primaryNumber },
        ]
        : [{ t: 'Generated For', bold: true }, { t: 'Internal Use' }]

    const panelHeight = paddingY * 2 + lineH * lines.length + 6
    const margin = 24
    const x = width - panelWidth - margin
    const y = margin

    // Header bar (slightly darker gray, thinner height)
    // ---- PANEL STYLE ----
    const headerHeight = lineH + paddingY - 2
    const borderColor = rgb(0.8, 0.8, 0.8)

    // Panel background (white with soft border)
    page.drawRectangle({
        x,
        y,
        width: panelWidth,
        height: panelHeight,
        color: rgb(1, 1, 1),
        borderColor,
        borderWidth: 0.8,
    })

    // Header bar (light gray, subtle contrast)
    page.drawRectangle({
        x,
        y: y + panelHeight - headerHeight,
        width: panelWidth,
        height: headerHeight,
        color: rgb(0.93, 0.93, 0.93),
    })

    // ---- HEADER TEXT ----
    const headerTextY = y + panelHeight - headerHeight / 2 - 5
    page.drawText('Generated For', {
        x: x + paddingX,
        y: headerTextY,
        size: 11,
        font: helvBold,
        color: rgb(0.15, 0.15, 0.15),
    })

    // ---- BODY TEXT ----
    let ty = headerTextY - lineH - 4
    const textLines = client
        ? [
            `${client.firstName} ${client.lastName}`,
            client.company,
            client.primaryNumber,
        ]
        : ['Internal Use']

    textLines.forEach((t) => {
        page.drawText(t, {
            x: x + paddingX,
            y: ty,
            size: 10,
            font: helv,
            color: rgb(0.1, 0.1, 0.1),
        })
        ty -= lineH
    })
    // ---------------------



    return donor.save()
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
            { status: 400 }
        )
    }

    try {
        // Optional client (for overlay text)
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

        // --- Corporate FRONT (logo) as first page, with overlay panel ---
        const front = await prisma.promotion.findUnique({
            where: { id: frontCorporateId },
            select: { filePath: true },
        })
        if (!front?.filePath) {
            return NextResponse.json({ error: 'Front corporate info missing' }, { status: 400 })
        }
        const frontRes = await fetch(front.filePath)
        if (!frontRes.ok) {
            return NextResponse.json({ error: 'Cannot fetch corporate front PDF' }, { status: 400 })
        }
        const frontBytes = await frontRes.arrayBuffer()
        const frontWithOverlay = await overlayClientPanelOnFirstPage(frontBytes, client)
        const donorFront = await PDFDocument.load(frontWithOverlay)
        const frontPages = await main.copyPages(donorFront, donorFront.getPageIndices())
        frontPages.forEach((p) => main.addPage(p))
        // ---------------------------------------------------------------

        // Build queue (positions unchanged from your UI logic)
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, pdfUrl: true },
        })
        const productsById = new Map(products.map((p) => [p.id, p]))
        const orderedProducts: ProductWithPDF[] = productIds
            .map((id) => productsById.get(id))
            .filter((p): p is ProductWithPDF => !!p)

        const addlIds = additionalPages.map((a) => a.id)
        const addl = await prisma.promotion.findMany({
            where: { id: { in: addlIds } },
            select: { id: true, filePath: true },
        })
        const addlById = new Map(addl.map((x) => [x.id, x.filePath ?? null]))

        type QueueItem = { position: number; url: string; kind: 'extra' | 'product' }
        const queue: QueueItem[] = []

        // Products keep original positions (index + 2) so they still sort after “After Corporate Info”
        orderedProducts.forEach((p, i) => {
            if (p.pdfUrl) queue.push({ position: i + 2, url: p.pdfUrl, kind: 'product' })
        })

        // Additional pages
        additionalPages.forEach((a) => {
            const fp = addlById.get(a.id)
            if (fp) queue.push({ position: a.position, url: fp, kind: 'extra' })
        })

        // Sort: by position; extras BEFORE products on ties
        queue.sort((a, b) =>
            a.position === b.position ? (a.kind === 'extra' ? -1 : 1) : a.position - b.position
        )

        // Append queued pages
        for (const item of queue) {
            await addPdfToDocument(main, item.url)
        }

        // Corporate BACK at end
        const back = await prisma.promotion.findUnique({
            where: { id: backCorporateId },
            select: { filePath: true },
        })
        if (!back?.filePath) {
            return NextResponse.json({ error: 'Back corporate info missing' }, { status: 400 })
        }
        await addPdfToDocument(main, back.filePath)

        const merged = await main.save()
        const pdfUrl = `data:application/pdf;base64,${Buffer.from(merged).toString('base64')}`
        return NextResponse.json({ url: pdfUrl })
    } catch (e) {
        console.error('Failed to generate PDF:', e)
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
