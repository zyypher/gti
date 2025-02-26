'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    Bell,
    ChevronDown,
    Info,
    LogOut,
    Menu,
    UserCog,
} from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { logout } from '@/lib/auth'

const Header = () => {
    const router = useRouter()
    const pathName = usePathname()

    // ✅ State for user details and loading
    const [user, setUser] = useState<{ firstName: string; lastName: string } | null>(null)
    const [loading, setLoading] = useState(true)

    // ✅ Fetch user details
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/api/users/me')
                setUser(response.data)
            } catch (error) {
                console.error('Failed to fetch user data')
            } finally {
                setLoading(false) // ✅ Stop loading
            }
        }
        fetchUser()
    }, [])

    const handleLogout = async () => {
        await logout()
        router.push('/login') // Redirect to login page
    }

    // ✅ Extract initials for the user
    const getUserInitials = () => {
        if (user) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
        }
        return 'G' // Default for "Guest"
    }

    return (
        <header className="fixed inset-x-0 top-0 z-30 bg-white px-4 py-[15px] shadow-sm lg:px-5">
            <div className="flex items-center justify-between gap-5">
                <Link href="/" className="inline-block shrink-0 lg:ml-2.5">
                    <h2 className="text-lg font-bold text-black">Brand</h2>
                </Link>

                <div className="inline-flex items-center gap-3 sm:gap-5">
                    {/* 🔔 Notifications */}
                    <div className="order-2 lg:order-none">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="relative duration-300 hover:opacity-80"
                                >
                                    <Bell className="h-5 w-5" />
                                    <Badge
                                        variant={'primary'}
                                        size={'number'}
                                        className="absolute -right-0.5 -top-0.5 grid h-3 min-w-3 place-content-center px-1 text-[9px]"
                                    >
                                        3
                                    </Badge>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                sideOffset={12}
                                className="mr-4 w-full max-w-80 divide-y divide-gray-300 p-0"
                            >
                                <div className="rounded-t-lg bg-gray-100 p-3 text-black">
                                    <h2 className="font-semibold leading-5">Notifications</h2>
                                </div>
                                <div className="p-4 text-center">
                                    <Info className="mx-auto mb-2 h-8 w-8 text-gray-500" />
                                    <p className="text-sm text-gray-500">No notifications</p>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* ✅ User Dropdown with Skeleton Loader */}
                    <div className="hidden lg:block">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="group flex cursor-pointer items-center gap-2.5 rounded-lg">
                                    {loading ? (
                                        // 🟡 Skeleton Loader for profile
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                    ) : (
                                        // ✅ Profile Circle with Initials
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-sm font-bold">
                                            {getUserInitials()}
                                        </div>
                                    )}

                                    <div className="hidden space-y-1 lg:block">
                                        {loading ? (
                                            // 🟡 Skeleton Loader for name
                                            <>
                                                <Skeleton className="h-3 w-24 rounded" />
                                                <Skeleton className="h-4 w-28 rounded" />
                                            </>
                                        ) : (
                                            <>
                                                <h5 className="line-clamp-1 text-[10px]/3 font-semibold">
                                                    Welcome back 👋
                                                </h5>
                                                <h2 className="line-clamp-1 text-xs font-bold text-black">
                                                    {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
                                                </h2>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className="-ml-1 mt-auto text-black transition group-hover:opacity-70"
                                    >
                                        <ChevronDown className="h-4 w-4 shrink-0 duration-300" />
                                    </button>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                sideOffset={12}
                                className="min-w-[200px] space-y-1 rounded-lg p-1.5 text-sm font-medium"
                            >
                                <DropdownMenuItem className="p-0">
                                    <Link
                                        href="/setting"
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 ${pathName === '/setting' && '!bg-gray-400 !text-black'}`}
                                    >
                                        <UserCog className="size-[18px] shrink-0" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="p-0">
                                    <Link
                                        href="/login"
                                        onClick={handleLogout}
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 ${pathName === '/login' && '!bg-gray-400 !text-black'}`}
                                    >
                                        <LogOut className="size-[18px] shrink-0" />
                                        Sign out
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* ☰ Sidebar Toggle */}
                    <button
                        type="button"
                        className="order-3 duration-300 hover:opacity-80 lg:hidden"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    )
}

export default Header
