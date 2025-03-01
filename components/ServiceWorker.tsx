'use client' // ✅ Mark this component as a Client Component

import { useEffect } from 'react'

export default function ServiceWorker() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/service-worker.js')
                .then((registration) => {
                    console.log('✅ Service Worker registered:', registration)
                })
                .catch((error) => {
                    console.error('❌ Service Worker registration failed:', error)
                })
        }
    }, [])

    return null // ✅ This component only runs the effect, nothing to render
}
