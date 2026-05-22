"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Download, Upload, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function DataPortabilityCard() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleExport() {
    const a = document.createElement("a")
    a.href = "/api/export"
    a.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setConfirmOpen(true)
    // reset input so same file can be re-selected if needed
    e.target.value = ""
  }

  async function confirmImport() {
    if (!pendingFile) return
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", pendingFile)
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Import failed")
      }
      toast.success("Data imported successfully")
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import — check file format")
    } finally {
      setImporting(false)
      setPendingFile(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import / Export Data</CardTitle>
          <CardDescription>
            Back up all your records or restore from a previous backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Backup
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="mr-2 h-4 w-4" />
            {importing ? "Importing…" : "Import Backup"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={handleFileChange}
          />
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Overwrite existing data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Importing <span className="font-medium">{pendingFile?.name}</span> will{" "}
              <strong>permanently delete and replace</strong> all existing cattle, breeding,
              health, finance, and settings records with the contents of the backup file.
              This cannot be undone. Export a backup first if you want to keep your current data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingFile(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmImport}
            >
              Yes, overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
