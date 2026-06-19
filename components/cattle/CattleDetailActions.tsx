"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, MoreVertical, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CattleForm } from "@/components/cattle/CattleForm"
import type { Cattle } from "@/types"

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
