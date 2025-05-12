import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { prisma } from '@/lib/prisma'

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
        const promotions = await prisma.promotion.findMany();
        return NextResponse.json(promotions);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 });
    }
}

// ✅ POST - Create Promotion (Store Record First, Then Upload PDF)
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string;
        const title = formData.get('title') as string;

        if (!type || !title) {
            return NextResponse.json({ error: 'Type and title are required' }, { status: 400 });
        }

        // ✅ Step 1: Create DB Record First
        const promotion = await prisma.promotion.create({
            data: { type, title },
        });

        // ✅ Step 2: Return Response Immediately (No Delay)
        const response = NextResponse.json(promotion, { status: 201 });

        // ✅ Step 3: Upload PDF to S3 in Background
        if (file) {
            uploadToS3(file, 'promotions')
                .then(async (filePath) => {
                    await prisma.promotion.update({
                        where: { id: promotion.id },
                        data: { filePath },
                    });
                })
                .catch((err) => console.error("PDF upload failed", err));
        }

        return response;
    } catch (error) {
        console.error('Error creating promotion:', error);
        return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 });
    }
}

// ✅ DELETE - Remove Promotion
export async function DELETE(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.promotion.delete({ where: { id } });

        return NextResponse.json({ message: 'Promotion deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        return NextResponse.json({ error: 'Failed to delete promotion' }, { status: 500 });
    }
}
