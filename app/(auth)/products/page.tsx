'use client'
import { Suspense } from 'react'
import Products from './Products'

export default function ProductsPageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Products />
        </Suspense>
    )
}
