'use client'

import { columns, ITable } from '@/components/custom/table/columns'
import { DataTable } from '@/components/custom/table/data-table'
import PageHeading from '@/components/layout/page-heading'
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

    const data: ITable[] = [
        {
            id: '#100001',
            brand: 'Milano',
            size: 'King Size',
            tar: '8 mg',
            nicotine: '0.6 mg',
            co: '10 mg',
            flavor: 'Vanilla',
            fsp: 'Yes',
            corners: 'Rounded',
            capsules: '1',
        },
        {
            id: '#100002',
            brand: 'Cavallo',
            size: 'Slim',
            tar: '6 mg',
            nicotine: '0.5 mg',
            co: '8 mg',
            flavor: 'Mint',
            fsp: 'No',
            corners: 'Square',
            capsules: 'No Cap',
        },
        {
            id: '#100003',
            brand: 'Nond Alster',
            size: 'Regular',
            tar: '10 mg',
            nicotine: '0.8 mg',
            co: '12 mg',
            flavor: 'Original',
            fsp: 'Yes',
            corners: 'Rounded',
            capsules: '2',
        },
        {
            id: '#100004',
            brand: 'Momento',
            size: 'King Size',
            tar: '9 mg',
            nicotine: '0.7 mg',
            co: '11 mg',
            flavor: 'Berry',
            fsp: 'No',
            corners: 'Square',
            capsules: '1',
        },
    ]
    

    return (
        <div className="space-y-4">
            <PageHeading heading={'Products'} />

            <div className="min-h-[calc(100vh_-_160px)] w-full">
                <div className="flex items-center justify-between gap-4 overflow-x-auto rounded-t-lg bg-white px-5 py-[17px]">
                    <div className="flex items-center gap-2.5">
                        <Button
                            type="button"
                            variant={'outline'}
                            className="bg-light-theme ring-0"
                        >
                            All
                        </Button>
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant={'outline-general'}
                                    >
                                        <CalendarCheck />
                                        {date ? (
                                            format(date, 'PP')
                                        ) : (
                                            <span>Start date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="!w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <span className="text-xs font-medium text-gray-700">
                                To
                            </span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant={'outline-general'}
                                    >
                                        <CalendarCheck />
                                        {mainDate ? (
                                            format(mainDate, 'PPP')
                                        ) : (
                                            <span>End date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="!w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={mainDate}
                                        onSelect={setMainDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
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

                <DataTable columns={columns} data={data} filterField="name" />
            </div>
        </div>
    )
}

export default Products
