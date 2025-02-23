import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from "stream";
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

// AWS S3 Configuration
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: "https://s3-accelerate.amazonaws.com",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

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

// **Function to Upload Files Using Multipart Upload (Faster for Large Files)**

const uploadToS3 = async (file: File, folder: string): Promise<string> => {
    const key = `${folder}/${Date.now()}-${file.name}`;

    const nodeStream = readableStreamToNodeStream(file.stream());

    const upload = new Upload({
        client: s3,
        params: {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: nodeStream, // ✅ Now it's a proper Node.js stream
            ContentType: file.type,
            ACL: "public-read",
        },
        queueSize: 4, // ✅ Parallel chunk uploads
        partSize: 5 * 1024 * 1024, // ✅ 5MB per part
    });

    await upload.done();

    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
};




// **GET Products (Fetch All)**
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: { brand: true },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

// **POST Product (Create a New Product with S3 Uploads)**
export async function POST(req: Request) {
    const formData = await req.formData();
    const pdfFile = formData.get('pdf') as File | null;
    const imageFile = formData.get('image') as File | null;
    const productData: Record<string, string> = {};

    formData.forEach((value, key) => {
        if (typeof value === 'string') {
            productData[key] = value;
        }
    });

    const { brandId, name, size, tar, nicotine, co, flavor, fsp, corners, capsules } = productData;

    try {
        // ✅ Step 1: Insert into Neon (Return immediately)
        const product = await prisma.product.create({
            data: { name, size, tar, nicotine, co, flavor, fsp, corners, capsules, brand: { connect: { id: brandId } } },
        });

        // ✅ Step 2: Return the product immediately (modal closes & UI updates)
        const response = NextResponse.json(product, { status: 201 });

        // ✅ Step 3: Run uploads in background (non-blocking)
        (async () => {
            const uploadTasks: Promise<void>[] = [];

            if (imageFile) {
                uploadTasks.push(
                    uploadToS3(imageFile, 'products')
                        .then(async (imageUrl) => {
                            await prisma.product.update({
                                where: { id: product.id },
                                data: { image: imageUrl },
                            });
                        })
                        .catch((err) => console.error("Image upload failed", err))
                );
            }

            if (pdfFile) {
                uploadTasks.push(
                    uploadToS3(pdfFile, 'pdfs')
                        .then(async (pdfUrl) => {
                            await prisma.productPDF.create({
                                data: { productId: product.id, pdfContent: pdfUrl },
                            });
                        })
                        .catch((err) => console.error("PDF upload failed", err))
                );
            }

            // **Uploads run in background, DB updates asynchronously**
            await Promise.all(uploadTasks);
        })();

        return response;
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}


// **DELETE Product (Remove Product & Delete from S3)**
export async function DELETE(req: Request) {
    const { id } = Object.fromEntries(new URL(req.url).searchParams);

    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { pdf: true },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // **Delete Image from S3**
        if (product.image) {
            const imageKey = product.image.split('.com/')[1];
            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: imageKey }));
        }

        // **Delete PDF from S3**
        if (product.pdf?.pdfContent) {
            const pdfKey = product.pdf.pdfContent.split('.com/')[1];
            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: pdfKey }));
        }

        // **Delete Product from DB**
        await prisma.product.delete({ where: { id } });

        return NextResponse.json({ message: 'Product deleted' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
