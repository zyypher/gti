'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/custom/table/data-table'
import { columns } from '@/components/custom/table/products/columns' // ✅ Use the same columns as Products table
import PageHeading from '@/components/layout/page-heading'
import { Card } from '@/components/ui/card'

const Home = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalBrands: 0,
        totalAdvertisements: 0,
    })
    const [topProducts, setTopProducts] = useState([]) // ✅ Only top products

    useEffect(() => {
        fetchStats()
        fetchTopProducts() // ✅ Fetch only top products
    }, [])

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/dashboard/stats')
            setStats(response.data)
        } catch (error) {
            toast.error('Failed to load dashboard stats')
        }
    }

    const fetchTopProducts = async () => {
        try {
            // ✅ API should return only the top-selling or latest products
            const response = await api.get('/api/products/top') 
            setTopProducts(response.data)
        } catch (error) {
            toast.error('Failed to load top products')
        }
    }

    return (
        <div className="relative space-y-4">
            <PageHeading heading={'Dashboard'} />

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <Card>
                    <div className="p-4">
                        <h3>Total Products</h3>
                        <h4>{stats.totalProducts}</h4>
                    </div>
                </Card>
                <Card>
                    <div className="p-4">
                        <h3>Total Brands</h3>
                        <h4>{stats.totalBrands}</h4>
                    </div>
                </Card>
                <Card>
                    <div className="p-4">
                        <h3>Total Advertisements</h3>
                        <h4>{stats.totalAdvertisements}</h4>
                    </div>
                </Card>
            </div>

            <div className="mt-4">
                <h2>Top Products</h2>
                <DataTable
                    columns={columns(
                        (item) => console.log('Edit:', item),
                        (id) => console.log('Delete:', id)
                    )}
                    data={topProducts}
                    filterField="name"
                />
            </div>
        </div>
    )
}

export default Home
