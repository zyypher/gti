import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'

// Update a brand
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id
    try {
        const formData = await req.formData()
        const name = formData.get('name') as string
        const description = formData.get('description') as string
        const image = formData.get('image') as File | null

        // Get existing brand to retain the current image if no new image is uploaded
        const existingBrand = await prisma.brand.findUnique({ where: { id } })
        if (!existingBrand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
        }

        let imageBuffer: Uint8Array | null = existingBrand.image

        // Convert file to buffer if a new image is provided
        if (image && image.size > 0) {
            const arrayBuffer = await image.arrayBuffer()
            imageBuffer = new Uint8Array(arrayBuffer)
        }

        // Update the brand with the new data
        const updatedBrand = await prisma.brand.update({
            where: { id },
            data: { 
                name, 
                description, 
                image: imageBuffer 
            },
        })

        return NextResponse.json(updatedBrand)
    } catch (error) {
        console.error('Error updating brand:', error)
        return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
    }
}

// Delete a brand
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    try {
        await prisma.brand.delete({ where: { id } });
        return NextResponse.json({ message: 'Brand deleted successfully' });
    } catch (error) {
        console.error('Error deleting brand:', error);
        return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
    }
}
