'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import PageHeading from '@/components/layout/page-heading';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Phone, Mail, Building2 } from 'lucide-react';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
}

interface Order {
    id: string;
    slug: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    products: Product[];
    quantities: Record<string, number>;
    createdAt: string;
}

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get<Order[]>('/api/orders');
            setOrders(response.data);
        } catch (error) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <PageHeading heading="My Orders" />

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Card key={index} className="p-4">
                            <Skeleton className="mb-2 h-6 w-16 rounded-md" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </Card>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-10">
                    <p className="text-gray-500 text-lg">No orders found</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                    {orders.map((order) => (
                        <Card key={order.id} className="relative rounded-lg p-5 border border-gray-300 shadow-md bg-white">
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-black">{order.name}</h3>
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <Building2 className="size-4 text-blue-500" />
                                    {order.company}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <Mail className="size-4 text-gray-500" />
                                    {order.email}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <Phone className="size-4 text-green-500" />
                                    {order.phone}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <Calendar className="size-4 text-yellow-500" />
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                                <hr />
                                <div className="mt-2 text-sm">
                                    <strong>Products Ordered:</strong>
                                    <ul>
                                        {order.products.length > 0 ? (
                                            order.products.map((product) => (
                                                <li key={product.id} className="text-gray-800">
                                                    {product.name} - {order.quantities[product.id] || 0} units
                                                </li>
                                            ))
                                        ) : (
                                            <p className="text-gray-800">No products found</p>
                                        )}
                                    </ul>
                                </div>

                                <Link href={`/orders/${order.id}`} className="text-blue-500 font-medium">
                                    View Details →
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
