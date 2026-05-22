"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import {
  Plus, Search, Filter, Eye, Pencil, Trash2, ChevronUp, ChevronDown,
} from "lucide-react"
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
import { CattleForm } from "@/components/cattle/CattleForm"
import type { Cattle } from "@/types"
import { formatDate, getAgeInMonths, getAgeInYears, isCalf, cn } from "@/lib/utils"
import { PaginationBar } from "@/components/ui/pagination-bar"

type SortKey = "tagNumber" | "dateOfBirth" | "sex" | "breed" | "status"

function statusBadge(status: Cattle["status"]) {
  const map = {
    active: "success" as const,
    sold: "secondary" as const,
    deceased: "destructive" as const,
    archived: "outline" as const,
  }
  return <Badge variant={map[status]}>{status}</Badge>
}

function ageLabel(dob: string) {
  const months = getAgeInMonths(dob)
  if (months < 1) return "< 1 mo"
  if (months < 12) return `${months} mo`
  const years = getAgeInYears(dob)
  const remainingMonths = months - years * 12
  return remainingMonths > 0
    ? `${years} yr${years !== 1 ? "s" : ""} ${remainingMonths} mo`
    : `${years} yr${years !== 1 ? "s" : ""}`
}

interface CattleTableProps {
  cattle: Cattle[]
}

export function CattleTable({ cattle }: CattleTableProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [filterSex, setFilterSex] = useState("all")
  const [filterStatus, setFilterStatus] = useState("active")
  const [filterBreed, setFilterBreed] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("tagNumber")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editCattle, setEditCattle] = useState<Cattle | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Cattle | null>(null)
  const [deleting, setDeleting] = useState(false)

  const PAGE_SIZE = 20
  const breeds = Array.from(new Set(cattle.map((c) => c.breed).filter(Boolean)))

  useEffect(() => { setPage(1) }, [search, filterSex, filterStatus, filterBreed])

  const filtered = cattle
    .filter((c) => {
      if (filterStatus !== "all" && c.status !== filterStatus) return false
      if (filterSex !== "all" && c.sex !== filterSex) return false
      if (filterBreed !== "all" && c.breed !== filterBreed) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          c.tagNumber.toLowerCase().includes(q) ||
          c.nickname?.toLowerCase().includes(q) ||
          c.breed.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      return a[sortKey] < b[sortKey] ? -dir : a[sortKey] > b[sortKey] ? dir : 0
    })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/cattle/${deleteTarget.tagNumber}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to archive")
      toast.success(`${deleteTarget.tagNumber} archived`)
      startTransition(() => router.refresh())
    } catch {
      toast.error("Failed to archive cattle")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by tag, name, or breed..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="deceased">Deceased</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSex} onValueChange={setFilterSex}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sex</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="male">Male</SelectItem>
          </SelectContent>
        </Select>
        {breeds.length > 1 && (
          <Select value={filterBreed} onValueChange={setFilterBreed}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Breeds</SelectItem>
              {breeds.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button onClick={() => { setEditCattle(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Add Cattle
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("tagNumber")}>
                <span className="flex items-center gap-1">Tag # <SortIcon k="tagNumber" /></span>
              </TableHead>
              <TableHead>Nickname</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("dateOfBirth")}>
                <span className="flex items-center gap-1">DOB <SortIcon k="dateOfBirth" /></span>
              </TableHead>
              <TableHead>Age</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("sex")}>
                <span className="flex items-center gap-1">Sex <SortIcon k="sex" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("breed")}>
                <span className="flex items-center gap-1">Breed <SortIcon k="breed" /></span>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  {cattle.length === 0 ? "No cattle yet." : "No cattle match your search."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((c) => (
                <TableRow key={c.tagNumber}>
                  <TableCell>
                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center text-sm">
                      {c.imagePath ? (
                        <Image
                          src={`/api/images/${c.imagePath.split("/").pop()}`}
                          alt={c.tagNumber}
                          fill
                          className="object-cover"
                        />
                      ) : "🐄"}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">{c.tagNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{c.nickname || "—"}</TableCell>
                  <TableCell>{formatDate(c.dateOfBirth)}</TableCell>
                  <TableCell>
                    <span className={cn(isCalf(c.dateOfBirth) && "text-amber-600 font-medium")}>
                      {ageLabel(c.dateOfBirth)}
                    </span>
                    {isCalf(c.dateOfBirth) && <Badge variant="warning" className="ml-1 text-xs">Calf</Badge>}
                  </TableCell>
                  <TableCell>
                    <span className={c.sex === "male" ? "text-blue-500" : "text-pink-500"} aria-hidden>
                      {c.sex === "male" ? "♂" : "♀"}
                    </span>
                    {" "}<span className="capitalize">{c.sex}</span>
                  </TableCell>
                  <TableCell>{c.breed}</TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/cattle/${c.tagNumber}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditCattle(c); setFormOpen(true) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(c)}>
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

      <PaginationBar page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} label="cattle" />

      <CattleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        cattle={editCattle}
        allCattle={cattle}
        onSuccess={() => startTransition(() => router.refresh())}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Cattle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive <strong>{deleteTarget?.tagNumber}</strong>
              {deleteTarget?.nickname ? ` (${deleteTarget.nickname})` : ""}. The record will be preserved but marked as archived. This action can be reversed by editing the cattle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
