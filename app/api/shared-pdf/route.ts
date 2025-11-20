import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

type SharedPdfRow = {
    id: string
    uniqueSlug: string
    productIds: string
    createdAt: Date
    expiresAt: Date
    createdById: string
    clientId: string | null
    proposalNumber: number | null
    client?: {
        id: string
        firstName: string
        lastName: string
        email: string | null
    } | null
}

const BASE_PROPOSAL_NUMBER = 25001

// ✅ Middleware to Extract User ID (Example - Adjust for Auth System)
async function getUserIdFromToken(req: Request): Promise<string | null> {
    try {
        const token = cookies().get('token')?.value
        if (!token) {
            console.error('🚨 No token found in cookies.')
            return null
        }

        console.log('✅ Found token:', token)

        const secret = new TextEncoder().encode(process.env.JWT_SECRET)
        const { payload } = await jwtVerify(token, secret)

        console.log('✅ Extracted JWT Payload:', payload)

        if (!payload || typeof payload !== 'object') {
            console.error('🚨 Invalid JWT payload format:', payload)
            return null
        }

        const userId = (payload as any).userId || (payload as any).id || (payload as any).sub

        if (!userId) {
            console.error('🚨 No userId found in payload:', payload)
            return null
        }

        console.log('✅ Extracted User ID:', userId)
        return userId as string
    } catch (error) {
        console.error('🚨 Error verifying token:', error)
        return null
    }
}

// ✅ GET Method: Fetch PDFs (you can later restrict by user if needed)
export async function GET(req: Request) {
    try {
        const url = new URL(req.url)

        // Filters
        const dateStr = url.searchParams.get('date') // yyyy-MM-dd
        const clientId = url.searchParams.get('clientId') || undefined
        const productId = url.searchParams.get('productId') || undefined
        const productName = url.searchParams.get('product') || undefined // free-text product name

        // Base where (can be extended safely)
        const where: any = {}
        if (clientId) where.clientId = clientId
        if (dateStr) {
            const d = new Date(dateStr)
            where.createdAt = { gte: startOfDay(d), lte: endOfDay(d) }
        }

        // Pull PDFs (without products first)
        const rows: SharedPdfRow[] = await prisma.sharedPDF.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                client: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        })

        if (!rows.length) return NextResponse.json([])

        // Parse all product ids used across these PDFs and fetch them once
        const allIds = new Set<string>()
        const parsedIdsByPdf = new Map<string, string[]>()

        for (const r of rows) {
            const ids = r.productIds
                ? r.productIds
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : []
            parsedIdsByPdf.set(r.id, ids)
            ids.forEach((id) => allIds.add(id))
        }

        const allProducts = await prisma.product.findMany({
            where: { id: { in: Array.from(allIds) } },
            select: { id: true, name: true, pdfUrl: true },
        })
        const productMap = new Map(allProducts.map((p) => [p.id, p]))

        // Optional product filtering
        const matchesProduct = (ids: string[]) => {
            if (productId) return ids.includes(productId)

            if (productName && productName.trim()) {
                const q = productName.trim().toLowerCase()
                return ids.some((id) => {
                    const p = productMap.get(id)
                    return p ? p.name.toLowerCase().includes(q) : false
                })
            }

            return true
        }

        // Build final response with products attached and product filter applied
        const result = rows
            .filter((r) => matchesProduct(parsedIdsByPdf.get(r.id) ?? []))
            .map((r) => {
                const ids = parsedIdsByPdf.get(r.id) ?? []
                return {
                    id: r.id,
                    uniqueSlug: r.uniqueSlug,
                    createdAt: r.createdAt,
                    expiresAt: r.expiresAt,
                    client: r.client ?? null,
                    proposalNumber: r.proposalNumber,
                    products: ids
                        .map((id) => productMap.get(id))
                        .filter(Boolean) as { id: string; name: string; pdfUrl: string }[],
                }
            })

        return NextResponse.json(result)
    } catch (err) {
        console.error('GET /api/shared-pdf error:', err)
        return NextResponse.json(
            { error: 'Failed to fetch generated PDFs' },
            { status: 500 },
        )
    }
}

// ✅ POST Method: Create a New Shared PDF & Assign Creator & Proposal Number
export async function POST(req: Request) {
    try {
        // expiresAt from the body is no longer used – Prisma still needs *some* value.
        let { productIds, clientId } = await req.json()

        const userId = await getUserIdFromToken(req)

        if (!userId) {
            console.error('🚨 No user ID found in token.')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('✅ Extracted User ID:', userId)

        const userExists = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!userExists) {
            console.error('🚨 Invalid createdById, user does not exist:', userId)
            return NextResponse.json(
                { error: 'User does not exist' },
                { status: 400 },
            )
        }

        if (typeof productIds === 'string') {
            productIds = productIds.split(',').map((id: string) => id.trim())
        }

        if (!Array.isArray(productIds) || productIds.length === 0) {
            console.error('🚨 Invalid productIds format:', productIds)
            return NextResponse.json(
                { error: 'Invalid productIds format' },
                { status: 400 },
            )
        }

        const lastWithNumber = await prisma.sharedPDF.findFirst({
            where: { proposalNumber: { not: null } },
            orderBy: { proposalNumber: 'desc' },
            select: { proposalNumber: true },
        })

        let nextProposalNumber = BASE_PROPOSAL_NUMBER
        if (
            lastWithNumber?.proposalNumber &&
            lastWithNumber.proposalNumber >= BASE_PROPOSAL_NUMBER
        ) {
            nextProposalNumber = lastWithNumber.proposalNumber + 1
        }

        const uniqueSlug = nanoid(10)

        const sharedPdf = await prisma.sharedPDF.create({
            data: {
                uniqueSlug,
                productIds: productIds.join(','),
                createdById: userId,
                proposalNumber: nextProposalNumber,
                ...(clientId && { clientId }),
                // 🔹 REQUIRED: Prisma schema says expiresAt is non-nullable
                //   We don't use it anymore, so set a dummy value (now).
                expiresAt: new Date(),
            },
        })

        console.log('✅ Shared PDF Created Successfully:', sharedPdf)

        const fileName = `GTI_PROPOSAL_${sharedPdf.proposalNumber ?? nextProposalNumber}.pdf`

        return NextResponse.json({
            slug: sharedPdf.uniqueSlug,
            url: `/shared/${sharedPdf.uniqueSlug}`,
            proposalNumber: sharedPdf.proposalNumber,
            fileName,
        })
    } catch (error) {
        console.error('🚨 Error creating shared PDF:', error)
        return NextResponse.json(
            { error: 'Failed to create shared PDF' },
            { status: 500 },
        )
    }
}
