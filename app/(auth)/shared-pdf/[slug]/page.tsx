'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'

interface Product {
    id: string
    name: string
    brand: { name: string }
    size: string
    flavor: string
}

const SharedProductsPage = () => {
    const { slug } = useParams() as { slug: string }
    const [products, setProducts] = useState<Product[]>([])

    useEffect(() => {
        if (slug) {
            api.get(`/api/shared-pdf/${slug}`)
                .then((res) => setProducts(res.data.products))
                .catch(() => setProducts([]))
        }
    }, [slug])

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold">Shared Products</h1>
            {products.length > 0 ? (
                <ul>
                    {products.map((product) => (
                        <li key={product.id} className="border p-2 my-2">
                            <h2 className="text-lg font-semibold">{product.name}</h2>
                            <p>Brand: {product.brand.name}</p>
                            <p>Size: {product.size}</p>
                            <p>Flavor: {product.flavor}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No products found or link expired.</p>
            )}
        </div>
    )
}

export default SharedProductsPage
