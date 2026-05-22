"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { HealthForm } from "@/components/health/HealthForm"
import type { HealthRecord, Cattle } from "@/types"
import { formatDate, formatPHP } from "@/lib/utils"
import { PaginationBar } from "@/components/ui/pagination-bar"

type SortKey = "recordDate" | "cost"

interface HealthTableProps {
  records: HealthRecord[]
  allCattle: Cattle[]
}

export function HealthTable({ records, allCattle }: HealthTableProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const PAGE_SIZE = 20
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<HealthRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HealthRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("recordDate")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  useEffect(() => { setPage(1) }, [search])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir(key === "recordDate" ? "desc" : "asc") }
    setPage(1)
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
  }

  const filtered = records.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.vaccinationType.toLowerCase().includes(q) ||
      r.veterinarian?.toLowerCase().includes(q) ||
      r.tagNumbers.toLowerCase().includes(q)
    )
  })

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1
    if (sortKey === "cost") {
      return (parseFloat(a.cost || "0") - parseFloat(b.cost || "0")) * dir
    }
    return a.recordDate < b.recordDate ? dir * -1 : a.recordDate > b.recordDate ? dir : 0
  })

  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalCost = sorted.reduce((s, r) => s + parseFloat(r.cost || "0"), 0)

  function exportToPDF() {
    const searchLabel = search ? ` · Search: "${search}"` : ""
    const rows = sorted.map((r) => {
      const tags = r.tagNumbers === "ALL" ? "All Cattle" : r.tagNumbers
      return `
      <tr>
        <td>${formatDate(r.recordDate)}</td>
        <td>${r.vaccinationType.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
        <td>${tags.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
        <td>${r.veterinarian ? r.veterinarian.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "\u2014"}</td>
        <td>${r.notes ? r.notes.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "\u2014"}</td>
        <td style="text-align:right">${r.cost ? formatPHP(parseFloat(r.cost)) : "\u2014"}</td>
      </tr>`
    }).join("")
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Health Records</title><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:13px; color:#111; padding:32px; }
      h1 { font-size:20px; font-weight:700; margin-bottom:4px; }
      .meta { color:#666; font-size:12px; margin-bottom:24px; }
      .summary { display:flex; gap:16px; margin-bottom:24px; }
      .summary-card { border:1px solid #e5e7eb; border-radius:8px; padding:12px 16px; flex:1; }
      .summary-label { font-size:11px; color:#666; margin-bottom:4px; }
      .summary-value { font-size:16px; font-weight:700; color:#dc2626; }
      table { width:100%; border-collapse:collapse; }
      thead { background:#f9fafb; }
      th { padding:8px 12px; text-align:left; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; border-bottom:1px solid #e5e7eb; }
      td { padding:8px 12px; border-bottom:1px solid #f3f4f6; vertical-align:top; }
      tr:last-child td { border-bottom:none; }
      .footer { margin-top:24px; font-size:11px; color:#9ca3af; text-align:right; }
      @media print { body { padding:20px; } @page { margin:15mm; } }
    </style></head><body>
      <h1>Health Records</h1>
      <p class="meta">${sorted.length} record${sorted.length !== 1 ? "s" : ""}${searchLabel} &middot; Exported ${new Date().toLocaleDateString("en-AU", { day:"numeric", month:"long", year:"numeric" })}</p>
      <div class="summary">
        <div class="summary-card"><div class="summary-label">Total Records</div><div class="summary-value" style="color:#111">${sorted.length}</div></div>
        <div class="summary-card"><div class="summary-label">Total Cost</div><div class="summary-value">${formatPHP(totalCost)}</div></div>
      </div>
      <table><thead><tr><th>Date</th><th>Type / Treatment</th><th>Cattle</th><th>Veterinarian</th><th>Notes</th><th style="text-align:right">Cost</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="footer">Generated by Cattle Herd Manager</div>
      <script>window.onload=function(){window.print()}<\/script>
    </body></html>`
    const win = window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close() }
  }

  function tagsDisplay(tagNumbers: string) {
    if (!tagNumbers || tagNumbers === "ALL") return <Badge variant="secondary">All Cattle</Badge>
    const tags = tagNumbers.split(",").map((t) => t.trim()).filter(Boolean)
    if (tags.length === 0) return "—"
    if (tags.length <= 3) return tags.map((t) => <Badge key={t} variant="outline" className="mr-1 font-mono text-xs">{t}</Badge>)
    return (
      <>
        {tags.slice(0, 2).map((t) => <Badge key={t} variant="outline" className="mr-1 font-mono text-xs">{t}</Badge>)}
        <Badge variant="secondary">+{tags.length - 2}</Badge>
      </>
    )
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/health/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Health record deleted")
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
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by type, vet, or tag..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={exportToPDF} disabled={sorted.length === 0}>
          <FileDown className="mr-2 h-4 w-4" /> Export PDF
        </Button>
        <Button onClick={() => { setEditRecord(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Add Record
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("recordDate")}>
                <span className="flex items-center gap-1">Date <SortIcon k="recordDate" /></span>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Cattle</TableHead>
              <TableHead>Veterinarian</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("cost")}>
                <span className="flex items-center gap-1">Cost <SortIcon k="cost" /></span>
              </TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No health records found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDate(r.recordDate)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.vaccinationType.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                        <Badge key={t} variant="outline">{t}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{tagsDisplay(r.tagNumbers)}</TableCell>
                  <TableCell>{r.veterinarian || "—"}</TableCell>
                  <TableCell>{r.cost ? formatPHP(parseFloat(r.cost)) : "—"}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{r.notes || "—"}</TableCell>
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

      <PaginationBar page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} label="records" />

      <HealthForm
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editRecord}
        allCattle={allCattle}
        onSuccess={() => startTransition(() => router.refresh())}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Health Record?</AlertDialogTitle>
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
