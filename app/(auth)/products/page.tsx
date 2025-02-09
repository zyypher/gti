'use client'

import { useEffect, useState } from 'react'
import { columns, ITable } from '@/components/custom/table/columns'
import { DataTable } from '@/components/custom/table/data-table'
import ProductsFilters from '@/components/products/filters/products-filters'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import routes from '@/lib/routes'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Dialog } from '@/components/ui/dialog'

interface IBrand {
    id: string
    name: string
}

const Products = () => {
    const [products, setProducts] = useState<ITable[]>([])
    const [brands, setBrands] = useState<IBrand[]>([])
    const [filters, setFilters] = useState({})
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm()

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true)
            try {
                const queryParams = new URLSearchParams(filters).toString()
                const response = await fetch(`/api/products?${queryParams}`)
                const data = await response.json()
                setProducts(data)
            } catch (error) {
                console.error('Failed to fetch products:', error)
            } finally {
                setLoading(false)
            }
        }

        async function fetchBrands() {
            try {
                const response = await fetch('/api/brands')
                const data = await response.json()
                setBrands(data)
            } catch (error) {
                console.error('Failed to fetch brands:', error)
            }
        }

        fetchProducts()
        fetchBrands()
    }, [filters])

    const handleAddProduct = async (data: any) => {
        try {
            const response = await api.post(routes.addProduct, {
                ...data,
            })
    
            if (response.status === 201 || response.status === 200) {
                setProducts((prev) => [...prev, response.data])
                toast.success('Product added successfully')
                reset()
                setIsDialogOpen(false)
            } else {
                toast.error('Failed to add product')
            }
        } catch (error) {
            toast.error('Error adding product')
            console.error('Error:', error)
        }
    }
    

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
            <div className="flex items-center justify-between gap-4">
                <ProductsFilters onFilterChange={handleFilterChange} />
                <Button variant="black" onClick={() => setIsDialogOpen(true)}>
                    <Plus />
                    New Product
                </Button>
            </div>

            <DataTable
                columns={columns(handleEdit, handleDelete)}
                data={products}
                filterField="product"
                loading={loading}
            />

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title="Add New Product"
                onSubmit={handleSubmit(handleAddProduct)}
            >
                <div className="space-y-4">
                    <div>
                        <Input
                            placeholder="Enter product name"
                            {...register('name', {
                                required: 'Product name is required',
                            })}
                        />
                        {errors.name?.message && (
                            <p className="text-red-500 mt-1 text-sm">
                                {String(errors.name.message)}
                            </p>
                        )}
                    </div>

                    <div>
                        <select
                            {...register('brandId', {
                                required: 'Brand is required',
                            })}
                            className="block w-full rounded-lg border p-2"
                        >
                            <option value="">Select a brand</option>
                            {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                        {errors.brandId?.message && (
                            <p className="text-red-500 mt-1 text-sm">
                                {String(errors.brandId.message)}
                            </p>
                        )}
                    </div>

                    <Input placeholder="Enter size" {...register('size')} />
                    <Input placeholder="Enter tar (mg)" {...register('tar')} />
                    <Input
                        placeholder="Enter nicotine (mg)"
                        {...register('nicotine')}
                    />
                    <Input placeholder="Enter CO (mg)" {...register('co')} />
                    <Input placeholder="Flavor" {...register('flavor')} />
                    <Input placeholder="fsp" {...register('fsp')} />
                    <Input placeholder="corners" {...register('corners')} />
                    <Input placeholder="capsules" {...register('capsules')} />
                </div>
            </Dialog>
        </div>
    )
}

export default Products
