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
import { X, Filter, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

interface FilterProps {
    onFilterChange: (filters: Record<string, string>) => void
    onRefresh: () => void
    onClearSelection?: () => void
}

interface IBrand {
    id: string
    name: string
}

export default function ProductsFilters({
    onFilterChange,
    onRefresh,
    onClearSelection,
}: FilterProps) {
    const [filters, setFilters] = useState<Record<string, string>>({})
    const [brands, setBrands] = useState<IBrand[]>([])
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
    const [showAllFilters, setShowAllFilters] = useState(false)

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

    const handleChange = (key: string, value: string) => {
        const updatedFilters = { ...filters }
        if (value.trim() === '') {
            delete updatedFilters[key]
        } else {
            updatedFilters[key] = value
        }
        setFilters(updatedFilters)
        onFilterChange(updatedFilters)
    }

    const clearFilters = () => {
        setFilters({})
        onFilterChange({})
        if (onClearSelection) onClearSelection()
    }

    return (
        <>
            {/* Desktop Filters */}
            <div className="hidden grid-cols-2 gap-4 md:grid md:grid-cols-4 lg:grid-cols-6">
                {/* Always visible filters */}
                <div className="relative col-span-2">
                    <Search className="text-muted-foreground absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2" />
                    <Input
                        placeholder="Search by name"
                        value={filters.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="pl-9"
                    />
                </div>
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
                    placeholder="Enter size"
                    value={filters.size || ''}
                    onChange={(e) => handleChange('size', e.target.value)}
                />
                <Input
                    placeholder="Flavor"
                    value={filters.flavor || ''}
                    onChange={(e) => handleChange('flavor', e.target.value)}
                />
                <Input
                    placeholder="Packet Type"
                    value={filters.packetStyle || ''}
                    onChange={(e) =>
                        handleChange('packetStyle', e.target.value)
                    }
                />

                {/* Conditionally visible filters */}
                {showAllFilters && (
                    <>
                        <Select
                            onValueChange={(value) =>
                                handleChange('fsp', value)
                            }
                            value={filters.fsp || ''}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="FSP" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            onValueChange={(value) =>
                                handleChange('capsules', value)
                            }
                            value={filters.capsules || ''}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Number of Capsules" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">0</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="Tar (mg)"
                            value={filters.tar || ''}
                            onChange={(e) =>
                                handleChange('tar', e.target.value)
                            }
                        />
                        <Input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="Nicotine (mg)"
                            value={filters.nicotine || ''}
                            onChange={(e) =>
                                handleChange('nicotine', e.target.value)
                            }
                        />
                        <Input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="Carbon Monoxide (mg)"
                            value={filters.co || ''}
                            onChange={(e) => handleChange('co', e.target.value)}
                        />

                        <Input
                            placeholder="Color of Packet"
                            value={filters.color || ''}
                            onChange={(e) =>
                                handleChange('color', e.target.value)
                            }
                        />
                    </>
                )}

                {/* Button to toggle */}
                <div className="col-span-full flex gap-2">
                    <Button
                        variant="outline"
                        size="small"
                        onClick={() => setShowAllFilters(!showAllFilters)}
                    >
                        {showAllFilters ? 'Hide Filters' : 'View All Filters'}
                    </Button>

                    <Button variant="outline" size="small" onClick={onRefresh}>
                        <RefreshCw size={18} />
                    </Button>

                    <Button
                        variant="outline"
                        size="small"
                        onClick={clearFilters}
                    >
                        <X size={18} />
                    </Button>
                </div>
            </div>

            {/* Mobile Filters Button & Clear Filters Button */}
            <div className="flex justify-end gap-2 md:hidden">
                {/* Mobile Filter Button */}
                <Button
                    variant="outline"
                    onClick={() => setIsMobileFilterOpen(true)}
                >
                    <Filter size={20} />
                </Button>

                {/* Clear Filters Button */}
                <Button
                    variant="outline"
                    size="small"
                    onClick={() => {
                        setFilters({}) // ✅ Clear filters
                        onFilterChange({}) // ✅ Apply empty filters
                    }}
                >
                    <X size={18} />
                </Button>
            </div>

            {/* Mobile Filters Modal */}
            <Dialog
                isOpen={isMobileFilterOpen}
                onClose={() => setIsMobileFilterOpen(false)}
                title="Filters"
            >
                <div className="space-y-4 p-4">
                    <div className="relative">
                        <Search className="text-muted-foreground absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search by name"
                            value={filters.name || ''}
                            onChange={(e) =>
                                setFilters({ ...filters, name: e.target.value })
                            }
                            className="pl-9"
                        />
                    </div>

                    <Select
                        onValueChange={(value) =>
                            setFilters({ ...filters, brandId: value })
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
                        placeholder="Enter Size"
                        value={filters.size || ''}
                        onChange={(e) =>
                            setFilters({ ...filters, size: e.target.value })
                        }
                    />

                    <Input
                        placeholder="Enter Flavor"
                        value={filters.flavor || ''}
                        onChange={(e) =>
                            setFilters({ ...filters, flavor: e.target.value })
                        }
                    />

                    <Input
                        placeholder="Enter Packet Type"
                        value={filters.packetStyle || ''}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                packetStyle: e.target.value,
                            })
                        }
                    />

                    <Select
                        onValueChange={(value) =>
                            setFilters({ ...filters, fsp: value })
                        }
                        value={filters.fsp || ''}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="FSP" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        onValueChange={(value) =>
                            setFilters({ ...filters, capsules: value })
                        }
                        value={filters.capsules || ''}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Number of Capsules" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">0</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                    </Select>

                    <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Enter Tar (mg)"
                        value={filters.tar || ''}
                        onChange={(e) =>
                            setFilters({ ...filters, tar: e.target.value })
                        }
                    />
                    <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Enter Nicotine (mg)"
                        value={filters.nicotine || ''}
                        onChange={(e) =>
                            setFilters({ ...filters, nicotine: e.target.value })
                        }
                    />
                    <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="Enter Carbon Monoxide (mg)"
                        value={filters.co || ''}
                        onChange={(e) =>
                            setFilters({ ...filters, co: e.target.value })
                        }
                    />

                    <Input
                        placeholder="Enter Color of Packet"
                        value={filters.color || ''}
                        onChange={(e) =>
                            setFilters({ ...filters, color: e.target.value })
                        }
                    />

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="black"
                            onClick={() => {
                                onFilterChange(filters) // ✅ Apply filters
                                setIsMobileFilterOpen(false) // ✅ Close modal
                            }}
                        >
                            Apply
                        </Button>
                    </div>
                </div>
            </Dialog>
        </>
    )
}
