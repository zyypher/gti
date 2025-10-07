'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'
import { X, Filter, RefreshCw, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { FloatingLabelInput } from '@/components/ui/floating-label-input'

interface FilterProps {
  onFilterChange: (filters: Record<string, string>) => void
  onRefresh: () => void
  onClearSelection?: () => void
  initialFilters?: Record<string, string>
}

interface IBrand {
  id: string
  name: string
}

const ANY = 'any' // sentinel used for “Any” options

function applySelect(
  key: string,
  value: string,
  filters: Record<string, string>,
  setFilters: (f: Record<string, string>) => void,
  onFilterChange: (f: Record<string, string>) => void
) {
  if (value === ANY) {
    // clear this key from filters
    const { [key]: _omit, ...rest } = filters
    setFilters(rest)
    onFilterChange(rest)
  } else {
    const next = { ...filters, [key]: value }
    setFilters(next)
    onFilterChange(next)
  }
}

export default function ProductsFilters({
  onFilterChange,
  onRefresh,
  onClearSelection,
  initialFilters = {},
}: FilterProps) {
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters)
  const [brands, setBrands] = useState<IBrand[]>([])
  const [sizes, setSizes] = useState<string[]>([])
  const [flavors, setFlavors] = useState<string[]>([])
  const [packFormats, setPackFormats] = useState<string[]>([])
  const [carbonMonoxides, setCarbonMonoxides] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [showAllFilters, setShowAllFilters] = useState(false)
  const [isLoadingBrands, setIsLoadingBrands] = useState(true)
  const [isLoadingSizes, setIsLoadingSizes] = useState(true)
  const [isLoadingFlavors, setIsLoadingFlavors] = useState(true)
  const [isLoadingPackFormats, setIsLoadingPackFormats] = useState(true)
  const [isLoadingCarbonMonoxides, setIsLoadingCarbonMonoxides] = useState(true)
  const [isLoadingColors, setIsLoadingColors] = useState(true)

  // tar: 0.1..1.2 ; nicotine: 1..12
  const tarOptions = Array.from({ length: 12 }, (_, i) => ((i + 1) / 10).toFixed(1))
  const nicotineOptions = Array.from({ length: 12 }, (_, i) => String(i + 1))

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get('/api/brands')
        setBrands(
          response.data.sort((a: IBrand, b: IBrand) => a.name.localeCompare(b.name))
        )
      } catch (error) {
        console.error('Failed to fetch brands:', error)
      } finally {
        setIsLoadingBrands(false)
      }
    }

    const fetchSizes = async () => {
      try {
        const response = await api.get('/api/products/sizes')
        setSizes(response.data)
      } catch (error) {
        console.error('Failed to fetch sizes:', error)
      } finally {
        setIsLoadingSizes(false)
      }
    }

    fetchBrands()
    fetchSizes()
    // Fetch unique values for dropdowns
    const fetchFlavors = async () => {
      try {
        const response = await api.get('/api/products/flavors')
        setFlavors(response.data)
      } catch (error) {
        console.error('Failed to fetch flavors:', error)
      } finally {
        setIsLoadingFlavors(false)
      }
    }
    const fetchPackFormats = async () => {
      try {
        const response = await api.get('/api/products/pack-formats')
        setPackFormats(response.data)
      } catch (error) {
        console.error('Failed to fetch pack formats:', error)
      } finally {
        setIsLoadingPackFormats(false)
      }
    }
    const fetchCarbonMonoxides = async () => {
      try {
        const response = await api.get('/api/products/carbon-monoxides')
        setCarbonMonoxides(response.data)
      } catch (error) {
        console.error('Failed to fetch carbon monoxide values:', error)
      } finally {
        setIsLoadingCarbonMonoxides(false)
      }
    }
    const fetchColors = async () => {
      try {
        const response = await api.get('/api/products/colors')
        setColors(response.data)
      } catch (error) {
        console.error('Failed to fetch colors:', error)
      } finally {
        setIsLoadingColors(false)
      }
    }
    fetchFlavors()
    fetchPackFormats()
    fetchCarbonMonoxides()
    fetchColors()
  }, [])

  // honor initial brand filter once brands are available
  useEffect(() => {
    if (brands.length > 0 && initialFilters.brandId && filters.brandId !== initialFilters.brandId) {
      setFilters(initialFilters)
      onFilterChange(initialFilters)
    } else if (brands.length > 0 && filters.brandId) {
      onFilterChange(filters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, filters.brandId, initialFilters.brandId])

  const handleChangeText = (key: string, value: string) => {
    const updated = { ...filters }
    if (value.trim() === '') {
      delete updated[key]
    } else {
      updated[key] = value
    }
    setFilters(updated)
    onFilterChange(updated)
  }

  const clearFilters = () => {
    setFilters({})
    onFilterChange({})
    onClearSelection?.()
  }

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden grid-cols-2 gap-4 md:grid md:grid-cols-4 lg:grid-cols-6">
        {/* Always visible filters */}
        <div className="relative col-span-2">
           <FloatingLabelInput
            label="Search by name"
            name="searchByName"
            value={filters.name || ''}
            onChange={(value) => handleChangeText('name', value)}
            iconLeft={<Search className="h-4 w-4" />}
          />
        </div>

        {/* Brand */}
        <Select
          value={filters.brandId || ''} // empty string keeps placeholder visible
          onValueChange={(v) => applySelect('brandId', v, filters, setFilters, onFilterChange)}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                isLoadingBrands ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                  </span>
                ) : (
                  'Select Brand'
                )
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Size */}
        <Select
          value={filters.size || ''}
          onValueChange={(v) => applySelect('size', v, filters, setFilters, onFilterChange)}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                isLoadingSizes ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                  </span>
                ) : (
                  'Select Stick Format'
                )
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            {sizes.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.flavor || ''}
          onValueChange={(v) => applySelect('flavor', v, filters, setFilters, onFilterChange)}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={isLoadingFlavors ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                </span>
              ) : (
                'Select Flavour'
              )}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            {flavors.map((flavor) => (
              <SelectItem key={flavor} value={flavor}>
                {flavor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.packetStyle || ''}
          onValueChange={(v) => applySelect('packetStyle', v, filters, setFilters, onFilterChange)}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={isLoadingPackFormats ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                </span>
              ) : (
                'Select Pack Format'
              )}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            {packFormats.map((packFormat) => (
              <SelectItem key={packFormat} value={packFormat}>
                {packFormat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Conditionally visible filters */}
        {showAllFilters && (
          <>
            {/* FSP */}
            <Select
              value={filters.fsp || ''}
              onValueChange={(v) => applySelect('fsp', v, filters, setFilters, onFilterChange)}
            >
              <SelectTrigger>
                <SelectValue placeholder="FSP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>

            {/* Capsules */}
            <Select
              value={filters.capsules || ''}
              onValueChange={(v) =>
                applySelect('capsules', v, filters, setFilters, onFilterChange)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Number of Capsules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any</SelectItem>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>

            {/* Tar (mg) */}
            <Select
              value={filters.tar || ''}
              onValueChange={(v) => applySelect('tar', v, filters, setFilters, onFilterChange)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tar (mg)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any</SelectItem>
                {tarOptions.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Nicotine (mg) */}
            <Select
              value={filters.nicotine || ''}
              onValueChange={(v) =>
                applySelect('nicotine', v, filters, setFilters, onFilterChange)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Nicotine (mg)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any</SelectItem>
                {nicotineOptions.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.co || ''}
              onValueChange={(v) => applySelect('co', v, filters, setFilters, onFilterChange)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={isLoadingCarbonMonoxides ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                    </span>
                  ) : (
                    'Select Carbon Monoxide (mg)'
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any</SelectItem>
                {carbonMonoxides.map((co) => (
                  <SelectItem key={co} value={co}>
                    {co}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.color || ''}
              onValueChange={(v) => applySelect('color', v, filters, setFilters, onFilterChange)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={isLoadingColors ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                    </span>
                  ) : (
                    'Select Color of Packet'
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any</SelectItem>
                {colors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {/* Actions */}
        <div className="col-span-full flex gap-2">
          <Button
            variant="outline"
            size="small"
            onClick={() => setShowAllFilters(!showAllFilters)}
          >
            {showAllFilters ? 'Hide Filters' : 'View All Filters'}
          </Button>

          <Button variant="outline" size="small" onClick={onRefresh}>
            <RefreshCw size={18} /> Refresh
          </Button>

          <Button variant="outline" size="small" onClick={clearFilters}>
            <X size={18} /> Clear
          </Button>
        </div>
      </div>

      {/* Mobile Filters Button & Clear */}
      <div className="flex justify-end gap-2 md:hidden">
        <Button variant="outline" onClick={() => setIsMobileFilterOpen(true)}>
          <Filter size={20} /> Filters
        </Button>
        <Button
          variant="outline"
          size="small"
          onClick={() => {
            setFilters({})
            onFilterChange({})
          }}
        >
          <X size={18} /> Clear
        </Button>
      </div>

      {/* Mobile Filters Modal */}
      <Dialog
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Filters"
      >
        <div className="space-y-4 p-4">
          <div className="relative">
            <Select
              value={filters.name || ''}
              onValueChange={(v) => setFilters({ ...filters, name: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder={'Select Product Name'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any</SelectItem>
                {/* Optionally, you can fetch product names for dropdown, or keep as textbox if needed */}
              </SelectContent>
            </Select>
          </div>

          {/* Brand */}
          <Select
            value={filters.brandId || ''}
            onValueChange={(v) => applySelect('brandId', v, filters, setFilters, onFilterChange)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingBrands ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                    </span>
                  ) : (
                    'Select Brand'
                  )
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Size */}
          <Select
            value={filters.size || ''}
            onValueChange={(v) => applySelect('size', v, filters, setFilters, onFilterChange)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingSizes ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                    </span>
                  ) : (
                    'Select Stick Format'
                  )
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {sizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.flavor || ''}
            onValueChange={(v) => setFilters({ ...filters, flavor: v })}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={isLoadingFlavors ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                  </span>
                ) : (
                  'Select Flavour'
                )}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {flavors.map((flavor) => (
                <SelectItem key={flavor} value={flavor}>
                  {flavor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.packetStyle || ''}
            onValueChange={(v) => setFilters({ ...filters, packetStyle: v })}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={isLoadingPackFormats ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                  </span>
                ) : (
                  'Select Pack Format'
                )}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {packFormats.map((packFormat) => (
                <SelectItem key={packFormat} value={packFormat}>
                  {packFormat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* FSP */}
          <Select
            value={filters.fsp || ''}
            onValueChange={(v) => applySelect('fsp', v, filters, setFilters, onFilterChange)}
          >
            <SelectTrigger>
              <SelectValue placeholder="FSP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>

          {/* Capsules */}
          <Select
            value={filters.capsules || ''}
            onValueChange={(v) =>
              applySelect('capsules', v, filters, setFilters, onFilterChange)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Number of Capsules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              <SelectItem value="0">0</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
            </SelectContent>
          </Select>

          {/* Tar */}
          <Select
            value={filters.tar || ''}
            onValueChange={(v) => applySelect('tar', v, filters, setFilters, onFilterChange)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tar (mg)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {tarOptions.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Nicotine */}
          <Select
            value={filters.nicotine || ''}
            onValueChange={(v) =>
              applySelect('nicotine', v, filters, setFilters, onFilterChange)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Nicotine (mg)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {nicotineOptions.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.co || ''}
            onValueChange={(v) => setFilters({ ...filters, co: v })}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={isLoadingCarbonMonoxides ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                  </span>
                ) : (
                  'Select Carbon Monoxide (mg)'
                )}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {carbonMonoxides.map((co) => (
                <SelectItem key={co} value={co}>
                  {co}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.color || ''}
            onValueChange={(v) => setFilters({ ...filters, color: v })}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={isLoadingColors ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                  </span>
                ) : (
                  'Select Color of Packet'
                )}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {colors.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="black"
              onClick={() => {
                onFilterChange(filters)
                setIsMobileFilterOpen(false)
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
