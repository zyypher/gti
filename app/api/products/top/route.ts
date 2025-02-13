import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

export async function GET(req: Request) {
    try {
        const topProducts = await prisma.product.findMany({
            orderBy: {
                createdAt: 'desc', // ✅ Order by most recent products
            },
            take: 5, // ✅ Limit to top 5 products
            include: {
                brand: true,
            },
        })
        

        return NextResponse.json(topProducts)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch top products' },
            { status: 500 }
        )
    }
}
