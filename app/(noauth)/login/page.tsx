'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AtSign } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'
import routes from '@/lib/routes'
import api from '@/lib/api'
import { toast } from 'react-hot-toast'


const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function Login() {
    const router = useRouter()
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const [loading, setLoading] = useState(false)

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true)
        try {
            const response = await api.post(routes.login, data)
            toast.success('Login Successful!')
            router.push('/')
        } catch (error: any) {
        } finally {
            setLoading(false)
        }
    }
    
    return (
        <div className="grid h-screen w-full gap-5 p-4 md:grid-cols-2">
            <div className="relative hidden overflow-hidden rounded-[20px] bg-[#3B06D2] p-4 md:block md:h-full">
                <Image
                    src="/images/gulbahar-logodark.svg"
                    width={145}
                    height={34}
                    alt="Logo"
                    className="absolute left-4 top-4 z-10 h-auto w-auto"
                />
                <Image
                    src="/images/login-cover-step.svg"
                    width={240}
                    height={240}
                    alt="Logo Cover Step"
                    className="absolute left-0 top-0.5 size-40 md:h-auto md:w-auto"
                />
                <Image
                    src="/images/login-cover-cartoon.svg"
                    width={145}
                    height={34}
                    alt="Logo Cover Cartoon"
                    className="absolute bottom-0 left-0 right-0 h-52 w-full md:h-96"
                />
                <div className="absolute left-1/2 top-1/4 w-full max-w-md -translate-x-1/2 space-y-3 px-3 text-center text-white">
                    <h2 className="text-lg font-bold sm:text-2xl lg:text-[30px]/9">
                        Drive your sales. Power your business.
                    </h2>
                    <p className="text-sm lg:text-xl/[30px]">
                        Track performance, optimize sales, and achieve
                        excellence.
                    </p>
                </div>
            </div>
            <div className="flex overflow-y-auto py-2">
                <Card className="m-auto w-full max-w-[400px] space-y-[30px] p-5 shadow-sm md:w-[400px]">
                    <CardHeader className="space-y-2">
                        <h2 className="text-lg font-semibold text-black lg:text-xl/tight">
                            Sign In to your account
                        </h2>
                        <p className="font-medium leading-tight">
                            Enter your details to proceed.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="space-y-[20px]"
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            <div className="space-y-2">
                                <label className="block font-semibold text-black">
                                    Email address
                                </label>
                                <Input
                                    type="email"
                                    placeholder="username@domain.com"
                                    iconRight={
                                        <AtSign className="size-[18px]" />
                                    }
                                    {...register('email')}
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-sm">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block font-semibold text-black">
                                    Password
                                </label>
                                <Input
                                    type="password"
                                    placeholder="********"
                                    {...register('password')}
                                />
                                {errors.password && (
                                    <p className="text-red-500 text-sm">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                variant="black"
                                size="large"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="loader" />
                                ) : (
                                    'Login'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
