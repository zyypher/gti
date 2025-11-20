import { NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'
import fontkit from '@pdf-lib/fontkit'

export const runtime = 'nodejs'

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

// ---------------- Gotham font helpers ----------------

const GOTHAM_MEDIUM_PATH = path.join(
    process.cwd(),
    'public',
    'fonts',
    'Gotham-Medium.otf',
)

const GOTHAM_LIGHT_PATH = path.join(
    process.cwd(),
    'public',
    'fonts',
    'Gotham-ExtraLight.otf',
)

let gothamMediumCache: Uint8Array | null = null
let gothamLightCache: Uint8Array | null = null

async function getGothamMediumBytes(): Promise<Uint8Array> {
    if (!gothamMediumCache) {
        const buf = await fs.readFile(GOTHAM_MEDIUM_PATH)
        gothamMediumCache = new Uint8Array(buf)
    }
    return gothamMediumCache
}

async function getGothamLightBytes(): Promise<Uint8Array> {
    if (!gothamLightCache) {
        const buf = await fs.readFile(GOTHAM_LIGHT_PATH)
        gothamLightCache = new Uint8Array(buf)
    }
    return gothamLightCache
}

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

// ---------------- overlay front page ----------------

type SimpleClient = {
    firstName: string | null
    lastName: string | null
    company?: string | null
} | null

/**
 * Draw front-page meta:
 *   No. 0250001
 *   Created for: ...
 *   Created by: ...
 *   Date: DD/MM/YYYY
 */
async function overlayClientPanelOnFirstPage(
    pdfBytes: ArrayBuffer,
    client?: SimpleClient,
    createdBy?: { firstName: string | null; lastName: string | null } | null,
    opts?: {
        proposalNumber?: string
        createdDate?: Date
    },
): Promise<Uint8Array> {
    const donor = await PDFDocument.load(pdfBytes)
    donor.registerFontkit(fontkit)

    const [gothamMediumBytes, gothamLightBytes] = await Promise.all([
        getGothamMediumBytes(),
        getGothamLightBytes(),
    ])

    const gothamMedium = await donor.embedFont(gothamMediumBytes)
    const gothamLight = await donor.embedFont(gothamLightBytes)

    const page = donor.getPages()[0]
    const { width, height } = page.getSize()

    const fullCreator = buildName(createdBy?.firstName, createdBy?.lastName)
    const fullClient = buildName(client?.firstName, client?.lastName)

    const proposalNumberLabel = opts?.proposalNumber
        ? `No. ${opts.proposalNumber.toString().padStart(6, '0')}`
        : ''

    const createdDate = opts?.createdDate ?? new Date()
    const dateText = [
        createdDate.getDate().toString().padStart(2, '0'),
        (createdDate.getMonth() + 1).toString().padStart(2, '0'),
        createdDate.getFullYear(),
    ].join('/')

    // Black box geometry
    const BLACK_BOX_LEFT = width * 0.10
    const BLACK_BOX_RIGHT = width * 0.90
    const BLACK_BOX_TOP = height * 0.72
    const BLACK_BOX_BOTTOM = height * 0.13

    // === NEW: Shift right by 100px ===
    const rightShift = 70

    const leftPadding = BLACK_BOX_LEFT + 38 + rightShift

    const headingBottomY = BLACK_BOX_TOP - 180

    // ---------------- PROPOSAL NUMBER (100px right) ----------------
    if (proposalNumberLabel) {
        const proposalFontSize = 22
        const proposalY = headingBottomY - 52

        page.drawText(proposalNumberLabel, {
            x: leftPadding,
            y: proposalY,
            size: proposalFontSize,
            font: gothamMedium,
            color: rgb(1, 1, 1),
        })
    }

    // ---------------- META BLOCK (100px right + 100px up) ----------------
    const metaFontSize = 12
    const lineHeight = 18

    const metaStartX = BLACK_BOX_LEFT + 38 + rightShift
    const metaStartY = BLACK_BOX_BOTTOM + 28 + 100  // +100px up

    const metaLines: string[] = []

    if (fullClient) {
        const companySuffix = client?.company ? ` / ${client.company}` : ''
        metaLines.push(`Created for: ${fullClient}${companySuffix}`)
    }
    if (fullCreator) {
        metaLines.push(`Created by: ${fullCreator} / GTI`)
    }
    metaLines.push(`Date: ${dateText}`)

    let y = metaStartY
    for (const line of metaLines) {
        page.drawText(line, {
            x: metaStartX,
            y,
            size: metaFontSize,
            font: gothamLight,
            color: rgb(1, 1, 1),
        })
        y -= lineHeight
    }

    return donor.save()
}



// ---------------- route handler ----------------

export async function POST(req: Request) {
    let payload: GeneratePayload
    try {
        payload = (await req.json()) as GeneratePayload
    } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const { frontCorporateId, backCorporateId, productIds, additionalPages, clientId } =
        payload
    if (!frontCorporateId || !backCorporateId) {
        return NextResponse.json(
            { error: 'frontCorporateId and backCorporateId are required' },
            { status: 400 },
        )
    }

    try {
        // Get next proposal number
        const lastWithNumber = await prisma.sharedPDF.findFirst({
            where: { proposalNumber: { not: null } },
            orderBy: { proposalNumber: 'desc' },
            select: { proposalNumber: true },
        })

        let proposalNumber = 25001
        if (lastWithNumber?.proposalNumber && lastWithNumber.proposalNumber >= 25001) {
            proposalNumber = lastWithNumber.proposalNumber + 1
        }

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
        const frontRes = await fetch(front.filePath as string)
        if (!frontRes.ok) {
            return NextResponse.json(
                { error: 'Cannot fetch corporate front PDF' },
                { status: 400 },
            )
        }
        const frontBytes = await frontRes.arrayBuffer()

        const simpleClient: SimpleClient = client
            ? {
                firstName: client.firstName,
                lastName: client.lastName,
                company: client.company,
            }
            : null

        const frontWithOverlay = await overlayClientPanelOnFirstPage(
            frontBytes,
            simpleClient,
            creator ?? null,
            {
                proposalNumber: proposalNumber.toString(),
                createdDate: new Date(),
            },
        )

        const donorFront = await PDFDocument.load(frontWithOverlay)
        const frontPages = await main.copyPages(donorFront, donorFront.getPageIndices())
        frontPages.forEach((p) => main.addPage(p))

        // Build queue for products + additional pages
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
            addl.filter((x) => x.filePath).map((x) => [x.id, x.filePath as string]),
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
            a.position === b.position
                ? a.kind === 'extra'
                    ? -1
                    : 1
                : a.position - b.position,
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
        await addPdfToDocument(main, back.filePath as string)

        const merged = await main.save()
        const base64 = Buffer.from(merged).toString('base64')
        const pdfUrl = `data:application/pdf;base64,${base64}`

        return NextResponse.json({ url: pdfUrl, proposalNumber })
    } catch (e) {
        console.error('Failed to generate PDF:', e)
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
