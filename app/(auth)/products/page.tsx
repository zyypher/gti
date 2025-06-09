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
import { nanoid } from 'nanoid'
import PageHeading from '@/components/layout/page-heading'
import { Skeleton } from '@/components/ui/skeleton'

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
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
    const [shareableUrl, setShareableUrl] = useState('')

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

    // Add this helper to preserve previously selected items
    const mergeWithSelectedProducts = (fetched: ITable[]) => {
        const selectedSet = new Set(selectedRows)
        const merged = [...fetched]

        // Ensure selected items not in the new filter result are kept
        products.forEach((prod) => {
            if (
                selectedSet.has(prod.id) &&
                !fetched.find((p) => p.id === prod.id)
            ) {
                merged.push(prod)
            }
        })

        return merged
    }

    // Fetch products
    const fetchProducts = async () => {
        setLoading(true)
        try {
            const queryParams = new URLSearchParams(filters).toString()
            const response = await fetch(`/api/products?${queryParams}`)
            const data: ITable[] = await response.json()

            const mergedData = mergeWithSelectedProducts(data)
            setProducts(mergedData)
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
        setSelectedRows((prev) => {
            const updated = new Set(prev)
            ids.forEach((id) => updated.add(id))
            return Array.from(updated)
        })
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
                reset()
                setSelectedRows([])

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

                    const sharedPdfResponse = await api.post(
                        '/api/shared-pdf',
                        {
                            productIds: selectedRows.join(','), // ✅ Send only productIds, API generates slug
                            expiresAt: expirationDate.toISOString(),
                        },
                    )

                    // ✅ Extract slug from API response
                    const { slug } = sharedPdfResponse.data
                    const shareableUrl = `${process.env.NEXT_PUBLIC_GTI_ORDER_HUB_BASE_URL}/${slug}` // ✅ Use API returned slug

                    // Show shareable link
                    setShareableUrl(shareableUrl)
                    setIsShareDialogOpen(true) // ✅ Open the new dialog instead of toast
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
            formData.append('capsules', data.capsules || '')
            formData.append('packetStyle', data.packetStyle || '')
            formData.append('color', data.color || '')
            // formData.append('corners', data.corners || '')

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
                reset()
                setSelectedProduct(null)
                setIsDialogOpen(false)
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

    const handleRefresh = () => {
        setFilters((prevFilters) => ({ ...prevFilters })) // ✅ Force re-render with existing filters
        fetchProducts() // ✅ Re-fetch products
    }

    const handleClearSelection = () => {
        setSelectedRows([]) // ✅ Clears checkboxes
    }

    return (
        <div className="space-y-4">
            <PageHeading heading="Products" />
            <div className="flex items-center justify-between gap-4">
                <ProductsFilters
                    onFilterChange={handleFilterChange}
                    onRefresh={handleRefresh}
                    onClearSelection={handleClearSelection}
                />

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

            {loading ? (
                <div className="w-full overflow-hidden rounded-md border border-gray-300">
                    {/* Table Header Skeleton */}
                    <div className="flex items-center bg-gray-200 p-3">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Skeleton key={index} className="mx-2 h-5 w-1/5" />
                        ))}
                    </div>

                    {/* Table Rows Skeleton */}
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex items-center border-t border-gray-300 p-3"
                        >
                            {Array.from({ length: 5 }).map((_, subIndex) => (
                                <Skeleton
                                    key={subIndex}
                                    className="mx-2 h-5 w-1/5"
                                />
                            ))}
                        </div>
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-10">
                    <p className="text-lg text-gray-500">No products found</p>
                </div>
            ) : (
                <DataTable
                    columns={columns(handleEdit, handleDelete)}
                    data={products}
                    filterField="product"
                    loading={loading}
                    rowSelectionCallback={handleRowSelection}
                    selectedRowIds={selectedRows}
                />
            )}

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => {
                    reset()
                    setSelectedProduct(null)
                    setIsDialogOpen(false)
                }}
                title={selectedProduct ? 'Edit Product' : 'Add New Product'}
                onSubmit={handleSubmit(handleAddOrUpdateProduct)}
                buttonLoading={buttonLoading}
            >
                {/* Scrollable Container */}
                <div className="max-h-[70vh] space-y-4 overflow-y-auto p-2">
                    {/* Product Name */}
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

                    {/* Brand Selection */}
                    <div>
                        <select
                            {...register('brandId', {
                                required: 'Brand is required',
                            })}
                            className="block w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-black focus:ring-1 focus:ring-black"
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

                    {/* Size */}
                    <div>
                        <Input
                            placeholder="Enter size"
                            {...register('size', {
                                required: 'Size is required',
                            })}
                        />
                        {errors.size?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.size.message)}
                            </p>
                        )}
                    </div>

                    {/* Flavor */}
                    <div>
                        <Input
                            placeholder="Flavor"
                            {...register('flavor', {
                                required: 'Flavor is required',
                            })}
                        />
                        {errors.flavor?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.flavor.message)}
                            </p>
                        )}
                    </div>

                    {/* Tar (mg) */}
                    <div>
                        <Input
                            type="number"
                            placeholder="Enter tar (mg)"
                            {...register('tar', {
                                required: 'Tar is required',
                            })}
                        />
                        {errors.tar?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.tar.message)}
                            </p>
                        )}
                    </div>

                    {/* Nicotine (mg) */}
                    <div>
                        <Input
                            type="number"
                            placeholder="Enter nicotine (mg)"
                            {...register('nicotine', {
                                required: 'Nicotine is required',
                            })}
                        />
                        {errors.nicotine?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.nicotine.message)}
                            </p>
                        )}
                    </div>

                    {/* Carbon Monoxide (CO) - Optional */}
                    <div>
                        <Input
                            type="number"
                            placeholder="Enter CO (mg) (optional)"
                            {...register('co')}
                        />
                    </div>

                    {/* Packet Style */}
                    <div>
                        <Input
                            placeholder="Packet Type (e.g., Fan Pack, Slide Pack, Regular)"
                            {...register('packetStyle', {
                                required: 'Packet type is required',
                            })}
                        />
                        {errors.packetStyle?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.packetStyle.message)}
                            </p>
                        )}
                    </div>

                    {/* Corners */}
                    {/* <div>
                        <Input
                            placeholder="Corners"
                            {...register('corners', {
                                required: 'Corners is required',
                            })}
                        />
                        {errors.corners?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.corners.message)}
                            </p>
                        )}
                    </div> */}

                    {/* FSP - Yes/No Dropdown */}
                    <div>
                        <select
                            {...register('fsp', {
                                required: 'FSP selection is required',
                            })}
                            className="block w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-black focus:ring-1 focus:ring-black"
                        >
                            <option value="">Select FSP</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                        {errors.fsp?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.fsp.message)}
                            </p>
                        )}
                    </div>

                    {/* Number of Capsules - 0, 1, 2, 3 */}
                    <div>
                        <select
                            {...register('capsules', {
                                required: 'Select number of capsules',
                            })}
                            className="block w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-black focus:ring-1 focus:ring-black"
                        >
                            <option value="">Select Capsules</option>
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </select>
                        {errors.capsules?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.capsules.message)}
                            </p>
                        )}
                    </div>

                    {/* Color of the Packet */}
                    <div>
                        <Input
                            placeholder="Enter Packet Color"
                            {...register('color', {
                                required: 'Packet color is required',
                            })}
                        />
                        {errors.color?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.color.message)}
                            </p>
                        )}
                    </div>

                    {/* Upload Product Image */}

                    {/* ✅ Preview Existing Product Image */}
                    {selectedProduct?.image && (
                        <div className="mb-2">
                            <p className="mb-1 text-sm text-gray-600">
                                Current Image Preview:
                            </p>
                            <img
                                src={selectedProduct.image}
                                alt="Product Image"
                                className="h-40 w-full rounded-lg border object-contain"
                            />
                        </div>
                    )}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Upload Product Image
                        </label>
                        <Input
                            type="file"
                            accept="image/*"
                            {...register('image', {
                                required: !selectedProduct
                                    ? 'Product image is required'
                                    : false,
                            })}
                        />
                        {errors.image?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.image.message)}
                            </p>
                        )}
                    </div>

                    {/* Upload Product PDF */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Upload Product PDF
                        </label>
                        <Input
                            type="file"
                            accept="application/pdf"
                            {...register('pdf', {
                                required: !selectedProduct
                                    ? 'Product PDF is required'
                                    : false,
                            })}
                        />
                        {errors.pdf?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.pdf.message)}
                            </p>
                        )}
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

            <Dialog
                isOpen={isShareDialogOpen}
                onClose={() => setIsShareDialogOpen(false)}
                title="PDF Generated"
            >
                <div className="space-y-4 p-4">
                    <p className="text-gray-700">
                        Your PDF has been generated successfully.
                    </p>

                    <div className="flex items-center space-x-2 rounded-md border bg-gray-100 p-2">
                        <span className="truncate">{shareableUrl}</span>
                        <Button
                            variant="outline"
                            onClick={() => {
                                navigator.clipboard.writeText(shareableUrl)
                                toast.success('Link copied to clipboard!')
                            }}
                        >
                            Copy Link
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default Products
