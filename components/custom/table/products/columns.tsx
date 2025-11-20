import { ColumnDef } from '@tanstack/react-table'
import { Edit, Trash, ShoppingCart } from 'lucide-react'
import PDFDownloadButton from '../../PDFDownloadButton'
import { Role } from '@/hooks/useUserRole'
import { Skeleton } from '@/components/ui/skeleton'

export type ITable = {
    id: string
    name: string
    brand: { name: string; description: string | null; image?: string | null }
    image?: string
    size: string
    tar: string | number
    nicotine: string | number
    co: string | number
    flavor: string
    fsp: boolean | string | number
    corners?: string
    capsules: string | number
    packetStyle?: string
    color?: string
    pdfUrl?: string
    status?: string
}

export const columns = (
    role: Role | null,
    handleEdit: (item: ITable) => void,
    handleDelete: (id: string) => void,
    mediaLoading: boolean = false,
    onAddToCart?: (item: ITable) => void,
    isInCart?: (id: string) => boolean,
): ColumnDef<ITable>[] => [
        // 🛒 Cart column
        {
            id: 'cart',
            header: '',
            cell: ({ row }) => {
                const inCart = isInCart ? isInCart(row.original.id) : false

                return (
                    <button
                        type="button"
                        // 🔹 keep using the same handler – now it will toggle add/remove
                        onClick={() => onAddToCart?.(row.original)}
                        // 🔹 REMOVE disabled so it can be clicked again
                        className={`
          inline-flex h-8 w-8 items-center justify-center rounded-full border 
          transition-all duration-200
          ${inCart
                                // 🔹 still show red state, but keep it clickable (no cursor-not-allowed)
                                ? 'border-red-500 bg-red-500 text-white hover:bg-red-600 hover:border-red-600'
                                : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300'
                            }
        `}
                        aria-label={inCart ? 'Remove product from cart' : 'Add product to cart'}
                    >
                        <ShoppingCart className="h-4 w-4" />
                    </button>
                )
            },
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

                if (!imageUrl) {
                    if (mediaLoading) {
                        return <Skeleton className="h-12 w-12 rounded" />
                    }

                    return (
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200 text-[10px] text-gray-700">
                            No Image
                        </div>
                    )
                }

                return (
                    <img
                        src={imageUrl}
                        alt="Product Image"
                        className="h-12 w-12 rounded object-cover"
                    />
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
            header: 'Flavour',
            cell: ({ row }) => <div>{row.getValue('flavor')}</div>,
        },
        {
            accessorKey: 'fsp',
            header: 'FSP',
            cell: ({ row }) => {
                const raw = row.original.fsp

                const isFsp =
                    raw === true ||
                    raw === 1 ||
                    (typeof raw === 'string' &&
                        ['yes', 'true', '1'].includes(raw.trim().toLowerCase()))

                return (
                    <div className="flex items-center justify-start">
                        {isFsp ? 'Yes' : 'No'}
                    </div>
                )
            },
        },
        {
            accessorKey: 'packetStyle',
            header: 'Pack format',
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
            cell: ({ row }) => {
                if (!row.original.pdfUrl && mediaLoading) {
                    return <Skeleton className="h-8 w-24 rounded" />
                }

                return (
                    <PDFDownloadButton
                        productId={row.original.id}
                        productName={row.original.name}
                    />
                )
            },
        },
        {
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex space-x-2">
                    {role === 'ADMIN' && (
                        <>
                            <button onClick={() => handleEdit(row.original)}>
                                <Edit className="h-5 w-5" />
                            </button>
                            <button onClick={() => handleDelete(row.original.id)}>
                                <Trash className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>
            ),
        },
    ]
