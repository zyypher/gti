import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { prisma } from '@/lib/prisma'

const ALLOWED_TYPES = ['banner_front', 'banner_back', 'advertisement', 'promotion'] as const
type AllowedType = (typeof ALLOWED_TYPES)[number]

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: "https://s3-accelerate.amazonaws.com",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// ✅ Function to convert ReadableStream to Node.js Stream
function readableStreamToNodeStream(stream: ReadableStream) {
    const reader = stream.getReader();
    return new Readable({
        async read() {
            const { done, value } = await reader.read();
            if (done) {
                this.push(null);
            } else {
                this.push(value);
            }
        }
    });
}

// ✅ Function to Upload File to S3
const uploadToS3 = async (file: File, folder: string): Promise<string> => {
    const key = `${folder}/${Date.now()}-${file.name}`;
    const nodeStream = readableStreamToNodeStream(file.stream());

    const upload = new Upload({
        client: s3,
        params: {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: nodeStream,
            ContentType: file.type,
            ACL: "public-read",
        },
        queueSize: 4,
        partSize: 5 * 1024 * 1024,
    });

    await upload.done();
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
};

// ✅ GET All Promotions
export async function GET() {
    try {
        const items = await prisma.promotion.findMany()
        return NextResponse.json(items)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }
}

// ✅ POST - Create Promotion (Store Record First, Then Upload PDF)
export async function POST(req: NextRequest) {
    try {
        const form = await req.formData()
        const file = form.get('file') as File | null
        const rawType = (form.get('type') as string)?.toLowerCase()
        const title = (form.get('title') as string) || 'Untitled'

        if (!ALLOWED_TYPES.includes(rawType as AllowedType)) {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
        }

        // 1) create DB row
        const record = await prisma.promotion.create({
            data: { type: rawType, title },
        })

        // 2) upload in background (optional)
        if (file) {
            uploadToS3(file, 'promotions')
                .then(async (filePath) => {
                    await prisma.promotion.update({
                        where: { id: record.id },
                        data: { filePath },
                    })
                })
                .catch((err) => console.error('PDF upload failed', err))
        }

        return NextResponse.json(record, { status: 201 })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'Failed to create' }, { status: 400 })
    }
}

// ✅ DELETE - Remove Promotion

export async function DELETE(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
        await prisma.promotion.delete({ where: { id } })
        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}