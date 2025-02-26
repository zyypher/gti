'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

const ORDER_HUB_BASE_URL = process.env.NEXT_PUBLIC_GTI_ORDER_HUB_BASE_URL

interface IGeneratedPDF {
    id: string
    uniqueSlug: string
    createdAt: string
    expiresAt: string
    products: { id: string; name: string; pdfUrl: string }[]
}

const GeneratedPDFs = () => {
    const [pdfs, setPdfs] = useState<IGeneratedPDF[]>([])
    const [loading, setLoading] = useState(true)

    console.log('##pdf', pdfs)

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
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {pdfs.map((pdf) => (
                        <Card
                            key={pdf.id}
                            className="rounded-lg bg-white p-6 shadow-lg"
                        >
                            <CardContent>
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

                                <Button variant="black" className="mt-4 w-full">
                                    <a
                                        href={`${ORDER_HUB_BASE_URL}/${pdf.uniqueSlug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-full w-full items-center justify-center"
                                    >
                                        View PDF
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default GeneratedPDFs
