'use client'

import { columns, ITable } from '@/components/custom/table/columns'
import { DataTable } from '@/components/custom/table/data-table'
import PageHeading from '@/components/layout/page-heading'
import { IProductTable, productData } from '@/components/products/data/products-data'
import ProductsFilters from '@/components/products/filters/products-filters'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { CalendarCheck, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const Products = () => {
    const [date, setDate] = useState<Date>()
    const [mainDate, setMainDate] = useState<Date>()
    const [filteredData, setFilteredData] = useState<ITable[]>(productData)

    const handleFilterChange = (newFilters: { [key: string]: string }) => {
        let data = productData

        // Apply each filter
        Object.entries(newFilters).forEach(([key, value]) => {
            data = data.filter((item) => {
                // Ensure key is treated as a valid key in IProductTable
                const itemKey = key as keyof IProductTable
                const itemValue = item[itemKey]
                
                // Check if the value is a string and includes the filter value
                return typeof itemValue === 'string' && itemValue.includes(value)
            })
        })
        
        

        setFilteredData(data)
    }

    return (
        <div className="space-y-4">
            <PageHeading heading={'Products'} />

            <div className="min-h-[calc(100vh_-_160px)] w-full">
                <div className="flex items-center justify-between gap-4 overflow-x-auto rounded-t-lg bg-white px-5 py-[17px]">
                <ProductsFilters onFilterChange={handleFilterChange} />
                    <div className="flex items-center gap-2.5">
                        <div id="search-table"></div>
                        <Select>
                            <SelectTrigger className="py-2 text-xs text-black shadow-sm ring-1 ring-gray-300">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="space-y-1.5">
                                    <SelectItem
                                        className="text-xs/tight"
                                        value="Weekly"
                                    >
                                        Weekly
                                    </SelectItem>
                                    <SelectItem
                                        className="text-xs/tight"
                                        value="Monthly"
                                    >
                                        Monthly
                                    </SelectItem>
                                    <SelectItem
                                        className="text-xs/tight"
                                        value="Yearly"
                                    >
                                        Yearly
                                    </SelectItem>
                                </div>
                            </SelectContent>
                        </Select>
                        <Link href="/" target="_blank">
                            <Button variant={'black'}>
                                <Plus />
                                New sales order
                            </Button>
                        </Link>
                    </div>
                </div>

                <DataTable columns={columns} data={productData} filterField="product" />
            </div>
        </div>
    )
}

export default Products
