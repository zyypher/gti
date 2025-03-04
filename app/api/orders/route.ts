import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromToken } from '@/lib/getUserIdFromToken';

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const userId = await getUserIdFromToken(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get slugs for shared PDFs created by the user
        const sharedPdfs = await prisma.sharedPDF.findMany({
            where: { createdById: userId },
            select: { uniqueSlug: true },
        });

        const slugs = sharedPdfs.map((pdf) => pdf.uniqueSlug);
        if (slugs.length === 0) {
            return NextResponse.json([]); // No orders for this user
        }

        // Fetch orders and parse JSON data
        const orders = await prisma.order.findMany({
            where: { slug: { in: slugs } },
            orderBy: { createdAt: 'desc' },
        });

        const ordersWithProducts = await Promise.all(
            orders.map(async (order) => {
                // ✅ Parse products and quantities correctly
                const productIds = JSON.parse(order.products || '[]');
                const productQuantities = JSON.parse(order.quantities || '{}');

                // Ensure productIds is an array
                if (!Array.isArray(productIds)) {
                    console.error(`Invalid products format in order ${order.id}:`, productIds);
                    return { ...order, products: [], quantities: {} };
                }

                // Fetch product details
                const products = await prisma.product.findMany({
                    where: { id: { in: productIds } }, // ✅ Now passing an array
                    select: { id: true, name: true },
                });

                return {
                    ...order,
                    products, // ✅ Attach full product objects
                    quantities: productQuantities, // ✅ Attach parsed quantities
                };
            })
        );

        return NextResponse.json(ordersWithProducts);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
    }
}


