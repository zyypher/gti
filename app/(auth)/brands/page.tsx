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
import { Pencil } from 'lucide-react'

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

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm()

    useEffect(() => {
        const fetchBrands = async () => {
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
      try {
          const formData = new FormData()
          formData.append('name', data.name)
          formData.append('description', data.description || '')
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
              toast.success(`Brand ${selectedBrand ? 'updated' : 'added'} successfully`)
              setIsDialogOpen(false)
              reset()
              setSelectedBrand(null)
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
      }
  }
  
  

    const openEditDialog = (brand: Brand) => {
        setSelectedBrand(brand)
        setValue('name', brand.name)
        setValue('description', brand.description)
        setIsDialogOpen(true)
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                Loading...
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <PageHeading heading="Brands" />
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
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {brands.map((brand) => (
                    <Card
                        key={brand.id}
                        className="relative transition hover:shadow-lg"
                    >
                        <button
                            onClick={() => openEditDialog(brand)}
                            className="absolute right-2 top-2 rounded-full bg-gray-200 p-2 hover:bg-gray-300"
                        >
                            <Pencil size={16} />
                        </button>
                        <CardContent className="space-y-3 p-4">
                            <img
                                src={brand.image}
                                alt={brand.name}
                                className="h-40 w-full rounded-lg object-cover"
                            />
                            <h3 className="text-gray-800 text-lg font-semibold">
                                {brand.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {brand.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={selectedBrand ? 'Edit Brand' : 'Add Brand'}
                onSubmit={handleSubmit(handleAddOrEditBrand)}
                buttonLoading={buttonLoading}
            >
                <div className="space-y-4">
                    <div>
                        <Input
                            placeholder="Enter brand name"
                            {...register('name', {
                                required: 'Brand name is required',
                            })}
                        />
                        {errors.name?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.name.message)}
                            </p>
                        )}
                    </div>
                    <div>
                        <Input
                            placeholder="Enter brand description"
                            {...register('description')}
                        />
                    </div>
                    <div>
                        <Input
                            type="file"
                            accept="image/*"
                            {...register('image')}
                        />
                        {errors.image?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.image.message)}
                            </p>
                        )}
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default BrandsPage
