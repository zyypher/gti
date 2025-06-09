'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Trash2, RefreshCw, Circle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import PageHeading from '@/components/layout/page-heading'

// Define type for promotions
type Promotion = {
    id: string
    filePath: string
    title: string
    type: 'banner' | 'advertisement'
}

const PromotionsPage = () => {
    const [promotions, setPromotions] = useState<Promotion[]>([])
    const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>(
        [],
    )
    const [filter, setFilter] = useState<'all' | 'banner' | 'advertisement'>(
        'all',
    )
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [type, setType] = useState<'banner' | 'advertisement'>('banner')
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchPromotions = async () => {
        setLoading(true)
        try {
            const response = await api.get('/api/promotions')
            const data: Promotion[] = response.data
            setPromotions(data)
            setFilteredPromotions(data)
        } catch (error) {
            toast.error('Failed to load promotions')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPromotions()
    }, [])

    useEffect(() => {
        if (filter === 'all') {
            setFilteredPromotions(promotions)
        } else {
            setFilteredPromotions(
                promotions.filter((item) => item.type === filter),
            )
        }
    }, [filter, promotions])

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFile(event.target.files[0])
        }
    }

    const handleSubmit = async () => {
        if (!file) {
            toast.error('Please select a PDF file')
            return
        }
        setIsSubmitting(true)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', type)
        formData.append('title', file.name)

        try {
            const response = await api.post('/api/promotions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            if (response.status === 201) {
                toast.success('Promotion added successfully')
                setIsDialogOpen(false)
                setFile(null)
                await fetchPromotions()
            } else {
                toast.error('Failed to add promotion')
            }
        } catch (error) {
            toast.error('Error adding promotion')
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        setIsDeleting(true)
        try {
            const response = await api.delete(`/api/promotions?id=${deleteId}`)
            if (response.status === 200) {
                toast.success('Promotion deleted successfully')
                setPromotions((prev) =>
                    prev.filter((item) => item.id !== deleteId),
                )
            } else {
                toast.error('Failed to delete promotion')
            }
        } catch (error) {
            toast.error('Error deleting promotion')
            console.error(error)
        } finally {
            setDeleteDialogOpen(false)
            setDeleteId(null)
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6 p-4">
            <PageHeading heading="Promotions" />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <select
                        value={filter}
                        onChange={(e) =>
                            setFilter(
                                e.target.value as
                                    | 'all'
                                    | 'banner'
                                    | 'advertisement',
                            )
                        }
                        className="rounded border p-2"
                    >
                        <option value="all">All</option>
                        <option value="banner">Banners</option>
                        <option value="advertisement">Advertisements</option>
                    </select>
                    <div className="flex items-center gap-4 text-sm text-gray-700">
                        <div className="h-3 w-3 rounded-full bg-primary" />{' '}
                        Banner
                        <div className="h-3 w-3 rounded-full bg-success" />{' '}
                        Advertisement
                    </div>

                    <Button variant="outline" onClick={fetchPromotions}>
                        <RefreshCw size={18} className="mr-1" /> Refresh
                    </Button>
                </div>
                <Button variant="black" onClick={() => setIsDialogOpen(true)}>
                    Add Promotion
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="relative rounded border bg-white p-2 shadow-md"
                        >
                            <Skeleton className="h-48 w-full rounded-md" />
                            <Skeleton className="mx-auto mt-2 h-5 w-3/4 rounded-md" />
                            <Skeleton className="absolute right-2 top-2 h-5 w-5 rounded-md" />
                        </div>
                    ))}
                </div>
            ) : filteredPromotions.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-10">
                    <p className="text-lg text-gray-500">No promotions found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 justify-center gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {filteredPromotions.map((item) => (
                        <div
                            key={item.id}
                            className={`relative aspect-square w-full max-w-[250px] overflow-hidden rounded border-4 bg-white shadow-md ${
                                item.type === 'banner'
                                    ? 'border-primary'
                                    : 'border-success'
                            }`}
                        >
                            <embed
                                src={`${item.filePath}#zoom=Fit`}
                                type="application/pdf"
                                className="h-full w-full object-contain"
                            />

                            {/* Title at bottom overlay */}
                            <div className="absolute bottom-0 w-full truncate bg-white bg-opacity-90 px-1 py-1 text-center text-sm font-medium">
                                {item.title.length > 20
                                    ? item.title.slice(0, 20) + '...'
                                    : item.title}
                            </div>

                            {/* Delete button at top-right */}
                            <button
                                className="absolute right-2 top-2 text-red-500"
                                onClick={() => {
                                    setDeleteId(item.id)
                                    setDeleteDialogOpen(true)
                                }}
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title="Add Promotion"
            >
                <div className="space-y-4">
                    <Input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                    />
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="type"
                                value="banner"
                                checked={type === 'banner'}
                                onChange={() => setType('banner')}
                            />
                            Banner
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="type"
                                value="advertisement"
                                checked={type === 'advertisement'}
                                onChange={() => setType('advertisement')}
                            />
                            Advertisement
                        </label>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            variant="black"
                            disabled={isSubmitting}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    </div>
                </div>
            </Dialog>

            <Dialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                title="Confirm Deletion"
                // onSubmit={handleDelete}
            >
                <div className="space-y-4">
                    <p>Are you sure you want to delete this promotion?</p>
                    <div className="mt-6 flex justify-end gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="black"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default PromotionsPage
