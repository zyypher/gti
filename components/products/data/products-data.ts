export type IProductTable = {
    id: string
    brand: string
    product: string
    size: string
    tar: string
    nicotine: string
    co: string
    flavor: string
    fsp: string
    corners: string
    capsules: string
}

export const productData: IProductTable[] = [
    {
        id: '#100001',
        brand: 'Milano',
        product: 'Milano Classic',
        size: 'King Size',
        tar: '8 mg',
        nicotine: '0.6 mg',
        co: '10 mg',
        flavor: 'Vanilla',
        fsp: 'Yes',
        corners: 'Rounded',
        capsules: '1',
    },
    {
        id: '#100002',
        brand: 'Cavallo',
        product: 'Cavallo Mint Chill',
        size: 'Slim',
        tar: '6 mg',
        nicotine: '0.5 mg',
        co: '8 mg',
        flavor: 'Mint',
        fsp: 'No',
        corners: 'Square',
        capsules: 'No Cap',
    },
    {
        id: '#100003',
        brand: 'Nond Alster',
        product: 'Alster Bold',
        size: 'Regular',
        tar: '10 mg',
        nicotine: '0.8 mg',
        co: '12 mg',
        flavor: 'Original',
        fsp: 'Yes',
        corners: 'Rounded',
        capsules: '2',
    },
    {
        id: '#100004',
        brand: 'Momento',
        product: 'Momento Smooth',
        size: 'King Size',
        tar: '9 mg',
        nicotine: '0.7 mg',
        co: '11 mg',
        flavor: 'Berry',
        fsp: 'No',
        corners: 'Square',
        capsules: '1',
    },
]
