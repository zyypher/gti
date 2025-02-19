import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()
const uploadDir = path.join(process.cwd(), 'public', 'uploads')

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
        include: {
            brand: true,
        },
    })

    return NextResponse.json(products)
}


export async function POST(req: Request) {
    const formData = await req.formData()
    const pdfFile = formData.get('pdf') as File | null
    const productData: Record<string, string> = {}

    formData.forEach((value, key) => {
        if (typeof value === 'string') {
            productData[key] = value
        }
    })

    const { brandId, name, size, tar, nicotine, co, flavor, fsp, corners, capsules } = productData

    try {
        // Step 1: Create the Product (Without PDF)
        const product = await prisma.product.create({
            data: {
                name,
                size,
                tar,
                nicotine,
                co,
                flavor,
                fsp,
                corners,
                capsules,
                brand: {
                    connect: { id: brandId },
                },
            },
        })

        // Step 2: If there's a PDF, store it in ProductPDF
        if (pdfFile) {
            const fileBuffer = await pdfFile.arrayBuffer()
            await prisma.productPDF.create({
                data: {
                    productId: product.id,
                    pdfContent: new Uint8Array(fileBuffer),
                },
            })
        }

        return NextResponse.json(product, { status: 201 })
    } catch (error) {
        console.error('Error creating product:', error)
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const { id } = Object.fromEntries(new URL(req.url).searchParams)
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ message: 'Product deleted' })
}
