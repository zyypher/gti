'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { CardContent } from '@/components/ui/card'
import PageHeading from '@/components/layout/page-heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Pencil, Trash2, Eye, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserRole } from '@/hooks/useUserRole'
import { useRouter } from 'next/navigation'

type Brand = {
    id: string
    name: string
    description: string
    image: string
}

const GlassCard = ({
    children,
    className = '',
}: {
    children: React.ReactNode
    className?: string
}) => (
    <div
        className={[
            'rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl',
            'shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.1)] transition-shadow',
            className,
        ].join(' ')}
    >
        {children}
    </div>
)

const BrandsPage = () => {
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
    const [buttonLoading, setButtonLoading] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const role = useUserRole()
    const router = useRouter()

    const brandSchema = yup.object().shape({
        name: yup.string().required('Brand name is required'),
        description: yup.string().required('Description is required'),
        image: yup
            .mixed()
            .test('fileRequired', 'Brand image is required', function (value) {
                if (selectedBrand) return true
                return value && (value as FileList).length > 0
            }),
    })

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(brandSchema),
    })

    useEffect(() => {
        const fetchBrands = async () => {
            setLoading(true)
            try {
                const response = await api.get('/api/brands')
                setBrands(response.data)
            } catch {
                toast.error('Failed to load brands')
            } finally {
                setLoading(false)
            }
        }
        fetchBrands()
    }, [])

    const handleAddOrEditBrand = async (data: any) => {
        setButtonLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', data.name)
            formData.append('description', data.description)
            if (data.image[0]) formData.append('image', data.image[0])

            const url = selectedBrand ? `/api/brands/${selectedBrand.id}` : '/api/brands'
            const method = selectedBrand ? 'put' : 'post'
            const response = await api({ method, url, data: formData, headers: { 'Content-Type': 'multipart/form-data' } })

            if (response.status === 200 || response.status === 201) {
                toast.success(`Brand ${selectedBrand ? 'updated' : 'added'} successfully`)
                setIsDialogOpen(false)
                reset()
                setSelectedBrand(null)
                setLoading(true)
                const refreshed = await api.get('/api/brands')
                setBrands(refreshed.data)
            } else toast.error('Failed to save brand')
        } catch (error) {
            console.error(error)
            toast.error('Error saving brand')
        } finally {
            setButtonLoading(false)
            setLoading(false)
        }
    }

    const openEditDialog = (brand: Brand) => {
        setSelectedBrand(brand)
        setValue('name', brand.name)
        setValue('description', brand.description)
        setIsDialogOpen(true)
    }

    const openDeleteDialog = (brand: Brand) => {
        setBrandToDelete(brand)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteBrand = async () => {
        if (!brandToDelete) return
        setIsDeleting(true)
        try {
            await api.delete('/api/brands', { data: { id: brandToDelete.id } })
            toast.success('Brand deleted successfully')
            setBrands((prev) => prev.filter((b) => b.id !== brandToDelete.id))
            setIsDeleteDialogOpen(false)
            setBrandToDelete(null)
        } catch (error) {
            console.error('Error deleting brand:', error)
            toast.error('Failed to delete brand')
        } finally {
            setIsDeleting(false)
        }
    }

    const onRefresh = async () => {
        setLoading(true)
        try {
            const response = await api.get('/api/brands')
            setBrands(response.data)
            toast.success('Brands refreshed')
        } catch {
            toast.error('Failed to refresh brands')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative">
            {/* Background gradient */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-100" />
                <div className="absolute left-1/2 top-[-120px] h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),rgba(255,255,255,0)_60%)]" />
            </div>

            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <PageHeading heading="Brands" />
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onRefresh}>
                            <RefreshCw size={16} className="mr-1" /> Refresh
                        </Button>
                        {role === 'ADMIN' && (
                            <Button
                                variant="black"
                                onClick={() => {
                                    setSelectedBrand(null)
                                    reset()
                                    setIsDialogOpen(true)
                                }}
                            >
                                + Add Brand
                            </Button>
                        )}
                    </div>
                </div>

                {/* Brand Grid */}
                <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <GlassCard key={i} className="p-4">
                                <Skeleton className="h-40 w-full rounded-xl" />
                                <div className="mt-3 space-y-2">
                                    <Skeleton className="h-6 w-2/3" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </GlassCard>
                        ))
                    ) : brands.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
                            <p>No brands found</p>
                        </div>
                    ) : (
                        brands.map((brand) => (
                            <GlassCard key={brand.id} className="overflow-hidden transition hover:scale-[1.02]">
                                <CardContent className="flex h-full flex-col justify-between space-y-4 p-4">
                                    <div>
                                        {brand.image ? (
                                            <img
                                                src={brand.image}
                                                alt={brand.name}
                                                className="h-44 w-full rounded-xl object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-44 w-full items-center justify-center rounded-xl bg-white/30 text-sm text-zinc-700">
                                                No Image
                                            </div>
                                        )}
                                        <h3 className="mt-3 text-lg font-semibold text-zinc-900">
                                            {brand.name}
                                        </h3>
                                        <p className="text-sm text-zinc-600">{brand.description}</p>
                                    </div>

                                    {role === 'ADMIN' && (
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => openEditDialog(brand)}
                                                className="rounded-full border border-white/30 bg-white/40 p-2 text-blue-700 hover:bg-blue-100/70"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => router.push(`/products?brandId=${brand.id}`)}
                                                title="View Products"
                                                className="rounded-full border border-white/30 bg-white/40 p-2 text-green-700 hover:bg-green-100/70"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => openDeleteDialog(brand)}
                                                className="rounded-full border border-white/30 bg-white/40 p-2 text-red-700 hover:bg-red-100/70"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </CardContent>
                            </GlassCard>
                        ))
                    )}
                </div>

                {/* Delete Dialog */}
                <Dialog
                    isOpen={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    title="Confirm Deletion"
                >
                    <div className="space-y-4 p-4">
                        <p className="text-zinc-800 text-lg font-medium">
                            Delete <strong>{brandToDelete?.name}</strong>?
                        </p>
                        <p className="text-sm text-zinc-600">
                            This action cannot be undone. All data related to this brand will be removed.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="black" onClick={handleDeleteBrand} disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </Dialog>

                {/* Add/Edit Dialog */}
                <Dialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    title={selectedBrand ? 'Edit Brand' : 'Add Brand'}
                >
                    <form onSubmit={handleSubmit(handleAddOrEditBrand)} className="space-y-5 p-2">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700">Brand Name</label>
                            <Input placeholder="Enter brand name" {...register('name')} />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">{errors.name.message as string}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700">Description</label>
                            <Input placeholder="Enter brand description" {...register('description')} />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.description.message as string}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700">Select an Image</label>
                            <Input type="file" accept="image/*" {...register('image')} />
                            {errors.image && (
                                <p className="mt-1 text-sm text-red-500">{errors.image.message as string}</p>
                            )}
                        </div>

                        {selectedBrand?.image && (
                            <div className="mb-2">
                                <img
                                    src={selectedBrand.image}
                                    alt="Current"
                                    className="h-24 rounded-xl object-cover"
                                />
                                <p className="text-xs text-zinc-500">Current image</p>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-4">
                            <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="black" disabled={buttonLoading}>
                                {buttonLoading
                                    ? 'Saving...'
                                    : selectedBrand
                                        ? 'Update Brand'
                                        : 'Add Brand'}
                            </Button>
                        </div>
                    </form>
                </Dialog>
            </div>
        </div>
    )
}

export default BrandsPage
