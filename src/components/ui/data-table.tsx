import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { useDarkMode } from "@/contexts/DarkModeContext"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    minWidth?: string
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  showPagination?: boolean
  totalLabel?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  showPagination = true,
  totalLabel = "items"
}: DataTableProps<TData, TValue>) {
  const { isDarkMode } = useDarkMode()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  return (
    <div className="w-full space-y-4">
      {/* Table Container with Horizontal Scroll */}
      <div className="relative w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="w-full caption-bottom text-sm">
          <thead className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`h-12 px-4 text-left align-middle font-semibold ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}
                    style={{ minWidth: header.column.columnDef.meta?.minWidth || 'auto' }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-gray-800 border-gray-700' 
                      : 'hover:bg-gray-50 border-gray-200'
                  } ${
                    idx % 2 === 0 
                      ? (isDarkMode ? 'bg-gray-900' : 'bg-white') 
                      : (isDarkMode ? 'bg-gray-800/50' : 'bg-gray-25')
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-4 align-middle"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className={`h-24 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className={`flex items-center justify-between px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <div className="flex-1 text-sm">
            Showing{" "}
            <span className="font-medium">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium">
              {table.getFilteredRowModel().rows.length}
            </span>{" "}
            {totalLabel}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className={isDarkMode ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : ''}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={isDarkMode ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : ''}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={isDarkMode ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : ''}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className={isDarkMode ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : ''}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
