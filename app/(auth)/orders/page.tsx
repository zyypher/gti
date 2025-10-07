'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import PageHeading from '@/components/layout/page-heading'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Phone, Mail, Building2 } from 'lucide-react'
import Link from 'next/link'

interface Product {
    id: string
    name: string
}

interface Order {
    id: string
    slug: string
    name: string
    company: string
    email: string
    phone: string
    products: Product[]
    quantities: Record<string, number>
    createdAt: string
    status: string
}

/* ------------------ purely presentational helper (style only) ------------------ */
const Glass = ({
    children,
    className = '',
}: {
    children: React.ReactNode
    className?: string
}) => (
    <div
        className={[
            'rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl',
            'shadow-[0_6px_24px_rgba(0,0,0,0.08)]',
            className,
        ].join(' ')}
    >
        {children}
    </div>
)
/* ------------------------------------------------------------------------------ */

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const response = await api.get<Order[]>('/api/orders')
            setOrders(response.data)
        } catch (error) {
            toast.error('Failed to load orders')
        } finally {
            setLoading(false)
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'CREATED':
                return {
                    label: 'Created',
                    style: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
                }
            case 'IN_PROGRESS':
                return {
                    label: 'In Progress',
                    style: { backgroundColor: '#FEF9C3', color: '#92400E' },
                }
            case 'COMPLETED':
                return {
                    label: 'Completed',
                    style: { backgroundColor: '#DCFCE7', color: '#15803D' },
                }
            default:
                return {
                    label: status,
                    style: { backgroundColor: '#F3F4F6', color: '#374151' },
                }
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
                <PageHeading heading="My Orders" />

                {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Glass key={index} className="p-5">
                                <Skeleton className="mb-3 h-6 w-24 rounded-md" />
                                <div className="rounded-2xl border border-white/20 bg-white/50 p-4 shadow-sm backdrop-blur-xl">
                                    <Skeleton className="mb-3 h-5 w-3/5" />
                                    <Skeleton className="mb-2 h-4 w-4/5" />
                                    <Skeleton className="mb-2 h-4 w-3/5" />
                                    <Skeleton className="mb-2 h-4 w-2/5" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </Glass>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <Glass className="p-10">
                        <div className="col-span-full flex flex-col items-center justify-center">
                            <p className="text-lg text-zinc-500">No orders found</p>
                        </div>
                    </Glass>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                        {orders.map((order) => {
                            const { label, style } = getStatusStyle(order.status)
                            return (
                                <Glass key={order.id} className="transition hover:scale-[1.01]">
                                    <Card className="relative rounded-2xl border border-white/20 bg-white/60 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
                                                    {order.name}
                                                </h3>
                                                <span
                                                    style={{
                                                        ...style,
                                                        padding: '6px 10px',
                                                        borderRadius: '9999px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                                        border: '1px solid rgba(255,255,255,0.6)',
                                                        backdropFilter: 'blur(6px)',
                                                    }}
                                                >
                                                    {label}
                                                </span>
                                            </div>

                                            <p className="flex items-center gap-2 text-sm text-zinc-700">
                                                <Building2 className="size-4 text-indigo-600" />
                                                {order.company}
                                            </p>
                                            <p className="flex items-center gap-2 text-sm text-zinc-700">
                                                <Mail className="size-4 text-zinc-500" />
                                                {order.email}
                                            </p>
                                            <p className="flex items-center gap-2 text-sm text-zinc-700">
                                                <Phone className="size-4 text-emerald-600" />
                                                {order.phone}
                                            </p>
                                            <p className="flex items-center gap-2 text-sm text-zinc-700">
                                                <Calendar className="size-4 text-amber-600" />
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </p>

                                            <div className="my-2 h-px w-full bg-gradient-to-r from-transparent via-zinc-300/60 to-transparent" />

                                            <div className="mt-2 text-sm">
                                                <strong className="text-zinc-900">Products Ordered:</strong>
                                                <ul className="mt-1 space-y-0.5">
                                                    {order.products.length > 0 ? (
                                                        order.products.map((product) => (
                                                            <li key={product.id} className="text-zinc-800">
                                                                {product.name} — {order.quantities[product.id] || 0} units
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <p className="text-zinc-800">No products found</p>
                                                    )}
                                                </ul>
                                            </div>

                                            <div className="pt-2">
                                                <Link
                                                    href={`/orders/${order.id}`}
                                                    className="inline-flex items-center rounded-xl border border-white/30 bg-white/70 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm backdrop-blur hover:bg-white/80"
                                                >
                                                    View Details →
                                                </Link>
                                            </div>
                                        </div>
                                    </Card>
                                </Glass>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
