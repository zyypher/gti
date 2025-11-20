import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from '@/lib/prisma'

export async function GET(
    req: Request,
    { params }: { params: { orderId: string } }
) {
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

        // 🔹 Try to find the related SharedPDF by slug
        const sharedPdf = await prisma.sharedPDF.findFirst({
            where: { uniqueSlug: order.slug },
            select: {
                proposalNumber: true,
                createdAt: true,
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                client: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        primaryNumber: true,
                        company: true,
                    },
                },
            },
        });

        const proposalNumber = sharedPdf?.proposalNumber ?? null;

        // map client → shape we want in JSON (with `phone`)
        const clientFromPdf = sharedPdf?.client
            ? {
                firstName: sharedPdf.client.firstName,
                lastName: sharedPdf.client.lastName,
                email: sharedPdf.client.email,
                phone: sharedPdf.client.primaryNumber,
                company: sharedPdf.client.company,
            }
            : null;

        // ✅ Ensure proper JSON parsing & type safety
        let productIds: string[] = [];
        let productQuantities: Record<string, number> = {};

        // 🛠 Fix: Ensure productIds is a valid string array
        if (Array.isArray(order.products) && order.products.every((id) => typeof id === "string")) {
            productIds = order.products as string[];
        } else if (typeof order.products === "string") {
            try {
                const parsedProducts = JSON.parse(order.products as unknown as string);
                if (Array.isArray(parsedProducts) && parsedProducts.every((id) => typeof id === "string")) {
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
            productQuantities = order.quantities as unknown as Record<string, number>;
        } else if (typeof order.quantities === "string") {
            try {
                const parsedQuantities = JSON.parse(order.quantities as unknown as string);
                if (typeof parsedQuantities === "object" && !Array.isArray(parsedQuantities)) {
                    productQuantities = parsedQuantities as Record<string, number>;
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
            proposalNumber,                     // 🔹 proposal number in response
            createdBy: sharedPdf?.createdBy ?? null, // 🔹 GTI staff
            client: clientFromPdf,              // 🔹 client (with phone)
            createdDate: sharedPdf?.createdAt ?? null, // 🔹 when proposal was created
        };

        return NextResponse.json(formattedOrder);
    } catch (error) {
        console.error("❌ Error fetching order:", error);
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}

// ✅ Update Order Status or Quantities
export async function PATCH(
    req: Request,
    { params }: { params: { orderId: string } }
) {
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
