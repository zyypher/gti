'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, MoveDown, MoveUp } from 'lucide-react'
import Image from 'next/image'

export type ITable = {
    id: string
    brand: string
    size: string
    tar: string
    nicotine: string
    co: string
    flavor: string
    fsp: string
    corners: string
    capsules: string
}


export const columns: ColumnDef<ITable>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'brand',
        header: 'Brand',
        cell: ({ row }) => <div>{row.getValue('brand')}</div>,
    },
    {
        accessorKey: 'product',
        header: 'Product',
        cell: ({ row }) => <div>{row.getValue('product')}</div>,
    },
    {
        accessorKey: 'size',
        header: 'Size',
        cell: ({ row }) => <div>{row.getValue('size')}</div>,
    },
    {
        accessorKey: 'tar',
        header: 'Tar (mg)',
        cell: ({ row }) => <div>{row.getValue('tar')}</div>,
    },
    {
        accessorKey: 'nicotine',
        header: 'Nicotine (mg)',
        cell: ({ row }) => <div>{row.getValue('nicotine')}</div>,
    },
    {
        accessorKey: 'co',
        header: 'CO (mg)',
        cell: ({ row }) => <div>{row.getValue('co')}</div>,
    },
    {
        accessorKey: 'flavor',
        header: 'Flavor',
        cell: ({ row }) => <div>{row.getValue('flavor')}</div>,
    },
    {
        accessorKey: 'fsp',
        header: 'FSP',
        cell: ({ row }) => (
            <Badge
                variant={row.getValue('fsp') === 'Yes' ? 'green' : 'red'}
                className="capitalize"
            >
                {row.getValue('fsp')}
            </Badge>
        ),
    },
    {
        accessorKey: 'corners',
        header: 'Corners',
        cell: ({ row }) => <div>{row.getValue('corners')}</div>,
    },
    {
        accessorKey: 'capsules',
        header: 'Capsules',
        cell: ({ row }) => <div>{row.getValue('capsules')}</div>,
    },
]

