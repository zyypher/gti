import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

// ✅ Middleware to Extract User ID (Example - Adjust for Auth System)
async function getUserIdFromToken(req: Request): Promise<string | null> {
    try {
        const token = cookies().get('token')?.value;
        if (!token) {
            console.error("🚨 No token found in cookies.");
            return null;
        }

        console.log("✅ Found token:", token);

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        console.log("✅ Extracted JWT Payload:", payload); // ✅ Log full payload

        // Ensure we're extracting the correct field from the payload
        if (!payload || typeof payload !== "object") {
            console.error("🚨 Invalid JWT payload format:", payload);
            return null;
        }

        // Try different possible field names based on how the JWT was created
        const userId = payload.userId || payload.id || payload.sub;

        if (!userId) {
            console.error("🚨 No userId found in payload:", payload);
            return null;
        }

        console.log("✅ Extracted User ID:", userId);
        return userId as string;
    } catch (error) {
        console.error("🚨 Error verifying token:", error);
        return null;
    }
}


// ✅ GET Method: Fetch Only PDFs Created by the Current User
export async function GET(req: Request) {
    try {
        const userId = await getUserIdFromToken(req)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const sharedPdfs = await prisma.sharedPDF.findMany({
            where: { createdById: userId }, // ✅ Fetch only PDFs created by the user
        })

        const pdfsWithDetails = await Promise.all(
            sharedPdfs.map(async (pdf) => {
                const productIdsArray = pdf.productIds.split(',')

                const products = await prisma.product.findMany({
                    where: { id: { in: productIdsArray } },
                    select: { id: true, name: true, pdfUrl: true },
                })

                return {
                    id: pdf.id,
                    uniqueSlug: pdf.uniqueSlug,
                    products,
                    createdAt: pdf.createdAt,
                    expiresAt: pdf.expiresAt,
                }
            }),
        )

        return NextResponse.json(pdfsWithDetails)
    } catch (error) {
        console.error('Error fetching generated PDFs:', error)
        return NextResponse.json(
            { error: 'Failed to fetch generated PDFs' },
            { status: 500 },
        )
    }
}

// ✅ POST Method: Create a New Shared PDF & Assign Creator
export async function POST(req: Request) {
    try {
        let { productIds, expiresAt } = await req.json()
        const userId = await getUserIdFromToken(req)

        if (!userId) {
            console.error('🚨 No user ID found in token.')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('✅ Extracted User ID:', userId)

        // ✅ Step 1: Ensure `createdById` exists in `User` table
        const userExists = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!userExists) {
            console.error(
                '🚨 Invalid createdById, user does not exist:',
                userId,
            )
            return NextResponse.json(
                { error: 'User does not exist' },
                { status: 400 },
            )
        }

        // ✅ Convert `productIds` from string to array (if necessary)
        if (typeof productIds === 'string') {
            productIds = productIds.split(',').map((id) => id.trim())
        }

        if (!Array.isArray(productIds) || productIds.length === 0) {
            console.error('🚨 Invalid productIds format:', productIds)
            return NextResponse.json(
                { error: 'Invalid productIds format' },
                { status: 400 },
            )
        }

        const uniqueSlug = nanoid(10)

        // ✅ Step 2: Create SharedPDF Entry
        const sharedPdf = await prisma.sharedPDF.create({
            data: {
                uniqueSlug,
                productIds: productIds.join(','),
                expiresAt: new Date(expiresAt),
                createdById: userId, // ✅ Assign creator ID
            },
        })

        console.log('✅ Shared PDF Created Successfully:', sharedPdf)

        return NextResponse.json({
            slug: sharedPdf.uniqueSlug,
            url: `/shared/${sharedPdf.uniqueSlug}`,
        })
    } catch (error) {
        console.error('🚨 Error creating shared PDF:', error)
        return NextResponse.json(
            { error: 'Failed to create shared PDF' },
            { status: 500 },
        )
    }
}
