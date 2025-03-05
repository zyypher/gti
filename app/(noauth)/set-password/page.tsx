'use client'

import React, { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '../../../lib/api'

export const dynamic = 'force-dynamic' // ✅ Prevents prerendering issues

function SetPasswordForm() {
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const handleSetPassword = async () => {
        if (!token) {
            toast.error('Invalid request')
            return
        }

        setLoading(true)
        try {
            await api.post('/api/auth/set-password', { token, password })
            toast.success('Password set successfully')
            router.push('/login')
        } catch (error) {
            toast.error('Failed to set password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto p-6 space-y-4">
            <h2 className="text-2xl font-bold">Set Password</h2>
            <input
                type="password"
                className="w-full p-2 border rounded"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button
                className="w-full bg-blue-500 text-white p-2 rounded"
                onClick={handleSetPassword}
                disabled={loading}
            >
                {loading ? 'Setting Password...' : 'Set Password'}
            </button>
        </div>
    )
}

export default function SetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SetPasswordForm />
        </Suspense>
    )
}
