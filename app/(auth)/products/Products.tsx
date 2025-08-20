'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { columns, ITable } from '@/components/custom/table/products/columns'
import { DataTable } from '@/components/custom/table/data-table'
import ProductsFilters from '@/components/products/filters/products-filters'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import routes from '@/lib/routes'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import PageHeading from '@/components/layout/page-heading'
import { FloatingLabelInput } from '@/components/ui/floating-label-input'
import { useUserRole } from '@/hooks/useUserRole'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import 'react-quill/dist/quill.snow.css'
import { useSearchParams } from 'next/navigation'
import { PaginationBar } from '@/components/ui/pagination'
import { useForm, Controller } from 'react-hook-form'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { countryData } from '@/lib/country-data'
import { isValidPhoneNumber } from 'react-phone-number-input'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

interface IBrand {
    id: string
    name: string
    position: number
}

/** ✨ UPDATED: allow front/back types too (kept legacy 'banner' just in case) */
export type INonProductPageItem = {
    id: string
    title: string
    type: 'banner' | 'banner_front' | 'banner_back' | 'advertisement' | 'promotion'
    filePath: string
}

interface AdditionalPage {
    id: string
    position: number
}

type NonProductPageItem = {
    id: string
    filePath: string
    title: string
    type: 'banner' | 'banner_front' | 'banner_back' | 'advertisement' | 'promotion'
}

type Client = {
    id: string
    nickname: string
    firstName: string
    lastName: string
}

type QuickClientForm = {
    firstName: string
    lastName: string
    company: string
    primaryNumber: string
    secondaryNumber?: string
    country: string
    nickname: string
}

const clientSchema = yup.object({
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    company: yup.string().required('Company is required'),
    nickname: yup.string().required('Nickname is required'),
    primaryNumber: yup
        .string()
        .required('Primary number is required')
        .test('is-valid', 'Enter a valid phone number', (value) =>
            value ? isValidPhoneNumber(value) : false,
        ),
    secondaryNumber: yup
        .string()
        .optional()
        .test('is-valid', 'Enter a valid phone number', (value) =>
            !value || isValidPhoneNumber(value),
        ),
    country: yup.string().required(),
})

