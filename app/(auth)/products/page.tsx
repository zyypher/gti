'use client'

import { useEffect, useState } from 'react'
import { columns, ITable } from '@/components/custom/table/products/columns'
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
import { nanoid } from 'nanoid' // Generate unique slug
import PageHeading from '@/components/layout/page-heading'

interface IBrand {
    id: string
    name: string
}

export type IPromotion = {
    id: string
    title: string
    type: 'banner' | 'advertisement'
    filePath: string
}

const Products = () => {
    const [products, setProducts] = useState<ITable[]>([])
    const [brands, setBrands] = useState<IBrand[]>([])
    const [filters, setFilters] = useState({})
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [buttonLoading, setButtonLoading] = useState(false)
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false)
    const [pdfStep, setPdfStep] = useState(1) // Tracks modal steps
    const [selectedBanner, setSelectedBanner] = useState<string | null>(null)
    const [selectedAdvertisement, setSelectedAdvertisement] = useState<
        string | null
    >(null)
    const [banners, setBanners] = useState<IPromotion[]>([])
    const [advertisements, setAdvertisements] = useState<IPromotion[]>([])
    const [selectedProduct, setSelectedProduct] = useState<ITable | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [deleteProductId, setDeleteProductId] = useState<string | null>(null)

    const isPWA = () => {
        if (typeof window !== 'undefined') {
            return (
                window.matchMedia('(display-mode: standalone)').matches ||
                (navigator as any).standalone === true
            )
        }
        return false
    }

    const isMobile = () => {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    }

    // Fetch banners and advertisements
    useEffect(() => {
        const fetchPromotions = async () => {
            try {
                const response = await api.get('/api/promotions')
                const data: IPromotion[] = response.data
                setBanners(data.filter((item) => item.type === 'banner'))
                setAdvertisements(
                    data.filter((item) => item.type === 'advertisement'),
                )
            } catch (error) {
                console.error('Failed to load promotions:', error)
            }
        }
        fetchPromotions()
    }, [])

    // Handle Next Step in PDF modal
    const handleNextStep = () => {
        if (pdfStep === 1 && !selectedBanner) {
            toast.error('Please select a banner')
            return
        }
        if (pdfStep === 2 && !selectedAdvertisement) {
            toast.error('Please select an advertisement')
            return
        }
        setPdfStep((prevStep) => prevStep + 1)
    }

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm()

    // Fetch products
    const fetchProducts = async () => {
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

    // Function to fetch brands
    const fetchBrands = async () => {
        try {
            const response = await fetch('/api/brands')
            const data = await response.json()
            setBrands(data)
        } catch (error) {
            console.error('Failed to fetch brands:', error)
        }
    }

    useEffect(() => {
        fetchProducts()
        fetchBrands()
    }, [filters])

    const handleFilterChange = (newFilters: { [key: string]: string }) => {
        setFilters(newFilters)
    }

    const handleEdit = (item: ITable) => {
        setSelectedProduct(item)
        setIsDialogOpen(true)
        Object.keys(item).forEach((key) =>
            setValue(key as any, (item as any)[key]),
        ) // Auto-fill form
    }

    const handleDelete = (id: string) => {
        setDeleteProductId(id)
        setIsDeleteDialogOpen(true)
    }

    const handleRowSelection = (ids: string[]) => {
        setSelectedRows(ids)
        console.log('##Selected rows in Products page:', ids)
    }

    // Handle Create PDF

    const handleGeneratePDF = async () => {
        setButtonLoading(true)
        try {
            const response = await api.post('/api/pdf/generate', {
                bannerId: selectedBanner,
                advertisementId: selectedAdvertisement,
                productIds: selectedRows,
            })

            if (response.status === 200) {
                toast.success('PDF generated successfully!')
                const pdfUrl = response.data.url
                const fileName = `Merged_Document_${new Date().toISOString()}.pdf`

                // Generate a unique short URL slug
                const uniqueSlug = nanoid(10)
                const expirationDate = new Date()
                expirationDate.setDate(expirationDate.getDate() + 30) // Expires in 30 days

                // Save the URL mapping in the database
                await api.post('/api/shared-pdf', {
                    uniqueSlug,
                    productIds: selectedRows.join(','), // Store as CSV
                    expiresAt: expirationDate.toISOString(),
                })
                setIsPdfDialogOpen(false)
                setPdfStep(1)
                setSelectedBanner(null)
                setSelectedAdvertisement(null)
                reset();
                setSelectedRows([]);

                const shareableUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/${uniqueSlug}` // Change to your domain

                if (isPWA() || isMobile()) {
                    // Mobile Share
                    if (navigator.share) {
                        const blob = await fetch(pdfUrl).then((res) =>
                            res.blob(),
                        )
                        const file = new File([blob], fileName, {
                            type: 'application/pdf',
                        })

                        const shareData = {
                            title: 'Shared PDF',
                            text: `View the products here: ${shareableUrl}`,
                            files: [file],
                        }

                        navigator
                            .share(shareData)
                            .then(() => console.log('Shared successfully'))
                            .catch((err) =>
                                console.error('Error sharing:', err),
                            )
                    } else {
                        toast.error('Sharing not supported')
                    }
                } else {
                    // Desktop Mode: Download & Show URL
                    const downloadLink = document.createElement('a')
                    downloadLink.href = pdfUrl
                    downloadLink.download = fileName
                    document.body.appendChild(downloadLink)
                    downloadLink.click()
                    document.body.removeChild(downloadLink)

                    // Show shareable link
                    toast.success(`Share this URL: ${shareableUrl}`)
                }
            } else {
                toast.error('Failed to generate PDF.')
            }
        } catch (error) {
            toast.error('Error generating PDF.')
            console.error('Error:', error)
        } finally {
            setButtonLoading(false)
        }
    }

    const handleAddOrUpdateProduct = async (data: any) => {
        setButtonLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', data.name)
            formData.append('brandId', data.brandId)
            formData.append('size', data.size || '')
            formData.append('tar', data.tar || '')
            formData.append('nicotine', data.nicotine || '')
            formData.append('co', data.co || '')
            formData.append('flavor', data.flavor || '')
            formData.append('fsp', data.fsp || '')
            formData.append('corners', data.corners || '')
            formData.append('capsules', data.capsules || '')

            // ✅ Append new image/PDF only if selected
            if (selectedProduct) {
                if (data.image?.[0]) {
                    formData.append('image', data.image[0])
                }
                if (data.pdf?.[0]) {
                    formData.append('pdf', data.pdf[0])
                }
            } else {
                if (data.image?.[0]) formData.append('image', data.image[0])
                if (data.pdf?.[0]) formData.append('pdf', data.pdf[0])
            }

            let response
            if (selectedProduct) {
                response = await api.put(
                    `/api/products/${selectedProduct.id}/pdf`,
                    formData,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    },
                ) // Update product
            } else {
                response = await api.post(routes.addProduct, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }) // Create product
            }

            if (response.status === 200 || response.status === 201) {
                toast.success(
                    `Product ${selectedProduct ? 'updated' : 'added'} successfully`,
                )
                fetchProducts()
                setIsDialogOpen(false)
                reset()
                setSelectedProduct(null)
            } else {
                toast.error(
                    `Failed to ${selectedProduct ? 'update' : 'add'} product`,
                )
            }
        } catch (error) {
            toast.error(
                `Error ${selectedProduct ? 'updating' : 'adding'} product`,
            )
            console.error(error)
        } finally {
            setButtonLoading(false)
        }
    }

    const handleDeleteProduct = async () => {
        if (!deleteProductId) return
        try {
            const response = await api.delete(
                `/api/products/${deleteProductId}/pdf`,
            )
            if (response.status === 200) {
                toast.success('Product deleted successfully')
                fetchProducts()
                setIsDeleteDialogOpen(false)
            } else {
                toast.error('Failed to delete product')
            }
        } catch (error) {
            toast.error('Error deleting product')
            console.error(error)
        }
    }

    return (
        <div className="space-y-4">
            <PageHeading heading="Products" />
            <div className="flex items-center justify-between gap-4">
                <ProductsFilters onFilterChange={handleFilterChange} />
                <div className="flex gap-4">
                    <Button
                        variant="black"
                        onClick={() => setIsDialogOpen(true)}
                    >
                        <Plus />
                        New Product
                    </Button>
                    <Button
                        variant="outline-black"
                        disabled={selectedRows.length === 0}
                        onClick={() => setIsPdfDialogOpen(true)}
                    >
                        Create PDF
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns(handleEdit, handleDelete)}
                data={products}
                filterField="product"
                loading={loading}
                rowSelectionCallback={handleRowSelection}
            />

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false)
                    reset()
                    setSelectedProduct(null)
                }}
                title={selectedProduct ? 'Edit Product' : 'Add New Product'}
                onSubmit={handleSubmit(handleAddOrUpdateProduct)}
                buttonLoading={buttonLoading}
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
                            <p className="mt-1 text-sm text-red-500">
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
                            <p className="mt-1 text-sm text-red-500">
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
                    <Input placeholder="FSP" {...register('fsp')} />
                    <Input placeholder="Corners" {...register('corners')} />
                    <Input placeholder="Capsules" {...register('capsules')} />
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Upload Product Image
                        </label>
                        <Input
                            type="file"
                            accept="image/*"
                            {...register('image')}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Upload Product PDF
                        </label>
                        <Input
                            type="file"
                            accept="application/pdf"
                            {...register('pdf')}
                        />
                    </div>
                </div>
            </Dialog>

            <Dialog
                isOpen={isPdfDialogOpen}
                onClose={() => {
                    setIsPdfDialogOpen(false)
                    setPdfStep(1)
                    setSelectedBanner(null)
                    setSelectedAdvertisement(null)
                }}
                // onSubmit={() => {}}
                title={
                    pdfStep === 1
                        ? 'Select Banner'
                        : pdfStep === 2
                          ? 'Select Advertisement'
                          : 'Confirm & Generate PDF'
                }
            >
                <div className="space-y-4 p-4">
                    {pdfStep === 1 && (
                        <>
                            <p>Select a Banner for the PDF:</p>
                            <select
                                className="w-full rounded border p-2"
                                value={selectedBanner || ''}
                                onChange={(e) =>
                                    setSelectedBanner(e.target.value)
                                }
                            >
                                <option value="">Select Banner</option>
                                {banners.map((banner) => (
                                    <option key={banner.id} value={banner.id}>
                                        {banner.title}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                    {pdfStep === 2 && (
                        <>
                            <p>Select an Advertisement for the PDF:</p>
                            <select
                                className="w-full rounded border p-2"
                                value={selectedAdvertisement || ''}
                                onChange={(e) =>
                                    setSelectedAdvertisement(e.target.value)
                                }
                            >
                                <option value="">Select Advertisement</option>
                                {advertisements.map((ad) => (
                                    <option key={ad.id} value={ad.id}>
                                        {ad.title}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                    {pdfStep === 3 && (
                        <>
                            <p className="text-lg font-medium">
                                Confirm the selection and generate PDF:
                            </p>
                            <ul className="space-y-2">
                                <li>
                                    <strong>Banner:</strong>{' '}
                                    {banners.find(
                                        (b) => b.id === selectedBanner,
                                    )?.title || 'Not selected'}
                                </li>
                                <li>
                                    <strong>Advertisement:</strong>{' '}
                                    {advertisements.find(
                                        (a) => a.id === selectedAdvertisement,
                                    )?.title || 'Not selected'}
                                </li>
                                <li>
                                    <strong>Products Selected:</strong>
                                    <ul className="ml-4 list-disc">
                                        {products
                                            .filter((product) =>
                                                selectedRows.includes(
                                                    product.id,
                                                ),
                                            )
                                            .map((product) => (
                                                <li
                                                    key={product.id}
                                                    className="text-gray-700"
                                                >
                                                    {product.name}
                                                </li>
                                            ))}
                                    </ul>
                                </li>
                            </ul>
                        </>
                    )}

                    {/* Navigation Buttons & Generate PDF Button in One Row */}
                    <div className="mt-6 flex justify-end gap-4">
                        {pdfStep > 1 && (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setPdfStep((prevStep) => prevStep - 1)
                                }
                            >
                                Back
                            </Button>
                        )}

                        {pdfStep < 3 ? (
                            <Button variant="black" onClick={handleNextStep}>
                                Next
                            </Button>
                        ) : (
                            <Button
                                variant="black"
                                onClick={handleGeneratePDF}
                                disabled={buttonLoading}
                            >
                                {buttonLoading ? (
                                    <span className="flex items-center">
                                        <span className="loader mr-2"></span>{' '}
                                        Generating...
                                    </span>
                                ) : (
                                    'Generate PDF'
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </Dialog>

            <Dialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                title="Confirm Delete"
                onSubmit={handleDeleteProduct}
            >
                <p>Are you sure you want to delete this product?</p>
            </Dialog>
        </div>
    )
}

export default Products
