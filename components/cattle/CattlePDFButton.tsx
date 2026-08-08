"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { Cattle, FarmSettings } from "@/types"

interface CattlePDFButtonProps {
  cattle: Cattle
  allCattle: Cattle[]
  settings: FarmSettings
}

export function CattlePDFButton({ cattle, allCattle, settings }: CattlePDFButtonProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState("")

  async function handleExport() {
    setLoading(true)
    try {
      // Dynamically import to avoid SSR issues with @react-pdf/renderer
      const { generateCattlePDF } = await import("@/components/cattle/CattlePDFDocument")
      const certificateId = crypto.randomUUID()
      const generatedAt = new Date().toISOString()
      await generateCattlePDF(cattle, allCattle, settings, certificateId, generatedAt)

      // Log the generation so it appears in the certificate history.
      try {
        await fetch(`/api/cattle/${encodeURIComponent(cattle.tagNumber)}/pdf-exports`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: certificateId, generatedAt, notes }),
        })
      } catch {
        // The PDF already downloaded; failing to log history shouldn't block the user.
      }
      setOpen(false)
      setNotes("")
    } catch (err) {
      console.error(err)
      toast.error("Failed to generate PDF")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) setNotes(""); setOpen(value) }}>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
        Export PDF
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export PDF Certificate</DialogTitle>
          <DialogDescription>
            Add a short note explaining why you are exporting this certificate. This will be saved with the export history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor="export-notes" className="text-sm font-medium text-slate-900">Export notes</label>
          <Textarea
            id="export-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Reason for export, recipient, or other context (optional)"
            rows={5}
          />
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Export PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
