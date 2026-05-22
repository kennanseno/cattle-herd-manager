"use client"

import { useState, useTransition, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { Cattle, BreedingRecord } from "@/types"
import { calcCalvingDate, formatDate } from "@/lib/utils"

const schema = z.object({
  cowTagNumber: z.string().min(1, "Cow is required"),
  sireTagNumber: z.string().optional().default(""),
  breedDate: z.string().min(1, "Start date is required"),
  breedDateTo: z.string().optional().default(""),
  status: z.enum(["pending", "calved", "failed"]).default("pending"),
  calfTagNumber: z.string().optional().default(""),
  notes: z.string().optional().default(""),
}).superRefine((data, ctx) => {
  if (data.breedDateTo && data.breedDate && data.breedDateTo < data.breedDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date must be on or after the start date",
      path: ["breedDateTo"],
    })
  }
})

type FormValues = z.output<typeof schema>

interface BreedingFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: BreedingRecord | null
  allCattle: Cattle[]
  onSuccess: () => void
}

export function BreedingForm({ open, onOpenChange, record, allCattle, onSuccess }: BreedingFormProps) {
  const router = useRouter()
  const isEditing = !!record
  const [saving, setSaving] = useState(false)
  const [rangeMode, setRangeMode] = useState(false)

  const females = allCattle.filter((c) => c.sex === "female" && c.status === "active")
  const males = allCattle.filter((c) => c.sex === "male" && c.status === "active")

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      cowTagNumber: "",
      sireTagNumber: "",
      breedDate: "",
      breedDateTo: "",
      status: "pending",
      calfTagNumber: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open) {
      const hasRange = !!(record?.breedDateTo)
      setRangeMode(hasRange)
      reset({
        cowTagNumber: record?.cowTagNumber || "",
        sireTagNumber: record?.sireTagNumber || "",
        breedDate: record?.breedDate || "",
        breedDateTo: record?.breedDateTo || "",
        status: record?.status || "pending",
        calfTagNumber: record?.calfTagNumber || "",
        notes: record?.notes || "",
      })
    }
  }, [open, record])

  const breedDate = watch("breedDate")
  const breedDateTo = watch("breedDateTo")
  const calvingFrom = breedDate ? calcCalvingDate(breedDate) : null
  const calvingTo = rangeMode && breedDateTo ? calcCalvingDate(breedDateTo) : null

  function handleRangeModeToggle(checked: boolean) {
    setRangeMode(checked)
    if (!checked) setValue("breedDateTo", "")
  }

  async function onSubmit(values: FormValues) {
    if (rangeMode && !values.breedDateTo) {
      toast.error("Please enter an end date for the breed period")
      return
    }
    // Clear breedDateTo if not in range mode
    if (!rangeMode) values.breedDateTo = ""

    setSaving(true)
    try {
      const url = isEditing ? `/api/breeding/${record.id}` : "/api/breeding"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save")
      }

      toast.success(isEditing ? "Breeding record updated" : "Breeding record added")
      onSuccess()
      onOpenChange(false)
      reset()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save breeding record")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Breeding Record" : "Add Breeding Record"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Cow *</Label>
            <Select value={watch("cowTagNumber")} onValueChange={(v) => setValue("cowTagNumber", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select cow..." />
              </SelectTrigger>
              <SelectContent>
                {females.map((c) => (
                  <SelectItem key={c.tagNumber} value={c.tagNumber}>
                    {c.tagNumber}{c.nickname ? ` (${c.nickname})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.cowTagNumber && <p className="text-xs text-destructive">{errors.cowTagNumber.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Sire (optional)</Label>
            <Select value={watch("sireTagNumber")} onValueChange={(v) => setValue("sireTagNumber", v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select sire (optional)..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None / Unknown</SelectItem>
                {males.map((c) => (
                  <SelectItem key={c.tagNumber} value={c.tagNumber}>
                    {c.tagNumber}{c.nickname ? ` (${c.nickname})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Breed date toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="rangeMode"
              checked={rangeMode}
              onCheckedChange={(checked) => handleRangeModeToggle(!!checked)}
            />
            <Label htmlFor="rangeMode" className="cursor-pointer font-normal text-sm">
              I don&apos;t know the exact breed date — use a date range
            </Label>
          </div>

          {!rangeMode ? (
            /* Single breed date */
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breedDate">Breed Date *</Label>
                <Input id="breedDate" type="date" {...register("breedDate")} />
                {errors.breedDate && <p className="text-xs text-destructive">{errors.breedDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Est. Calving Date</Label>
                <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                  {calvingFrom ? formatDate(calvingFrom) : "—"}
                </div>
                <p className="text-xs text-muted-foreground">Calculated (283 days)</p>
              </div>
            </div>
          ) : (
            /* Date range */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="breedDate">Breed Period From *</Label>
                  <Input id="breedDate" type="date" {...register("breedDate")} />
                  {errors.breedDate && <p className="text-xs text-destructive">{errors.breedDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breedDateTo">To *</Label>
                  <Input id="breedDateTo" type="date" {...register("breedDateTo")} />
                  {errors.breedDateTo && <p className="text-xs text-destructive">{errors.breedDateTo.message}</p>}
                </div>
              </div>
              {/* Calving window summary */}
              <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Est. Calving Window (283 days gestation)
                </p>
                <div className="flex gap-6">
                  <div>
                    <span className="text-xs text-muted-foreground">Earliest: </span>
                    <span className="font-medium">{calvingFrom ? formatDate(calvingFrom) : "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Latest: </span>
                    <span className="font-medium">{calvingTo ? formatDate(calvingTo) : "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as FormValues["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="calved">Calved</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="calfTagNumber">Calf Tag (if calved)</Label>
              <Input id="calfTagNumber" {...register("calfTagNumber")} placeholder="e.g. B010" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Optional notes..." rows={2} />
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


