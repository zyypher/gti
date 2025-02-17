import { ColumnDef } from '@tanstack/react-table'
import { Edit, Trash } from 'lucide-react'

export interface IUser {
    id: string
    email: string
    role: string
    createdAt: string
}

export const columns: ColumnDef<IUser>[] = [
    {
        accessorKey: 'email',
        header: 'Email',
    },
    {
        accessorKey: 'role',
        header: 'Role',
    },
    {
        accessorKey: 'createdAt',
        header: 'Created At',
        cell: (cell) => {
            const date = cell.getValue() as string
            return new Date(date).toLocaleDateString()
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const user = row.original
            return (
                <div className="flex gap-3">
                    {/* Edit Button */}

                    <button
                        onClick={() =>
                            window.dispatchEvent(
                                new CustomEvent('openEditUser', {
                                    detail: user,
                                }),
                            )
                        }
                    >
                        <Edit className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() =>
                            window.dispatchEvent(
                                new CustomEvent('confirmDeleteUser', {
                                    detail: user.id,
                                }),
                            )
                        }
                    >
                        <Trash className="h-5 w-5" />
                    </button>
                </div>
            )
        },
    },
]
