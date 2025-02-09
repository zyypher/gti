import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'

interface FilterProps {
    onFilterChange: (filters: Record<string, string>) => void
}

export default function ProductsFilters({ onFilterChange }: FilterProps) {
    const [filters, setFilters] = useState<Record<string, string>>({})

    const handleChange = (key: string, value: string) => {
        const updatedFilters = { ...filters, [key]: value }
        setFilters(updatedFilters)
        onFilterChange(updatedFilters)
    }

    return (
        <div className="flex gap-4">
            <Select onValueChange={(value) => handleChange('size', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select Size" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="King Size">King Size</SelectItem>
                <SelectItem value="Slim">Slim</SelectItem>
                </SelectContent>
                
            </Select>
            {/* Add similar filters for other fields */}
        </div>
    )
}
