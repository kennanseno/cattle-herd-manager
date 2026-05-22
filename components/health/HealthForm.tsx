"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import type { Cattle, HealthRecord } from "@/types"

const HEALTH_TYPES = ["Vaccination", "Deworming", "Vitamin Supplement", "Checkup", "Treatment", "Surgery", "Other"]

const schema = z.object({
  recordDate: z.string().min(1, "Date is required"),
  veterinarian: z.string().default(""),
  cost: z.string().default(""),
  notes: z.string().default(""),
})

type FormValues = z.output<typeof schema>

interface HealthFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: HealthRecord | null
  allCattle: Cattle[]
  onSuccess: () => void
}

export function HealthForm({ open, onOpenChange, record, allCattle, onSuccess }: HealthFormProps) {
  const router = useRouter()
  const isEditing = !!record

  const parseInitialTags = () => {
    if (!record?.tagNumbers) return []
    const tags = record.tagNumbers.split(",").map((t) => t.trim()).filter(Boolean)
    return tags.filter((t) => t !== "ALL")
  }

  const [saving, setSaving] = useState(false)
  const [allCattleSelected, setAllCattleSelected] = useState(
    record ? record.tagNumbers === "ALL" || record.tagNumbers === "" : false
  )
  const [selectedTags, setSelectedTags] = useState<string[]>(parseInitialTags())
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    record?.vaccinationType ? record.vaccinationType.split(",").map((t) => t.trim()).filter(Boolean) : []
  )
  const [typesError, setTypesError] = useState("")

  const activeCattle = allCattle.filter((c) => c.status === "active")

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      recordDate: record?.recordDate || "",
      veterinarian: record?.veterinarian || "",
      cost: record?.cost || "",
      notes: record?.notes || "",
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        recordDate: record?.recordDate || "",
        veterinarian: record?.veterinarian || "",
        cost: record?.cost || "",
        notes: record?.notes || "",
      })
      setSelectedTypes(
        record?.vaccinationType ? record.vaccinationType.split(",").map((t) => t.trim()).filter(Boolean) : []
      )
      setTypesError("")
      if (record) {
        const isAll = record.tagNumbers === "ALL" || record.tagNumbers === ""
        setAllCattleSelected(isAll)
        setSelectedTags(isAll ? [] : record.tagNumbers.split(",").map((t) => t.trim()).filter(Boolean))
      } else {
        setAllCattleSelected(false)
        setSelectedTags([])
      }
    }
  }, [open, record])

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
    setTypesError("")
  }

  async function onSubmit(values: FormValues) {
    if (selectedTypes.length === 0) {
      setTypesError("Select at least one type")
      return
    }
    if (!allCattleSelected && selectedTags.length === 0) {
      toast.error("Please select at least one animal")
      return
    }
    setSaving(true)
    try {
      const tagNumbers = allCattleSelected ? "ALL" : selectedTags.join(",")
      const vaccinationType = selectedTypes.join(", ")
      const url = isEditing ? `/api/health/${record.id}` : "/api/health"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, tagNumbers, vaccinationType }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed")
      }

      toast.success(isEditing ? "Health record updated" : "Health record added")
      onSuccess()
      onOpenChange(false)
      reset()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Health Record" : "Add Health Record"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recordDate">Date *</Label>
              <Input id="recordDate" type="date" {...register("recordDate")} />
              {errors.recordDate && <p className="text-xs text-destructive">{errors.recordDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type * <span className="text-muted-foreground font-normal">(select all that apply)</span></Label>
            <div className="border rounded-lg p-3 grid grid-cols-2 gap-2">
              {HEALTH_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => toggleType(type)}
                  />
                  <Label htmlFor={`type-${type}`} className="font-normal cursor-pointer">{type}</Label>
                </div>
              ))}
            </div>
            {typesError && <p className="text-xs text-destructive">{typesError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="veterinarian">Veterinarian</Label>
              <Input id="veterinarian" {...register("veterinarian")} placeholder="Dr. Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (₱)</Label>
              <Input id="cost" type="number" step="0.01" {...register("cost")} placeholder="0.00" />
            </div>
          </div>

          {/* Cattle Selection */}
          <div className="space-y-2">
            <Label>Applies To *</Label>
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                id="all-cattle"
                checked={allCattleSelected}
                onCheckedChange={(v) => setAllCattleSelected(!!v)}
              />
              <Label htmlFor="all-cattle" className="font-normal cursor-pointer">All Active Cattle</Label>
            </div>
            {!allCattleSelected && (
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                {activeCattle.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No active cattle.</p>
                ) : (
                  activeCattle.map((c) => (
                    <div key={c.tagNumber} className="flex items-center gap-2">
                      <Checkbox
                        id={`tag-${c.tagNumber}`}
                        checked={selectedTags.includes(c.tagNumber)}
                        onCheckedChange={() => toggleTag(c.tagNumber)}
                      />
                      <Label htmlFor={`tag-${c.tagNumber}`} className="font-normal cursor-pointer">
                        <span className="font-mono">{c.tagNumber}</span>
                        {c.nickname && <span className="text-muted-foreground ml-1">({c.nickname})</span>}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={2} placeholder="Optional notes..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
