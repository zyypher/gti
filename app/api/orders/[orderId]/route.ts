import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { orderId: string } }) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: params.orderId },
            include: {
                history: {
                    orderBy: { createdAt: "asc" },
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

        // 🛠 Fix: Ensure productIds is a valid string array
        if (Array.isArray(order.products) && order.products.every(id => typeof id === "string")) {
            productIds = order.products as string[];
        } else if (typeof order.products === "string") {
            try {
                const parsedProducts = JSON.parse(order.products);
                if (Array.isArray(parsedProducts) && parsedProducts.every(id => typeof id === "string")) {
                    productIds = parsedProducts;
                } else {
                    throw new Error("Invalid format");
                }
            } catch (error) {
                console.error(`❌ Invalid products format for order ${order.id}:`, order.products);
                return NextResponse.json({ error: "Invalid products format" }, { status: 500 });
            }
        } else {
            console.error(`❌ Unexpected products format for order ${order.id}:`, order.products);
        }

        // 🛠 Fix: Ensure productQuantities is a valid object
        if (order.quantities && typeof order.quantities === "object" && !Array.isArray(order.quantities)) {
            productQuantities = order.quantities as Record<string, number>;
        } else if (typeof order.quantities === "string") {
            try {
                const parsedQuantities = JSON.parse(order.quantities);
                if (typeof parsedQuantities === "object" && !Array.isArray(parsedQuantities)) {
                    productQuantities = parsedQuantities;
                } else {
                    throw new Error("Invalid format");
                }
            } catch (error) {
                console.error(`❌ Invalid quantities format for order ${order.id}:`, order.quantities);
                return NextResponse.json({ error: "Invalid quantities format" }, { status: 500 });
            }
        }

        if (!Array.isArray(productIds)) {
            console.error(`❌ Invalid products format for order ${order.id}:`, productIds);
            return NextResponse.json({ error: "Invalid products format" }, { status: 500 });
        }

        // ✅ Fetch product details
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
        console.error("❌ Error fetching order:", error);
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

        // ✅ Update status if provided
        let updateData: Prisma.OrderUpdateInput = {};
        if (status) {
            updateData.status = status;
        }

        // ✅ Update quantities if provided
        if (updatedQuantities && typeof updatedQuantities === "object") {
            updateData.quantities = JSON.stringify(updatedQuantities);
        }

        // ✅ Perform update
        const updatedOrder = await prisma.order.update({
            where: { id: params.orderId },
            data: updateData,
        });

        // ✅ Add entry to order history
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
        console.error("❌ Error updating order:", error);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}
