import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
    const { search, ...filters } = Object.fromEntries(new URL(req.url).searchParams)

    const products = await prisma.product.findMany({
        where: {
            name: {
                contains: search,
                mode: 'insensitive',
            },
            ...filters,
        },
        include: { brand: true },
    })

    return NextResponse.json(products)
}

export async function POST(req: Request) {
    const body = await req.json()
    const { brandId, ...productData } = body

    const product = await prisma.product.create({
        data: {
            ...productData,
            brand: {
                connect: {
                    id: brandId, // Use only the nested relation here
                },
            },
        },
    })

    return NextResponse.json(product, { status: 201 })
}

export async function DELETE(req: Request) {
    const { id } = Object.fromEntries(new URL(req.url).searchParams)
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ message: 'Product deleted' })
}
