import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get all brands
export async function GET(req: NextRequest) {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: {
                updatedAt: 'desc',
            }
        })

        // Convert binary image data to base64 string if present
        const brandsWithImages = brands.map((brand) => {
            let base64Image = null
            if (brand.image) {
                const mimeType = 'image/png' // Adjust if other formats are used
                base64Image = `data:${mimeType};base64,${Buffer.from(brand.image).toString('base64')}`
            }
            return {
                ...brand,
                image: base64Image,
            }
        })

        return NextResponse.json(brandsWithImages)
    } catch (error) {
        console.error('Error fetching brands:', error)
        return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
    }
}

// Add a new brand
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const name = formData.get('name') as string
        const description = formData.get('description') as string
        const image = formData.get('image') as File | null

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        let imageBuffer: Uint8Array | null = null

        // Convert file to Uint8Array if an image is provided
        if (image && image.size > 0) {
            const arrayBuffer = await image.arrayBuffer()
            imageBuffer = new Uint8Array(arrayBuffer)
        }

        const newBrand = await prisma.brand.create({
            data: {
                name,
                description,
                image: imageBuffer
            },
        })

        return NextResponse.json(newBrand, { status: 201 })
    } catch (error) {
        console.error('Error creating brand:', error)
        return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
    }
}


// Update an existing brand
export async function PUT(req: NextRequest) {
    try {
        const { id, name, description, image } = await req.json()

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        const updatedBrand = await prisma.brand.update({
            where: { id },
            data: { name, description, image },
        })

        return NextResponse.json(updatedBrand)
    } catch (error) {
        console.error('Error updating brand:', error)
        return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
    }
}

// Delete a brand
// Delete a brand and its related products
export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json()

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        // ✅ Step 1: Delete all products related to this brand
        await prisma.product.deleteMany({
            where: { brandId: id },
        })

        // ✅ Step 2: Delete the brand
        await prisma.brand.delete({ where: { id } })

        return NextResponse.json({ message: 'Brand and related products deleted successfully' })
    } catch (error) {
        console.error('Error deleting brand:', error)
        return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 })
    }
}

