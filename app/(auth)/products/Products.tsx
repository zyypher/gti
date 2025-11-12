'use client'
export const dynamic = 'force-dynamic'

import React, { useEffect, useMemo, useState } from 'react'
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
import { Controller, useForm } from 'react-hook-form'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { countryData } from '@/lib/country-data'
import { isValidPhoneNumber } from 'react-phone-number-input'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

/* -------------------- types -------------------- */
interface IBrand {
  id: string
  name: string
  position: number
}

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

/* ----------------- presentational ---------------- */
const GlassPanel = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div
    className={[
      'rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl',
      'shadow-[0_6px_24px_rgba(0,0,0,0.08)]',
      className,
    ].join(' ')}
  >
    {children}
  </div>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-base font-semibold text-zinc-900">{children}</h3>
)

/* ------------------ product form ----------------- */
type ProductFormValues = {
  name: string
  brandId: string
  size: string
  flavor: string
  tar: string
  nicotine: string
  co?: string
  packetStyle: string
  fsp: string
  capsules: string
  color: string
  image?: FileList
  pdf?: FileList
}

const EMPTY_DEFAULTS: ProductFormValues = {
  name: '',
  brandId: '',
  size: '',
  flavor: '',
  tar: '',
  nicotine: '',
  co: '',
  packetStyle: '',
  fsp: '',
  capsules: '',
  color: '',
}

