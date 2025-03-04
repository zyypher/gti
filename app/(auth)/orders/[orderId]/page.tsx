"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import PageHeading from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Timeline, TimelineItem } from "@/components/custom/timeline";

interface Product {
    id: string;
    name: string;
}

interface Order {
    id: string;
    company: string;
    email: string;
    name: string;
    phone: string;
    products: Product[];
    quantities: Record<string, number>;
    status: string;
    createdAt: string;
    history: { createdAt: string; message: string }[];
}

export default function OrderDetailPage() {
    const { orderId } = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [status, setStatus] = useState('');
    const [updatedQuantities, setUpdatedQuantities] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchOrder();
    }, []);

    const fetchOrder = async () => {
        try {
            const response = await api.get(`/api/orders/${orderId}`);
            setOrder(response.data);
            setStatus(response.data.status);
            setUpdatedQuantities(response.data.quantities);
        } catch (error) {
            toast.error("Failed to fetch order details");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            await api.patch(`/api/orders/${orderId}`, { status: newStatus });

            setStatus(newStatus);
            const newHistoryItem = {
                createdAt: new Date().toISOString(),
                message: `Order status updated to ${newStatus}`,
            };

            setOrder((prev) =>
                prev ? { ...prev, history: [newHistoryItem, ...prev.history] } : prev
            );

            toast.success("Order status updated");
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const updateQuantities = async () => {
        setUpdating(true);
        try {
            await api.patch(`/api/orders/${orderId}`, { updatedQuantities });

            const newHistoryItem = {
                createdAt: new Date().toISOString(),
                message: "Order quantities updated",
            };

            setOrder((prev) =>
                prev ? { ...prev, history: [newHistoryItem, ...prev.history] } : prev
            );

            toast.success("Order quantities updated");
        } catch (error) {
            toast.error("Failed to update quantities");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <Skeleton className="h-32 w-full rounded-lg" />;
    }

    if (!order) {
        return <p className="text-red-500">Order not found.</p>;
    }

    return (
        <div className="space-y-4">
            <PageHeading heading={`Order Details: #${orderId}`} />

            {/* Order Details Grid Layout */}
            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Side: Customer & Product Info */}
                    <div>
                        <h3 className="text-lg font-semibold">{order.name}</h3>
                        <p className="text-sm text-gray-600">{order.company}</p>
                        <p className="text-sm text-gray-600">{order.email}</p>
                        <p className="text-sm text-gray-600">{order.phone}</p>

                        <div className="mt-4">
                            <h4 className="text-md font-semibold">Products Ordered</h4>
                            <ul className="mt-2">
                                {order.products.map((product) => (
                                    <li key={product.id} className="py-2 border-b last:border-none">
                                        {product.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Side: Quantities & Status */}
                    <div>
                        <div className="mb-4">
                            <h4 className="text-md font-semibold">Quantities</h4>
                            <ul className="mt-2">
                                {order.products.map((product) => (
                                    <li key={product.id} className="flex justify-between items-center py-2 border-b last:border-none">
                                        <span>{product.name}</span>
                                        <input
                                            type="number"
                                            value={updatedQuantities[product.id] || 0}
                                            onChange={(e) =>
                                                setUpdatedQuantities({
                                                    ...updatedQuantities,
                                                    [product.id]: parseInt(e.target.value) || 0,
                                                })
                                            }
                                            className="border p-1 w-20 text-center rounded-md"
                                        />
                                    </li>
                                ))}
                            </ul>
                            <Button className="mt-3" onClick={updateQuantities} disabled={updating}>
                                Update Quantities
                            </Button>
                        </div>

                        <div>
                            <h4 className="text-md font-semibold">Order Status</h4>
                            <select
                                value={status}
                                onChange={(e) => updateStatus(e.target.value)}
                                className="w-full mt-2 p-2 border rounded-md bg-white shadow"
                                disabled={updating}
                            >
                                <option value="CREATED">Created</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>
            </Card>

            {/* 🛠️ Updated Fancy Timeline (Latest Updates First) */}
            <Card className="p-6">
                <h4 className="text-md font-semibold mb-4">Order Timeline</h4>
                <Timeline>
                    {order.history
                        .slice()
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((event, index) => (
                            <TimelineItem key={index} time={event.createdAt}>
                                {event.message}
                            </TimelineItem>
                        ))}
                </Timeline>
            </Card>
        </div>
    );
}
