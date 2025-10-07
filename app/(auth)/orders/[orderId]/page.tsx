"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import PageHeading from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, PackageCheck } from 'lucide-react'
import { format } from 'date-fns'
import { OrderDetailSkeleton } from "./OrderDetailSkeleton";

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

/* ------------------ purely presentational helper (style only) ------------------ */
const Glass = ({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <div
        className={[
            "rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl",
            "shadow-[0_6px_24px_rgba(0,0,0,0.08)]",
            className,
        ].join(" ")}
    >
        {children}
    </div>
);
/* ------------------------------------------------------------------------------ */

export default function OrderDetailPage() {
    const { orderId } = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [status, setStatus] = useState("");
    const [updatedQuantities, setUpdatedQuantities] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchOrder();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        return <OrderDetailSkeleton />;
    }

    if (!order) {
        return <p className="text-red-500 p-4">Order not found.</p>;
    }

    const metaForEvent = (message: string) => {
        if (message.includes('COMPLETED')) {
            return {
                label: 'Completed',
                dot: 'bg-emerald-500 ring-emerald-200',
                badge: 'bg-emerald-100 text-emerald-700',
                Icon: CheckCircle2,
            }
        }
        if (message.includes('IN_PROGRESS')) {
            return {
                label: 'In Progress',
                dot: 'bg-amber-500 ring-amber-200',
                badge: 'bg-amber-100 text-amber-700',
                Icon: Clock,
            }
        }
        if (message.includes('CREATED')) {
            return {
                label: 'Created',
                dot: 'bg-indigo-500 ring-indigo-200',
                badge: 'bg-indigo-100 text-indigo-700',
                Icon: Clock,
            }
        }
        return {
            label: 'Update',
            dot: 'bg-zinc-500 ring-zinc-200',
            badge: 'bg-zinc-100 text-zinc-700',
            Icon: PackageCheck,
        }
    }

    return (
        <div className="relative">
            {/* subtle gradient + radial glow */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-100" />
                <div className="absolute left-1/2 top-[-120px] h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),rgba(255,255,255,0)_60%)]" />
            </div>

            <div className="space-y-6 p-4">
                <PageHeading heading={`Order Details: #${orderId}`} />

                {/* Order Details Grid Layout */}
                <Glass>
                    <Card className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Left Side: Customer & Product Info */}
                            <div>
                                <h3 className="text-lg font-semibold tracking-tight text-zinc-900">{order.name}</h3>
                                <p className="text-sm text-zinc-700">{order.company}</p>
                                <p className="text-sm text-zinc-700">{order.email}</p>
                                <p className="text-sm text-zinc-700">{order.phone}</p>

                                <div className="mt-5">
                                    <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">
                                        Products Ordered
                                    </h4>
                                    <ul className="mt-3 rounded-2xl border border-white/30 bg-white/60 p-3 backdrop-blur">
                                        {order.products.map((product) => (
                                            <li
                                                key={product.id}
                                                className="border-b border-white/40 py-2 last:border-none text-zinc-800"
                                            >
                                                {product.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Right Side: Quantities & Status */}
                            <div>
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">
                                        Quantities
                                    </h4>
                                    <ul className="mt-3 rounded-2xl border border-white/30 bg-white/60 p-3 backdrop-blur">
                                        {order.products.map((product) => (
                                            <li
                                                key={product.id}
                                                className="flex items-center justify-between border-b border-white/40 py-2 last:border-none"
                                            >
                                                <span className="text-zinc-800">{product.name}</span>
                                                <input
                                                    type="number"
                                                    value={updatedQuantities[product.id] || 0}
                                                    onChange={(e) =>
                                                        setUpdatedQuantities({
                                                            ...updatedQuantities,
                                                            [product.id]: parseInt(e.target.value) || 0,
                                                        })
                                                    }
                                                    className="w-24 rounded-xl border border-white/40 bg-white/70 px-2 py-1 text-center text-zinc-900 placeholder:text-zinc-500 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className="mt-3 rounded-xl"
                                        onClick={updateQuantities}
                                        disabled={updating}
                                    >
                                        {updating ? "Updating…" : "Update Quantities"}
                                    </Button>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">
                                        Order Status
                                    </h4>
                                    <select
                                        value={status}
                                        onChange={(e) => updateStatus(e.target.value)}
                                        className="mt-3 w-full rounded-xl border border-white/40 bg-white/70 p-2 text-zinc-900 shadow-sm backdrop-blur focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
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
                </Glass>

                {/* Timeline */}
                <Glass>
                    <Card className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-900">
                            Order Timeline
                        </h4>

                        <div className="space-y-5">
                            {order.history
                                .slice()
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((event, idx) => {
                                    const { label, dot, badge, Icon } = metaForEvent(event.message)
                                    return (
                                        <div key={idx} className="grid grid-cols-[28px_1fr] gap-3">
                                            {/* LEFT: rail + dot (always perfectly aligned) */}
                                            <div className="relative">
                                                {/* vertical rail */}
                                                <div className="pointer-events-none absolute left-[13px] top-0 bottom-0 w-px bg-gradient-to-b from-zinc-300 via-zinc-200 to-transparent" />
                                                {/* dot aligned with header row of the card (p-4 => 16px; header height ≈ 12–14px) */}
                                                <span className={`mx-auto mt-[22px] block h-3 w-3 rounded-full ring-4 ${dot}`} />
                                            </div>

                                            {/* RIGHT: event card */}
                                            <div className="rounded-xl border border-white/50 bg-white/90 p-4 shadow-sm">
                                                <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-500">
                                                    <Icon className="h-3.5 w-3.5" />
                                                    <span>{format(new Date(event.createdAt), 'PP, p')}</span>
                                                    <span className={`ml-2 rounded-full px-2 py-0.5 ${badge}`}>{label}</span>
                                                </div>
                                                <p className="text-sm text-zinc-900">{event.message}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    </Card>
                </Glass>


            </div>
        </div>
    );
}
