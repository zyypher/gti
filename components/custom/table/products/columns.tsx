import { Checkbox } from '@/components/ui/checkbox'
import { ColumnDef } from '@tanstack/react-table'
import { Edit, Trash } from 'lucide-react'
import PDFDownloadButton from '../../PDFDownloadButton'

export type ITable = {
    id: string
    name: string
    brand: { name: string; description: string | null; image: string | null }
    image: string
    size: string
    tar: string
    nicotine: string
    co: string
    flavor: string
    fsp: string
    corners: string
    capsules: string
    packetStyle?: string
    color?: string
    pdfUrl?: string
}

export const columns = (
    handleEdit: (item: ITable) => void,
    handleDelete: (id: string) => void,
): ColumnDef<ITable>[] => [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                className="h-3 w-3 scale-150"
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
                className="h-3 w-3 scale-150"
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
        cell: ({ row }) => <div>{row.original.brand.name}</div>,
    },
    {
        accessorKey: 'name',
        header: 'Product Name',
        cell: ({ row }) => <div>{row.getValue('name')}</div>,
    },
    {
        accessorKey: 'image',
        header: 'Image',
        cell: ({ row }) => {
            const imageUrl = row.original.image
            return imageUrl ? (
                <img
                    src={imageUrl}
                    alt="Product Image"
                    className="h-12 w-12 rounded object-cover"
                />
            ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200 text-sm text-gray-700">
                    No Image
                </div>
            )
        },
    },
    {
        accessorKey: 'size',
        header: 'Stick Format',
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
        cell: ({ row }) => {
            const fspValue = String(row.getValue('fsp')).trim().toLowerCase()
            return (
                <div className="flex items-center justify-center">
                    {fspValue === 'yes' ? 'Yes' : 'No'}
                </div>
            )
        },
    },
    // {
    //     accessorKey: 'corners',
    //     header: 'Corners',
    //     cell: ({ row }) => <div>{row.getValue('corners')}</div>,
    // },
    {
        accessorKey: 'packetStyle',
        header: 'Packet type',
        cell: ({ row }) => <div>{row.getValue('packetStyle')}</div>,
    },
    {
        accessorKey: 'color',
        header: 'Color',
        cell: ({ row }) => <div>{row.getValue('color')}</div>,
    },
    {
        accessorKey: 'capsules',
        header: 'Capsules',
        cell: ({ row }) => <div>{row.getValue('capsules')}</div>,
    },
    {
        accessorKey: 'pdfContent',
        header: 'PDF',
        cell: ({ row }) => (
            <PDFDownloadButton
                productId={row.original.id}
                productName={row.original.name}
            />
        ),
    },
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
            </div>
        ),
    },
]
