import { NextRequest, NextResponse } from 'next/server'
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { Readable } from 'stream'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'

// AWS S3 Configuration
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: 'https://s3-accelerate.amazonaws.com',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!

function readableStreamToNodeStream(stream: ReadableStream) {
    const reader = stream.getReader()
    return new Readable({
        async read() {
            const { done, value } = await reader.read()
            if (done) {
                this.push(null)
            } else {
                this.push(value)
            }
        },
    })
}

// **Function to Upload Files Using Multipart Upload (Faster for Large Files)**

const uploadToS3 = async (file: File, folder: string): Promise<string> => {
    const key = `${folder}/${Date.now()}-${file.name}`

    const nodeStream = readableStreamToNodeStream(file.stream())

    const upload = new Upload({
        client: s3,
        params: {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: nodeStream, // ✅ Now it's a proper Node.js stream
            ContentType: file.type,
            ACL: 'public-read',
        },
        queueSize: 4, // ✅ Parallel chunk uploads
        partSize: 5 * 1024 * 1024, // ✅ 5MB per part
    })

    await upload.done()

    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
}

// **GET Products (Fetch All)**
// **GET Products (Fetch All)**
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const sp = url.searchParams

        const where: any = {}
        const and: any[] = []

        const contains = (k: string) => {
            const v = sp.get(k)
            return v && v.trim() ? { contains: v.trim(), mode: 'insensitive' } : undefined
        }

        // generic text filters
        where.name = contains('name')
        where.size = contains('size')
        where.packetStyle = contains('packetStyle')
        where.color = contains('color')
        where.corners = contains('corners')

        // brand
        const brandId = sp.get('brandId')
        if (brandId) where.brandId = brandId

        // fsp
        const fsp = sp.get('fsp')
        if (fsp === 'true') where.fsp = true
        else if (fsp === 'false') where.fsp = false

        // capsules
        const capsulesMode = sp.get('capsulesMode')
        const capsules = sp.get('capsules')
        if (capsulesMode === 'gt0') {
            where.capsules = { gt: 0 }
        } else if (capsules !== null) {
            const n = Number.parseInt(capsules, 10)
            if (!Number.isNaN(n)) where.capsules = n
        }

        // numbers
        const tar = sp.get('tar')
        if (tar) where.tar = parseFloat(tar)
        const nicotine = sp.get('nicotine')
        if (nicotine) where.nicotine = parseFloat(nicotine)
        const co = sp.get('co')
        if (co) where.co = parseFloat(co)

        // flavour logic
        const flavorMode = sp.get('flavorMode')
        const flavor = sp.get('flavor')

        if (flavorMode === 'allFlavoursExceptRegular') {
            // everything except Regular (case-insensitive)
            and.push({ NOT: { flavor: { equals: 'Regular', mode: 'insensitive' } } })
            // optionally exclude empty strings (valid for required string)
            and.push({ flavor: { not: '' } })
        } else if (flavorMode === 'onlyRegular') {
            where.flavor = { equals: 'Regular', mode: 'insensitive' }
        } else if (flavor) {
            // exact flavour
            where.flavor = { equals: flavor, mode: 'insensitive' }
        }

        if (and.length) where.AND = and

        // pagination
        const page = Number.parseInt(sp.get('page') || '1', 10)
        const pageSize = Number.parseInt(sp.get('pageSize') || '10', 10)
        const skip = (page - 1) * pageSize
        const take = pageSize

        const total = await prisma.product.count({ where })
        const products = await prisma.product.findMany({
            where,
            include: { brand: true },
            skip,
            take,
        })

        return NextResponse.json({ products, total })
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}


// **POST Product (Create a New Product with S3 Uploads)**
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
        packetStyle,
        fsp,
        capsules,
        color,
    } = productData

    try {
        // ✅ Convert types correctly
        const parsedTar = parseFloat(tar || '0')
        const parsedNicotine = parseFloat(nicotine || '0')
        const parsedCo = parseFloat(co || '0')
        const parsedFsp = fsp === 'true' // Convert "true"/"false" string to boolean
        const parsedCapsules = parseInt(capsules || '0')

        // ✅ Step 1: Create the product in Neon first
        const product = await prisma.product.create({
            data: {
                name,
                size,
                tar: parsedTar,
                nicotine: parsedNicotine,
                co: parsedCo,
                flavor,
                packetStyle,
                fsp: parsedFsp,
                capsules: parsedCapsules,
                color,
                image: '',
                pdfUrl: '',
                brand: { connect: { id: brandId } },
            },
        })

        // ✅ Step 2: Return the product immediately (modal closes & UI updates)
        const response = NextResponse.json(product, { status: 201 })

            // ✅ Step 3: Run S3 uploads in the background (non-blocking)
            ; (async () => {
                const uploadTasks: Promise<string | null>[] = []

                if (imageFile) {
                    uploadTasks.push(
                        uploadToS3(imageFile, 'products').catch(() => null),
                    )
                } else {
                    uploadTasks.push(Promise.resolve(null))
                }

                if (pdfFile) {
                    uploadTasks.push(uploadToS3(pdfFile, 'pdfs').catch(() => null))
                } else {
                    uploadTasks.push(Promise.resolve(null))
                }

                // Wait for uploads to complete
                const [imageUrl, pdfUrl] = await Promise.all(uploadTasks)

                // ✅ Step 4: Update the product with uploaded URLs
                await prisma.product.update({
                    where: { id: product.id },
                    data: {
                        image: imageUrl || '',
                        pdfUrl: pdfUrl || '',
                    },
                })
            })()

        return response
    } catch (error) {
        console.error('Error creating product:', error)
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 },
        )
    }
}

// **DELETE Product (Remove Product & Delete from S3)**
export async function DELETE(req: Request) {
    const { id } = Object.fromEntries(new URL(req.url).searchParams)

    try {
        const product = await prisma.product.findUnique({
            where: { id },
        })

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 },
            )
        }

        // **Delete Image from S3**
        if (product.image) {
            const imageKey = product.image.split('.com/')[1]
            await s3.send(
                new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: imageKey }),
            )
        }

        // **Delete PDF from S3**
        if (product.pdfUrl) {
            const pdfKey = product.pdfUrl.split('.com/')[1]
            await s3.send(
                new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: pdfKey }),
            )
        }

        // **Delete Product from DB**
        await prisma.product.delete({ where: { id } })

        return NextResponse.json(
            { message: 'Product deleted' },
            { status: 200 },
        )
    } catch (error) {
        console.error('Error deleting product:', error)
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 },
        )
    }
}
