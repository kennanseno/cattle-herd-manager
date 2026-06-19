"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { BreedingForm } from "@/components/breeding/BreedingForm"
import type { BreedingRecord, Cattle } from "@/types"
import { formatDate, daysUntil, calcCalvingDate } from "@/lib/utils"
import { PaginationBar } from "@/components/ui/pagination-bar"

function statusBadge(status: BreedingRecord["status"]) {
  const map = {
    pending: "warning" as const,
    calved: "success" as const,
    failed: "destructive" as const,
  }
  return <Badge variant={map[status]} className="capitalize">{status}</Badge>
}

type SortKey = "breedDate" | "possibleCalvingDate" | "status" | "daysUntil"

function SortIcon({ k, sortKey, dir }: { k: string; sortKey: string; dir: "asc" | "desc" }) {
  if (sortKey !== k) return null
  return dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
}

const STATUS_ORDER: Record<BreedingRecord["status"], number> = { pending: 0, calved: 1, failed: 2 }

interface BreedingTableProps {
  records: BreedingRecord[]
  allCattle: Cattle[]
}

export function BreedingTable({ records, allCattle }: BreedingTableProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | BreedingRecord["status"]>("all")
  const PAGE_SIZE = 20
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<BreedingRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BreedingRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("breedDate")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
    setPage(1)
  }

  const filtered = records.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false
    if (!search) return true
    const q = search.toLowerCase()
    return r.calfTagNumber?.toLowerCase().includes(q)
  })

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1
    switch (sortKey) {
      case "breedDate":
        return a.breedDate < b.breedDate ? -dir : a.breedDate > b.breedDate ? dir : 0
      case "possibleCalvingDate": {
        const aD = a.possibleCalvingDate || ""
        const bD = b.possibleCalvingDate || ""
        return aD < bD ? -dir : aD > bD ? dir : 0
      }
      case "status":
        return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * dir
      case "daysUntil": {
        const aD = a.possibleCalvingDate ? daysUntil(a.possibleCalvingDate) : Infinity
        const bD = b.possibleCalvingDate ? daysUntil(b.possibleCalvingDate) : Infinity
        return (aD - bD) * dir
      }
      default: return 0
    }
  })

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function cowLabel(tag: string) {
    const c = allCattle.find((x) => x.tagNumber === tag)
    return c?.nickname ? `${tag} (${c.nickname})` : tag
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/breeding/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("Breeding record deleted")
      startTransition(() => router.refresh())
    } catch {
      toast.error("Failed to delete record")
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
            placeholder="Search by calf tag..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="calved">Calved</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditRecord(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Add Record
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Calf Tag</TableHead>
              <TableHead>Cow</TableHead>
              <TableHead>Sire</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("breedDate")}>
                <span className="flex items-center gap-1">Breed Date <SortIcon k="breedDate" sortKey={sortKey} dir={sortDir} /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("possibleCalvingDate")}>
                <span className="flex items-center gap-1">Expected Calving <SortIcon k="possibleCalvingDate" sortKey={sortKey} dir={sortDir} /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("daysUntil")}>
                <span className="flex items-center gap-1">Days Until <SortIcon k="daysUntil" sortKey={sortKey} dir={sortDir} /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("status")}>
                <span className="flex items-center gap-1">Status <SortIcon k="status" sortKey={sortKey} dir={sortDir} /></span>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  {records.length === 0 ? "No breeding records yet." : "No breeding records match your search."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((r) => {
                    const isRange = !!r.breedDateTo
                    const daysFrom = r.possibleCalvingDate && r.status === "pending"
                      ? daysUntil(r.possibleCalvingDate)
                      : null
                    const daysTo = isRange && r.breedDateTo && r.status === "pending"
                      ? daysUntil(calcCalvingDate(r.breedDateTo))
                      : null
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-semibold">{r.calfTagNumber || "—"}</TableCell>
                    <TableCell className="font-mono font-semibold">{cowLabel(r.cowTagNumber)}</TableCell>
                    <TableCell className="font-mono">{r.sireTagNumber ? cowLabel(r.sireTagNumber) : "—"}</TableCell>
                    <TableCell>
                      {isRange
                        ? <span>{formatDate(r.breedDate)}<br /><span className="text-muted-foreground text-xs">to {formatDate(r.breedDateTo!)}</span></span>
                        : formatDate(r.breedDate)}
                    </TableCell>
                    <TableCell>
                      {r.possibleCalvingDate
                        ? isRange && r.breedDateTo
                          ? <span>{formatDate(r.possibleCalvingDate)}<br /><span className="text-muted-foreground text-xs">to {formatDate(calcCalvingDate(r.breedDateTo))}</span></span>
                          : formatDate(r.possibleCalvingDate)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {isRange && daysFrom !== null && daysTo !== null ? (
                        <span className={(daysFrom <= 30 || daysTo <= 30) && daysTo > 0 ? "text-amber-600 font-semibold" : ""}>
                          {daysTo < 0
                            ? `${Math.abs(daysTo)}d overdue`
                            : daysFrom < 0
                              ? `due in ${daysTo}d`
                              : `${daysFrom}–${daysTo}d`}
                        </span>
                      ) : daysFrom !== null ? (
                        <span className={daysFrom <= 30 ? "text-amber-600 font-semibold" : ""}>
                          {daysFrom < 0 ? `${Math.abs(daysFrom)}d overdue` : `${daysFrom}d`}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
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
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationBar page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} label="records" />

      <BreedingForm
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editRecord}
        allCattle={allCattle}
        onSuccess={() => startTransition(() => router.refresh())}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Breeding Record?</AlertDialogTitle>
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
