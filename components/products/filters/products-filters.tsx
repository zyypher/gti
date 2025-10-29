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

const ALL = 'all' // sentinel used for “All” option (UI shows All; API omits key)

/**
 * Helper to apply a Select change while keeping:
 * - UI memory of "All" (so the trigger shows All)
 * - API filters clean (remove key when All)
 */
function applySelectUI(
  key: string,
  value: string,
  filters: Record<string, string>,
  setFilters: (f: Record<string, string>) => void,
  onFilterChange: (f: Record<string, string>) => void,
  uiSelections: Record<string, string>,
  setUiSelections: (f: Record<string, string>) => void
) {
  // remember what the user selected for the UI
  const nextUi = { ...uiSelections, [key]: value }
  setUiSelections(nextUi)

  if (value === ALL) {
    // “All” = clear this key from API filters
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

  // UI-only selection memory so "All" shows in the trigger even though the key is removed from filters
  const [uiSelections, setUiSelections] = useState<Record<string, string>>({})

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

  // honor initial brand filter once brands are available (and mirror it in UI selections)
  useEffect(() => {
    if (brands.length > 0 && initialFilters.brandId && filters.brandId !== initialFilters.brandId) {
      setFilters(initialFilters)
      setUiSelections((prev) => ({ ...prev, brandId: initialFilters.brandId })) // so trigger shows the initial brand
      onFilterChange(initialFilters)
    } else if (brands.length > 0 && filters.brandId) {
      setUiSelections((prev) => ({ ...prev, brandId: filters.brandId }))
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
    setUiSelections({}) // reset UI to placeholders
    onFilterChange({})
    onClearSelection?.()
  }

  // convenience wrapper so we don't pass ui state everywhere inline
  const onSelect = (key: string) => (v: string) =>
    applySelectUI(key, v, filters, setFilters, onFilterChange, uiSelections, setUiSelections)

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
          value={uiSelections.brandId ?? (filters.brandId ?? '')} // '' => placeholder by default
          onValueChange={onSelect('brandId')}
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
            <SelectItem value={ALL}>All</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Size */}
        <Select
          value={uiSelections.size ?? (filters.size ?? '')}
          onValueChange={onSelect('size')}
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
            <SelectItem value={ALL}>All</SelectItem>
            {sizes.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Flavour */}
        <Select
          value={uiSelections.flavor ?? (filters.flavor ?? '')}
          onValueChange={onSelect('flavor')}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                isLoadingFlavors ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                  </span>
                ) : (
                  'Select Flavour'
                )
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            {flavors.map((flavor) => (
              <SelectItem key={flavor} value={flavor}>
                {flavor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Pack Format */}
        <Select
          value={uiSelections.packetStyle ?? (filters.packetStyle ?? '')}
          onValueChange={onSelect('packetStyle')}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                isLoadingPackFormats ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                  </span>
                ) : (
                  'Select Pack Format'
                )
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
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
              value={uiSelections.fsp ?? (filters.fsp ?? '')}
              onValueChange={onSelect('fsp')}
            >
              <SelectTrigger>
                <SelectValue placeholder="FSP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>

            {/* Capsules */}
            <Select
              value={uiSelections.capsules ?? (filters.capsules ?? '')}
              onValueChange={onSelect('capsules')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Number of Capsules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>

            {/* Tar (mg) */}
            <Select
              value={uiSelections.tar ?? (filters.tar ?? '')}
              onValueChange={onSelect('tar')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tar (mg)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {tarOptions.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Nicotine (mg) */}
            <Select
              value={uiSelections.nicotine ?? (filters.nicotine ?? '')}
              onValueChange={onSelect('nicotine')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nicotine (mg)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {nicotineOptions.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* CO (mg) */}
            <Select
              value={uiSelections.co ?? (filters.co ?? '')}
              onValueChange={onSelect('co')}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingCarbonMonoxides ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                      </span>
                    ) : (
                      'Select Carbon Monoxide (mg)'
                    )
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {carbonMonoxides.map((co) => (
                  <SelectItem key={co} value={co}>
                    {co}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Color */}
            <Select
              value={uiSelections.color ?? (filters.color ?? '')}
              onValueChange={onSelect('color')}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingColors ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                      </span>
                    ) : (
                      'Select Color of Packet'
                    )
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
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
            setUiSelections({})
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
              value={uiSelections.name ?? (filters.name ?? '')}
              onValueChange={onSelect('name')}
            >
              <SelectTrigger>
                <SelectValue placeholder={'Select Product Name'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {/* Optionally, you can fetch product names for dropdown, or keep as textbox if needed */}
              </SelectContent>
            </Select>
          </div>

          {/* Brand */}
          <Select
            value={uiSelections.brandId ?? (filters.brandId ?? '')}
            onValueChange={onSelect('brandId')}
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
              <SelectItem value={ALL}>All</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Size */}
          <Select
            value={uiSelections.size ?? (filters.size ?? '')}
            onValueChange={onSelect('size')}
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
              <SelectItem value={ALL}>All</SelectItem>
              {sizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Flavour */}
          <Select
            value={uiSelections.flavor ?? (filters.flavor ?? '')}
            onValueChange={onSelect('flavor')}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingFlavors ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                    </span>
                  ) : (
                    'Select Flavour'
                  )
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {flavors.map((flavor) => (
                <SelectItem key={flavor} value={flavor}>
                  {flavor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Pack Format */}
          <Select
            value={uiSelections.packetStyle ?? (filters.packetStyle ?? '')}
            onValueChange={onSelect('packetStyle')}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingPackFormats ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                    </span>
                  ) : (
                    'Select Pack Format'
                  )
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {packFormats.map((packFormat) => (
                <SelectItem key={packFormat} value={packFormat}>
                  {packFormat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* FSP */}
          <Select
            value={uiSelections.fsp ?? (filters.fsp ?? '')}
            onValueChange={onSelect('fsp')}
          >
            <SelectTrigger>
              <SelectValue placeholder="FSP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>

          {/* Capsules */}
          <Select
            value={uiSelections.capsules ?? (filters.capsules ?? '')}
            onValueChange={onSelect('capsules')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Number of Capsules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              <SelectItem value="0">0</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
            </SelectContent>
          </Select>

          {/* Tar */}
          <Select
            value={uiSelections.tar ?? (filters.tar ?? '')}
            onValueChange={onSelect('tar')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tar (mg)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {tarOptions.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Nicotine */}
          <Select
            value={uiSelections.nicotine ?? (filters.nicotine ?? '')}
            onValueChange={onSelect('nicotine')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nicotine (mg)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {nicotineOptions.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* CO */}
          <Select
            value={uiSelections.co ?? (filters.co ?? '')}
            onValueChange={onSelect('co')}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingCarbonMonoxides ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                    </span>
                  ) : (
                    'Select Carbon Monoxide (mg)'
                  )
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {carbonMonoxides.map((co) => (
                <SelectItem key={co} value={co}>
                  {co}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Color */}
          <Select
            value={uiSelections.color ?? (filters.color ?? '')}
            onValueChange={onSelect('color')}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingColors ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                    </span>
                  ) : (
                    'Select Color of Packet'
                  )
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
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
