'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'
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

    // Fetch promotions
    useEffect(() => {
        const fetchPromotions = async () => {
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
        fetchPromotions()
    }, [])

    // Filter promotions
    useEffect(() => {
        if (filter === 'all') {
            setFilteredPromotions(promotions)
        } else {
            setFilteredPromotions(
                promotions.filter((item) => item.type === filter),
            )
        }
    }, [filter, promotions])

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFile(event.target.files[0])
        }
    }

    // Handle form submission
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
                const updatedData = await api.get('/api/promotions')
                const data: Promotion[] = updatedData.data
                setPromotions(data)
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

    // Handle delete confirmation
    const handleDelete = async () => {
        if (!deleteId) return
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
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 p-4">
                {/* Skeleton Loader Grid */}
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
            </div>
        )
    }

    return (
        <div className="space-y-6 p-4">
            <PageHeading heading="Promotions" />
            {/* Add Promotion and Filter */}
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
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

                <Button variant="black" onClick={() => setIsDialogOpen(true)}>
                    Add Promotion
                </Button>
            </div>

            {/* Promotions Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {filteredPromotions.map((item) => (
                    <div
                        key={item.id}
                        className="relative rounded border bg-white p-2 shadow-md"
                    >
                        {item.filePath ? (
                            <iframe
                                src={item.filePath}
                                className="h-48 w-full"
                                title={item.title}
                            />
                        ) : (
                            <p className="text-center text-red-500">
                                No PDF preview available
                            </p>
                        )}
                        <p className="mt-2 w-full overflow-hidden text-ellipsis whitespace-nowrap text-center font-medium">
                            {item.title.length > 20
                                ? item.title.slice(0, 20) + '...'
                                : item.title}
                        </p>
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

            {/* Dialog for adding promotions */}
            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title="Add Banner/Advertisement"
                onSubmit={handleSubmit}
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
                        >
                            {isSubmitting ? (
                                <div className="loader" />
                            ) : (
                                'Submit'
                            )}
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Dialog for delete confirmation */}
            <Dialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                title="Confirm Deletion"
                onSubmit={handleDelete}
            >
                <div className="space-y-4 text-center">
                    <p>Are you sure you want to delete this promotion?</p>
                    <div className="flex justify-center gap-4">
                        <Button
                            variant="black"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleDelete}>Delete</Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default PromotionsPage
