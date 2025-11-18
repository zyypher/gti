// app/api/products/filters/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const [sizes, flavors, colors, packFormats, coValues] = await Promise.all([
            prisma.product.findMany({
                distinct: ['size'],
                select: { size: true },
                orderBy: { size: 'asc' },
            }),
            prisma.product.findMany({
                distinct: ['flavor'],
                select: { flavor: true },
                orderBy: { flavor: 'asc' },
            }),
            prisma.product.findMany({
                distinct: ['color'],
                select: { color: true },
                orderBy: { color: 'asc' },
            }),
            prisma.product.findMany({
                distinct: ['packetStyle'],
                select: { packetStyle: true },
                orderBy: { packetStyle: 'asc' },
            }),
            prisma.product.findMany({
                distinct: ['co'],
                select: { co: true },
                orderBy: { co: 'asc' },
            }),
        ])

        const sizeOptions = Array.from(
            new Set(
                sizes
                    .map((item) => item.size?.trim())
                    .filter((val): val is string => !!val),
            ),
        )

        // normalize flavours and remove junk like "1"
        const flavorOptions = Array.from(
            new Set(
                flavors
                    .map((item) => item.flavor?.trim())
                    .filter((val): val is string => !!val)
                    // drop purely-numeric values such as "1", "2", "3", etc.
                    .filter((val) => !/^\d+(\.\d+)?$/.test(val)),
            ),
        )

        const colorOptions = Array.from(
            new Set(
                colors
                    .map((item) => item.color?.trim())
                    .filter((val): val is string => !!val),
            ),
        )

        const packFormatOptions = Array.from(
            new Set(
                packFormats
                    .map((item) => item.packetStyle?.trim())
                    .filter((val): val is string => !!val),
            ),
        )

        const coOptions = Array.from(
            new Set(
                coValues
                    .map((item) => item.co)
                    .filter((val): val is number => val !== null && val !== undefined),
            ),
        )

        return NextResponse.json({
            sizes: sizeOptions.sort(),
            flavors: flavorOptions.sort(),
            colors: colorOptions.sort(),
            packFormats: packFormatOptions.sort(),
            carbonMonoxides: coOptions.sort((a, b) => a - b),
        })
    } catch (error) {
        console.error('Error fetching filter options:', error)
        return NextResponse.json(
            { error: 'Failed to load filter options' },
            { status: 500 },
        )
    }
}
