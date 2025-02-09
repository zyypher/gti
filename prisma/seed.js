const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    // Seed brands
    await prisma.brand.createMany({
        data: [
            { name: 'Milano', description: 'Premium brand' },
            { name: 'Cavallo', description: 'Cool and minty' },
            { name: 'Mondal', description: 'Strong and bold' },
            { name: 'Momento', description: 'Smooth and relaxing' },
        ],
    })

    console.log('Brands seeded')

    // Retrieve brand IDs
    const brandRecords = await prisma.brand.findMany()
    const brandMap = {}
    brandRecords.forEach((brand) => {
        brandMap[brand.name] = brand.id
    })

    // Seed products
    await prisma.product.createMany({
        data: [
            {
                name: 'Milano Classic',
                brandId: brandMap['Milano'],
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
                name: 'Cavallo Mint Chill',
                brandId: brandMap['Cavallo'],
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
                name: 'Mondal Bold',
                brandId: brandMap['Mondal'],
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
                name: 'Momento Smooth',
                brandId: brandMap['Momento'],
                size: 'King Size',
                tar: '9 mg',
                nicotine: '0.7 mg',
                co: '11 mg',
                flavor: 'Berry',
                fsp: 'No',
                corners: 'Square',
                capsules: '1',
            },
            {
                name: 'Milano Gold',
                brandId: brandMap['Milano'],
                size: 'Slim',
                tar: '7 mg',
                nicotine: '0.5 mg',
                co: '9 mg',
                flavor: 'Citrus',
                fsp: 'No',
                corners: 'Rounded',
                capsules: 'No Cap',
            },
            {
                name: 'Cavallo Ice',
                brandId: brandMap['Cavallo'],
                size: 'Regular',
                tar: '5 mg',
                nicotine: '0.4 mg',
                co: '7 mg',
                flavor: 'Ice Mint',
                fsp: 'Yes',
                corners: 'Square',
                capsules: '1',
            },
            {
                name: 'Mondal Dark',
                brandId: brandMap['Mondal'],
                size: 'King Size',
                tar: '12 mg',
                nicotine: '0.9 mg',
                co: '13 mg',
                flavor: 'Strong Tobacco',
                fsp: 'Yes',
                corners: 'Rounded',
                capsules: '1',
            },
            {
                name: 'Momento Light',
                brandId: brandMap['Momento'],
                size: 'Slim',
                tar: '6 mg',
                nicotine: '0.5 mg',
                co: '9 mg',
                flavor: 'Lavender',
                fsp: 'No',
                corners: 'Square',
                capsules: 'No Cap',
            },
            {
                name: 'Milano Fresh',
                brandId: brandMap['Milano'],
                size: 'Regular',
                tar: '7 mg',
                nicotine: '0.6 mg',
                co: '10 mg',
                flavor: 'Peppermint',
                fsp: 'Yes',
                corners: 'Rounded',
                capsules: '1',
            },
            {
                name: 'Cavallo Frost',
                brandId: brandMap['Cavallo'],
                size: 'King Size',
                tar: '6 mg',
                nicotine: '0.5 mg',
                co: '8 mg',
                flavor: 'Spearmint',
                fsp: 'No',
                corners: 'Square',
                capsules: 'No Cap',
            },
            {
                name: 'Mondal Stronghold',
                brandId: brandMap['Mondal'],
                size: 'King Size',
                tar: '12 mg',
                nicotine: '0.9 mg',
                co: '14 mg',
                flavor: 'Bold Tobacco',
                fsp: 'Yes',
                corners: 'Rounded',
                capsules: '2',
            },
            {
                name: 'Momento Dream',
                brandId: brandMap['Momento'],
                size: 'Slim',
                tar: '5 mg',
                nicotine: '0.4 mg',
                co: '7 mg',
                flavor: 'Peach',
                fsp: 'Yes',
                corners: 'Rounded',
                capsules: '1',
            },
            {
                name: 'Milano Velvet',
                brandId: brandMap['Milano'],
                size: 'Slim',
                tar: '6 mg',
                nicotine: '0.4 mg',
                co: '9 mg',
                flavor: 'Blueberry',
                fsp: 'No',
                corners: 'Square',
                capsules: 'No Cap',
            },
            {
                name: 'Cavallo Glacier',
                brandId: brandMap['Cavallo'],
                size: 'Regular',
                tar: '7 mg',
                nicotine: '0.5 mg',
                co: '10 mg',
                flavor: 'Winter Mint',
                fsp: 'Yes',
                corners: 'Square',
                capsules: '2',
            },
            {
                name: 'Momento Serenity',
                brandId: brandMap['Momento'],
                size: 'King Size',
                tar: '9 mg',
                nicotine: '0.6 mg',
                co: '11 mg',
                flavor: 'Rose',
                fsp: 'Yes',
                corners: 'Rounded',
                capsules: '1',
            },
        ],
    })

    console.log('Products seeded')
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
