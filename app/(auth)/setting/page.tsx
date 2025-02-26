'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import PageHeading from '@/components/layout/page-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LockKeyhole, LockKeyholeOpen, Mail, Phone, User } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const passwordSchema = z
    .object({
        currentPassword: z.string().min(6, 'Current password is required'),
        newPassword: z
            .string()
            .min(6, 'New password must be at least 6 characters'),
        confirmPassword: z.string().min(6, 'Confirm password is required'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    })

export default function Setting() {
    const [user, setUser] = useState({
        id: '',
        email: '',
        phoneNumber: '',
        firstName: '',
        lastName: '',
    })
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(passwordSchema),
    })

    // ✅ Fetch user data on page load
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/api/users/me')
                setUser(response.data)
            } catch (error) {
                toast.error('Failed to fetch user data')
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [])

    // ✅ Handle profile update
    const handleUpdateProfile = async () => {
        setIsSubmitting(true)
        try {
            await api.patch('/api/users/me', {
                email: user.email,
                phoneNumber: user.phoneNumber,
                firstName: user.firstName,
                lastName: user.lastName,
            })
            toast.success('Profile updated successfully')
        } catch (error) {
            toast.error('Failed to update profile')
        } finally {
            setIsSubmitting(false)
        }
    }

    // ✅ Handle password update
    const handleUpdatePassword = async (data: any) => {
        setIsSubmitting(true)
        try {
            await api.patch('/api/users/me/password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            })
            toast.success('Password updated successfully')
            reset()
        } catch (error) {
            toast.error(
                (error as any)?.response?.data?.error ||
                    'Failed to update password',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 p-4">
                <Skeleton className="h-8 w-32" /> {/* Simulating Page Heading */}

                {/* Tabs Skeleton */}
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32 rounded-md" />
                    <Skeleton className="h-10 w-32 rounded-md" />
                </div>

                {/* Card Skeleton */}
                <Card>
                    <CardHeader className="border-b bg-gray-100 px-5 py-4">
                        <Skeleton className="h-6 w-40" /> {/* Simulating Title */}
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {/* Input Fields */}
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />

                        {/* Button Skeleton */}
                        <div className="flex justify-end">
                            <Skeleton className="h-10 w-32 rounded-md" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <PageHeading heading="Settings" />

            <div className="min-h-[calc(100vh_-_160px)] w-full rounded-lg">
                <Tabs defaultValue="my-profile">
                    <TabsList className="mb-5 overflow-x-auto rounded-lg bg-white shadow-sm">
                        <div className="inline-flex gap-2.5 px-5 py-[11px] text-sm/[18px] font-semibold">
                            <TabsTrigger
                                value="my-profile"
                                className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white"
                            >
                                My Profile
                            </TabsTrigger>
                            <TabsTrigger
                                value="password"
                                className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white"
                            >
                                Password
                            </TabsTrigger>
                        </div>
                    </TabsList>

                    {/* ✅ Profile Update Form */}
                    <TabsContent
                        value="my-profile"
                        className="font-medium text-black"
                    >
                        <Card>
                            <CardHeader className="space-y-1.5 border-b border-gray-300 bg-gray-100 px-5 py-4 text-base/5 font-semibold text-black">
                                <h3>Personal Info</h3>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-5 p-4">
                                    <div className="space-y-2.5">
                                        <label className="font-semibold leading-tight">
                                            First name
                                        </label>
                                        <Input
                                            type="text"
                                            value={user.firstName}
                                            onChange={(e) =>
                                                setUser({
                                                    ...user,
                                                    firstName: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="font-semibold leading-tight">
                                            Last name
                                        </label>
                                        <Input
                                            type="text"
                                            value={user.lastName}
                                            onChange={(e) =>
                                                setUser({
                                                    ...user,
                                                    lastName: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="font-semibold leading-tight">
                                            Email address
                                        </label>
                                        <Input
                                            type="text"
                                            value={user.email}
                                            onChange={(e) =>
                                                setUser({
                                                    ...user,
                                                    email: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="font-semibold leading-tight">
                                            Phone number
                                        </label>
                                        <Input
                                            type="tel"
                                            value={user.phoneNumber}
                                            onChange={(e) =>
                                                setUser({
                                                    ...user,
                                                    phoneNumber: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="!mt-7 flex items-center justify-end gap-4">
                                        <Button
                                            variant="black"
                                            onClick={handleUpdateProfile}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting
                                                ? 'Updating...'
                                                : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ✅ Password Update Form */}
                    <TabsContent
                        value="password"
                        className="mx-auto w-full max-w-[566px] font-medium text-black"
                    >
                        <Card>
                            <CardHeader className="space-y-1.5 border-b border-gray-300 bg-gray-100 px-5 py-4 text-base/5 font-semibold text-black">
                                <h3>Update Password</h3>
                            </CardHeader>
                            <CardContent>
                                <form
                                    className="space-y-5 p-4"
                                    onSubmit={handleSubmit(
                                        handleUpdatePassword,
                                    )}
                                >
                                    <div className="space-y-2.5">
                                        <label className="font-semibold leading-tight">
                                            Current Password
                                        </label>
                                        <Input
                                            type="password"
                                            {...register('currentPassword')}
                                            iconLeft={
                                                <LockKeyhole className="size-4" />
                                            }
                                        />
                                        {errors.currentPassword && (
                                            <p className="text-sm text-red-500">
                                                {String(
                                                    errors.confirmPassword
                                                        ?.message,
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="font-semibold leading-tight">
                                            New Password
                                        </label>
                                        <Input
                                            type="password"
                                            {...register('newPassword')}
                                            iconLeft={
                                                <LockKeyholeOpen className="size-4" />
                                            }
                                        />
                                        {errors.newPassword && (
                                            <p className="text-sm text-red-500">
                                                {String(
                                                    errors.newPassword?.message,
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="font-semibold leading-tight">
                                            Confirm New Password
                                        </label>
                                        <Input
                                            type="password"
                                            {...register('confirmPassword')}
                                            iconLeft={
                                                <LockKeyholeOpen className="size-4" />
                                            }
                                        />
                                        {errors.confirmPassword && (
                                            <p className="text-sm text-red-500">
                                                {String(
                                                    errors.confirmPassword
                                                        ?.message,
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-end gap-4">
                                        <Button
                                            type="submit"
                                            variant="black"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting
                                                ? 'Updating...'
                                                : 'Update Password'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
