'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Edit, Trash } from 'lucide-react'
import { Role } from '@/hooks/useUserRole'

export type Client = {
    id: string
    firstName: string
    lastName: string
    company: string
    primaryNumber: string
    secondaryNumber: string
    country: string
    email: string
}

export const columns = (
    onEdit: (client: Client) => void,
    onDelete: (id: string) => void,
    role: Role | null,
): ColumnDef<Client>[] => [
    {
        accessorKey: 'email',
        header: 'Email',
    },
    {
        accessorKey: 'firstName',
        header: 'First Name',
    },
    {
        accessorKey: 'lastName',
        header: 'Last Name',
    },
    {
        accessorKey: 'company',
        header: 'Company',
    },
    {
        accessorKey: 'primaryNumber',
        header: 'Phone Number',
    },
    {
        accessorKey: 'country',
        header: 'Country',
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const client = row.original

            return (
                <div className="flex gap-3">
                    {role === 'ADMIN' && (
                        <>
                            <button onClick={() => onEdit(client)}>
                                <Edit className="h-5 w-5" />
                            </button>
                            <button onClick={() => onDelete(client.id)}>
                                <Trash className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>
            )
        },
    },
] 