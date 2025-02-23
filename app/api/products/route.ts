import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: {
                brand: true,
            },
        })

        // Convert binary image data to base64 for preview
        const formattedProducts = products.map((product) => ({
            ...product,
            image: product.image
                ? `data:image/jpeg;base64,${Buffer.from(product.image).toString('base64')}`
                : null,
        }))

        return NextResponse.json(formattedProducts)
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 },
        )
    }
}



export async function POST(req: Request) {
    const formData = await req.formData()
    const pdfFile = formData.get('pdf') as File | null
    const imageFile = formData.get('image') as File | null
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

    let imageBuffer: Uint8Array | null = null

    // Convert image file to binary
    if (imageFile) {
        const buffer = await imageFile.arrayBuffer()
        imageBuffer = new Uint8Array(buffer)
    }

    try {
        // Step 1: Create the Product (With Binary Image)
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
                image: imageBuffer, // ✅ Store image as binary
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
