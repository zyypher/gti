import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

interface FilterProps {
    onFilterChange: (filters: Record<string, string>) => void
}

interface IBrand {
    id: string
    name: string
}

export default function ProductsFilters({ onFilterChange }: FilterProps) {
    const [filters, setFilters] = useState<Record<string, string>>({})
    const [brands, setBrands] = useState<IBrand[]>([])
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

    // Fetch brands dynamically from API
    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const response = await api.get('/api/brands')
                setBrands(response.data)
            } catch (error) {
                console.error('Failed to fetch brands:', error)
            }
        }
        fetchBrands()
    }, [])

    // Handle filter changes
    const handleChange = (key: string, value: string) => {
        const updatedFilters = { ...filters, [key]: value }
        setFilters(updatedFilters)
        onFilterChange(updatedFilters)
    }

    // Clear all filters
    const clearFilters = () => {
        setFilters({})
        onFilterChange({})
    }

    return (
        <>
            {/* Desktop Filters */}
            <div className="hidden grid-cols-2 gap-4 md:grid md:grid-cols-4 lg:grid-cols-6">
                <Input
                    placeholder="Search by name"
                    value={filters.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                />

                <Select
                    onValueChange={(value) => handleChange('size', value)}
                    value={filters.size || ''}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Size" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="King Size">King Size</SelectItem>
                        <SelectItem value="Slim">Slim</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    onValueChange={(value) => handleChange('brandId', value)}
                    value={filters.brandId || ''}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent>
                        {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Input
                    placeholder="Tar (mg)"
                    type="number"
                    value={filters.tar || ''}
                    onChange={(e) => handleChange('tar', e.target.value)}
                />
                <Input
                    placeholder="Nicotine (mg)"
                    type="number"
                    value={filters.nicotine || ''}
                    onChange={(e) => handleChange('nicotine', e.target.value)}
                />
                <Input
                    placeholder="CO (mg)"
                    type="number"
                    value={filters.co || ''}
                    onChange={(e) => handleChange('co', e.target.value)}
                />

                <Button variant="outline" onClick={clearFilters}>
                    <X size={20} />
                </Button>
            </div>

            {/* Mobile Filters Button */}
            <div className="flex justify-end md:hidden">
                <Button
                    variant="outline"
                    onClick={() => setIsMobileFilterOpen(true)}
                >
                    <Filter size={20} />
                </Button>
            </div>

            {/* Mobile Filters Modal */}
            <Dialog
                isOpen={isMobileFilterOpen}
                onClose={() => setIsMobileFilterOpen(false)}
                title="Filters"
                onSubmit={() => onFilterChange(filters)}
            >
                <div className="space-y-4 p-4">
                    <Input
                        placeholder="Search by name"
                        value={filters.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                    />

                    <Select
                        onValueChange={(value) => handleChange('size', value)}
                        value={filters.size || ''}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Size" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="King Size">King Size</SelectItem>
                            <SelectItem value="Slim">Slim</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        onValueChange={(value) =>
                            handleChange('brandId', value)
                        }
                        value={filters.brandId || ''}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Brand" />
                        </SelectTrigger>
                        <SelectContent>
                            {brands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                    {brand.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input
                        placeholder="Tar (mg)"
                        type="number"
                        value={filters.tar || ''}
                        onChange={(e) => handleChange('tar', e.target.value)}
                    />
                    <Input
                        placeholder="Nicotine (mg)"
                        type="number"
                        value={filters.nicotine || ''}
                        onChange={(e) =>
                            handleChange('nicotine', e.target.value)
                        }
                    />
                    <Input
                        placeholder="CO (mg)"
                        type="number"
                        value={filters.co || ''}
                        onChange={(e) => handleChange('co', e.target.value)}
                    />

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={clearFilters}>
                            Clear
                        </Button>
                        <Button
                            variant="black"
                            onClick={() => setIsMobileFilterOpen(false)}
                        >
                            Apply
                        </Button>
                    </div>
                </div>
            </Dialog>
        </>
    )
}