/* ===================== PAGE ===================== */
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

  const [corporateFronts, setCorporateFronts] = useState<INonProductPageItem[]>([])
  const [corporateBacks, setCorporateBacks] = useState<INonProductPageItem[]>([])
  const [selectedCorporateFront, setSelectedCorporateFront] = useState<string | null>(null)
  const [selectedCorporateBack, setSelectedCorporateBack] = useState<string | null>(null)
  const [selectedBanner, setSelectedBanner] = useState<string | null>(null)

  const [advertisements, setAdvertisements] = useState<INonProductPageItem[]>([])
  const [promotions, setPromotions] = useState<INonProductPageItem[]>([])

  const [selectedAdverts, setSelectedAdverts] = useState<AdditionalPage[]>([])
  const [selectedPromotions, setSelectedPromotions] = useState<AdditionalPage[]>([])

  const [selectedProduct, setSelectedProduct] = useState<ITable | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareableUrl, setShareableUrl] = useState('')
  const role = useUserRole()

  const [nonProductItems, setNonProductItems] = useState<NonProductPageItem[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedCorporateInfo, setSelectedCorporateInfo] = useState<string | undefined>(undefined)
  const [addedPromotions, setAddedPromotions] = useState<{ id: string; position: number }[]>([])
  const [selectedClient, setSelectedClient] = useState<string | undefined>(undefined)

  const searchParams = useSearchParams()
  const initialBrandId = searchParams.get('brandId')
  const initialFilters: Record<string, string> = initialBrandId ? { brandId: initialBrandId } : {}
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [isClientSubmitting, setIsClientSubmitting] = useState(false)
  const [tableResetKey, setTableResetKey] = useState(0)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const isPWA = () => window.matchMedia('(display-mode: standalone)').matches
  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  console.log('##clients', clients)

  /* -------- client form (quick add) -------- */
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
    } catch {
      toast.error('Failed to add client')
    } finally {
      setIsClientSubmitting(false)
    }
  }

  /* -------- non-product page lists -------- */
  useEffect(() => {
    const fetchNonProductPageItems = async () => {
      try {
        const response = await api.get('/api/non-product-pages')
        const data: INonProductPageItem[] = response.data
        setCorporateFronts(data.filter((i) => i.type === 'banner_front' || i.type === 'banner'))
        setCorporateBacks(data.filter((i) => i.type === 'banner_back'))
        setAdvertisements(data.filter((i) => i.type === 'advertisement'))
        setPromotions(data.filter((i) => i.type === 'promotion'))
      } catch (e) {
        console.error('Failed to load non-product page items:', e)
      }
    }
    fetchNonProductPageItems()
  }, [])

  const handleNextStep = () => {
    if (pdfStep === 1 && (!selectedCorporateFront || !selectedCorporateBack)) {
      toast.error('Please select Corporate Info (Front) and (Back).')
      return
    }
    if (pdfStep === 2 && (selectedAdverts.length === 0 || selectedPromotions.length === 0)) {
      toast.error('Please select at least one Advert and one Promotion.')
      return
    }
    setPdfStep((s) => s + 1)
  }

  /* -------------- Product form -------------- */
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control: productControl,
    clearErrors,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: EMPTY_DEFAULTS,
    shouldUnregister: true,
    mode: 'onChange',
    reValidateMode: 'onChange',
  })

  const [fileKey, setFileKey] = useState(0)

  const tarOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ((i + 1) / 10).toFixed(1)),
    [],
  )
  const nicotineOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i + 1)),
    [],
  )

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
    } catch (e) {
      console.error('Failed to fetch products:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      const data = await response.json()
      setBrands(data)
    } catch (e) {
      console.error('Failed to fetch brands:', e)
    }
  }

  const fetchNonProductItems = async () => {
    try {
      const response = await api.get('/api/non-product-pages')
      setNonProductItems(response.data)
    } catch (e) {
      console.error('Failed to fetch non-product items', e)
      toast.error('Failed to fetch non-product items.')
    }
  }

  const fetchClients = async () => {
    try {
      const response = await api.get('/api/clients')
      setClients(response.data)
    } catch (e) {
      console.error('Failed to fetch clients', e)
      toast.error('Failed to fetch clients.')
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [filters, page, pageSize])

  useEffect(() => {
    fetchBrands()
    fetchNonProductItems()
    fetchClients()
  }, [])

  const handleFilterChange = (newFilters: { [key: string]: string }) => {
    setFilters(newFilters)
  }

  /** Prefill edit form correctly (fixes FSP/boolean mismatch) */
  const handleEdit = (item: ITable) => {
    setSelectedProduct(item)
    setIsDialogOpen(true)

    const fspNormalized: 'true' | 'false' =
      typeof item.fsp === 'boolean'
        ? (item.fsp ? 'true' : 'false')
        : /^(true|yes|1)$/i.test(String(item.fsp))
          ? 'true'
          : 'false'

    reset({
      name: (item as any).name ?? '',
      brandId: (item as any).brandId ?? '',
      size: String((item as any).size ?? ''),
      flavor: (item as any).flavor ?? '',
      tar: String((item as any).tar ?? ''),
      nicotine: String((item as any).nicotine ?? ''),
      co: String((item as any).co ?? ''),
      packetStyle: (item as any).packetStyle ?? '',
      fsp: fspNormalized,
      capsules: String((item as any).capsules ?? ''),
      color: (item as any).color ?? '',
    })

    clearErrors(['tar', 'nicotine', 'brandId', 'name', 'size', 'flavor'])
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

        const shareableUrl = `${process.env.NEXT_PUBLIC_GTI_ORDER_HUB_BASE_URL}/${slug}`

        setIsPdfDialogOpen(false)
        setPdfStep(1)
        setSelectedBanner(null)
        setSelectedAdverts([])
        setSelectedPromotions([])
        reset()
        setSelectedRows([])
        setSelectedClient(undefined)
        setSelectedCorporateFront(null)
        setSelectedCorporateBack(null)
        setTableResetKey((k) => k + 1)

        if ((isPWA() || isMobile()) && navigator.share) {
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

  /** Create/Update (files optional during edit; text fields always sent) */
  const handleAddOrUpdateProduct = async (data: ProductFormValues) => {
    if (role !== 'ADMIN') {
      toast.error('You are not authorized to perform this action.')
      return
    }
    setButtonLoading(true)

    const formData = new FormData()
    formData.append('name', data.name ?? '')
    formData.append('brandId', data.brandId ?? '')
    formData.append('size', data.size ?? '')
    formData.append('flavor', data.flavor ?? '')
    formData.append('tar', data.tar ?? '')
    formData.append('nicotine', data.nicotine ?? '')
    formData.append('co', data.co ?? '')
    formData.append('packetStyle', data.packetStyle ?? '')
    formData.append('fsp', data.fsp ?? '')
    formData.append('capsules', data.capsules ?? '')
    formData.append('color', data.color ?? '')

    if (data.image?.length) formData.append('image', data.image[0])
    if (data.pdf?.length) formData.append('pdf', data.pdf[0])

    try {
      const url = selectedProduct ? `/api/products/${selectedProduct.id}/pdf` : routes.addProduct
      const method = selectedProduct ? 'PUT' : 'POST'

      const response = await api({
        method,
        url,
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (response.status === 200 || response.status === 201) {
        toast.success(`Product ${selectedProduct ? 'updated' : 'added'} successfully`)
        fetchProducts()
        reset()
        setSelectedProduct(null)
        setIsDialogOpen(false)
      } else {
        toast.error(`Failed to ${selectedProduct ? 'update' : 'add'} product`)
      }
    } catch (error: any) {
      console.error(error)
      toast.error(
        error?.response?.data?.error
          ? `Error: ${error.response.data.error}`
          : `Error ${selectedProduct ? 'updating' : 'adding'} product`,
      )
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

  const handleRefresh = () => fetchProducts()
  const handleClearSelection = () => setSelectedRows([])

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
    if (type === 'advert') setSelectedAdverts((prev) => prev.filter((p) => p.id !== id))
    else setSelectedPromotions((prev) => prev.filter((p) => p.id !== id))
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

  const renderPositionDropdown = (type: 'advert' | 'promotion', page: AdditionalPage) => {
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
        onChange={(e) => updateAdditionalPagePosition(type, page.id, parseInt(e.target.value, 10))}
        className="rounded border bg-white/60 p-1"
      >
        {options}
      </select>
    )
  }

  const tableLoading = initialBrandId ? filters.brandId !== initialBrandId || loading : loading

  /* PDF preview helper */
  const PdfPreview = ({ src, className }: { src?: string; className?: string }) => {
    if (!src) return null
    const url = `${src}${src.includes('#') ? '' : '#'}toolbar=0&navpanes=0&scrollbar=0&zoom=page-fit`
    return (
      <embed
        src={url}
        type="application/pdf"
        className={className ?? 'h-64 w-full rounded-md border overflow-hidden pointer-events-none'}
      />
    )
  }

  return (
    <div className="relative">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-100" />
        <div className="absolute left-1/2 top-[-120px] h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),rgba(255,255,255,0)_60%)]" />
      </div>

      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <PageHeading heading="Products" />
          <GlassPanel className="flex items-center gap-3 p-2">
            {role === 'ADMIN' && (
              <Button
                variant="black"
                onClick={() => {
                  setSelectedProduct(null)
                  reset(EMPTY_DEFAULTS)
                  setFileKey((k) => k + 1)
                  reset()
                  setIsDialogOpen(true)
                }}
                className="gap-2"
              >
                <Plus size={18} />
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
          </GlassPanel>
        </div>

        {/* Filters */}
        <GlassPanel className="p-3">
          <ProductsFilters
            onFilterChange={handleFilterChange}
            onRefresh={handleRefresh}
            onClearSelection={handleClearSelection}
            initialFilters={initialFilters}
          />
        </GlassPanel>

        {/* Table */}
        <GlassPanel className="p-3">
          <DataTable<ITable>
            key={tableResetKey}
            columns={_columns}
            data={products}
            filterField="product"
            loading={tableLoading}
            rowSelectionCallback={handleRowSelection}
            isRemovePagination={false}
          />
          <div className="border-t border-white/20 pt-3">
            <PaginationBar
              currentPage={page}
              totalPages={Math.ceil(total / pageSize)}
              onPageChange={setPage}
            />
          </div>
        </GlassPanel>

        {/* Add/Edit Dialog */}
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
            <SectionTitle>Details</SectionTitle>
            <GlassPanel className="space-y-4 p-4">
              {/* Name */}
              <div>
                <FloatingLabelInput
                  label="Enter product name"
                  name="name"
                  value={watch('name') || ''}
                  onChange={(val) => setValue('name', val, { shouldValidate: true })}
                  error={String(errors.name?.message || '')}
                />
                <input type="hidden" {...register('name', { required: 'Name is required' })} />
              </div>

              {/* Brand */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Brand</label>
                <select
                  {...register('brandId', { required: 'Brand is required' })}
                  className="block w-full rounded-lg border border-zinc-500 bg-white p-2 focus:border-black focus:ring-1 focus:ring-black"
                  defaultValue={watch('brandId') || ''}
                  style={{ border: '1px solid #d1d5db' }}
                >
                  <option value="">Select a brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {errors.brandId?.message && (
                  <p className="mt-1 text-sm text-red-500">{String(errors.brandId.message)}</p>
                )}
              </div>

              {/* Size */}
              <div>
                <FloatingLabelInput
                  label="Enter Stick Format"
                  name="size"
                  value={watch('size') || ''}
                  onChange={(val) => setValue('size', val, { shouldValidate: true })}
                  error={String(errors.size?.message || '')}
                />
                <input type="hidden" {...register('size', { required: 'Stick format is required' })} />
              </div>

              {/* Flavor */}
              <div>
                <FloatingLabelInput
                  label="Flavour"
                  name="flavor"
                  value={watch('flavor') || ''}
                  onChange={(val) => setValue('flavor', val, { shouldValidate: true })}
                  error={String(errors.flavor?.message || '')}
                />
                <input type="hidden" {...register('flavor', { required: 'Flavour is required' })} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Tar (mg)</label>
                <select
                  {...register('tar', { required: 'Tar is required' })}
                  value={watch('tar') ?? ''}
                  onChange={(e) => setValue('tar', e.target.value, { shouldValidate: true })}
                  className="block w-full rounded-lg border border-zinc-300 bg-white p-2 focus:border-black focus:ring-1 focus:ring-black"
                  style={{ border: '1px solid #d1d5db' }}
                >
                  <option value="">Select Tar</option>
                  {tarOptions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                {errors.tar?.message && (
                  <p className="mt-1 text-sm text-red-500">{String(errors.tar.message)}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Nicotine (mg)</label>
                <select
                  {...register('nicotine', { required: 'Nicotine is required' })}
                  value={watch('nicotine') ?? ''}
                  onChange={(e) => setValue('nicotine', e.target.value, { shouldValidate: true })}
                  className="block w-full rounded-lg border border-zinc-300 bg-white p-2 focus:border-black focus:ring-1 focus:ring-black"
                  style={{ border: '1px solid #d1d5db' }}
                >
                  <option value="">Select Nicotine</option>
                  {nicotineOptions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                {errors.nicotine?.message && (
                  <p className="mt-1 text-sm text-red-500">{String(errors.nicotine.message)}</p>
                )}
              </div>

              {/* CO */}
              <div>
                <FloatingLabelInput
                  type="number"
                  label="Enter CO (mg)"
                  name="co"
                  value={watch('co') || ''}
                  onChange={(val) => setValue('co', val, { shouldValidate: true })}
                  error={String(errors.co?.message || '')}
                />
                <input type="hidden" {...register('co', { required: 'CO is required' })} />
              </div>

              {/* Packet style */}
              <div>
                <FloatingLabelInput
                  label="Pack Format (e.g., Fan Pack, Slide Pack, Regular)"
                  name="packetStyle"
                  value={watch('packetStyle') || ''}
                  onChange={(val) => setValue('packetStyle', val, { shouldValidate: true })}
                  error={String(errors.packetStyle?.message || '')}
                />
                <input
                  type="hidden"
                  {...register('packetStyle', { required: 'Pack format is required' })}
                />
              </div>

              {/* FSP */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">FSP</label>
                <select
                  {...register('fsp', { required: 'FSP selection is required' })}
                  className="block w-full rounded-lg border border-zinc-300 bg-white p-2 focus:border-black focus:ring-1 focus:ring-black"
                  value={watch('fsp') ?? ''}
                  onChange={(e) => setValue('fsp', e.target.value, { shouldValidate: true })}
                  style={{ border: '1px solid #d1d5db' }}
                >
                  <option value="">Select FSP</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
                {errors.fsp?.message && (
                  <p className="mt-1 text-sm text-red-500">{String(errors.fsp.message)}</p>
                )}
              </div>

              {/* Capsules */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Capsules</label>
                <select
                  {...register('capsules', { required: 'Select number of capsules' })}
                  className="block w-full rounded-lg border border-zinc-300 bg-white p-2 focus:border-black focus:ring-1 focus:ring-black"
                  value={watch('capsules') ?? ''}
                  onChange={(e) => setValue('capsules', e.target.value, { shouldValidate: true })}
                  style={{ border: '1px solid #d1d5db' }}
                >
                  <option value="">Select Capsules</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
                {errors.capsules?.message && (
                  <p className="mt-1 text-sm text-red-500">{String(errors.capsules.message)}</p>
                )}
              </div>

              {/* Color */}
              <div>
                <FloatingLabelInput
                  label="Enter Packet Color"
                  name="color"
                  value={watch('color') || ''}
                  onChange={(val) => setValue('color', val, { shouldValidate: true })}
                  error={String(errors.color?.message || '')}
                />
                <input type="hidden" {...register('color', { required: 'Packet color is required' })} />
              </div>

              {/* Existing previews on EDIT */}
              {selectedProduct?.image && (
                <div className="mb-2">
                  <p className="mb-1 text-sm text-zinc-600">Current Image Preview:</p>
                  <img
                    src={selectedProduct.image}
                    alt="Product Image"
                    className="h-40 w-full rounded-lg border object-contain"
                  />
                </div>
              )}

              {selectedProduct && (selectedProduct as any).pdfUrl && (
                <div className="mb-2">
                  <p className="mb-1 text-sm text-zinc-600">Current PDF Preview:</p>
                  <PdfPreview src={(selectedProduct as any).pdfUrl} className="h-64 w-full rounded-md border" />
                </div>
              )}

              {/* New file inputs (optional on edit) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Upload Product Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  {...register('image', {
                    required: !selectedProduct ? 'Product image is required' : false,
                  })}
                />
                {errors.image && (
                  <p className="mt-1 text-sm text-red-500">{String((errors as any).image?.message)}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Upload Product PDF</label>
                <Input
                  type="file"
                  accept="application/pdf"
                  {...register('pdf', {
                    required: !selectedProduct ? 'Product PDF is required' : false,
                  })}
                />
                {errors.pdf && (
                  <p className="mt-1 text-sm text-red-500">{String((errors as any).pdf?.message)}</p>
                )}
              </div>
            </GlassPanel>
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
            setSelectedCorporateFront(null)
            setSelectedCorporateBack(null)
          }}
          title={`Step ${pdfStep}: ${pdfStep === 1 ? 'Select Corporate Infos' : pdfStep === 2 ? 'Add Adverts & Promotions' : 'Confirm & Generate'}`}
        >
          <div className="flex max-h-[75vh] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-2 pr-3">
              {pdfStep === 1 && (
                <GlassPanel className="space-y-6 p-4">
                  <div>
                    <p className="mb-2 text-sm text-zinc-700">Corporate Info (Front):</p>
                    <select
                      className="w-full rounded border border-white/40 bg-white/70 p-2"
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
                        <p className="mb-2 text-sm text-zinc-600">Preview</p>
                        <PdfPreview
                          src={corporateFronts.find((b) => b.id === selectedCorporateFront)?.filePath}
                          className="h-64 w-full rounded-md border"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 text-sm text-zinc-700">Corporate Info (Back):</p>
                    <select
                      className="w-full rounded border border-white/40 bg-white/70 p-2"
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
                        <p className="mb-2 text-sm text-zinc-600">Preview</p>
                        <PdfPreview
                          src={corporateBacks.find((b) => b.id === selectedCorporateBack)?.filePath}
                          className="h-64 w-full rounded-md border"
                        />
                      </div>
                    )}
                  </div>
                </GlassPanel>
              )}

              {pdfStep === 2 && (
                <GlassPanel className="p-4">
                  <div className="mb-4">
                    <SectionTitle>Adverts</SectionTitle>
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        className="w-full rounded border border-white/40 bg-white/70 p-2"
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

                    {selectedAdverts.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {selectedAdverts.map((ad) => {
                          const src = advertisements.find((it) => it.id === ad.id)?.filePath
                          return <PdfPreview key={ad.id} src={src} className="h-64 w-full rounded-md border" />
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <SectionTitle>Promotions</SectionTitle>
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        className="w-full rounded border border-white/40 bg-white/70 p-2"
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

                    {selectedPromotions.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {selectedPromotions.map((promo) => {
                          const src = promotions.find((it) => it.id === promo.id)?.filePath
                          return <PdfPreview key={promo.id} src={src} className="h-64 w-full rounded-md border" />
                        })}
                      </div>
                    )}
                  </div>
                </GlassPanel>
              )}

              {pdfStep === 3 && (
                <GlassPanel className="space-y-4 p-4">
                  <div className="rounded-lg border border-white/30 bg-white/40 p-3">
                    <h4 className="mb-1 font-semibold text-zinc-900">What are you doing here?</h4>
                    <p className="text-sm text-zinc-700">
                      Arrange where your selected Adverts and Promotions will appear in the final PDF. Corporate Info goes
                      first, followed by the selected products.
                    </p>
                  </div>

                  {selectedAdverts.length > 0 && (
                    <div className="space-y-2">
                      <SectionTitle>Selected Adverts</SectionTitle>
                      {selectedAdverts.map((advert) => (
                        <div key={advert.id} className="flex items-center justify-between">
                          <p>{advertisements.find((a) => a.id === advert.id)?.title}</p>
                          {renderPositionDropdown('advert', advert)}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedPromotions.length > 0 && (
                    <div className="space-y-2">
                      <SectionTitle>Selected Promotions</SectionTitle>
                      {selectedPromotions.map((promo) => (
                        <div key={promo.id} className="flex items-center justify-between">
                          <p>{promotions.find((p) => p.id === promo.id)?.title}</p>
                          {renderPositionDropdown('promotion', promo)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Always render the header + button; show Select when you have clients */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <SectionTitle>Select Client (Optional)</SectionTitle>
                      <Button variant="outline" onClick={openClientDialog}>
                        Add Client
                      </Button>
                    </div>

                    {clients.length > 0 ? (
                      <Select
                        value={selectedClient ?? undefined}
                        onValueChange={(v) => setSelectedClient(v === 'none' ? undefined : v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>

                        <SelectContent
                          className="z-[9999] max-h-[300px] overflow-y-auto bg-white"
                          sideOffset={4}
                        >
                          <SelectItem value="none">No Client</SelectItem>
                          {clients.map((c) => (
                            <SelectItem key={String(c.id)} value={String(c.id)}>
                              {`${c.firstName} ${c.lastName}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-zinc-600">No clients yet. Click "Add Client".</p>
                    )}
                  </div>
                </GlassPanel>
              )}
            </div>

            <div className="mt-2 flex shrink-0 items-center justify-end gap-3 border-t border-white/30 bg-white/60 px-3 py-3">
              {pdfStep > 1 && (
                <Button variant="outline" onClick={() => setPdfStep((s) => s - 1)}>
                  Back
                </Button>
              )}
              <Button
                variant="black"
                onClick={pdfStep < 3 ? handleNextStep : handleGeneratePDF}
                disabled={pdfStep === 3 && buttonLoading}
              >
                {pdfStep < 3 ? 'Next' : buttonLoading ? 'Generating...' : 'Generate PDF'}
              </Button>
            </div>
          </div>
        </Dialog>

        {/* QUICK ADD CLIENT DIALOG */}
        <Dialog
          isOpen={isClientDialogOpen}
          onClose={() => setIsClientDialogOpen(false)}
          title="Add Client"
          onSubmit={handleClientSubmit(submitQuickClient)}
          buttonLoading={isClientSubmitting}
        >
          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-2">
            <GlassPanel className="space-y-4 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <FloatingLabelInput
                    label="First name"
                    name="firstName"
                    value={''}
                    onChange={() => { }}
                  />
                  <input type="hidden" {...clientRegister('firstName')} />
                  {clientErrors.firstName && (
                    <p className="mt-1 text-sm text-red-500">{String(clientErrors.firstName.message)}</p>
                  )}
                </div>

                <div>
                  <FloatingLabelInput
                    label="Last name"
                    name="lastName"
                    value={''}
                    onChange={() => { }}
                  />
                  <input type="hidden" {...clientRegister('lastName')} />
                  {clientErrors.lastName && (
                    <p className="mt-1 text-sm text-red-500">{String(clientErrors.lastName.message)}</p>
                  )}
                </div>

                <div>
                  <FloatingLabelInput
                    label="Company"
                    name="company"
                    value={''}
                    onChange={() => { }}
                  />
                  <input type="hidden" {...clientRegister('company')} />
                  {clientErrors.company && (
                    <p className="mt-1 text-sm text-red-500">{String(clientErrors.company.message)}</p>
                  )}
                </div>

                <div>
                  <FloatingLabelInput
                    label="Nickname"
                    name="nickname"
                    value={''}
                    onChange={() => { }}
                  />
                  <input type="hidden" {...clientRegister('nickname')} />
                  {clientErrors.nickname && (
                    <p className="mt-1 text-sm text-red-500">{String(clientErrors.nickname.message)}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Primary Number</label>
                  <Controller
                    control={clientControl}
                    name="primaryNumber"
                    render={({ field }) => (
                      <PhoneInput
                        {...field}
                        defaultCountry="AE"
                        international
                        className="w-full rounded-lg border border-zinc-300 bg-white p-2"
                      />
                    )}
                  />
                  {clientErrors.primaryNumber && (
                    <p className="mt-1 text-sm text-red-500">{String(clientErrors.primaryNumber.message)}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Secondary Number</label>
                  <Controller
                    control={clientControl}
                    name="secondaryNumber"
                    render={({ field }) => (
                      <PhoneInput
                        {...field}
                        defaultCountry="AE"
                        international
                        className="w-full rounded-lg border border-zinc-300 bg-white p-2"
                      />
                    )}
                  />
                  {clientErrors.secondaryNumber && (
                    <p className="mt-1 text-sm text-red-500">{String(clientErrors.secondaryNumber.message)}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Country</label>
                <select
                  {...clientRegister('country')}
                  defaultValue="United Arab Emirates"
                  className="block w-full rounded-lg border border-zinc-300 bg-white p-2 focus:border-black focus:ring-1 focus:ring-black"
                >
                  {countryData.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {clientErrors.country && (
                  <p className="mt-1 text-sm text-red-500">{String(clientErrors.country.message)}</p>
                )}
              </div>
            </GlassPanel>
          </div>
        </Dialog>

        {/* Delete dialog */}
        <Dialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          title="Confirm Delete"
          onSubmit={handleDeleteProduct}
        >
          <p>Are you sure you want to delete this product?</p>
        </Dialog>

        {/* Share dialog */}
        <Dialog isOpen={isShareDialogOpen} onClose={() => setIsShareDialogOpen(false)} title="PDF Generated">
          <div className="space-y-4 p-4">
            <p className="text-zinc-700">Your PDF has been generated successfully.</p>
            <div className="flex items-center space-x-2 rounded-md border border-white/30 bg-white/50 p-2">
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
    </div>
  )
}

export default Products
