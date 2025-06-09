'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PDFPreviewButtonProps {
    productId: string
    productName: string
}

const PDFPreviewButton: React.FC<PDFPreviewButtonProps> = ({ productId, productName }) => {
    const [loading, setLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)

    const handlePreview = async () => {
        setLoading(true)
        try {
            const response = await api.get(`/api/products/${productId}/pdf`)
            const url = response.data?.url

            if (!url) {
                toast.error('PDF URL not found')
                return
            }

            setPdfUrl(url)
            setIsModalOpen(true)
        } catch (error) {
            toast.error('Failed to fetch PDF')
            console.error('PDF preview error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button onClick={handlePreview} disabled={loading} title="Preview PDF">
                {loading ? 'Loading...' : <FileText className="h-5 w-5 text-black" />}
            </button>

            <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="PDF Preview">
                <div className="max-h-[80vh] w-full overflow-auto">
                    {pdfUrl ? (
                        <embed
                            src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                            type="application/pdf"
                            className="h-[80vh] w-full"
                        />
                    ) : (
                        <p className="text-center text-gray-600">No preview available</p>
                    )}
                </div>
            </Dialog>
        </>
    )
}

export default PDFPreviewButton
