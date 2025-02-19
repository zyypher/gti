import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
    const url = new URL(req.url)
    const queryParams = Object.fromEntries(url.searchParams)

    // Convert numerical filters to string (if applicable)
    const filters = Object.keys(queryParams).reduce((acc, key) => {
        acc[key] = isNaN(Number(queryParams[key])) ? queryParams[key] : String(queryParams[key])
        return acc
    }, {} as Record<string, string>)

    try {
        const products = await prisma.product.findMany({
            where: {
                name: {
                    contains: filters.search, // Assuming "search" is for the name field
                    mode: 'insensitive',
                },
                ...filters,
            },
            include: {
                brand: true,
            },
        })

        return NextResponse.json(products)
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
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

    const {
        brandId,
        name,
        size,
        tar,
        nicotine,
        co,
        flavor,
        fsp,
        corners,
        capsules,
    } = productData

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
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 },
        )
    }
}

export async function DELETE(req: Request) {
    const { id } = Object.fromEntries(new URL(req.url).searchParams)
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ message: 'Product deleted' })
}
