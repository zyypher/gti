import { NextResponse } from 'next/server'
import {
    S3Client,
    DeleteObjectCommand
} from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import { Upload } from '@aws-sdk/lib-storage'
import { prisma } from '@/lib/prisma'

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

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
            Body: nodeStream, // ✅ Proper Node.js stream
            ContentType: file.type,
            ACL: 'public-read',
        },
        queueSize: 4, // ✅ Parallel chunk uploads
        partSize: 5 * 1024 * 1024, // ✅ 5MB per part
    })

    await upload.done()
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
}

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!

// ✅ Fetch Product PDF (GET)
export async function GET(
    req: Request,
    { params }: { params: { id: string } },
) {
    const productId = params.id

    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { pdfUrl: true },
        })

        if (!product || !product.pdfUrl) {
            return NextResponse.json({ error: 'No PDF found' }, { status: 404 })
        }

        return NextResponse.json({ url: product.pdfUrl })
    } catch (error) {
        console.error('Error fetching PDF:', error)
        return NextResponse.json(
            { error: 'Failed to fetch PDF' },
            { status: 500 },
        )
    }
}

// **PUT Product (Update Product with Background Uploads)**
export async function PUT(
    req: Request,
    { params }: { params: { id: string } },
) {
    const productId = params.id
    const formData = await req.formData()

    try {
        const existingProduct = await prisma.product.findUnique({
            where: { id: productId },
            select: { image: true, pdfUrl: true },
        })

        if (!existingProduct) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 },
            )
        }

        const updateData: Record<string, any> = {}

        formData.forEach((value, key) => {
            if (typeof value === 'string') {
                updateData[key] = value
            }
        })

        // ✅ Step 1: Update product **immediately** (return response quickly)
        // const updatedProduct = await prisma.product.update({
        //     where: { id: productId },
        //     data: {
        //       ...(imageUrl ? { image: imageUrl } : {}),
        //       ...(pdfUrl ? { pdfUrl: pdfUrl } : {}),
        //     },
        //   })

        const response = NextResponse.json(existingProduct, { status: 200 })

        // ✅ Step 2: Run S3 uploads in the background (non-blocking)
        ;(async () => {
            const uploadTasks: Promise<string | null>[] = []
            const newImage = formData.get('image') as File | null
            const newPdf = formData.get('pdf') as File | null

            if (newImage && newImage.name) {
                uploadTasks.push(
                    uploadToS3(newImage, 'products').catch(() => null),
                )
            } else {
                uploadTasks.push(Promise.resolve(existingProduct.image))
            }

            if (newPdf && newPdf.name) {
                uploadTasks.push(uploadToS3(newPdf, 'pdfs').catch(() => null))
            } else {
                uploadTasks.push(Promise.resolve(existingProduct.pdfUrl))
            }

            const [imageUrl, pdfUrl] = await Promise.all(uploadTasks)

            // ✅ Step 3: Update the product with uploaded URLs
            const updateLater: Record<string, string> = {}
            if (imageUrl && imageUrl !== existingProduct.image)
                updateLater.image = imageUrl
            if (pdfUrl && pdfUrl !== existingProduct.pdfUrl)
                updateLater.pdfUrl = pdfUrl

            if (Object.keys(updateLater).length) {
                await prisma.product.update({
                    where: { id: productId },
                    data: updateLater,
                })
            }
        })()

        return response
    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json(
            { error: 'Failed to update product' },
            { status: 500 },
        )
    }
}

// ✅ Delete Product (DELETE)
export async function DELETE(
    req: Request,
    { params }: { params: { id: string } },
) {
    const productId = params.id

    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
        })

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 },
            )
        }

        // ✅ Delete Image from S3
        if (product.image) {
            const imageKey = product.image.split('.com/')[1]
            await s3.send(
                new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: imageKey }),
            )
        }

        // ✅ Delete PDF from S3
        if (product.pdfUrl) {
            const pdfKey = product.pdfUrl.split('.com/')[1]
            await s3.send(
                new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: pdfKey }),
            )
        }

        // ✅ Delete Product from Database
        await prisma.product.delete({ where: { id: productId } })

        return NextResponse.json(
            { message: 'Product deleted successfully' },
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
