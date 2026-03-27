"use client"

import * as React from "react"
import {
  IconCircleCheckFilled,
  IconLoader,
  IconLogin,
  IconPlus,
  IconTrash,
  IconEdit,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ActivityLog {
  id: string
  action: string
  resource: string
  user_email?: string
  created_at: string
}

function formatAction(action: string) {
  return action
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

function getActionIcon(action: string) {
  const a = action.toLowerCase()
  if (a.includes("login") || a.includes("auth")) return <IconLogin className="size-3.5" />
  if (a.includes("create") || a.includes("add")) return <IconPlus className="size-3.5" />
  if (a.includes("delete") || a.includes("remove")) return <IconTrash className="size-3.5" />
  if (a.includes("update") || a.includes("edit")) return <IconEdit className="size-3.5" />
  return <IconCircleCheckFilled className="size-3.5" />
}

export function DataTable({ data }: { data: ActivityLog[] }) {
  const t = useTranslations("dashboard")
  const tc = useTranslations("common")
  const [sorting, setSorting] = React.useState<SortingState>([])

  function formatTimeAgo(dateString: string) {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    if (diff < 60) return tc("justNow")
    if (diff < 3600) return tc("mAgo", { minutes: Math.floor(diff / 60) })
    if (diff < 86400) return tc("hAgo", { hours: Math.floor(diff / 3600) })
    return tc("dAgo", { days: Math.floor(diff / 86400) })
  }

  const columns: ColumnDef<ActivityLog>[] = [
    {
      accessorKey: "action",
      header: t("action"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{getActionIcon(row.original.action)}</span>
          <span className="font-medium">{formatAction(row.original.action)}</span>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "resource",
      header: t("resource"),
      cell: ({ row }) => (
        <span className="text-muted-foreground truncate max-w-[200px] block">
          {row.original.resource || "—"}
        </span>
      ),
    },
    {
      accessorKey: "user_email",
      header: t("userCol"),
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.user_email || tc("system")}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: t("time"),
      cell: ({ row }) => (
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {formatTimeAgo(row.original.created_at)}
        </Badge>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  })

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">{t("recentActivity")}</h3>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("noActivity")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {tc("previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {tc("page", { current: table.getState().pagination.pageIndex + 1, total: table.getPageCount() })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {tc("next")}
          </Button>
        </div>
      )}
    </div>
  )
}
