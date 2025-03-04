import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserIdFromToken } from "@/lib/getUserIdFromToken";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const userId = await getUserIdFromToken(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

        // Fetch orders
        const orders = await prisma.order.findMany({
            where: { slug: { in: slugs } },
            orderBy: { createdAt: "desc" },
        });

        // ✅ Ensure proper JSON parsing & type safety
        const ordersWithProducts = await Promise.all(
            orders.map(async (order) => {
                let productIds: string[] = [];
                let productQuantities: Record<string, number> = {};

                // 🛠 Fix: Handle different JSON formats safely
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
                        return { ...order, products: [], quantities: {} };
                    }
                }

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
                        return { ...order, products: [], quantities: {} };
                    }
                }

                // ✅ Fetch product details
                const products = await prisma.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true, name: true },
                });

                return {
                    ...order,
                    products, // Attach full product objects
                    quantities: productQuantities, // Attach parsed quantities
                };
            })
        );

        return NextResponse.json(ordersWithProducts);
    } catch (error) {
        console.error("❌ Error fetching orders:", error);
        return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
    }
}
