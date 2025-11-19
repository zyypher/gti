'use client'

import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
    RowSelectionState,
} from '@tanstack/react-table'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import React, { useEffect } from 'react'
import { InputSearch } from '@/components/ui/input-search'
import { createPortal } from 'react-dom'
import PaginationTable from '@/components/custom/pagination-table'
import { Skeleton } from '@/components/ui/skeleton'

interface DataTableProps<TData extends { id: string; status?: string }> {
    columns: ColumnDef<TData>[]
    data: TData[]
    filterField: string
    isFilterRowBasedOnValue?: string
    isRemovePagination?: boolean
    isFilterRow?: boolean
    isAllRowKey?: string
    loading?: boolean
    rowSelectionCallback?: (selectedIds: string[]) => void
    selectedRowIds?: string[]
}

export function DataTable<TData extends { id: string; status?: string }>({
    columns,
    data,
    filterField,
    isFilterRow = false,
    isFilterRowBasedOnValue,
    isRemovePagination = true,
    isAllRowKey,
    loading = false,
    rowSelectionCallback,
    selectedRowIds,
}: DataTableProps<TData>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        // ✅ KEY FIX: Use actual data ID instead of row index
        getRowId: (row) => row.id,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        enableRowSelection: true,
    })

    const TableData = isFilterRow
        ? table
            .getRowModel()
            .rows.filter((rowItems) =>
                isFilterRowBasedOnValue === isAllRowKey
                    ? rowItems
                    : rowItems.original.status === isFilterRowBasedOnValue,
            )
        : table.getRowModel().rows

    const [mounted, setMounted] = React.useState<boolean>(false)

    // Use ref to track if we're programmatically setting selection
    const isProgrammaticUpdate = React.useRef(false)

    // Sync incoming selectedRowIds to rowSelection
    useEffect(() => {
        if (selectedRowIds && selectedRowIds.length > 0) {
            const newSelectionState: RowSelectionState = {}
            selectedRowIds.forEach((id) => {
                newSelectionState[id] = true
            })

            const currentKeys = Object.keys(rowSelection).sort()
            const newKeys = Object.keys(newSelectionState).sort()
            const isDifferent =
                currentKeys.length !== newKeys.length ||
                currentKeys.join(',') !== newKeys.join(',')

            if (isDifferent) {
                isProgrammaticUpdate.current = true
                setRowSelection(newSelectionState)
            }
        } else if (
            selectedRowIds &&
            selectedRowIds.length === 0 &&
            Object.keys(rowSelection).length > 0
        ) {
            isProgrammaticUpdate.current = true
            setRowSelection({})
        }
    }, [selectedRowIds])

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    // Track row selection changes and notify parent
    useEffect(() => {
        // Skip callback if this was a programmatic update from parent
        if (isProgrammaticUpdate.current) {
            isProgrammaticUpdate.current = false
            return
        }

        const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])
        console.log('Row selection updated. Selected IDs:', selectedIds)
        if (rowSelectionCallback) {
            rowSelectionCallback(selectedIds)
        }
    }, [rowSelection])

    return (
        <div>
            <div className="w-full overflow-hidden rounded-b-lg bg-white shadow-sm">
                <div>
                    {mounted &&
                        document.getElementById('search-table') &&
                        createPortal(
                            <InputSearch
                                placeholder={`Search ${filterField || ''}`}
                                value={
                                    (table.getColumn(filterField)?.getFilterValue() as string) ?? ''
                                }
                                onChange={(event) =>
                                    table.getColumn(filterField)?.setFilterValue(event.target.value)
                                }
                            />,
                            document.getElementById('search-table')!,
                        )}
                </div>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="h-8">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="last:w-0 px-3 py-1 text-xs font-medium"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext(),
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index} className="h-9">
                                    {columns.map((_, cellIndex) => (
                                        <TableCell key={cellIndex} className="px-3 py-1">
                                            <Skeleton className="h-3 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            TableData.map((row) => {
                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && 'selected'}
                                        className="h-9"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                className="px-3 py-1 text-xs align-middle"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow className="h-12">
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-12 !text-center text-sm font-semibold"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {isRemovePagination && <PaginationTable table={table} data={data} />}
        </div>
    )
}