'use client'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ColumnDef } from '@tanstack/react-table'
import { Edit, Trash, FileText } from 'lucide-react'

export type ITable = {
    id: string
    name: string
    brand: {
        name: string
        description: string | null
        image: string | null
    }
    size: string
    tar: string
    nicotine: string
    co: string
    flavor: string
    fsp: string
    corners: string
    capsules: string
    pdfContent: string
}
function displayPdf(base64Pdf: string | null) {
    if (!base64Pdf) return <span>No PDF</span>

    const pdfUrl = `data:application/pdf;base64,${base64Pdf}`
    return (
        <a href={pdfUrl} download="product.pdf">
            Download PDF
        </a>
    )
}

export const columns = (
    handleEdit: (item: ITable) => void,
    handleDelete: (id: string) => void
): ColumnDef<ITable>[] => [
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
        accessorKey: 'brand.name',
        header: 'Brand',
        cell: ({ row }) => <div>{row.original.brand.name}</div>, // Access the nested name property
    },
    {
        accessorKey: 'name',
        header: 'Product Name',
        cell: ({ row }) => <div>{row.getValue('name')}</div>,
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
    // {
    //     accessorKey: 'pdfContent',
    //     header: 'PDF',
    //     cell: ({ row }) => {
    //         const pdfPath = row.original.pdfContent
    //         return pdfPath ? (
    //             <a href={pdfPath} target="_blank" rel="noopener noreferrer">
    //                 View PDF
    //             </a>
    //         ) : (
    //             <span>No PDF</span>
    //         )
    //     },
    // },
    {
        accessorKey: 'pdfContent',
        header: 'PDF',
        cell: ({ row }) => displayPdf(row.getValue('pdfContent')),
    }
,    
    {
        header: 'Actions',
        cell: ({ row }) => (
            <div className="flex space-x-2">
                <button onClick={() => handleEdit(row.original)}>
                    <Edit className="h-5 w-5" />
                </button>
                <button onClick={() => handleDelete(row.original.id)}>
                    <Trash className="h-5 w-5" />
                </button>
                <button>
                    <FileText className="h-5 w-5" />
                </button>
            </div>
        ),
    },
]
