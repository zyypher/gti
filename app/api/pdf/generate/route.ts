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

type CreatorUser = {
    firstName: string | null
    lastName: string | null
} | null

type ClientInfo = {
    firstName: string | null
    lastName: string | null
    company: string | null
    primaryNumber: string | null
} | null

/** Fetch a PDF by URL and append all its pages into pdfDoc */
async function addPdfToDocument(pdfDoc: PDFDocument, pdfUrl: string): Promise<void> {
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

const buildName = (first?: string | null, last?: string | null) => {
    const parts = [first, last].filter(Boolean) as string[]
    return parts.join(' ').trim()
}

/**
 * Draw:
 *   Created by: <user name>
 *   Created for: <client name>
 *
 * Labels ("Created by:", "Created for:") are bold, values normal.
 * Columns are vertically aligned and the whole block is right-aligned
 * with some padding from the right edge.
 */
async function overlayClientPanelOnFirstPage(
    pdfBytes: ArrayBuffer,
    client?: { firstName: string | null; lastName: string | null } | null,
    createdBy?: { firstName: string | null; lastName: string | null } | null
): Promise<Uint8Array> {
    const donor = await PDFDocument.load(pdfBytes)

    const font = await donor.embedFont(StandardFonts.Helvetica)
    const fontBold = await donor.embedFont(StandardFonts.HelveticaBold)

    const page = donor.getPages()[0]
    const { width } = page.getSize()

    const fullCreator = buildName(createdBy?.firstName, createdBy?.lastName)
    const fullClient = buildName(client?.firstName, client?.lastName)

    // Nothing to draw → just return original
    if (!fullCreator && !fullClient) {
        return donor.save()
    }

    // Build rows explicitly so we can align label/value columns
    const rows: { label: string; value: string }[] = []
    if (fullCreator) rows.push({ label: 'Created by:', value: fullCreator })
    if (fullClient) rows.push({ label: 'Created for:', value: fullClient })

    const fontSizeLabel = 12
    const fontSizeValue = 12
    const paddingRight = 60 // distance from right edge
    const lineHeight = 18
    const gap = 10 // space between label and value columns

    // Measure max label width and total width for right-alignment
    let maxLabelWidth = 0
    let maxTotalWidth = 0

    rows.forEach(({ label, value }) => {
        const labelWidth = fontBold.widthOfTextAtSize(label, fontSizeLabel)
        const valueWidth = font.widthOfTextAtSize(value, fontSizeValue)
        const totalWidth = labelWidth + gap + valueWidth

        if (labelWidth > maxLabelWidth) maxLabelWidth = labelWidth
        if (totalWidth > maxTotalWidth) maxTotalWidth = totalWidth
    })

    // Right-align whole block
    const xLabel = width - paddingRight - maxTotalWidth
    const xValue = xLabel + maxLabelWidth + gap
    let y = 90 // vertical position from bottom

    rows.forEach(({ label, value }) => {
        // label (bold)
        page.drawText(label, {
            x: xLabel,
            y,
            size: fontSizeLabel,
            font: fontBold,
            color: rgb(0, 0, 0),
        })

        // value (normal) – guaranteed space between colon and value via `gap`
        page.drawText(value, {
            x: xValue,
            y,
            size: fontSizeValue,
            font,
            color: rgb(0, 0, 0),
        })

        y -= lineHeight
    })

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
        // current user (for "Created by")
        let creator: CreatorUser = null
        try {
            const { origin } = new URL(req.url)
            const meRes = await fetch(`${origin}/api/users/me`, {
                headers: {
                    cookie: req.headers.get('cookie') ?? '',
                },
                cache: 'no-store',
            })

            if (meRes.ok) {
                const me = await meRes.json()
                creator = {
                    firstName: me.firstName ?? null,
                    lastName: me.lastName ?? null,
                }
            }
        } catch (err) {
            console.error('Failed to fetch current user for PDF overlay:', err)
        }

        // Optional client (for "Created for")
        const client: ClientInfo = clientId
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

        // Corporate FRONT as first page, with overlay panel
        const front = await prisma.promotion.findUnique({
            where: { id: frontCorporateId },
            select: { filePath: true },
        })
        if (!front?.filePath) {
            return NextResponse.json({ error: 'Front corporate info missing' }, { status: 400 })
        }
        const frontUrl = front.filePath as string
        const frontRes = await fetch(frontUrl)
        if (!frontRes.ok) {
            return NextResponse.json({ error: 'Cannot fetch corporate front PDF' }, { status: 400 })
        }
        const frontBytes = await frontRes.arrayBuffer()

        // simplify client object to only first/last name for overlay
        const simpleClient = client
            ? { firstName: client.firstName, lastName: client.lastName }
            : null

        const frontWithOverlay = await overlayClientPanelOnFirstPage(
            frontBytes,
            simpleClient,
            creator ?? undefined
        )
        const donorFront = await PDFDocument.load(frontWithOverlay)
        const frontPages = await main.copyPages(donorFront, donorFront.getPageIndices())
        frontPages.forEach((p) => main.addPage(p))

        // Build queue (positions unchanged)
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
        const addlById = new Map(
            addl.filter((x) => x.filePath).map((x) => [x.id, x.filePath as string])
        )

        type QueueItem = { position: number; url: string; kind: 'extra' | 'product' }
        const queue: QueueItem[] = []

        orderedProducts.forEach((p, i) => {
            if (p.pdfUrl) queue.push({ position: i + 2, url: p.pdfUrl, kind: 'product' })
        })

        additionalPages.forEach((a) => {
            const fp = addlById.get(a.id)
            if (fp) queue.push({ position: a.position, url: fp, kind: 'extra' })
        })

        queue.sort((a, b) =>
            a.position === b.position ? (a.kind === 'extra' ? -1 : 1) : a.position - b.position
        )

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
        const backUrl = back.filePath as string
        await addPdfToDocument(main, backUrl)

        const merged = await main.save()
        const pdfUrl = `data:application/pdf;base64,${Buffer.from(merged).toString('base64')}`
        return NextResponse.json({ url: pdfUrl })
    } catch (e) {
        console.error('Failed to generate PDF:', e)
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
