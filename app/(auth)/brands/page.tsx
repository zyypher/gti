'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Card, CardContent } from '@/components/ui/card'
import PageHeading from '@/components/layout/page-heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Pencil, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw } from 'lucide-react'
import { useUserRole } from '@/hooks/useUserRole'

type Brand = {
    id: string
    name: string
    description: string
    image: string
}

const BrandsPage = () => {
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
    const [buttonLoading, setButtonLoading] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null)
    const [isDeleting, setIsDeleting] = useState(false) // ✅ New state for delete button loading
    const role = useUserRole()

    // ✅ Yup Schema Validation
    const brandSchema = yup.object().shape({
        name: yup.string().required('Brand name is required'),
        description: yup.string().required('Description is required'),
        image: yup
            .mixed()
            .test('fileRequired', 'Brand image is required', function (value) {
                if (selectedBrand) return true // ✅ Skip validation during edit
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
            } catch (error) {
                toast.error('Failed to load brands')
            } finally {
                setLoading(false)
            }
        }

        fetchBrands()
    }, [])

    const handleAddOrEditBrand = async (data: any) => {
        setButtonLoading(true)
        // ❌ REMOVE THIS: setLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', data.name)
            formData.append('description', data.description)
            if (data.image[0]) {
                formData.append('image', data.image[0])
            }

            const url = selectedBrand
                ? `/api/brands/${selectedBrand.id}`
                : '/api/brands'

            const method = selectedBrand ? 'put' : 'post'

            const response = await api({
                method,
                url,
                data: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            if (response.status === 200 || response.status === 201) {
                toast.success(
                    `Brand ${selectedBrand ? 'updated' : 'added'} successfully`,
                )
                setIsDialogOpen(false)
                reset()
                setSelectedBrand(null)

                // ✅ Refresh brands with loading feedback (optional)
                setLoading(true) // ← only before re-fetch
                const refreshedBrands = await api.get('/api/brands')
                setBrands(refreshedBrands.data)
            } else {
                toast.error('Failed to save brand')
            }
        } catch (error) {
            toast.error('Error saving brand')
            console.error(error)
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

    // ✅ Open Delete Confirmation Dialog
    const openDeleteDialog = (brand: Brand) => {
        setBrandToDelete(brand)
        setIsDeleteDialogOpen(true)
    }

    // ✅ Handle Brand Deletion with Loading State
    const handleDeleteBrand = async () => {
        if (!brandToDelete) return

        setIsDeleting(true) // ✅ Start Loading
        try {
            await api.delete('/api/brands', {
                data: { id: brandToDelete.id },
            })

            toast.success('Brand deleted successfully')
            setBrands((prev) => prev.filter((b) => b.id !== brandToDelete.id))
            setIsDeleteDialogOpen(false)
            setBrandToDelete(null)
        } catch (error) {
            toast.error('Failed to delete brand')
            console.error('Error deleting brand:', error)
        } finally {
            setIsDeleting(false) // ✅ Stop Loading
        }
    }

    const onRefresh = async () => {
        setLoading(true)
        try {
            const response = await api.get('/api/brands')
            setBrands(response.data)
            toast.success('Brands refreshed')
        } catch (error) {
            toast.error('Failed to refresh brands')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <PageHeading heading="Brands" />
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onRefresh}>
                    <RefreshCw size={18} className="mr-1" />
                    Refresh
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
                        Add Brand
                    </Button>
                )}
            </div>

            {/* ✅ Brand Grid Section with Conditional Loading */}
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {loading ? (
                    Array.from({ length: 9 }).map((_, index) => (
                        <Card key={index} className="relative">
                            <CardContent className="space-y-3 p-4">
                                <Skeleton className="h-40 w-full rounded-lg" />
                                <Skeleton className="h-6 w-3/4 rounded-md" />
                                <Skeleton className="h-4 w-1/2 rounded-md" />
                                <Skeleton className="absolute bottom-2 right-2 h-8 w-8 rounded-full" />
                            </CardContent>
                        </Card>
                    ))
                ) : brands.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-10">
                        <p className="text-lg text-gray-500">No brands found</p>
                    </div>
                ) : (
                    brands.map((brand) => (
                        <Card
                            key={brand.id}
                            className="relative w-full max-w-[300px] transition hover:shadow-lg"
                        >
                            <CardContent className="relative space-y-3 p-4">
                                {brand.image ? (
                                    <img
                                        src={brand.image}
                                        alt={brand.name}
                                        className="h-40 w-full rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="flex h-40 w-full items-center justify-center rounded-lg bg-gray-300 text-sm text-gray-700">
                                        No Image Available
                                    </div>
                                )}
                                <h3 className="text-gray-800 text-lg font-semibold">
                                    {brand.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {brand.description}
                                </p>
                                {role === 'ADMIN' && (
                                    <div className="absolute bottom-2 right-2 flex gap-2">
                                        <button
                                            className="rounded-full bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                                            onClick={() => openEditDialog(brand)}
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            className="rounded-full bg-red-100 p-2 text-red-600 hover:bg-red-200"
                                            onClick={() => openDeleteDialog(brand)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* ✅ Delete Confirmation Dialog with Loading Indicator */}
            <Dialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                title="Confirm Deletion"
            >
                <div className="space-y-4 p-4">
                    <p className="text-gray-800 text-lg font-medium">
                        Are you sure you want to delete the brand{' '}
                        <strong className="text-black">
                            {brandToDelete?.name}
                        </strong>
                        ?
                    </p>

                    <p className="text-sm text-gray-600">
                        This action cannot be undone. The brand and all related
                        data will be permanently removed.
                    </p>

                    {/* 🔹 Buttons */}
                    <div className="mt-6 flex justify-end gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="black"
                            onClick={handleDeleteBrand}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <span className="flex items-center">
                                    <span className="loader mr-2"></span>{' '}
                                    Deleting...
                                </span>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* ✅ Add/Edit Brand Dialog */}
            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={selectedBrand ? 'Edit Brand' : 'Add Brand'}
                buttonLoading={buttonLoading} // ✅ Keeps the existing pattern
            >
                <form onSubmit={handleSubmit(handleAddOrEditBrand)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block font-medium text-gray-700">
                                Brand Name
                            </label>
                            <Input
                                placeholder="Enter brand name"
                                {...register('name')}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block font-medium text-gray-700">
                                Description
                            </label>
                            <Input
                                placeholder="Enter brand description"
                                {...register('description')}
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.description.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="block font-medium text-gray-700">
                                Select an Image
                            </label>
                            <Input
                                type="file"
                                accept="image/*"
                                {...register('image')}
                            />
                            {errors.image && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.image.message}
                                </p>
                            )}
                        </div>
                        {selectedBrand?.image && (
                            <div className="mb-2">
                                <img
                                    src={selectedBrand.image}
                                    alt="Current Brand"
                                    className="h-20 rounded-lg object-cover"
                                />
                                <p className="text-xs text-gray-500">
                                    Current image
                                </p>
                            </div>
                        )}

                        {/* ✅ Submit Button with Loader (Maintains the Same Pattern) */}
                        <div className="mt-6 flex justify-end gap-4">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="black"
                                disabled={buttonLoading}
                            >
                                {buttonLoading ? (
                                    <span className="flex items-center">
                                        <span className="loader mr-2"></span>{' '}
                                        Saving...
                                    </span>
                                ) : selectedBrand ? (
                                    'Update Brand'
                                ) : (
                                    'Add Brand'
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </Dialog>
        </div>
    )
}

export default BrandsPage
