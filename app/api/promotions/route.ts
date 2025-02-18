// Updated routes
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all promotions
// Update GET route in /api/promotions
export async function GET() {
    try {
        const promotions = await prisma.promotion.findMany({
            select: {
                id: true,
                type: true,
                title: true,
                fileData: true
            }
        })

        // Convert binary data to base64 for PDF preview
        const formattedPromotions = promotions.map((promo) => ({
            ...promo,
            filePath: promo.fileData
                ? `data:application/pdf;base64,${Buffer.from(promo.fileData).toString('base64')}`
                : null
        }))

        return NextResponse.json(formattedPromotions)
    } catch (error) {
        console.error('Error fetching promotions:', error)
        return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 })
    }
}


// POST - Add a new promotion
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string;
        const title = formData.get('title') as string;

        if (!file || !type || !title) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const newPromotion = await prisma.promotion.create({
            data: {
                type,
                title,
                fileData: uint8Array,
            },
        });

        return NextResponse.json(newPromotion, { status: 201 });
    } catch (error) {
        console.error('Error creating promotion:', error);
        return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 });
    }
}

// DELETE - Remove a promotion by ID
export async function DELETE(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.promotion.delete({ where: { id } });

        return NextResponse.json({ message: 'Promotion deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        return NextResponse.json({ error: 'Failed to delete promotion' }, { status: 500 });
    }
}
