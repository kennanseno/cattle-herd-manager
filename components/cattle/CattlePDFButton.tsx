"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Cattle, FarmSettings } from "@/types"
import { formatDate, getAgeInYears, getAgeInMonths } from "@/lib/utils"

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
      await generateCattlePDF(cattle, allCattle, settings)
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
