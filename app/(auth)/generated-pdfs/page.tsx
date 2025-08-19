'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { Calendar, X } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

const ORDER_HUB_BASE_URL = process.env.NEXT_PUBLIC_GTI_ORDER_HUB_BASE_URL

type TProduct = { id: string; name: string; pdfUrl: string }
type TClient = { id: string; firstName: string; lastName: string; nickname: string }
type TListClient = { id: string; firstName: string; lastName: string }

interface IGeneratedPDF {
    id: string
    uniqueSlug: string
    createdAt: string
    expiresAt: string
    products: TProduct[]
    client: TClient | null
}

export default function GeneratedPDFs() {
    // data
    const [pdfs, setPdfs] = useState<IGeneratedPDF[]>([])
    const [loading, setLoading] = useState(true)

    // preview modal
    const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null)
    const [currentShareableUrl, setCurrentShareableUrl] = useState<string | null>(null)

    // filters (all inline in a single row)
    const [clients, setClients] = useState<TListClient[]>([])
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined)
    const [productQuery, setProductQuery] = useState('')
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [isDateOpen, setIsDateOpen] = useState(false)

    // fetch list, supports optional filters
    const fetchPdfs = async (opts?: { date?: Date; clientId?: string; product?: string }) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (opts?.date) params.set('date', format(opts.date, 'yyyy-MM-dd'))
            if (opts?.clientId) params.set('clientId', opts.clientId)
            if (opts?.product && opts.product.trim()) params.set('product', opts.product.trim())

            const url = `/api/shared-pdf${params.toString() ? `?${params.toString()}` : ''}`
            const response = await api.get(url)
            setPdfs(response.data as IGeneratedPDF[])
        } catch (error) {
            console.error('Error fetching generated PDFs:', error)
            toast.error('Failed to load PDFs')
        } finally {
            setLoading(false)
        }
    }

    // initial load + clients
    useEffect(() => {
        fetchPdfs()
            ; (async () => {
                try {
                    const res = await api.get('/api/clients')
                    const list: TListClient[] = (res.data || []).map((c: any) => ({
                        id: c.id,
                        firstName: c.firstName,
                        lastName: c.lastName,
                    }))
                    setClients(list)
                } catch (e) {
                    console.error('Failed to fetch clients', e)
                }
            })()
    }, [])

    // re-fetch on date/client change
    useEffect(() => {
        fetchPdfs({ date: selectedDate, clientId: selectedClientId, product: productQuery })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, selectedClientId])

    // product search (debounced)
    const onProductChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const val = e.target.value
        setProductQuery(val)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            fetchPdfs({ date: selectedDate, clientId: selectedClientId, product: val })
        }, 350)
    }

    // preview
    const handleView = (pdf: IGeneratedPDF) => {
        const firstPdf = pdf.products[0]
        if (!firstPdf?.pdfUrl) {
            toast.error('PDF URL not found')
            return
        }
        const shareLink = `${ORDER_HUB_BASE_URL}/${pdf.uniqueSlug}`
        setCurrentShareableUrl(shareLink)
        setActivePdfUrl(firstPdf.pdfUrl)
    }

    const handleCopyLink = () => {
        if (currentShareableUrl) {
            navigator.clipboard.writeText(currentShareableUrl)
            toast.success('Link copied to clipboard!')
        }
    }

    const clearDate = () => setSelectedDate(undefined)
    const clearClient = () => setSelectedClientId(undefined)
    const clearProduct = () => {
        setProductQuery('')
        fetchPdfs({ date: selectedDate, clientId: selectedClientId, product: '' })
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="mb-4 text-2xl font-semibold">Generated PDFs</h1>

            {/* Compact filters row */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
                {/* Date (react-day-picker in a popover, compact trigger) */}
                <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="min-w-[120px] text-left">
                                {selectedDate ? format(selectedDate, 'PP') : 'Choose date'}
                            </span>
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent className="z-50 p-3 w-auto min-w-[300px]" align="start">
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={(d) => {
                                setSelectedDate(d)
                                if (d) setIsDateOpen(false)   // close after choosing
                            }}
                            showOutsideDays
                            className="rdp"
                        />
                        <div className="mt-2 flex items-center justify-between">
                            <Button
                                onClick={() => {
                                    clearDate()
                                    setIsDateOpen(false)
                                }}
                            >
                                Clear
                            </Button>
                            <Button
                                onClick={() => {
                                    setSelectedDate(new Date())
                                    setIsDateOpen(false)
                                }}
                            >
                                Today
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                {selectedDate && (
                    <Button onClick={clearDate} aria-label="Clear date">
                        <X className="h-4 w-4" />
                    </Button>
                )}

                {/* Client */}
                <div className="flex items-center gap-2">
                    <Select
                        value={selectedClientId ?? 'all'}
                        onValueChange={(v) => setSelectedClientId(v === 'all' ? undefined : v)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All clients" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All clients</SelectItem>
                            {clients.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.firstName} {c.lastName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedClientId && (
                        <Button onClick={clearClient} aria-label="Clear client">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Product search */}
                <div className="flex items-center gap-2">
                    <Input
                        className="w-[220px]"
                        placeholder="Filter by product…"
                        value={productQuery}
                        onChange={onProductChange}
                    />
                    {productQuery && (
                        <Button onClick={clearProduct} aria-label="Clear product">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Card key={index} className="rounded-lg p-4 shadow">
                            <Skeleton className="mb-2 h-40 w-full" />
                            <Skeleton className="mb-2 h-6 w-3/4" />
                            <Skeleton className="mb-4 h-5 w-1/2" />
                            <Skeleton className="h-10 w-full" />
                        </Card>
                    ))}
                </div>
            ) : pdfs.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-10">
                    <p className="text-lg text-gray-500">No generated PDFs found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {pdfs.map((pdf) => (
                        <Card
                            key={pdf.id}
                            className="flex h-full flex-col rounded-lg bg-white p-6 shadow-lg"
                        >
                            <CardContent className="flex flex-1 flex-col">
                                {pdf.client && (
                                    <p className="mb-2 text-sm font-semibold text-blue-600">
                                        Client: {pdf.client.firstName} {pdf.client.lastName}
                                    </p>
                                )}

                                <p className="text-sm font-semibold text-gray-900">Products:</p>
                                <ul className="text-sm text-gray-600">
                                    {pdf.products.length > 0 ? (
                                        pdf.products.map((product) => <li key={product.id}>{product.name}</li>)
                                    ) : (
                                        <li>No products available</li>
                                    )}
                                </ul>

                                <p className="text-sm font-medium text-gray-700">
                                    <strong>Created:</strong> {new Date(pdf.createdAt).toLocaleString()}
                                </p>
                                <p className="mb-2 text-sm text-gray-500">
                                    <strong>Expires:</strong> {new Date(pdf.expiresAt).toLocaleString()}
                                </p>

                                <div className="mt-auto">
                                    <Button variant="black" className="w-full" onClick={() => handleView(pdf)}>
                                        View PDF
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* PDF Preview Modal */}
            <Dialog
                isOpen={!!activePdfUrl}
                onClose={() => {
                    setActivePdfUrl(null)
                    setCurrentShareableUrl(null)
                }}
                title="PDF Preview"
            >
                <div className="space-y-4 p-4">
                    {activePdfUrl && (
                        <embed
                            src={`${activePdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                            type="application/pdf"
                            className="h-[80vh] w-full"
                        />
                    )}
                    {currentShareableUrl && (
                        <Button onClick={handleCopyLink} variant="black" className="w-full">
                            Copy Shareable Link
                        </Button>
                    )}
                </div>
            </Dialog>
        </div>
    )
}
