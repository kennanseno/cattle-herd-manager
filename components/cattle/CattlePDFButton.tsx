"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Cattle, FarmSettings } from "@/types"

interface CattlePDFButtonProps {
  cattle: Cattle
  allCattle: Cattle[]
  settings: FarmSettings
}

export function CattlePDFButton({ cattle, allCattle, settings }: CattlePDFButtonProps) {
  const [loading, setLoading] = useState(false)

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
          body: JSON.stringify({ id: certificateId, generatedAt }),
        })
      } catch {
        // The PDF already downloaded; failing to log history shouldn't block the user.
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to generate PDF")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
      Export PDF
    </Button>
  )
}
