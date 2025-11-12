import { NextResponse } from 'next/server'
import {
    S3Client,
    DeleteObjectCommand
} from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import { Upload } from '@aws-sdk/lib-storage'
import { prisma } from '@/lib/prisma'

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!
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
            if (done) this.push(null)
            else this.push(value)
        },
    })
}

const uploadToS3 = async (file: File, folder: string): Promise<string> => {
    const key = `${folder}/${Date.now()}-${file.name}`
    const nodeStream = readableStreamToNodeStream(file.stream())
    const upload = new Upload({
        client: s3,
        params: {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: nodeStream,
            ContentType: file.type,
            ACL: 'public-read',
        },
        queueSize: 4,
        partSize: 5 * 1024 * 1024,
    })
    await upload.done()
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
}

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
// **PUT Product (Update Product with optional file uploads)**
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const productId = params.id;
    const formData = await req.formData();

    try {
        const existing = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, image: true, pdfUrl: true },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // collect text fields
        const updateData: Record<string, any> = {};
        formData.forEach((value, key) => {
            if (typeof value === 'string') updateData[key] = value;
        });

        // require the normal text fields (same as before)
        const required = [
            'brandId',
            'name',
            'size',
            'tar',
            'nicotine',
            'co',
            'flavor',
            'packetStyle',
            'fsp',
            'capsules',
            'color',
        ] as const;

        const missing = required.filter(
            (k) => !updateData[k] || String(updateData[k]).trim() === ''
        );
        if (missing.length) {
            return NextResponse.json(
                { error: `Missing fields: ${missing.join(', ')}` },
                { status: 400 }
            );
        }

        // parse types
        const fspBool =
            String(updateData.fsp).toLowerCase() === 'true' ||
            String(updateData.fsp).toLowerCase() === 'yes';

        // files are OPTIONAL on edit
        const newImage = (formData.get('image') as File | null) ?? null;
        const newPdf = (formData.get('pdf') as File | null) ?? null;

        // 1) update textual fields first
        await prisma.product.update({
            where: { id: productId },
            data: {
                name: updateData.name,
                size: updateData.size,
                tar: parseFloat(updateData.tar || '0'),
                nicotine: parseFloat(updateData.nicotine || '0'),
                co: parseFloat(updateData.co || '0'),
                flavor: updateData.flavor,
                packetStyle: updateData.packetStyle,
                fsp: fspBool,
                capsules: parseInt(updateData.capsules || '0', 10),
                color: updateData.color,
                brand: { connect: { id: updateData.brandId } },
            },
        });

        // 2) upload only what was provided, then patch URLs
        const later: Record<string, string> = {};

        if (newImage && newImage.size > 0) {
            const imageUrl = await uploadToS3(newImage, 'products');
            later.image = imageUrl;

            // (optional) delete old image if you want to clean up
            if (existing.image) {
                const oldKey = existing.image.split('.com/')[1];
                if (oldKey) {
                    try {
                        await s3.send(
                            new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: oldKey })
                        );
                    } catch {
                        /* ignore cleanup failure */
                    }
                }
            }
        }

        if (newPdf && newPdf.size > 0) {
            if (newPdf.type !== 'application/pdf') {
                return NextResponse.json({ error: 'PDF must be application/pdf' }, { status: 400 });
            }
            const pdfUrl = await uploadToS3(newPdf, 'pdfs');
            later.pdfUrl = pdfUrl;

            // (optional) delete old pdf
            if (existing.pdfUrl) {
                const oldKey = existing.pdfUrl.split('.com/')[1];
                if (oldKey) {
                    try {
                        await s3.send(
                            new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: oldKey })
                        );
                    } catch {
                        /* ignore cleanup failure */
                    }
                }
            }
        }

        if (Object.keys(later).length) {
            await prisma.product.update({
                where: { id: productId },
                data: later,
            });
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
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

        if (product.image) {
            const imageKey = product.image.split('.com/')[1]
            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: imageKey }))
        }

        if (product.pdfUrl) {
            const pdfKey = product.pdfUrl.split('.com/')[1]
            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: pdfKey }))
        }

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
