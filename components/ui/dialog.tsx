'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DialogProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description?: string
    children: React.ReactNode
    onSubmit?: () => void
    buttonLoading?: boolean
}

export function Dialog({
    isOpen,
    onClose,
    title,
    description,
    children,
    onSubmit,
    buttonLoading = false,
}: DialogProps) {
    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md transition-opacity" />
                <DialogPrimitive.Content
                    className={cn(
                        'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-8 shadow-2xl focus:outline-none',
                    )}
                >
                    <div className="mb-6 flex items-center justify-between">
                        <DialogPrimitive.Title className="text-gray-900 text-xl font-semibold">
                            {title}
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Close className="text-gray-500 hover:text-gray-700 focus:outline-none">
                            <X className="h-5 w-5" />
                        </DialogPrimitive.Close>
                    </div>

                    {description && (
                        <DialogPrimitive.Description className="mb-4 text-sm text-gray-500">
                            {description}
                        </DialogPrimitive.Description>
                    )}

                    <div className="space-y-4">{children}</div>
                    {onSubmit && (

                    <div className="mt-6 flex justify-end gap-4">
                        <DialogPrimitive.Close asChild>
                            <Button variant="outline-black" size="large">
                                Cancel
                            </Button>
                        </DialogPrimitive.Close>
                        <Button
                            variant="black"
                            size="large"
                            onClick={onSubmit}
                            disabled={buttonLoading}
                        >
                            {buttonLoading ? (
                                <span className="loader"></span>
                            ) : (
                                'Submit'
                            )}
                        </Button>
                    </div>
                                    )}

                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
