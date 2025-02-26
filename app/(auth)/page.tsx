'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/custom/table/data-table'
import { columns } from '@/components/custom/table/products/columns'
import PageHeading from '@/components/layout/page-heading'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const Home = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalBrands: 0,
        totalPromotions: 0,
    })
    const [topProducts, setTopProducts] = useState([])
    const [loadingStats, setLoadingStats] = useState(true) // ✅ Loading for stats
    const [loadingProducts, setLoadingProducts] = useState(true) // ✅ Loading for table

    useEffect(() => {
        fetchStats()
        fetchTopProducts()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/dashboard/stats')
            setStats(response.data)
        } catch (error) {
            toast.error('Failed to load dashboard stats')
        } finally {
            setLoadingStats(false) // ✅ Stop loading after fetching
        }
    }

    const fetchTopProducts = async () => {
        try {
            const response = await api.get('/api/products/top')
            setTopProducts(response.data)
        } catch (error) {
            toast.error('Failed to load top products')
        } finally {
            setLoadingProducts(false) // ✅ Stop loading after fetching
        }
    }

    return (
        <div className="relative space-y-4">
            <PageHeading heading="Dashboard" />

            {/* ✅ Stats Section with Skeleton Loader */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <Card>
                    <div className="p-4">
                        <h3>Total Products</h3>
                        {loadingStats ? (
                            <Skeleton className="h-6 w-16 rounded-md" />
                        ) : (
                            <h4>{stats.totalProducts}</h4>
                        )}
                    </div>
                </Card>
                <Card>
                    <div className="p-4">
                        <h3>Total Brands</h3>
                        {loadingStats ? (
                            <Skeleton className="h-6 w-16 rounded-md" />
                        ) : (
                            <h4>{stats.totalBrands}</h4>
                        )}
                    </div>
                </Card>
                <Card>
                    <div className="p-4">
                        <h3>Total Promotions</h3>
                        {loadingStats ? (
                            <Skeleton className="h-6 w-16 rounded-md" />
                        ) : (
                            <h4>{stats.totalPromotions}</h4>
                        )}
                    </div>
                </Card>
            </div>

            {/* ✅ Top Products Table with Skeleton Loader */}
            <div className="mt-4">
                <h2>Top Products</h2>
                {loadingProducts ? (
                    // 🟡 Skeleton Loader for Table
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full rounded-md" /> {/* Table Header */}
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Skeleton
                                key={index}
                                className="h-12 w-full rounded-md"
                            />
                        ))}
                    </div>
                ) : (
                    <DataTable
                        columns={columns(
                            (item) => console.log('Edit:', item),
                            (id) => console.log('Delete:', id)
                        )}
                        data={topProducts}
                        filterField="name"
                    />
                )}
            </div>
        </div>
    )
}

export default Home
