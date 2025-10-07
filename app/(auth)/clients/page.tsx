'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import PageHeading from '@/components/layout/page-heading'
import { useUserRole } from '@/hooks/useUserRole'
import { DataTable } from '@/components/custom/table/data-table'
import { Client, columns } from '@/components/custom/table/clients/columns'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { countryData } from '@/lib/country-data'

type FormData = {
    firstName: string
    lastName: string
    company: string
    primaryNumber: string
    secondaryNumber?: string
    country: string
    nickname: string
}

const ClientsPage = () => {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const role = useUserRole()

    const {
        control,
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            firstName: '',
            lastName: '',
            company: '',
            primaryNumber: '',
            secondaryNumber: '',
            country: 'United Arab Emirates',
            nickname: '',
        },
    })

    const fetchClients = async () => {
        setLoading(true)
        try {
            const response = await api.get('/api/clients')
            setClients(response.data)
        } catch (error) {
            toast.error('Failed to load clients')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchClients()
    }, [])

    const handleOpenDialog = (client: Client | null = null) => {
        setSelectedClient(client)
        if (client) {
            reset(client)
        } else {
            reset({
                firstName: '',
                lastName: '',
                company: '',
                primaryNumber: '',
                secondaryNumber: '',
                country: 'United Arab Emirates',
                nickname: '',
            })
        }
        setIsDialogOpen(true)
    }

    const handleOpenDeleteDialog = (id: string) => {
        setDeleteId(id)
        setIsDeleteDialogOpen(true)
    }

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true)
        try {
            if (selectedClient) {
                await api.put(`/api/clients/${selectedClient.id}`, data)
                toast.success('Client updated successfully')
            } else {
                await api.post('/api/clients', data)
                toast.success('Client added successfully')
            }
            setIsDialogOpen(false)
            fetchClients()
        } catch (error) {
            toast.error('An error occurred')
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        setIsSubmitting(true)
        try {
            await api.delete(`/api/clients/${deleteId}`)
            toast.success('Client deleted successfully')
            setIsDeleteDialogOpen(false)
            fetchClients()
        } catch (error) {
            toast.error('Failed to delete client')
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const tableColumns = columns(handleOpenDialog, handleOpenDeleteDialog, role)

    return (
        <div className="space-y-6">
            {/* Header + action */}
            <div className="flex items-center justify-between">
                <PageHeading heading="Clients" />
                {role === 'ADMIN' && (
                    <Button
                        variant="black"
                        onClick={() => handleOpenDialog(null)}
                        className="rounded-xl px-4 py-2 shadow-sm transition hover:shadow-md"
                    >
                        Add Client
                    </Button>
                )}
            </div>

            {/* Soft glass wrapper for table */}
            <div className="rounded-2xl border border-white/50 bg-white/70 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <DataTable<Client>
                    columns={tableColumns}
                    data={clients}
                    filterField="nickname"
                    loading={loading}
                />
            </div>

            {/* Add/Edit Client */}
            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={selectedClient ? 'Edit Client' : 'Add Client'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 backdrop-blur">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-700">First Name</label>
                                <Input
                                    placeholder="First Name"
                                    className="rounded-xl border border-zinc-300 bg-white text-black placeholder:text-black/70 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
                                    {...register('firstName', { required: 'First name is required' })}
                                />
                                {errors.firstName && (
                                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-700">Last Name</label>
                                <Input
                                    placeholder="Last Name"
                                    className="rounded-xl border border-zinc-300 bg-white text-black placeholder:text-black/70 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
                                    {...register('lastName', { required: 'Last name is required' })}
                                />
                                {errors.lastName && (
                                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-700">Company</label>
                                <Input
                                    placeholder="Company"
                                    className="rounded-xl border border-zinc-300 bg-white text-black placeholder:text-black/70 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
                                    {...register('company', { required: 'Company is required' })}
                                />
                                {errors.company && (
                                    <p className="text-sm text-red-500">{errors.company.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-700">Nickname</label>
                                <Input
                                    placeholder="Nickname"
                                    className="rounded-xl border border-zinc-300 bg-white text-black placeholder:text-black/70 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
                                    {...register('nickname', { required: 'Nickname is required' })}
                                />
                                {errors.nickname && (
                                    <p className="text-sm text-red-500">{errors.nickname.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-700">Primary Number</label>
                                <Controller
                                    name="primaryNumber"
                                    control={control}
                                    rules={{ required: 'Primary number is required' }}
                                    render={({ field }) => (
                                        <PhoneInput
                                            international
                                            defaultCountry="AE"
                                            placeholder="Enter primary number"
                                            value={field.value}
                                            onChange={field.onChange}
                                            onCountryChange={(country) => {
                                                if (country) {
                                                    const countryInfo = countryData.find((c) => c.code === country)
                                                    if (countryInfo) setValue('country', countryInfo.name)
                                                }
                                            }}
                                            inputComponent={Input as any}
                                            /* visual polish */
                                            className="rounded-xl"
                                        />
                                    )}
                                />
                                {errors.primaryNumber && (
                                    <p className="text-sm text-red-500">{errors.primaryNumber.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-700">Secondary Number (Optional)</label>
                                <Controller
                                    name="secondaryNumber"
                                    control={control}
                                    render={({ field }) => (
                                        <PhoneInput
                                            international
                                            defaultCountry="AE"
                                            placeholder="Enter secondary number"
                                            value={field.value}
                                            onChange={field.onChange}
                                            inputComponent={Input as any}
                                            className="rounded-xl"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="black"
                            disabled={isSubmitting}
                            className="rounded-xl px-5"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    </div>
                </form>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                title="Confirm Deletion"
            >
                <div className="space-y-6">
                    <p className="text-sm text-zinc-700">
                        Are you sure you want to delete this client? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button
                            variant="black"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="rounded-xl"
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default ClientsPage
