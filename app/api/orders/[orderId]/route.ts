import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { orderId: string } }) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: params.orderId },
            include: {
                history: {
                    orderBy: { createdAt: 'asc' }, // Sort history events
                    select: {
                        id: true,
                        createdAt: true,
                        message: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Parse products & quantities
        const productIds = JSON.parse(order.products || '[]');
        const productQuantities = JSON.parse(order.quantities || '{}');

        if (!Array.isArray(productIds)) {
            console.error(`Invalid products format for order ${order.id}`);
            return NextResponse.json({ error: 'Invalid products format' }, { status: 500 });
        }

        // Fetch product details
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
        });

        const formattedOrder = {
            ...order,
            products, // Attach full product objects
            quantities: productQuantities, // Attach parsed quantities
        };

        return NextResponse.json(formattedOrder);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}

// ✅ Update Order Status or Quantities
export async function PATCH(req: Request, { params }: { params: { orderId: string } }) {
    try {
        const { status, updatedQuantities } = await req.json();

        // Fetch existing order
        const order = await prisma.order.findUnique({ where: { id: params.orderId } });
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Update status if provided
        let updateData: any = {};
        if (status) {
            updateData.status = status;
        }

        // Update quantities if provided
        if (updatedQuantities) {
            updateData.quantities = JSON.stringify(updatedQuantities);
        }

        // Perform update
        const updatedOrder = await prisma.order.update({
            where: { id: params.orderId },
            data: updateData,
        });

        // Add Entry to Order History
        await prisma.orderHistory.create({
            data: {
                orderId: params.orderId,
                message: status
                    ? `Order status updated to ${status}`
                    : 'Order quantities updated',
            },
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
