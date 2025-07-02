'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Dialog } from '@/components/ui/dialog'

const ORDER_HUB_BASE_URL = process.env.NEXT_PUBLIC_GTI_ORDER_HUB_BASE_URL

interface IGeneratedPDF {
    id: string
    uniqueSlug: string
    createdAt: string
    expiresAt: string
    products: { id: string; name: string; pdfUrl: string }[]
    client: {
        id: string
        firstName: string
        lastName: string
        nickname: string
    } | null
}

const GeneratedPDFs = () => {
    const [pdfs, setPdfs] = useState<IGeneratedPDF[]>([])
    const [loading, setLoading] = useState(true)
    const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null)
    const [currentShareableUrl, setCurrentShareableUrl] = useState<string | null>(null)

    useEffect(() => {
        const fetchPdfs = async () => {
            try {
                const response = await api.get('/api/shared-pdf')
                const pdfData: IGeneratedPDF[] = response.data
                setPdfs(pdfData)
            } catch (error) {
                console.error('Error fetching generated PDFs:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchPdfs()
    }, [])

    const handleView = async (pdf: IGeneratedPDF) => {
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

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="mb-6 text-2xl font-semibold">Generated PDFs</h1>

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
                    <p className="text-lg text-gray-500">
                        No generated PDFs found
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {pdfs.map((pdf) => (
                        <Card
                            key={pdf.id}
                            className="flex flex-col h-full rounded-lg bg-white p-6 shadow-lg"
                        >
                            <CardContent className="flex flex-col flex-1">
                                {pdf.client && (
                                    <p className="mb-2 text-sm font-semibold text-blue-600">
                                        Client:{' '}
                                        {`${pdf.client.firstName} ${pdf.client.lastName}`}
                                    </p>
                                )}
                                <p className="text-gray-900 text-sm font-semibold">
                                    Products:
                                </p>
                                <ul className="text-sm text-gray-600">
                                    {pdf.products.length > 0 ? (
                                        pdf.products.map((product) => (
                                            <li key={product.id}>
                                                {product.name}
                                            </li>
                                        ))
                                    ) : (
                                        <li>No products available</li>
                                    )}
                                </ul>
                                <p className="text-sm font-medium text-gray-700">
                                    <strong>Created:</strong>{' '}
                                    {new Date(pdf.createdAt).toLocaleString()}
                                </p>
                                <p className="mb-2 text-sm text-gray-500">
                                    <strong>Expires:</strong>{' '}
                                    {new Date(pdf.expiresAt).toLocaleString()}
                                </p>
                                <div className="mt-auto">
                                    <Button
                                        variant="black"
                                        className="w-full"
                                        onClick={() => handleView(pdf)}
                                    >
                                        View PDF
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal for PDF preview */}
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

export default GeneratedPDFs