const Products = () => {
    const [products, setProducts] = useState<ITable[]>([])
    const [brands, setBrands] = useState<IBrand[]>([])
    const [filters, setFilters] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [buttonLoading, setButtonLoading] = useState(false)
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false)
    const [pdfStep, setPdfStep] = useState(1)

    /** ✨ NEW: split corporate infos into front/back + selections */
    const [corporateFronts, setCorporateFronts] = useState<INonProductPageItem[]>([])
    const [corporateBacks, setCorporateBacks] = useState<INonProductPageItem[]>([])
    const [selectedCorporateFront, setSelectedCorporateFront] = useState<string | null>(null)
    const [selectedCorporateBack, setSelectedCorporateBack] = useState<string | null>(null)
    /** (keep old selectedBanner state unused so nothing else breaks) */
    const [selectedBanner, setSelectedBanner] = useState<string | null>(null)

    const [advertisements, setAdvertisements] = useState<INonProductPageItem[]>(
        [],
    )
    const [promotions, setPromotions] = useState<INonProductPageItem[]>([])

    const [selectedAdverts, setSelectedAdverts] = useState<AdditionalPage[]>([])
    const [selectedPromotions, setSelectedPromotions] = useState<AdditionalPage[]>(
        [],
    )

    const [selectedProduct, setSelectedProduct] = useState<ITable | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
    const [shareableUrl, setShareableUrl] = useState('')
    const role = useUserRole()

    const [nonProductItems, setNonProductItems] = useState<NonProductPageItem[]>(
        [],
    )
    const [clients, setClients] = useState<Client[]>([])
    const [selectedCorporateInfo, setSelectedCorporateInfo] = useState<
        string | undefined
    >(undefined)
    const [addedPromotions, setAddedPromotions] = useState<
        { id: string; position: number }[]
    >([])
    const [selectedClient, setSelectedClient] = useState<string | undefined>(
        undefined,
    )

    const searchParams = useSearchParams()
    const initialBrandId = searchParams.get('brandId')
    const initialFilters: Record<string, string> = initialBrandId
        ? { brandId: initialBrandId }
        : {}
    const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
    const [isClientSubmitting, setIsClientSubmitting] = useState(false)

    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [total, setTotal] = useState(0)

    const isPWA = () => window.matchMedia('(display-mode: standalone)').matches
    const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    const {
        control: clientControl,
        register: clientRegister,
        handleSubmit: handleClientSubmit,
        reset: resetClientForm,
        setValue: setClientValue,
        formState: { errors: clientErrors },
    } = useForm<QuickClientForm>({
        resolver: yupResolver(clientSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            company: '',
            primaryNumber: '',
            secondaryNumber: '',
            country: 'United Arab Emirates',
            nickname: '',
        },
    })

    const openClientDialog = () => {
        resetClientForm()
        setIsClientDialogOpen(true)
    }

    const submitQuickClient = async (data: QuickClientForm) => {
        setIsClientSubmitting(true)
        try {
            const res = await api.post('/api/clients', data)
            const newClient: Client = res.data
            setClients((prev) => [newClient, ...prev])
            setSelectedClient(newClient.id)
            toast.success('Client added')
            setIsClientDialogOpen(false)
        } catch (err) {
            toast.error('Failed to add client')
        } finally {
            setIsClientSubmitting(false)
        }
    }

    useEffect(() => {
        const fetchNonProductPageItems = async () => {
            try {
                const response = await api.get('/api/non-product-pages')
                const data: INonProductPageItem[] = response.data

                // ✨ Split into front/back + others (support legacy 'banner' as front)
                setCorporateFronts(
                    data.filter(
                        (item) =>
                            item.type === 'banner_front' ||
                            item.type === 'banner', // legacy fallback
                    ),
                )
                setCorporateBacks(
                    data.filter((item) => item.type === 'banner_back'),
                )
                setAdvertisements(
                    data.filter((item) => item.type === 'advertisement'),
                )
                setPromotions(data.filter((item) => item.type === 'promotion'))
            } catch (error) {
                console.error('Failed to load non-product page items:', error)
            }
        }
        fetchNonProductPageItems()
    }, [])

    const handleNextStep = () => {
        // ✨ Require both front & back at Step 1
        if (pdfStep === 1 && (!selectedCorporateFront || !selectedCorporateBack)) {
            toast.error('Please select Corporate Info (Front) and (Back).')
            return
        }
        if (
            pdfStep === 2 &&
            (selectedAdverts.length === 0 || selectedPromotions.length === 0)
        ) {
            toast.error('Please select at least one Advert and one Promotion.')
            return
        }
        setPdfStep((prevStep) => prevStep + 1)
    }

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm()

    const mergeWithSelectedProducts = (fetched: ITable[]) => {
        const selectedSet = new Set(selectedRows)
        const merged = [...fetched]
        products.forEach((prod) => {
            if (selectedSet.has(prod.id) && !fetched.find((p) => p.id === prod.id)) {
                merged.push(prod)
            }
        })
        return merged
    }

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const queryParams = new URLSearchParams({
                ...filters,
                page: String(page),
                pageSize: String(pageSize),
            }).toString()
            const response = await fetch(`/api/products?${queryParams}`)
            const result = await response.json()
            setProducts(result.products)
            setTotal(result.total)
        } catch (error) {
            console.error('Failed to fetch products:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchBrands = async () => {
        try {
            const response = await fetch('/api/brands')
            const data = await response.json()
            setBrands(data)
        } catch (error) {
            console.error('Failed to fetch brands:', error)
        }
    }

    const fetchNonProductItems = async () => {
        try {
            const response = await api.get('/api/non-product-pages')
            setNonProductItems(response.data)
        } catch (error) {
            console.error('Failed to fetch non-product items', error)
            toast.error('Failed to fetch non-product items.')
        }
    }

    const fetchClients = async () => {
        try {
            const response = await api.get('/api/clients')
            setClients(response.data)
        } catch (error) {
            console.error('Failed to fetch clients', error)
            toast.error('Failed to fetch clients.')
        }
    }

    useEffect(() => {
        fetchProducts()
        fetchBrands()
        fetchNonProductItems()
        fetchClients()
    }, [filters, page, pageSize])

    const handleFilterChange = (newFilters: { [key: string]: string }) => {
        setFilters(newFilters)
    }

    const handleEdit = (item: ITable) => {
        setSelectedProduct(item)
        setIsDialogOpen(true)
        Object.keys(item).forEach((key) => setValue(key as any, (item as any)[key]))
    }

    const handleDelete = (id: string) => {
        setDeleteProductId(id)
        setIsDeleteDialogOpen(true)
    }

    const _columns = columns(role, handleEdit, handleDelete)

    const handleRowSelection = (ids: string[]) => {
        setSelectedRows(ids)
    }

    const handleGeneratePDF = async () => {
        setButtonLoading(true)
        try {
            const additionalPages = [
                ...selectedAdverts.map((a) => ({ id: a.id, position: a.position })),
                ...selectedPromotions.map((p) => ({ id: p.id, position: p.position })),
            ]

            /** ✨ Send front/back ids to the (already updated) generate route */
            const response = await api.post('/api/pdf/generate', {
                frontCorporateId: selectedCorporateFront,
                backCorporateId: selectedCorporateBack,
                productIds: selectedRows,
                additionalPages,
                clientId: selectedClient,
            })

            if (response.status === 200) {
                toast.success('PDF generated successfully!')
                const pdfUrl = response.data.url
                const fileName = `Merged_Document_${new Date().toISOString()}.pdf`

                try {
                    const blob = await fetch(pdfUrl).then((res) => res.blob())
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = fileName
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    window.URL.revokeObjectURL(url)
                } catch (err) {
                    console.error('Failed to auto-download PDF:', err)
                }

                const expirationDate = new Date()
                expirationDate.setDate(expirationDate.getDate() + 30)

                const { slug } = await api
                    .post('/api/shared-pdf', {
                        productIds: selectedRows.join(','),
                        expiresAt: expirationDate.toISOString(),
                        clientId: selectedClient,
                    })
                    .then((res) => res.data)

                const shareableUrl = `${window.location.origin}/shared-pdf/${slug}`

                setIsPdfDialogOpen(false)
                setPdfStep(1)
                setSelectedBanner(null)
                setSelectedAdverts([])
                setSelectedPromotions([])
                reset()
                setSelectedRows([])
                setSelectedClient(undefined)
                /** ✨ reset front/back selections */
                setSelectedCorporateFront(null)
                setSelectedCorporateBack(null)

                if (isPWA() || isMobile()) {
                    if (navigator.share) {
                        const blob = await fetch(pdfUrl).then((res) => res.blob())
                        const file = new File([blob], fileName, { type: 'application/pdf' })
                        navigator
                            .share({
                                title: 'Shared PDF',
                                text: `View the products here: ${shareableUrl}`,
                                files: [file],
                            })
                            .catch((err) => console.error('Error sharing:', err))
                    } else {
                        toast.error('Sharing not supported')
                    }
                } else {
                    setShareableUrl(shareableUrl)
                    setIsShareDialogOpen(true)
                }
            } else {
                toast.error(`Error: ${response.data.error || 'Failed to generate PDF'}`)
            }
        } catch (error) {
            console.error('Failed to generate PDF:', error)
            toast.error('Failed to generate PDF.')
        } finally {
            setButtonLoading(false)
        }
    }

    const handleAddOrUpdateProduct = async (data: any) => {
        if (role !== 'ADMIN') {
            toast.error('You are not authorized to perform this action.')
            return
        }
        setButtonLoading(true)
        const formData = new FormData()
        Object.keys(data).forEach((key) => {
            if (key === 'image' && data.image[0]) {
                formData.append('image', data.image[0])
            } else if (key === 'pdf' && data.pdf[0]) {
                formData.append('pdf', data.pdf[0])
            } else {
                formData.append(key, data[key])
            }
        })

        try {
            const url = selectedProduct
                ? `/api/products/${selectedProduct.id}/pdf`
                : routes.addProduct
            const method = selectedProduct ? 'PUT' : 'POST'

            const response = await api({
                method,
                url,
                data: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            if (response.status === 200 || response.status === 201) {
                toast.success(
                    `Product ${selectedProduct ? 'updated' : 'added'} successfully`,
                )
                fetchProducts()
                reset()
                setSelectedProduct(null)
                setIsDialogOpen(false)
            } else {
                toast.error(`Failed to ${selectedProduct ? 'update' : 'add'} product`)
            }
        } catch (error) {
            toast.error(`Error ${selectedProduct ? 'updating' : 'adding'} product`)
            console.error(error)
        } finally {
            setButtonLoading(false)
        }
    }

    const handleDeleteProduct = async () => {
        if (role !== 'ADMIN') {
            toast.error('You are not authorized to perform this action.')
            return
        }
        if (!deleteProductId) return
        try {
            const response = await api.delete(`/api/products/${deleteProductId}/pdf`)
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
        setFilters((prevFilters) => ({ ...prevFilters }))
        fetchProducts()
    }

    const handleClearSelection = () => {
        setSelectedRows([])
    }

    const addAdditionalPage = (type: 'advert' | 'promotion', id: string) => {
        if (!id) return
        if (type === 'advert') {
            if (selectedAdverts.some((a) => a.id === id)) return
            setSelectedAdverts((prev) => [...prev, { id, position: 2 }])
        } else {
            if (selectedPromotions.some((p) => p.id === id)) return
            setSelectedPromotions((prev) => [...prev, { id, position: 2 }])
        }
    }

    const removeAdditionalPage = (type: 'advert' | 'promotion', id: string) => {
        if (type === 'advert') {
            setSelectedAdverts((prev) => prev.filter((p) => p.id !== id))
        } else {
            setSelectedPromotions((prev) => prev.filter((p) => p.id !== id))
        }
    }

    const updateAdditionalPagePosition = (
        type: 'advert' | 'promotion',
        id: string,
        position: number,
    ) => {
        const updater = (pages: AdditionalPage[]) =>
            pages.map((p) => (p.id === id ? { ...p, position } : p))
        if (type === 'advert') setSelectedAdverts(updater)
        else setSelectedPromotions(updater)
    }

    const renderPositionDropdown = (
        type: 'advert' | 'promotion',
        page: AdditionalPage,
    ) => {
        const totalProductPages = selectedRows.length
        const options = []
        options.push(
            <option key="pos-2" value={2}>
                After Corporate Info
            </option>,
        )
        for (let i = 0; i < totalProductPages; i++) {
            options.push(
                <option key={`pos-${i + 3}`} value={i + 3}>
                    {`After Product ${i + 1}`}
                </option>,
            )
        }
        options.push(
            <option key={`pos-end`} value={totalProductPages + 2}>
                At the end
            </option>,
        )
        return (
            <select
                value={page.position}
                onChange={(e) =>
                    updateAdditionalPagePosition(type, page.id, parseInt(e.target.value, 10))
                }
                className="rounded border p-1"
            >
                {options}
            </select>
        )
    }

    // ---------- options for Tar & Nicotine ----------
    const tarOptions = Array.from({ length: 12 }, (_, i) =>
        ((i + 1) / 10).toFixed(1),
    ) // 0.1..1.2
    const nicotineOptions = Array.from({ length: 12 }, (_, i) => String(i + 1)) // 1..12
    // -------------------------------------------------

    const tableLoading = initialBrandId
        ? filters.brandId !== initialBrandId || loading
        : loading

    // ---------- helpers to render PDF previews (object with fallback) ----------
    const PdfPreview = ({ src, className }: { src?: string; className?: string }) => {
        if (!src) return null
        // Hide viewer chrome & its scrollbar where supported
        const url = `${src}${src.includes('#') ? '' : '#'}toolbar=0&navpanes=0&scrollbar=0&zoom=page-fit`
        return (
            <embed
                src={url}
                type="application/pdf"
                className={className ?? 'h-64 w-full rounded-md border overflow-hidden pointer-events-none'}
            />
        )
    }

    // --------------------------------------------------------------------------

    return (
        <div className="space-y-4">
            <PageHeading heading="Products" />
            <div className="flex items-center justify-between gap-4">
                <ProductsFilters
                    onFilterChange={handleFilterChange}
                    onRefresh={handleRefresh}
                    onClearSelection={handleClearSelection}
                    initialFilters={initialFilters}
                />

                <div className="flex gap-4">
                    {role === 'ADMIN' && (
                        <Button
                            variant="black"
                            onClick={() => {
                                setSelectedProduct(null)
                                reset()
                                setIsDialogOpen(true)
                            }}
                        >
                            <Plus />
                            New Product
                        </Button>
                    )}
                    <Button
                        variant="outline-black"
                        disabled={selectedRows.length === 0}
                        onClick={() => setIsPdfDialogOpen(true)}
                    >
                        Create PDF
                    </Button>
                </div>
            </div>

            <DataTable<ITable>
                columns={_columns}
                data={products}
                filterField="product"
                loading={tableLoading}
                rowSelectionCallback={handleRowSelection}
                isRemovePagination={false}
            />
            <PaginationBar
                currentPage={page}
                totalPages={Math.ceil(total / pageSize)}
                onPageChange={setPage}
            />

            {/* Add/Edit Product */}
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
                <div className="max-h-[70vh] space-y-4 overflow-y-auto p-2">
                    <div>
                        <FloatingLabelInput
                            label="Enter product name"
                            name="name"
                            value={watch('name') || ''}
                            onChange={(val) => setValue('name', val)}
                            error={String(errors.name?.message || '')}
                        />
                        {errors.name?.message && (
                            <p className="mt-1 hidden text-sm text-red-500">
                                {String(errors.name.message)}
                            </p>
                        )}
                    </div>

                    <div>
                        <select
                            {...register('brandId', { required: 'Brand is required' })}
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

                    <div>
                        <FloatingLabelInput
                            label="Enter Stick Format"
                            name="size"
                            value={watch('size') || ''}
                            onChange={(val) => setValue('size', val)}
                            error={String(errors.size?.message || '')}
                        />
                        {errors.size?.message && (
                            <p className="mt-1 hidden text-sm text-red-500">
                                {String(errors.size.message)}
                            </p>
                        )}
                    </div>

                    <div>
                        <FloatingLabelInput
                            label="Flavour"
                            name="flavor"
                            value={watch('flavor') || ''}
                            onChange={(val) => setValue('flavor', val)}
                            error={String(errors.flavor?.message || '')}
                        />
                        {errors.flavor?.message && (
                            <p className="mt-1 hidden text-sm text-red-500">
                                {String(errors.flavor.message)}
                            </p>
                        )}
                    </div>

                    {/* Tar (mg) dropdown */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Tar (mg)
                        </label>
                        <select
                            className="block w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-black focus:ring-1 focus:ring-black"
                            value={watch('tar') || ''}
                            onChange={(e) => setValue('tar', e.target.value, { shouldValidate: true })}
                        >
                            <option value="">Select Tar</option>
                            {tarOptions.map((v) => (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            ))}
                        </select>
                        {errors.tar?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.tar.message)}
                            </p>
                        )}
                    </div>

                    {/* Nicotine (mg) dropdown */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Nicotine (mg)
                        </label>
                        <select
                            className="block w-full rounded-lg border border-gray-300 bg-white p-2 focus:border-black focus:ring-1 focus:ring-black"
                            value={watch('nicotine') || ''}
                            onChange={(e) =>
                                setValue('nicotine', e.target.value, { shouldValidate: true })
                            }
                        >
                            <option value="">Select Nicotine</option>
                            {nicotineOptions.map((v) => (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            ))}
                        </select>
                        {errors.nicotine?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.nicotine.message)}
                            </p>
                        )}
                    </div>

                    <div>
                        <FloatingLabelInput
                            type="number"
                            label="Enter CO (mg) (optional)"
                            name="co"
                            value={watch('co') || ''}
                            onChange={(val) => setValue('co', val)}
                            error={String(errors.co?.message || '')}
                        />
                        {errors.co?.message && (
                            <p className="mt-1 hidden text-sm text-red-500">
                                {String(errors.co.message)}
                            </p>
                        )}
                    </div>

                    <div>
                        <FloatingLabelInput
                            label="Pack Format (e.g., Fan Pack, Slide Pack, Regular)"
                            name="packetStyle"
                            value={watch('packetStyle') || ''}
                            onChange={(val) => setValue('packetStyle', val)}
                            error={String(errors.packetStyle?.message || '')}
                        />
                        {errors.packetStyle?.message && (
                            <p className="mt-1 hidden text-sm text-red-500">
                                {String(errors.packetStyle.message)}
                            </p>
                        )}
                    </div>

                    <div>
                        <select
                            {...register('fsp', { required: 'FSP selection is required' })}
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

                    <div>
                        <select
                            {...register('capsules', { required: 'Select number of capsules' })}
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

                    <div>
                        <FloatingLabelInput
                            label="Enter Packet Color"
                            name="color"
                            value={watch('color') || ''}
                            onChange={(val) => setValue('color', val)}
                            error={String(errors.color?.message || '')}
                        />
                        {errors.color?.message && (
                            <p className="mt-1 hidden text-sm text-red-500">
                                {String(errors.color.message)}
                            </p>
                        )}
                    </div>

                    {selectedProduct?.image && (
                        <div className="mb-2">
                            <p className="mb-1 text-sm text-gray-600">Current Image Preview:</p>
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
                                required: !selectedProduct ? 'Product image is required' : false,
                            })}
                        />
                        {errors.image?.message && (
                            <p className="mt-1 text-sm text-red-500">
                                {String(errors.image.message)}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Upload Product PDF
                        </label>
                        <Input
                            type="file"
                            accept="application/pdf"
                            {...register('pdf', {
                                required: !selectedProduct ? 'Product PDF is required' : false,
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

            {/* Generate PDF flow */}
            <Dialog
                isOpen={isPdfDialogOpen}
                onClose={() => {
                    setIsPdfDialogOpen(false)
                    setPdfStep(1)
                    setSelectedBanner(null)
                    setSelectedAdverts([])
                    setSelectedPromotions([])
                    /** ✨ reset selections */
                    setSelectedCorporateFront(null)
                    setSelectedCorporateBack(null)
                }}
                title={`Step ${pdfStep}: ${pdfStep === 1
                    ? 'Select Corporate Infos'
                    : pdfStep === 2
                        ? 'Add Adverts & Promotions'
                        : 'Confirm & Generate'
                    }`}
            >
                <div className="max-h-[75vh] overflow-y-auto space-y-4 p-4 pr-2">
                    {pdfStep === 1 && (
                        // stacked (2 rows) — no inner scroll here to avoid nested scrollbars
                        <div className="space-y-6">
                            <div>
                                <p className="mb-2">Corporate Info (Front):</p>
                                <select
                                    className="w-full rounded border p-2"
                                    value={selectedCorporateFront || ''}
                                    onChange={(e) => setSelectedCorporateFront(e.target.value)}
                                >
                                    <option value="">Select Corporate Info (Front)</option>
                                    {corporateFronts.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.title}
                                        </option>
                                    ))}
                                </select>

                                {selectedCorporateFront && (
                                    <div className="mt-3">
                                        <p className="mb-2 text-sm text-gray-600">Preview</p>
                                        <PdfPreview
                                            src={corporateFronts.find((b) => b.id === selectedCorporateFront)?.filePath}
                                            className="h-64 w-full rounded-md border"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <p className="mb-2">Corporate Info (Back):</p>
                                <select
                                    className="w-full rounded border p-2"
                                    value={selectedCorporateBack || ''}
                                    onChange={(e) => setSelectedCorporateBack(e.target.value)}
                                >
                                    <option value="">Select Corporate Info (Back)</option>
                                    {corporateBacks.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.title}
                                        </option>
                                    ))}
                                </select>

                                {selectedCorporateBack && (
                                    <div className="mt-3">
                                        <p className="mb-2 text-sm text-gray-600">Preview</p>
                                        <PdfPreview
                                            src={corporateBacks.find((b) => b.id === selectedCorporateBack)?.filePath}
                                            className="h-64 w-full rounded-md border"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {pdfStep === 2 && (
                        <div>
                            <div className="mb-4">
                                <h3 className="mb-2 font-semibold">Adverts</h3>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="w-full rounded border p-2"
                                        value=""
                                        onChange={(e) => addAdditionalPage('advert', e.target.value)}
                                    >
                                        <option value="">Select an Advert to add</option>
                                        {advertisements.map((advert) => (
                                            <option key={advert.id} value={advert.id}>
                                                {advert.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mt-2 space-y-1">
                                    {selectedAdverts.map((ad) => (
                                        <div key={ad.id} className="flex items-center justify-between text-sm">
                                            <span>{advertisements.find((it) => it.id === ad.id)?.title}</span>
                                            <Button
                                                size="small"
                                                variant="outline"
                                                onClick={() => removeAdditionalPage('advert', ad.id)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* Adverts previews */}
                                {selectedAdverts.length > 0 && (
                                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {selectedAdverts.map((ad) => {
                                            const src = advertisements.find((it) => it.id === ad.id)?.filePath
                                            return (
                                                <PdfPreview key={ad.id} src={src} className="h-64 w-full rounded-md border" />
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="mb-2 font-semibold">Promotions</h3>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="w-full rounded border p-2"
                                        value=""
                                        onChange={(e) => addAdditionalPage('promotion', e.target.value)}
                                    >
                                        <option value="">Select a Promotion to add</option>
                                        {promotions.map((promo) => (
                                            <option key={promo.id} value={promo.id}>
                                                {promo.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mt-2 space-y-1">
                                    {selectedPromotions.map((promo) => (
                                        <div key={promo.id} className="flex items-center justify-between text-sm">
                                            <span>{promotions.find((it) => it.id === promo.id)?.title}</span>
                                            <Button
                                                size="small"
                                                variant="outline"
                                                onClick={() => removeAdditionalPage('promotion', promo.id)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* Promotions previews */}
                                {selectedPromotions.length > 0 && (
                                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {selectedPromotions.map((promo) => {
                                            const src = promotions.find((it) => it.id === promo.id)?.filePath
                                            return (
                                                <PdfPreview key={promo.id} src={src} className="h-64 w-full rounded-md border" />
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {pdfStep === 3 && (
                        <div>
                            <div className="mb-4 rounded-lg bg-blue-50 p-3">
                                <h4 className="mb-2 font-semibold text-blue-800">What are you doing here?</h4>
                                <p className="text-sm text-blue-700">
                                    You're arranging where your selected Adverts and Promotions will appear in the
                                    final PDF. The Corporate Info will always be the first page, followed by your
                                    selected products. Use the dropdowns below to choose where each Advert and
                                    Promotion should be inserted.
                                </p>
                            </div>

                            {selectedAdverts.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold">Selected Adverts</h3>
                                    {selectedAdverts.map((advert) => (
                                        <div key={advert.id} className="flex items-center justify-between">
                                            <p>{advertisements.find((a) => a.id === advert.id)?.title}</p>
                                            {renderPositionDropdown('advert', advert)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedPromotions.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <h3 className="font-semibold">Selected Promotions</h3>
                                    {selectedPromotions.map((promo) => (
                                        <div key={promo.id} className="flex items-center justify-between">
                                            <p>{promotions.find((p) => p.id === promo.id)?.title}</p>
                                            {renderPositionDropdown('promotion', promo)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {clients.length > 0 && (
                                <div className="mt-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <h3 className="font-semibold">Select Client (Optional)</h3>
                                        <Button variant="outline" onClick={openClientDialog}>
                                            Add Client
                                        </Button>
                                    </div>
                                    <Select
                                        onValueChange={(value) =>
                                            setSelectedClient(value === 'none' ? undefined : value)
                                        }
                                        value={selectedClient}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Client</SelectItem>
                                            {clients.map((client) => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {`${client.firstName} ${client.lastName}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-4">
                        {pdfStep > 1 && (
                            <Button variant="outline" onClick={() => setPdfStep((s) => s - 1)}>
                                Back
                            </Button>
                        )}
                        {pdfStep < 3 ? (
                            <Button variant="black" onClick={handleNextStep}>
                                Next
                            </Button>
                        ) : (
                            <Button variant="black" onClick={handleGeneratePDF} disabled={buttonLoading}>
                                {buttonLoading ? 'Generating...' : 'Generate PDF'}
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
                    <p className="text-gray-700">Your PDF has been generated successfully.</p>
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

            <Dialog
                isOpen={isClientDialogOpen}
                onClose={() => setIsClientDialogOpen(false)}
                title="Add Client"
            >
                <form onSubmit={handleClientSubmit(submitQuickClient)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input placeholder="First Name" {...clientRegister('firstName')} />
                        {clientErrors.firstName && (
                            <p className="mt-1 text-sm text-red-500">{clientErrors.firstName.message}</p>
                        )}

                        <Input placeholder="Last Name" {...clientRegister('lastName')} />
                        {clientErrors.lastName && (
                            <p className="mt-1 text-sm text-red-500">{clientErrors.lastName.message}</p>
                        )}

                        <Input placeholder="Company" {...clientRegister('company')} />
                        {clientErrors.company && (
                            <p className="mt-1 text-sm text-red-500">{clientErrors.company.message}</p>
                        )}

                        <Input placeholder="Nickname" {...clientRegister('nickname')} />
                        {clientErrors.nickname && (
                            <p className="mt-1 text-sm text-red-500">{clientErrors.nickname.message}</p>
                        )}

                        <Controller
                            name="primaryNumber"
                            control={clientControl}
                            render={({ field, fieldState }) => (
                                <>
                                    <PhoneInput
                                        international
                                        defaultCountry="AE"
                                        placeholder="Enter primary number"
                                        value={field.value ?? ''}
                                        onChange={field.onChange}
                                        onCountryChange={(country) => {
                                            const info = countryData.find((c) => c.code === country)
                                            if (info) setClientValue('country', info.name)
                                        }}
                                        inputComponent={Input}
                                    />
                                    {fieldState.error && (
                                        <p className="mt-1 text-sm text-red-500">{fieldState.error.message}</p>
                                    )}
                                </>
                            )}
                        />

                        <Controller
                            name="secondaryNumber"
                            control={clientControl}
                            render={({ field, fieldState }) => (
                                <>
                                    <PhoneInput
                                        international
                                        defaultCountry="AE"
                                        placeholder="Enter secondary number"
                                        value={field.value ?? ''}
                                        onChange={field.onChange}
                                        inputComponent={Input}
                                    />
                                    {fieldState.error && (
                                        <p className="mt-1 text-sm text-red-500">{fieldState.error.message}</p>
                                    )}
                                </>
                            )}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" variant="black" disabled={isClientSubmitting}>
                            {isClientSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    </div>
                </form>
            </Dialog>
        </div>
    )
}

export default Products
