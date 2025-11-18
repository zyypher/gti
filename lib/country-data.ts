import countries from 'world-countries'

export const countryData = countries.map((c) => ({
    name: c.name.common,
    code: c.cca2,
    phone: c.idd.root
        ? c.idd.root + (c.idd.suffixes?.[0] ?? '')
        : '',
}))