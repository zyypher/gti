'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';

interface Product {
    id: string;
    name: string;
    brand: { name: string };
    size: string;
    flavor: string;
}

const SharedProductsPage = () => {
    const router = useRouter();
    const { slug } = router.query;
    const [products, setProducts] = useState<Product[]>([]); // ✅ Define type

    useEffect(() => {
        if (slug) {
            api.get(`/api/shared-pdf/${slug}`) // ✅ Fixed template string
                .then((res) => setProducts(res.data.products))
                .catch(() => setProducts([]));
        }
    }, [slug]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold">Shared Products</h1>
            {products.length > 0 ? (
                <ul>
                    {products.map((product) => (
                        <li key={product.id} className="border p-2 my-2">
                            <h2 className="text-lg font-semibold">{product.name}</h2>
                            <p>Brand: {product.brand?.name || 'N/A'}</p>
                            <p>Stick Format: {product.size || 'N/A'}</p>
                            <p>Flavor: {product.flavor || 'N/A'}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No products found or link expired.</p>
            )}
        </div>
    );
};

export default SharedProductsPage;
