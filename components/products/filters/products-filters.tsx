'use client'

import { useState } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type FiltersProps = {
    onFilterChange: (filters: { [key: string]: string }) => void
}

const ProductsFilters = ({ onFilterChange }: FiltersProps) => {
    const [brand, setBrand] = useState<string | undefined>()
    const [size, setSize] = useState<string | undefined>()

    const handleFilterChange = (key: string, value: string) => {
        onFilterChange({ [key]: value })
    }

    return (
        <div className="flex items-center gap-4">
            <Select
                onValueChange={(value) => {
                    setBrand(value)
                    handleFilterChange('brand', value)
                }}
            >
                <SelectTrigger className="py-2 text-xs text-black shadow-sm ring-1 ring-gray-300">
                    <SelectValue placeholder="Filter by Brand" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Milano">Milano</SelectItem>
                    <SelectItem value="Cavallo">Cavallo</SelectItem>
                    <SelectItem value="Nond Alster">Nond Alster</SelectItem>
                    <SelectItem value="Momento">Momento</SelectItem>
                </SelectContent>
            </Select>

            <Select
                onValueChange={(value) => {
                    setSize(value)
                    handleFilterChange('size', value)
                }}
            >
                <SelectTrigger className="py-2 text-xs text-black shadow-sm ring-1 ring-gray-300">
                    <SelectValue placeholder="Filter by Size" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="King Size">King Size</SelectItem>
                    <SelectItem value="Slim">Slim</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}

export default ProductsFilters
