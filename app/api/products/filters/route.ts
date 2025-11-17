// app/api/products/filters/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // Execute distinct queries in parallel for performance
        const [sizes, flavors, colors, packFormats, coValues] = await Promise.all([
            prisma.product.findMany({
                distinct: ['size'],
                select: { size: true },
                orderBy: { size: 'asc' }
            }),
            prisma.product.findMany({
                distinct: ['flavor'],
                select: { flavor: true },
                orderBy: { flavor: 'asc' }
            }),
            prisma.product.findMany({
                distinct: ['color'],
                select: { color: true },
                orderBy: { color: 'asc' }
            }),
            prisma.product.findMany({
                distinct: ['packetStyle'],
                select: { packetStyle: true },
                orderBy: { packetStyle: 'asc' }
            }),
            prisma.product.findMany({
                distinct: ['co'],
                select: { co: true },
                orderBy: { co: 'asc' }
            })
        ]);

        // Extract the values into simple arrays
        const sizeOptions = sizes.map(item => item.size).filter(val => !!val);
        const flavorOptions = flavors.map(item => item.flavor).filter(val => !!val);
        const colorOptions = colors.map(item => item.color).filter(val => !!val);
        const packFormatOptions = packFormats.map(item => item.packetStyle).filter(val => !!val);
        const coOptions = coValues.map(item => item.co);

        return NextResponse.json({
            sizes: sizeOptions,
            flavors: flavorOptions,
            colors: colorOptions,
            packFormats: packFormatOptions,
            carbonMonoxides: coOptions
        });
    } catch (error) {
        console.error('Error fetching filter options:', error);
        return NextResponse.json({ error: 'Failed to load filter options' }, { status: 500 });
    }
}
