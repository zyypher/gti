import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function sniffMimeFromBytes(bytes?: Uint8Array | null): 'image/png' | 'image/jpeg' | null {
    if (!bytes || bytes.length < 4) return null
    if (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
    ) {
        return 'image/png'
    }
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return 'image/jpeg'
    }
    return null
}

const ALLOWED_MIMES = new Set(['image/png', 'image/jpeg'])

/**
 * GET /api/brands
 *
 * - Default: light brands (no image data) for fast lists / filters.
 * - ?withImage=1: includes base64 image data for full cards.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const withImage = searchParams.get('withImage') === '1'

        if (!withImage) {
            const brands = await prisma.brand.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { updatedAt: 'desc' },
            })

            const normalized = brands.map((b) => ({
                ...b,
                image: null as null,
            }))

            return NextResponse.json(normalized)
        }

        const brands = await prisma.brand.findMany({
            orderBy: { updatedAt: 'desc' },
        })

        const brandsWithImages = brands.map((brand) => {
            if (!brand.image) {
                return { ...brand, image: null }
            }
            const bytes = brand.image as unknown as Uint8Array
            const mime = sniffMimeFromBytes(bytes) || 'image/png'
            const base64 = Buffer.from(bytes).toString('base64')
            return {
                ...brand,
                image: `data:${mime};base64,${base64}`,
            }
        })

        return NextResponse.json(brandsWithImages)
    } catch (error) {
        console.error('Error fetching brands:', error)
        return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const name = (formData.get('name') as string | null)?.trim()
        const description = (formData.get('description') as string | null)?.trim()
        const image = formData.get('image') as File | null

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        let imageBuffer: Uint8Array | null = null

        if (image && image.size > 0) {
            if (!ALLOWED_MIMES.has(image.type)) {
                return NextResponse.json(
                    { error: 'Only PNG or JPG images are allowed' },
                    { status: 415 },
                )
            }
            const arrayBuffer = await image.arrayBuffer()
            imageBuffer = new Uint8Array(arrayBuffer)
        }

        const newBrand = await prisma.brand.create({
            data: {
                name,
                description: description ?? '',
                image: imageBuffer,
            },
        })

        return NextResponse.json(newBrand, { status: 201 })
    } catch (error) {
        console.error('Error creating brand:', error)
        return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        const form = await req.formData()
        const name = (form.get('name') as string | null)?.trim()
        const description = (form.get('description') as string | null)?.trim()
        const image = form.get('image') as File | null

        const data: Record<string, any> = {}
        if (typeof name === 'string') data.name = name
        if (typeof description === 'string') data.description = description

        if (image && image.size > 0) {
            if (!ALLOWED_MIMES.has(image.type)) {
                return NextResponse.json(
                    { error: 'Only PNG or JPG images are allowed' },
                    { status: 415 },
                )
            }
            const buf = new Uint8Array(await image.arrayBuffer())
            data.image = buf
        }

        const updatedBrand = await prisma.brand.update({
            where: { id },
            data,
        })

        return NextResponse.json(updatedBrand)
    } catch (error) {
        console.error('Error updating brand:', error)
        return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json()

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        await prisma.product.deleteMany({ where: { brandId: id } })
        await prisma.brand.delete({ where: { id } })

        return NextResponse.json({ message: 'Brand and related products deleted successfully' })
    } catch (error) {
        console.error('Error deleting brand:', error)
        return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 })
    }
}
