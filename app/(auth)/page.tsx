'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import PageHeading from '@/components/layout/page-heading'
import { Card } from '@/components/ui/card'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from 'recharts'
import { Users, Package, FileText, Image, Database } from 'lucide-react'
import DashboardSkeleton from '@/components/DashboardSkeleton'

const Home = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalBrands: 0,
        totalProducts: 0,
        totalBanners: 0,
        totalAds: 0,
        totalSharedPdfs: 0,
        totalOrders: 0,
    })
    const [loadingStats, setLoadingStats] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/dashboard/stats');
            setStats(response.data);
        } catch (error) {
            toast.error('Failed to load dashboard stats');
        } finally {
            setLoadingStats(false);
        }
    };


    const data = [
        { name: 'Users', value: stats.totalUsers },
        { name: 'Brands', value: stats.totalBrands },
        { name: 'Products', value: stats.totalProducts },
        { name: 'Corporate Info', value: stats.totalBanners },
        { name: 'Ads', value: stats.totalAds },
        { name: 'Generated PDFs', value: stats.totalSharedPdfs },
        { name: 'Orders', value: stats.totalOrders },
    ]

    return (
        <div className="relative space-y-4">
            <PageHeading heading="Dashboard" />

            {loadingStats ? (
                <DashboardSkeleton />
            ) : (
                <>
                    {/* ✅ Stats Cards Section */}
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                        <Card className="relative rounded-[6px] rounded-b-none rounded-t-2xl border border-b-[3px] border-b-[#972d2d] bg-gray-100 p-5 shadow-md">
                            <div className="space-y-3.5 font-semibold">
                                <div className="flex items-center gap-1.5">
                                    <Users
                                        className="text-gray-700"
                                        size={24}
                                    />
                                    <h3 className="leading-tight">Users</h3>
                                </div>
                                <h4 className="text-3xl font-bold text-black">
                                    {stats.totalUsers}
                                </h4>
                            </div>
                        </Card>

                        <Card className="bg-green-100 relative rounded-[6px] rounded-b-none rounded-t-2xl border border-b-[3px] border-b-[#178f4d] p-5 shadow-md">
                            <div className="space-y-3.5 font-semibold">
                                <div className="flex items-center gap-1.5">
                                    <FileText
                                        className="text-green-700"
                                        size={24}
                                    />
                                    <h3 className="leading-tight">Brands</h3>
                                </div>
                                <h4 className="text-3xl font-bold text-black">
                                    {stats.totalBrands}
                                </h4>
                            </div>
                        </Card>

                        <Card className="bg-blue-100 relative rounded-[6px] rounded-b-none rounded-t-2xl border border-b-[3px] border-b-[#1d4ed8] p-5 shadow-md">
                            <div className="space-y-3.5 font-semibold">
                                <div className="flex items-center gap-1.5">
                                    <Package
                                        className="text-blue-700"
                                        size={24}
                                    />
                                    <h3 className="leading-tight">Products</h3>
                                </div>
                                <h4 className="text-3xl font-bold text-black">
                                    {stats.totalProducts}
                                </h4>
                            </div>
                        </Card>

                        <Card className="bg-yellow-100 relative rounded-[6px] rounded-b-none rounded-t-2xl border border-b-[3px] border-b-[#d97706] p-5 shadow-md">
                            <div className="space-y-3.5 font-semibold">
                                <div className="flex items-center gap-1.5">
                                    <Image
                                        className="text-yellow-700"
                                        size={24}
                                    />
                                    <h3 className="leading-tight">Corporate Info</h3>
                                </div>
                                <h4 className="text-3xl font-bold text-black">
                                    {stats.totalBanners}
                                </h4>
                            </div>
                        </Card>

                        <Card className="bg-orange-100 relative rounded-[6px] rounded-b-none rounded-t-2xl border border-b-[3px] border-b-[#c2410c] p-5 shadow-md">
                            <div className="space-y-3.5 font-semibold">
                                <div className="flex items-center gap-1.5">
                                    <Image
                                        className="text-orange-700"
                                        size={24}
                                    />
                                    <h3 className="leading-tight">Ads</h3>
                                </div>
                                <h4 className="text-3xl font-bold text-black">
                                    {stats.totalAds}
                                </h4>
                            </div>
                        </Card>

                        <Card className="bg-purple-100 relative rounded-[6px] rounded-b-none rounded-t-2xl border border-b-[3px] border-b-[#6d28d9] p-5 shadow-md">
                            <div className="space-y-3.5 font-semibold">
                                <div className="flex items-center gap-1.5">
                                    <Database
                                        className="text-purple-700"
                                        size={24}
                                    />
                                    <h3 className="leading-tight">
                                        Generated PDFs
                                    </h3>
                                </div>
                                <h4 className="text-3xl font-bold text-black">
                                    {stats.totalSharedPdfs}
                                </h4>
                            </div>
                        </Card>

                        <Card className="bg-pink-100 relative rounded-[6px] rounded-b-none rounded-t-2xl border border-b-[3px] border-b-[#db2777] p-5 shadow-md">
                            <div className="space-y-3.5 font-semibold">
                                <div className="flex items-center gap-1.5">
                                    <Package className="text-pink-700" size={24} />
                                    <h3 className="leading-tight">Orders</h3>
                                </div>
                                <h4 className="text-3xl font-bold text-black">
                                    {stats.totalOrders}
                                </h4>
                            </div>
                        </Card>

                    </div>

                    {/* ✅ Graphs Section */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* ✅ Bar Chart */}
                        <Card className="p-4">
                            <h3 className="font-semibold text-black">
                                Statistics Overview
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#4f46e5" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* ✅ Line Chart */}
                        <Card className="p-4">
                            <h3 className="font-semibold text-black">
                                Growth Over Time
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#e11d48"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}

export default Home
