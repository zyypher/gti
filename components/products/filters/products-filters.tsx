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
import { X, Filter, RefreshCw, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { FloatingLabelInput } from '@/components/ui/floating-label-input'

interface FilterProps {
    onFilterChange: (filters: Record<string, string>) => void
    onRefresh: () => void
    onClearSelection?: () => void
    initialFilters?: Record<string, string>
}

interface IBrand {
    id: string
    name: string
}

export default function ProductsFilters({
    onFilterChange,
    onRefresh,
    onClearSelection,
    initialFilters = {},
}: FilterProps) {
    const [filters, setFilters] = useState<Record<string, string>>(initialFilters)
    const [brands, setBrands] = useState<IBrand[]>([])
    const [sizes, setSizes] = useState<string[]>([])
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
    const [showAllFilters, setShowAllFilters] = useState(false)
    const [isLoadingBrands, setIsLoadingBrands] = useState(true)
    const [isLoadingSizes, setIsLoadingSizes] = useState(true)

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const response = await api.get('/api/brands')
                setBrands(
                    response.data.sort((a: IBrand, b: IBrand) =>
                        a.name.localeCompare(b.name),
                    ),
                )
            } catch (error) {
                console.error('Failed to fetch brands:', error)
            } finally {
                setIsLoadingBrands(false)
            }
        }

        const fetchSizes = async () => {
            try {
                const response = await api.get('/api/products/sizes')
                setSizes(response.data)
            } catch (error) {
                console.error('Failed to fetch sizes:', error)
            } finally {
                setIsLoadingSizes(false)
            }
        }

        fetchBrands()
        fetchSizes()
    }, [])

    useEffect(() => {
        console.log('##brands:', brands, 'filters.brandId:', filters.brandId);
    }, [brands, filters.brandId]);

    useEffect(() => {
        if (
            brands.length > 0 &&
            initialFilters.brandId &&
            filters.brandId !== initialFilters.brandId
        ) {
            setFilters(initialFilters);
            onFilterChange(initialFilters);
        } else if (brands.length > 0 && filters.brandId) {
            onFilterChange(filters);
        }
    }, [brands, filters.brandId, initialFilters.brandId]);

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
                    <FloatingLabelInput
                        label="Search by name"
                        name="searchByName"
                        value={filters.name || ''}
                        onChange={(value) => handleChange('name', value)}
                        iconLeft={<Search className="h-4 w-4" />}
                    />
                </div>
                <Select
                    onValueChange={(value) => handleChange('brandId', value)}
                    value={filters.brandId || ''}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={
                            isLoadingBrands ? (
                                <span className="flex items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                                </span>
                            ) : (
                                'Select Brand'
                            )
                        } />
                    </SelectTrigger>
                    <SelectContent>
                        {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    onValueChange={(value) => handleChange('size', value)}
                    value={filters.size || ''}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={
                            isLoadingSizes ? (
                                <span className="flex items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                                </span>
                            ) : (
                                'Select Stick Format'
                            )
                        } />
                    </SelectTrigger>
                    <SelectContent>
                        {sizes.map((size) => (
                            <SelectItem key={size} value={size}>
                                {size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FloatingLabelInput
                    label="Flavour"
                    name="flavor"
                    value={filters.flavor || ''}
                    onChange={(value) => handleChange('flavor', value)}
                />
                <FloatingLabelInput
                    label="Pack Format"
                    name="packFormat"
                    value={filters.packetStyle || ''}
                    onChange={(value) =>
                        handleChange('packetStyle', value)
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

                        <FloatingLabelInput
                            type="number"
                            step="0.1"
                            min="0"
                            label="Tar (mg)"
                            name="tar"
                            value={filters.tar || ''}
                            onChange={(value) =>
                                handleChange('tar', value)
                            }
                        />
                        <FloatingLabelInput
                            type="number"
                            step="1"
                            min="0"
                            label="Nicotine (mg)"
                            name="nicotine"
                            value={filters.nicotine || ''}
                            onChange={(value) =>
                                handleChange('nicotine', value)
                            }
                        />
                        <FloatingLabelInput
                            type="number"
                            step="1"
                            min="0"
                            label="Carbon Monoxide (mg)"
                            name="co"
                            value={filters.co || ''}
                            onChange={(value) => handleChange('co', value)}
                        />

                        <FloatingLabelInput
                            label="Color of Packet"
                            name="color"
                            value={filters.color || ''}
                            onChange={(value) =>
                                handleChange('color', value)
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
                        <RefreshCw size={18} /> Refresh
                    </Button>

                    <Button
                        variant="outline"
                        size="small"
                        onClick={clearFilters}
                    >
                        <X size={18} /> Clear
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
                    <Filter size={20} /> Filters
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
                    <X size={18} /> Clear
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
                        <FloatingLabelInput
                            label="Search by name"
                            name="searchByNameMobile"
                            value={filters.name || ''}
                            onChange={(value) =>
                                setFilters({ ...filters, name: value })
                            }
                            iconLeft={<Search className="h-4 w-4" />}
                        />
                    </div>

                    <Select
                        onValueChange={(value) =>
                            setFilters({ ...filters, brandId: value })
                        }
                        value={filters.brandId || ''}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={
                                isLoadingBrands ? (
                                    <span className="flex items-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                                    </span>
                                ) : (
                                    'Select Brand'
                                )
                            } />
                        </SelectTrigger>
                        <SelectContent>
                            {brands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                    {brand.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        onValueChange={(value) =>
                            setFilters({ ...filters, size: value })
                        }
                        value={filters.size || ''}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={
                                isLoadingSizes ? (
                                    <span className="flex items-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                                    </span>
                                ) : (
                                    'Select Stick Format'
                                )
                            } />
                        </SelectTrigger>
                        <SelectContent>
                            {sizes.map((size) => (
                                <SelectItem key={size} value={size}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <FloatingLabelInput
                        label="Flavour"
                        name="flavor"
                        value={filters.flavor || ''}
                        onChange={(value) =>
                            setFilters({ ...filters, flavor: value })
                        }
                    />

                    <FloatingLabelInput
                        label="Pack Format"
                        name="packFormat"
                        value={filters.packetStyle || ''}
                        onChange={(value) =>
                            setFilters({
                                ...filters,
                                packetStyle: value,
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

                    <FloatingLabelInput
                        type="number"
                        step="0.1"
                        min="0"
                        label="Tar (mg)"
                        name="tar"
                        value={filters.tar || ''}
                        onChange={(value) =>
                            setFilters({ ...filters, tar: value })
                        }
                    />
                    <FloatingLabelInput
                        type="number"
                        step="1"
                        min="0"
                        label="Nicotine (mg)"
                        name="nicotine"
                        value={filters.nicotine || ''}
                        onChange={(value) =>
                            setFilters({ ...filters, nicotine: value })
                        }
                    />
                    <FloatingLabelInput
                        type="number"
                        step="1"
                        min="0"
                        label="Carbon Monoxide (mg)"
                        name="co"
                        value={filters.co || ''}
                        onChange={(value) =>
                            setFilters({ ...filters, co: value })
                        }
                    />

                    <FloatingLabelInput
                        label="Color of Packet"
                        name="color"
                        value={filters.color || ''}
                        onChange={(value) =>
                            setFilters({ ...filters, color: value })
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
