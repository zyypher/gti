import { useState } from 'react'
import { FileText } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { AxiosError } from 'axios'

interface PDFDownloadButtonProps {
    productId: string
    productName: string
}

const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({ productId, productName }) => {
    const [loading, setLoading] = useState(false)

    const handleDownloadPDF = async () => {
        setLoading(true)
        try {
            const response = await api.get(`/api/products/${productId}/pdf`, {
                responseType: 'blob',
            })

            if (response.status === 200) {
                if (!response.data || response.data.size === 0) {
                    toast.error('No PDF available for this product')
                    return
                }

                const blob = new Blob([response.data], { type: 'application/pdf' })
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')

                link.href = url
                link.download = `${productName}.pdf`
                document.body.appendChild(link)
                link.click()

                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            } else {
                toast.error('No PDF available for this product')
            }
        } catch (error) {
            const axiosError = error as AxiosError;
        
            if (axiosError.response?.status === 404) {
                toast.error('No PDF available for this product');
            } else {
                toast.error('Error fetching PDF');
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <button onClick={handleDownloadPDF} disabled={loading}>
            {loading ? 'Loading...' : <FileText className="h-5 w-5" />}
        </button>
    )
}

export default PDFDownloadButton
