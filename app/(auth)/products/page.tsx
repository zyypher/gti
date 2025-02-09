'use client'

import { columns, ITable } from '@/components/custom/table/columns'
import { DataTable } from '@/components/custom/table/data-table'
import PageHeading from '@/components/layout/page-heading'
import ProductsFilters from '@/components/products/filters/products-filters'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const Products = () => {
    const [products, setProducts] = useState<ITable[]>([])
    const [filters, setFilters] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true) // Start loading before fetch
            try {
                const queryParams = new URLSearchParams(filters).toString()
                const response = await fetch(`/api/products?${queryParams}`)
                const data = await response.json()
                setProducts(data)
            } catch (error) {
                console.error('Failed to fetch products:', error)
            } finally {
                setLoading(false) // Stop loading after fetch
            }
        }

        fetchProducts()
    }, [filters])

    const handleFilterChange = (newFilters: { [key: string]: string }) => {
        setFilters(newFilters)
    }

    const handleEdit = (item: ITable) => {
        console.log('Edit item:', item)
    }

    const handleDelete = (id: string) => {
        console.log('Delete item with ID:', id)
    }

    return (
        <div className="space-y-4">
            <PageHeading heading={'Products'} />

            <div className="min-h-[calc(100vh_-_160px)] w-full">
                <div className="flex items-center justify-between gap-4 overflow-x-auto rounded-t-lg bg-white px-5 py-[17px]">
                    <ProductsFilters onFilterChange={handleFilterChange} />
                    <Link href="/new-product">
                        <Button variant="black">
                            <Plus />
                            New Product
                        </Button>
                    </Link>
                </div>

                <DataTable
                    columns={columns(handleEdit, handleDelete)}
                    data={products}
                    filterField="product"
                    loading={loading}
                />
            </div>
        </div>
    )
}

export default Products
