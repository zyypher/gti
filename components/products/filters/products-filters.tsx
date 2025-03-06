import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { X, Filter, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

interface FilterProps {
    onFilterChange: (filters: Record<string, string>) => void
    onRefresh: () => void
}

interface IBrand {
    id: string
    name: string
}

export default function ProductsFilters({ onFilterChange, onRefresh }: FilterProps) {
    const [filters, setFilters] = useState<Record<string, string>>({})
    const [brands, setBrands] = useState<IBrand[]>([])
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

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
        const updatedFilters = { ...filters, [key]: value }
        setFilters(updatedFilters)
        onFilterChange(updatedFilters)
    }

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
                    placeholder="Packet Style"
                    value={filters.packetStyle || ''}
                    onChange={(e) => handleChange('packetStyle', e.target.value)}
                />

                <Select
                    onValueChange={(value) => handleChange('fsp', value)}
                    value={filters.fsp || ''}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="FSP (Firm Shell Pack)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    onValueChange={(value) => handleChange('capsules', value)}
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
                    placeholder="Carbon Monoxide (mg)"
                    type="number"
                    value={filters.co || ''}
                    onChange={(e) => handleChange('co', e.target.value)}
                />

                <Input
                    placeholder="Color of Packet"
                    value={filters.color || ''}
                    onChange={(e) => handleChange('color', e.target.value)}
                />

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {/* Refresh Button */}
                    <Button variant="outline" size="small" onClick={() => onRefresh()}>
                        <RefreshCw size={18} />
                    </Button>

                    {/* Clear Filters (Small Button) */}
                    <Button variant="outline" size="small" onClick={clearFilters}>
                        <X size={18} />
                    </Button>
                </div>
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
                        placeholder="Enter Size"
                        value={filters.size || ''}
                        onChange={(e) => handleChange('size', e.target.value)}
                    />

                    <Input
                        placeholder="Enter Flavor"
                        value={filters.flavor || ''}
                        onChange={(e) => handleChange('flavor', e.target.value)}
                    />

                    <Input
                        placeholder="Enter Packet Style"
                        value={filters.packetStyle || ''}
                        onChange={(e) => handleChange('packetStyle', e.target.value)}
                    />

                    <Select
                        onValueChange={(value) => handleChange('fsp', value)}
                        value={filters.fsp || ''}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="FSP (Firm Shell Pack)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        onValueChange={(value) => handleChange('capsules', value)}
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
                        placeholder="Enter Tar (mg)"
                        type="number"
                        value={filters.tar || ''}
                        onChange={(e) => handleChange('tar', e.target.value)}
                    />
                    <Input
                        placeholder="Enter Nicotine (mg)"
                        type="number"
                        value={filters.nicotine || ''}
                        onChange={(e) => handleChange('nicotine', e.target.value)}
                    />
                    <Input
                        placeholder="Enter Carbon Monoxide (mg)"
                        type="number"
                        value={filters.co || ''}
                        onChange={(e) => handleChange('co', e.target.value)}
                    />

                    <Input
                        placeholder="Enter Color of Packet"
                        value={filters.color || ''}
                        onChange={(e) => handleChange('color', e.target.value)}
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
