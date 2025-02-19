import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        let { productIds, expiresAt } = await req.json();

        console.log('##Received productIds:', productIds);

        // Ensure productIds is always an array
        if (!Array.isArray(productIds)) {
            productIds = [productIds]; // Convert single string to an array
        }

        // Validate productIds is a valid array
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ error: 'Invalid productIds format' }, { status: 400 });
        }

        const uniqueSlug = nanoid(10); // Generate a unique slug

        const sharedPdf = await prisma.sharedPDF.create({
            data: {
                uniqueSlug,
                productIds: productIds.join(','), // Store as comma-separated values
                expiresAt: new Date(expiresAt),
            },
        });

        return NextResponse.json({ slug: sharedPdf.uniqueSlug, url: `/shared/${sharedPdf.uniqueSlug}` });
    } catch (error) {
        console.error('Error creating shared PDF:', error);
        return NextResponse.json({ error: 'Failed to create shared PDF' }, { status: 500 });
    }
}
