"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, MoreVertical, Archive, FileClock, Loader2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { CattleForm } from "@/components/cattle/CattleForm"
import type { Cattle, PdfExportRecord } from "@/types"

interface CattleDetailActionsProps {
  cattle: Cattle
  allCattle: Cattle[]
}

export function CattleDetailActions({ cattle, allCattle }: CattleDetailActionsProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [exports, setExports] = useState<PdfExportRecord[]>([])

  async function openHistory() {
    setHistoryOpen(true)
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/cattle/${encodeURIComponent(cattle.tagNumber)}/pdf-exports`)
      if (!res.ok) throw new Error("Failed")
      setExports(await res.json() as PdfExportRecord[])
    } catch {
      toast.error("Failed to load certificate history")
      setExports([])
    } finally {
      setHistoryLoading(false)
    }
  }

  async function handleArchive() {
    setArchiving(true)
    try {
      const res = await fetch(`/api/cattle/${cattle.tagNumber}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success(`${cattle.tagNumber} archived`)
      router.push("/cattle")
    } catch {
      toast.error("Failed to archive cattle")
    } finally {
      setArchiving(false)
      setArchiveOpen(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setEditOpen(true)}>
        <Pencil className="mr-2 h-4 w-4" /> Edit
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openHistory}>
            <FileClock className="mr-2 h-4 w-4" />
            Certificate History
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setArchiveOpen(true)}
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive Cattle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Certificate History</DialogTitle>
            <DialogDescription>
              PDF certificates generated for {cattle.tagNumber}
              {cattle.nickname ? ` (${cattle.nickname})` : ""}.
            </DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : exports.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No certificates have been generated yet. Use “Export PDF” to create one.
            </p>
          ) : (
            <ul className="max-h-80 divide-y overflow-y-auto">
              {exports.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {new Date(e.generatedAt).toLocaleString()}
                    </p>
                    {e.notes ? (
                      <p className="truncate text-xs text-muted-foreground" title={e.notes}>
                        {e.notes}
                      </p>
                    ) : null}
                    <p className="truncate font-mono text-xs text-muted-foreground" title={e.id}>
                      {e.id}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    title="Copy certificate ID"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(e.id)
                        toast.success("Certificate ID copied")
                      } catch {
                        toast.error("Failed to copy")
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <CattleForm
        open={editOpen}
        onOpenChange={setEditOpen}
        cattle={cattle}
        allCattle={allCattle}
        onSuccess={() => startTransition(() => router.refresh())}
      />

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {cattle.tagNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              The record will be preserved but hidden from active views. You can restore it later by editing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleArchive}
              disabled={archiving}
            >
              {archiving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
