'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/custom/table/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { columns } from '@/components/custom/table/users/columns'
import PageHeading from '@/components/layout/page-heading'
import { useUserRole } from '@/hooks/useUserRole'

type User = {
    id: string
    email: string
    role: string
    createdAt: string
}

const UsersPage = () => {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<string | null>(null)
    const [buttonLoading, setButtonLoading] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const role = useUserRole()

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm()

    useEffect(() => {
        fetchUsers()

        // Handle edit event
        const editHandler = (event: CustomEvent) => openEditModal(event.detail)
        const deleteHandler = (event: CustomEvent) =>
            openDeleteDialog(event.detail)

        window.addEventListener('openEditUser', editHandler as EventListener)
        window.addEventListener(
            'confirmDeleteUser',
            deleteHandler as EventListener,
        )

        return () => {
            window.removeEventListener(
                'openEditUser',
                editHandler as EventListener,
            )
            window.removeEventListener(
                'confirmDeleteUser',
                deleteHandler as EventListener,
            )
        }
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const response = await api.get('/api/users')
            setUsers(response.data)
        } catch (error) {
            toast.error('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const handleAddUser = async (data: any) => {
        setButtonLoading(true)
        try {
            const response = await api.post('/api/users', data)
            if (response.status === 201) {
                toast.success('User added successfully')
                reset()
                setIsDialogOpen(false)
                fetchUsers()
            } else {
                toast.error('Failed to add user')
            }
        } catch (error) {
            toast.error('Error adding user')
            console.error(error)
        } finally {
            setButtonLoading(false)
        }
    }

    const handleDeleteUser = async () => {
        if (!userToDelete) return
        try {
            await api.delete(`/api/users/${userToDelete}`)
            toast.success('User deleted successfully')
            fetchUsers()
        } catch (error) {
            toast.error('Failed to delete user')
        } finally {
            setDeleteDialogOpen(false)
            setUserToDelete(null)
        }
    }

    const openEditModal = (user: User) => {
        setSelectedUser(user)
        setValue('email', user.email)
        setValue('role', user.role)
        setIsDialogOpen(true)
    }

    const openDeleteDialog = (id: string) => {
        setUserToDelete(id)
        setDeleteDialogOpen(true)
    }

    return (
        <div className="space-y-4">
            <PageHeading heading="Users" />
            <div className="flex items-center justify-end">
                {role === 'ADMIN' && (
                    <Button
                        variant="black"
                        onClick={() => setIsDialogOpen(true)}
                    >
                        <Plus className="mr-2" />
                        Add User
                    </Button>
                )}
            </div>

            <DataTable
                columns={columns(role)}
                data={users}
                filterField="email"
                loading={loading}
            />

            {/* Add/Edit User Dialog */}
            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={selectedUser ? 'Edit User' : 'Add User'}
                onSubmit={handleSubmit(handleAddUser)}
                buttonLoading={buttonLoading}
            >
                <div className="space-y-4">
                    <Input
                        placeholder="Enter email"
                        {...register('email', {
                            required: 'Email is required',
                        })}
                    />
                    {errors.email && (
                        <p className="text-red-500">
                            {String(errors.email.message)}
                        </p>
                    )}

                    <select
                        className="w-full rounded border p-2"
                        {...register('role', { required: 'Role is required' })}
                    >
                        <option value="">Select Role</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SALESPERSON">Salesperson</option>
                    </select>
                    {errors.role && (
                        <p className="text-red-500">
                            {String(errors.role.message)}
                        </p>
                    )}
                </div>
            </Dialog>


            {/* Delete Confirmation Dialog */}
            <Dialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                title="Confirm Delete"
                onSubmit={handleDeleteUser}
                buttonLoading={buttonLoading}
            >
                <div className="text-center text-lg font-semibold">
                    Are you sure you want to delete this user?
                </div>
            </Dialog>
        </div>
    )
}

export default UsersPage
