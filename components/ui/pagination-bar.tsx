"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationBarProps {
  page: number
  pageSize: number
  total: number
  onPage: (page: number) => void
  label?: string
}

export function PaginationBar({ page, pageSize, total, onPage, label = "items" }: PaginationBarProps) {
  const totalPages = Math.ceil(total / pageSize)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {total === 0
          ? null
          : `Showing ${from}–${to} of ${total} ${label}`}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPage(1)} disabled={page === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPage(page - 1)} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 tabular-nums">Page {page} of {totalPages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPage(page + 1)} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPage(totalPages)} disabled={page === totalPages}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
