import * as React from 'react'

import { cn } from '@/lib/utils'
import { ButtonProps, buttonVariants } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
    <nav
        role="navigation"
        aria-label="pagination"
        className={cn('mx-auto flex w-full justify-end', className)}
        {...props}
    />
)
Pagination.displayName = 'Pagination'

const PaginationContent = React.forwardRef<
    HTMLUListElement,
    React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
    <ul
        ref={ref}
        className={cn(
            'flex flex-row items-center overflow-hidden rounded-lg bg-white shadow-sm',
            className,
        )}
        {...props}
    />
))
PaginationContent.displayName = 'PaginationContent'

const PaginationItem = React.forwardRef<
    HTMLLIElement,
    React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
    <li ref={ref} className={cn('', className)} {...props} />
))
PaginationItem.displayName = 'PaginationItem'

type PaginationLinkProps = {
    isActive?: boolean
} & Pick<ButtonProps, 'size'> &
    React.ComponentProps<'a'>

const PaginationLink = ({
    className,
    isActive,

    ...props
}: PaginationLinkProps) => (
    <a
        aria-current={isActive ? 'page' : undefined}
        className={cn(
            'grid size-[30px] place-content-center !rounded-none text-xs text-[#707079] !shadow-none !ring-0 hover:!border-x hover:border-gray-300',
            buttonVariants({
                variant: isActive ? 'outline-general' : 'outline-general',
            }),
            className,
            isActive &&
                'border-x border-gray-300 bg-[#F7F7F8] text-black hover:bg-[#F7F7F8] hover:text-black',
        )}
        {...props}
    />
)
PaginationLink.displayName = 'PaginationLink'

const PaginationPrevious = ({
    className,
    disabled,
    ...props
}: React.ComponentProps<typeof PaginationLink> & { disabled?: boolean }) => (
    <PaginationLink
        aria-label="Go to previous page"
        size="default"
        className={cn(
            'gap-1 rounded-l-lg border-r border-gray-300 pl-2.5 hover:!border-l-0',
            className,
            disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        )}
        {...props}
    >
        <ChevronLeft className="size-4 text-black" />
    </PaginationLink>
)
PaginationPrevious.displayName = 'PaginationPrevious'

const PaginationNext = ({
    className,
    disabled,
    ...props
}: React.ComponentProps<typeof PaginationLink> & { disabled?: boolean }) => (
    <PaginationLink
        aria-label="Go to next page"
        size="default"
        className={cn(
            'gap-1 rounded-r-lg border-l border-gray-300 pr-2.5 hover:!border-r-0',
            className,
            disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        )}
        {...props}
    >
        <ChevronRight className="size-4 text-black" />
    </PaginationLink>
)
PaginationNext.displayName = 'PaginationNext'

// Server-side PaginationBar
export function PaginationBar({
    currentPage,
    totalPages,
    onPageChange,
    className,
}: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    className?: string
}) {
    if (totalPages <= 1) return null;
    return (
        <nav className={cn('flex justify-center mt-4', className)}>
            <ul className="flex items-center gap-1">
                <li>
                    <button
                        className="px-2 py-1 rounded disabled:opacity-50"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="inline-block" />
                    </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <li key={page}>
                        <button
                            className={cn(
                                'px-3 py-1 rounded',
                                page === currentPage
                                    ? 'bg-black text-white'
                                    : 'bg-white text-black border border-gray-300',
                            )}
                            onClick={() => onPageChange(page)}
                            disabled={page === currentPage}
                        >
                            {page}
                        </button>
                    </li>
                ))}
                <li>
                    <button
                        className="px-2 py-1 rounded disabled:opacity-50"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="inline-block" />
                    </button>
                </li>
            </ul>
        </nav>
    );
}

export {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
}
