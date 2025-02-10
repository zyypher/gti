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

    const formattedProducts = products.map((product) => ({
        ...product,
        pdfContent: product.pdfContent ? Buffer.from(product.pdfContent).toString('base64') : null,
    }))

    return NextResponse.json(formattedProducts)
}



export async function POST(req: Request) {
    const formData = await req.formData()
    const pdfFile = formData.get('pdf')

    let pdfContent: Buffer | null = null

    // Convert the file to binary if it exists
    if (pdfFile instanceof File) {
        const fileBuffer = await pdfFile.arrayBuffer()
        pdfContent = Buffer.from(fileBuffer)
    }

    // Collect form data entries
    const productData: Record<string, string> = {}
    formData.forEach((value, key) => {
        if (typeof value === 'string') {
            productData[key] = value
        }
    })

    const { brandId, name, size, tar, nicotine, co, flavor, fsp, corners, capsules } = productData

    try {
        // Create the product and store the binary PDF content
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
                pdfContent,  // Save directly to the database
                brand: {
                    connect: {
                        id: brandId,
                    },
                },
            },
        })

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
