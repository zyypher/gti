import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    const brands = await prisma.brand.findMany()
    return NextResponse.json(brands)
}
