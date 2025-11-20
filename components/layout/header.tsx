'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown, Info, LogOut, Menu, UserCog } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
    const CART_KEY = 'gti-products-cart'

    const [user, setUser] = useState<{ firstName: string; lastName: string; email: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [notifications, setNotifications] = useState<
        { id: string; message: string; createdAt: string; isRead: boolean }[]
    >([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loadingNotifications, setLoadingNotifications] = useState(true)
    const [displayName, setDisplayName] = useState<string | null>(null)

    const subscribeToPush = async (userId: string) => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
        try {
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') return
            const registration = await navigator.serviceWorker.ready
            const existing = await registration.pushManager.getSubscription()
            if (!existing) {
                const sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
                })
                await api.post('/api/subscribe', { userId, subscription: sub })
            }
        } catch (e) {
            console.error('Push subscription failed:', e)
        }
    }

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/api/users/me')
                if (res.data?.id) subscribeToPush(res.data.id)
                setUser(res.data)
            } catch {
                console.error('Failed to fetch user data')
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [])

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/api/notifications')
                setNotifications(res.data.notifications)
                setUnreadCount(res.data.unreadCount)
            } catch (e) {
                console.error('Failed to fetch notifications:', e)
            } finally {
                setLoadingNotifications(false)
            }
        }
        fetchNotifications()
    }, [])

    useEffect(() => {
        if (user?.firstName || user?.lastName) {
            setDisplayName(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim())
        } else if (user?.email === 'admin@gulbahartobacco.com') {
            setDisplayName('Admin')
        } else {
            setDisplayName('Sales User')
        }
    }, [user])

    const markNotificationsAsRead = async () => {
        if (unreadCount === 0) return
        try {
            await api.patch('/api/notifications')
            setUnreadCount(0)
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        } catch (e) {
            console.error('Failed to mark notifications as read:', e)
        }
    }

    const handleLogout = async () => {
        await logout()
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(CART_KEY)
        }
        router.push('/login')
    }

    const getUserInitials = () => {
        if (user && (user?.firstName || user?.lastName)) {
            return `${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}`.toUpperCase()
        }
        return 'G'
    }

    const toggleSidebar = () => {
        document.getElementById('sidebar')?.classList.add('open')
        document.getElementById('overlay')?.classList.add('open')
    }

    return (
        // fixed height = 64px (h-16) to align with sidebar/top offsets
        <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-black/5 bg-white/90 backdrop-blur">
            <div className="flex h-full items-center justify-between gap-5 px-4 lg:px-5">
                <Link href="/" className="inline-block shrink-0 lg:ml-2.5">
                    <img src="/images/gulbahar-logo.png" alt="Brand Logo" className="h-9 w-auto" />
                </Link>

                <div className="inline-flex items-center gap-3 sm:gap-5">
                    {/* Notifications */}
                    <div className="order-2 lg:order-none">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button type="button" className="relative transition-opacity hover:opacity-80">
                                    <Bell className="h-5 w-5" />
                                    {unreadCount > 0 && (
                                        <Badge
                                            variant="primary"
                                            size="number"
                                            className="absolute -right-0.5 -top-0.5 grid h-3 min-w-3 place-content-center px-1 text-[9px]"
                                        >
                                            {unreadCount}
                                        </Badge>
                                    )}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                sideOffset={12}
                                className="mr-4 flex w-full max-w-80 max-h-[60vh] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-0 shadow-lg"
                                onOpenAutoFocus={markNotificationsAsRead}
                            >
                                <div className="bg-gray-50 p-3 text-black">
                                    <h2 className="font-semibold leading-5">Notifications</h2>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                    {loadingNotifications ? (
                                        <Skeleton className="h-10 w-full rounded-md" />
                                    ) : notifications.length === 0 ? (
                                        <div className="text-center">
                                            <Info className="mx-auto mb-2 h-8 w-8 text-gray-500" />
                                            <p className="text-sm text-gray-500">No notifications</p>
                                        </div>
                                    ) : (
                                        <ul className="space-y-2">
                                            {notifications.map(n => (
                                                <li
                                                    key={n.id}
                                                    className={`rounded p-2 ${n.isRead ? 'bg-gray-100' : 'bg-white'
                                                        }`}
                                                >
                                                    <p className="text-sm text-gray-800">{n.message}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(n.createdAt).toLocaleString()}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Profile */}
                    <div className="hidden lg:block">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="group flex cursor-pointer items-center gap-2.5 rounded-lg">
                                    {loading ? (
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                                            {getUserInitials()}
                                        </div>
                                    )}

                                    <div className="hidden space-y-1 lg:block">
                                        {loading ? (
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
                                                    {displayName}
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
                                    <Link href="/setting" className="flex items-center gap-1.5 rounded-lg px-3 py-2">
                                        <UserCog className="size-[18px] shrink-0" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="p-0">
                                    <Link
                                        href="/login"
                                        onClick={handleLogout}
                                        className="flex items-center gap-1.5 rounded-lg px-3 py-2"
                                    >
                                        <LogOut className="size-[18px] shrink-0" />
                                        Sign out
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Mobile menu */}
                    <button type="button" className="lg:hidden" onClick={toggleSidebar}>
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    )
}

export default Header
