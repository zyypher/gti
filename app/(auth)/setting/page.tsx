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
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
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

  // load user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/api/users/me')
        setUser(response.data)
      } catch {
        toast.error('Failed to fetch user data')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  // profile update
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
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  // password update
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
      toast.error((error as any)?.response?.data?.error || 'Failed to update password')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <Card className="rounded-2xl border border-white/30 bg-white/60 p-0 backdrop-blur-xl">
          <CardHeader className="border-b border-white/40 bg-white/70 px-5 py-4">
            <Skeleton className="h-6 w-40 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeading heading="Settings" />

      <div className="min-h-[calc(100vh_-_160px)] w-full">
        <Tabs defaultValue="my-profile">
          {/* segmented control */}
          <TabsList className="mb-5 w-fit rounded-2xl border border-white/30 bg-white/60 p-1 backdrop-blur-xl shadow-sm">
            <div className="inline-flex gap-1 p-1 text-sm font-semibold">
              <TabsTrigger
                value="my-profile"
                className="rounded-xl px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white"
              >
                My Profile
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="rounded-xl px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white"
              >
                Password
              </TabsTrigger>
            </div>
          </TabsList>

          {/* Profile */}
          <TabsContent value="my-profile" className="font-medium text-black">
            <Card className="rounded-2xl border border-white/30 bg-white/60 backdrop-blur-xl">
              <CardHeader className="space-y-1.5 border-b border-white/40 bg-white/70 px-5 py-4 text-base/5 font-semibold text-black">
                <h3>Personal Info</h3>
              </CardHeader>

              <CardContent>
                <form className="grid grid-cols-1 gap-5 p-4 md:grid-cols-2">
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      First name
                    </label>
                    <Input
                      type="text"
                      value={user.firstName}
                      onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                      iconLeft={<User className="size-4" />}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Last name
                    </label>
                    <Input
                      type="text"
                      value={user.lastName}
                      onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                      iconLeft={<User className="size-4" />}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Email address
                    </label>
                    <Input
                      type="text"
                      value={user.email}
                      onChange={(e) => setUser({ ...user, email: e.target.value })}
                      iconLeft={<Mail className="size-4" />}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Phone number
                    </label>
                    <Input
                      type="tel"
                      value={user.phoneNumber}
                      onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })}
                      iconLeft={<Phone className="size-4" />}
                    />
                  </div>

                  <div className="col-span-full !mt-3 flex items-center justify-end">
                    <Button variant="black" onClick={handleUpdateProfile} disabled={isSubmitting}>
                      {isSubmitting ? 'Updating...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password */}
          <TabsContent value="password" className="mx-auto w-full max-w-[566px] font-medium text-black">
            <Card className="rounded-2xl border border-white/30 bg-white/60 backdrop-blur-xl">
              <CardHeader className="space-y-1.5 border-b border-white/40 bg-white/70 px-5 py-4 text-base/5 font-semibold text-black">
                <h3>Update Password</h3>
              </CardHeader>

              <CardContent>
                <form className="space-y-5 p-4" onSubmit={handleSubmit(handleUpdatePassword)}>
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Current Password
                    </label>
                    <Input type="password" {...register('currentPassword')} iconLeft={<LockKeyhole className="size-4" />} />
                    {errors.currentPassword && (
                      <p className="text-sm text-red-500">{String(errors.currentPassword?.message)}</p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      New Password
                    </label>
                    <Input type="password" {...register('newPassword')} iconLeft={<LockKeyholeOpen className="size-4" />} />
                    {errors.newPassword && (
                      <p className="text-sm text-red-500">{String(errors.newPassword?.message)}</p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Confirm New Password
                    </label>
                    <Input type="password" {...register('confirmPassword')} iconLeft={<LockKeyholeOpen className="size-4" />} />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">{String(errors.confirmPassword?.message)}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-4">
                    <Button type="submit" variant="black" disabled={isSubmitting}>
                      {isSubmitting ? 'Updating...' : 'Update Password'}
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
