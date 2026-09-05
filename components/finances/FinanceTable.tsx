"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Search, TrendingUp, TrendingDown, ChevronUp, ChevronDown, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FinanceForm } from "@/components/finances/FinanceForm"
import type { FinanceRecord, Cattle } from "@/types"
import { formatDateRange, formatPHP, cn } from "@/lib/utils"
import { PaginationBar } from "@/components/ui/pagination-bar"

type SortKey = "date" | "type" | "category" | "amount"

function getCategoryTotals(records: FinanceRecord[], type: FinanceRecord["type"]) {
  const totals = new Map<string, number>()

  records
    .filter((record) => record.type === type)
    .forEach((record) => {
      const category = record.category.trim() || "Uncategorized"
      totals.set(category, (totals.get(category) ?? 0) + parseFloat(record.amount || "0"))
    })

  return Array.from(totals, ([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}

function SortIcon({ k, sortKey, dir }: { k: string; sortKey: string; dir: "asc" | "desc" }) {
  if (sortKey !== k) return null
  return dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
}

interface FinanceTableProps {
  records: FinanceRecord[]
  allCattle: Cattle[]
}

export function FinanceTable({ records, allCattle }: FinanceTableProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [filterYear, setFilterYear] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const PAGE_SIZE = 20
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<FinanceRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FinanceRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir(key === "date" ? "desc" : "asc") }
    setPage(1)
  }

  const years = Array.from(new Set(records.flatMap((r) => [r.date.slice(0, 4), r.dateTo?.slice(0, 4)].filter((year): year is string => Boolean(year))))).sort().reverse()
  if (filterYear !== "all" && !years.includes(filterYear)) years.unshift(filterYear)
  const categories = Array.from(new Set(records.map((r) => r.category.trim() || "Uncategorized"))).sort()

  const filtered = records
    .filter((r) => {
      const recordYears = [r.date.slice(0, 4), r.dateTo?.slice(0, 4)].filter((year): year is string => Boolean(year))
      if (filterYear !== "all" && !recordYears.includes(filterYear)) return false
      if (filterCategory !== "all" && (r.category.trim() || "Uncategorized") !== filterCategory) return false
      if (!search) return true
      const q = search.toLowerCase()
      return r.category.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
    })

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1
    switch (sortKey) {
      case "date": return a.date < b.date ? dir * -1 : a.date > b.date ? dir : 0
      case "type": return a.type < b.type ? -dir : a.type > b.type ? dir : 0
      case "category": return a.category.localeCompare(b.category) * dir
      case "amount": return (parseFloat(a.amount || "0") - parseFloat(b.amount || "0")) * dir
      default: return 0
    }
  })

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const totalIncome = filtered.filter((r) => r.type === "income").reduce((s, r) => s + parseFloat(r.amount || "0"), 0)
  const totalExpense = filtered.filter((r) => r.type === "expense").reduce((s, r) => s + parseFloat(r.amount || "0"), 0)
  const incomeByCategory = getCategoryTotals(filtered, "income")
  const expenseByCategory = getCategoryTotals(filtered, "expense")
  const netBalance = totalIncome - totalExpense

  function exportToPDF() {
    const yearLabel = filterYear === "all" ? "All Years" : filterYear
    const categoryLabel = filterCategory === "all" ? "All Categories" : filterCategory
    const searchLabel = search ? ` · Search: "${search}"` : ""
    const rows = sorted.map((r) => `
      <tr>
        <td>${formatDateRange(r.date, r.dateTo)}</td>
        <td><span class="${r.type === "income" ? "badge-income" : "badge-expense"}">${r.type}</span></td>
        <td>${r.category}</td>
        <td>${r.description ? r.description.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "\u2014"}</td>
        <td class="${r.type === "income" ? "amount-income" : "amount-expense"}">${r.type === "income" ? "+" : "\u2212"}${formatPHP(parseFloat(r.amount || "0"))}</td>
      </tr>`).join("")
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Finance Report</title><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:13px; color:#111; padding:32px; }
      h1 { font-size:20px; font-weight:700; margin-bottom:4px; }
      .meta { color:#666; font-size:12px; margin-bottom:24px; }
      .summary { display:flex; gap:16px; margin-bottom:24px; }
      .summary-card { border:1px solid #e5e7eb; border-radius:8px; padding:12px 16px; flex:1; }
      .summary-label { font-size:11px; color:#666; margin-bottom:4px; }
      .summary-value { font-size:16px; font-weight:700; }
      .income { color:#16a34a; } .expense { color:#dc2626; }
      table { width:100%; border-collapse:collapse; }
      thead { background:#f9fafb; }
      th { padding:8px 12px; text-align:left; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; border-bottom:1px solid #e5e7eb; }
      td { padding:8px 12px; border-bottom:1px solid #f3f4f6; vertical-align:middle; }
      tr:last-child td { border-bottom:none; }
      .badge-income { background:#dcfce7; color:#16a34a; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:600; }
      .badge-expense { background:#fee2e2; color:#dc2626; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:600; }
      .amount-income { color:#16a34a; font-weight:600; text-align:right; }
      .amount-expense { color:#dc2626; font-weight:600; text-align:right; }
      .footer { margin-top:24px; font-size:11px; color:#9ca3af; text-align:right; }
      @media print { body { padding:20px; } @page { margin:15mm; } }
    </style></head><body>
      <h1>Finance Report</h1>
      <p class="meta">${yearLabel} · ${categoryLabel}${searchLabel} &middot; ${sorted.length} transaction${sorted.length !== 1 ? "s" : ""} &middot; Exported ${new Date().toLocaleDateString("en-AU", { day:"numeric", month:"long", year:"numeric" })}</p>
      <div class="summary">
        <div class="summary-card"><div class="summary-label">Total Income</div><div class="summary-value income">${formatPHP(totalIncome)}</div></div>
        <div class="summary-card"><div class="summary-label">Total Expenses</div><div class="summary-value expense">${formatPHP(totalExpense)}</div></div>
        <div class="summary-card"><div class="summary-label">Net Balance</div><div class="summary-value ${netBalance >= 0 ? "income" : "expense"}">${netBalance >= 0 ? "+" : ""}${formatPHP(netBalance)}</div></div>
      </div>
      <table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="footer">Generated by Cattle Herd Manager</div>
      <script>window.onload=function(){window.print()}<\/script>
    </body></html>`
    const win = window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close() }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/finances/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Transaction deleted")
      startTransition(() => router.refresh())
    } catch {
      toast.error("Failed to delete")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Income</span>
          </div>
          <p className="text-xl font-bold text-green-600">{formatPHP(totalIncome)}</p>
          {incomeByCategory.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t pt-3">
              {incomeByCategory.map(({ category, amount }) => (
                <div key={category} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-muted-foreground">{category}</span>
                  <span className="shrink-0 font-medium text-green-600">{formatPHP(amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm font-medium">Expenses</span>
          </div>
          <p className="text-xl font-bold text-red-600">{formatPHP(totalExpense)}</p>
          {expenseByCategory.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t pt-3">
              {expenseByCategory.map(({ category, amount }) => (
                <div key={category} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-muted-foreground">{category}</span>
                  <span className="shrink-0 font-medium text-red-600">{formatPHP(amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={cn("rounded-lg border bg-card p-4", netBalance >= 0 ? "border-green-200" : "border-red-200")}>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <span className="text-sm font-medium">Net Balance</span>
          </div>
          <p className={cn("text-xl font-bold", netBalance >= 0 ? "text-green-600" : "text-red-600")}>
            {netBalance >= 0 ? "+" : ""}{formatPHP(netBalance)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by category or description..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <Select value={filterCategory} onValueChange={(value) => { setFilterCategory(value); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportToPDF} disabled={sorted.length === 0}>
          <FileDown className="mr-2 h-4 w-4" /> Export PDF
        </Button>
        <Button onClick={() => { setEditRecord(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("date")}>
                <span className="flex items-center gap-1">Date <SortIcon k="date" sortKey={sortKey} dir={sortDir} /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("type")}>
                <span className="flex items-center gap-1">Type <SortIcon k="type" sortKey={sortKey} dir={sortDir} /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("category")}>
                <span className="flex items-center gap-1">Category <SortIcon k="category" sortKey={sortKey} dir={sortDir} /></span>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("amount")}>
                <span className="flex items-center justify-end gap-1">Amount <SortIcon k="amount" sortKey={sortKey} dir={sortDir} /></span>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  {records.length === 0 ? "No transactions yet." : "No transactions match your search."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDateRange(r.date, r.dateTo)}</TableCell>
                  <TableCell>
                    <Badge variant={r.type === "income" ? "success" : "destructive"} className="capitalize">
                      {r.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell className="text-muted-foreground">{r.description || "—"}</TableCell>
                  <TableCell className={cn("text-right font-semibold", r.type === "income" ? "text-green-600" : "text-red-600")}>
                    {r.type === "income" ? "+" : "−"}{formatPHP(parseFloat(r.amount || "0"))}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditRecord(r); setFormOpen(true) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(r)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationBar page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} label="transactions" />

      <FinanceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editRecord}
        allCattle={allCattle}
        onSuccess={() => startTransition(() => router.refresh())}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
