import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromToken } from '@/lib/getUserIdFromToken';

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        // ✅ 1️⃣ Get Logged-in User ID
        const userId = await getUserIdFromToken(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ✅ 2️⃣ Find Slugs from Shared PDFs Created by User
        const sharedPdfs = await prisma.sharedPDF.findMany({
            where: { createdById: userId },
            select: { uniqueSlug: true },
        });

        const slugs = sharedPdfs.map((pdf) => pdf.uniqueSlug);

        if (slugs.length === 0) {
            return NextResponse.json([]); // No orders for this user
        }

        // ✅ 3️⃣ Fetch Orders That Match the User’s Slugs
        const orders = await prisma.order.findMany({
            where: {
                slug: { in: slugs }, // Match orders where the slug is in the shared PDFs
            },
            orderBy: { createdAt: 'desc' },
        });

        // ✅ 4️⃣ Fetch Product Names for Each Order
        const ordersWithProducts = await Promise.all(
            orders.map(async (order) => {
                const productIds = order.products.split(',');
        
                const products = await prisma.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true, name: true },
                });
        
                // ✅ Define parsedQuantities with correct type
                let parsedQuantities: Record<string, number> = {};
                try {
                    parsedQuantities = JSON.parse(order.quantities) as Record<string, number>;
                } catch (error) {
                    console.error('Error parsing quantities JSON:', error);
                }
        
                return {
                    ...order,
                    products: products.map((p) => p.name).join(', '), // ✅ Show names instead of IDs
                    quantities: products
                        .map((p) => `${p.name}: ${parsedQuantities[p.id] || 0}`)
                        .join(', '), // ✅ Now correctly retrieves quantities
                };
            })
        );
        

        return NextResponse.json(ordersWithProducts);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to load orders' },
            { status: 500 }
        );
    }
}
