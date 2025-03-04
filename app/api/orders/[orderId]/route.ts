import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { orderId: string } }) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: params.orderId },
            include: {
                history: {
                    orderBy: { createdAt: "asc" }, // Sort history events
                    select: {
                        id: true,
                        createdAt: true,
                        message: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // ✅ Ensure proper JSON parsing & type safety
        let productIds: string[] = [];
        let productQuantities: Record<string, number> = {};

        if (Array.isArray(order.products)) {
            productIds = order.products;
        } else if (typeof order.products === "string") {
            try {
                productIds = JSON.parse(order.products);
            } catch (error) {
                console.error(`Invalid products format for order ${order.id}:`, order.products);
                return NextResponse.json({ error: "Invalid products format" }, { status: 500 });
            }
        }

        if (typeof order.quantities === "object" && !Array.isArray(order.quantities)) {
            productQuantities = order.quantities as Record<string, number>;
        } else if (typeof order.quantities === "string") {
            try {
                productQuantities = JSON.parse(order.quantities);
            } catch (error) {
                console.error(`Invalid quantities format for order ${order.id}:`, order.quantities);
                return NextResponse.json({ error: "Invalid quantities format" }, { status: 500 });
            }
        }

        if (!Array.isArray(productIds)) {
            console.error(`Invalid products format for order ${order.id}:`, productIds);
            return NextResponse.json({ error: "Invalid products format" }, { status: 500 });
        }

        // Fetch product details
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
        });

        const formattedOrder = {
            ...order,
            products,
            quantities: productQuantities,
        };

        return NextResponse.json(formattedOrder);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}

// ✅ Update Order Status or Quantities
export async function PATCH(req: Request, { params }: { params: { orderId: string } }) {
    try {
        const { status, updatedQuantities } = await req.json();

        // Fetch existing order
        const order = await prisma.order.findUnique({ where: { id: params.orderId } });
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Update status if provided
        let updateData: any = {};
        if (status) {
            updateData.status = status;
        }

        // Update quantities if provided
        if (updatedQuantities && typeof updatedQuantities === "object") {
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
                    : "Order quantities updated",
            },
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}
