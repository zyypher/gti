'use client'

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface FloatingLabelInputProps {
  label: string
  value?: string
  onChange?: (val: string) => void
  name: string
  error?: string
  type?: string
  placeholder?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  className?: string
  step?: string
  min?: string
  iconLeft?: React.ReactNode
}

export function FloatingLabelInput({
  label,
  value = '',
  onChange,
  name,
  error,
  type = 'text',
  placeholder,
  onKeyDown,
  className,
  step,
  min,
  iconLeft
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const hasValue = value?.toString().length > 0

  return (
    <div className="relative w-full">
      <Input
        id={name}
        name={name}
        value={value}
        type={type}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "peer placeholder-transparent pt-5",
          iconLeft ? "pl-9" : "pl-3.5", // Conditional padding for icon
          className
        )}
        onKeyDown={onKeyDown}
        step={step}
        min={min}
      />
      <Label
        htmlFor={name}
        className={cn(
          "absolute text-sm text-muted-foreground transition-all duration-200",
          iconLeft ? 'left-9' : 'left-3',
          {
            'top-1 text-xs scale-90': isFocused || hasValue,
            'top-3.5': !isFocused && !hasValue,
          }
        )}
      >
        {label}
      </Label>

      {iconLeft && (
        <span className="pointer-events-none absolute left-0 top-0 flex h-full w-9 items-center justify-center text-muted-foreground">
          {iconLeft}
        </span>
      )}

      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  )
} 