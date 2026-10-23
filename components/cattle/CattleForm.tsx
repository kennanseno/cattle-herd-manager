"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Cattle } from "@/types"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

const schema = z.object({
  tagNumber: z.string().min(1, "Tag number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  sex: z.enum(["male", "female"]),
  breed: z.string().min(1, "Breed is required"),
  sireTagNumber: z.string().optional().default(""),
  damTagNumber: z.string().optional().default(""),
  nickname: z.string().optional().default(""),
  birthWeight: z.string().optional().default(""),
  weaningWeight: z.string().optional().default(""),
  status: z.enum(["active", "sold", "deceased", "archived"]).default("active"),
  notes: z.string().optional().default(""),
})

type FormValues = z.infer<typeof schema>

interface CattleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cattle?: Cattle | null
  allCattle: Cattle[]
  onSuccess: () => void
}

function TagCombobox({
  value,
  onChange,
  cattle,
  label,
  filterSex,
}: {
  value: string
  onChange: (v: string) => void
  cattle: Cattle[]
  label: string
  filterSex?: "male" | "female"
}) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const filtered = filterSex ? cattle.filter((c) => c.sex === filterSex) : cattle
  const selected = filtered.find((c) => c.tagNumber === value)
  const trimmed = inputValue.trim()
  const exactMatch = filtered.some((c) => c.tagNumber.toLowerCase() === trimmed.toLowerCase())
  const canAddCustom = trimmed !== "" && !exactMatch

  function handleSelect(tag: string) {
    onChange(tag)
    setOpen(false)
    setInputValue("")
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setInputValue("") }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}
        >
          {selected
            ? `${selected.tagNumber}${selected.nickname ? ` (${selected.nickname})` : ""}`
            : value
            ? <span className="font-mono">{value} <span className="text-muted-foreground text-xs">(not in records)</span></span>
            : `Select ${label}...`}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Command>
          <CommandInput
            placeholder={`Search or type tag number...`}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {!canAddCustom && <CommandEmpty>No cattle found.</CommandEmpty>}
            <CommandGroup>
              <CommandItem value="__none__" onSelect={() => handleSelect("")}>
                <span className="text-muted-foreground italic">None</span>
              </CommandItem>
              {canAddCustom && (
                <CommandItem
                  value={`__custom__${trimmed}`}
                  onSelect={() => handleSelect(trimmed)}
                >
                  <Plus className="mr-2 h-4 w-4 text-primary" />
                  <span>Use <span className="font-mono font-medium">&ldquo;{trimmed}&rdquo;</span></span>
                  <span className="ml-auto text-xs text-muted-foreground">not in records</span>
                </CommandItem>
              )}
              {filtered.map((c) => (
                <CommandItem
                  key={c.tagNumber}
                  value={`${c.tagNumber} ${c.nickname}`}
                  onSelect={() => handleSelect(c.tagNumber)}
                >
                  <span className="font-mono font-medium">{c.tagNumber}</span>
                  {c.nickname && <span className="ml-2 text-muted-foreground">({c.nickname})</span>}
                  <span className="ml-auto text-xs text-muted-foreground">{formatDate(c.dateOfBirth)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function CattleForm({ open, onOpenChange, cattle, allCattle, onSuccess }: CattleFormProps) {
  const router = useRouter()
  const isEditing = !!cattle
  const [saving, setSaving] = useState(false)
  const [sireTag, setSireTag] = useState(cattle?.sireTagNumber || "")
  const [damTag, setDamTag] = useState(cattle?.damTagNumber || "")

  const activeCattle = allCattle.filter((c) => c.status === "active" && c.tagNumber !== cattle?.tagNumber)

  useEffect(() => {
    if (open) {
      reset({
        tagNumber: cattle?.tagNumber || "",
        dateOfBirth: cattle?.dateOfBirth || "",
        sex: cattle?.sex || "female",
        breed: cattle?.breed || "Brahman",
        sireTagNumber: cattle?.sireTagNumber || "",
        damTagNumber: cattle?.damTagNumber || "",
        nickname: cattle?.nickname || "",
        birthWeight: cattle?.birthWeight || "",
        weaningWeight: cattle?.weaningWeight || "",
        status: cattle?.status || "active",
      })
      setSireTag(cattle?.sireTagNumber || "")
      setDamTag(cattle?.damTagNumber || "")
    }
  }, [open, cattle])

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      tagNumber: cattle?.tagNumber || "",
      dateOfBirth: cattle?.dateOfBirth || "",
      sex: cattle?.sex || "female",
      breed: cattle?.breed || "Brahman",
      sireTagNumber: cattle?.sireTagNumber || "",
      damTagNumber: cattle?.damTagNumber || "",
      nickname: cattle?.nickname || "",
      birthWeight: cattle?.birthWeight || "",
      weaningWeight: cattle?.weaningWeight || "",
      status: cattle?.status || "active",
    },
  })

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const payload = {
        ...values,
        sireTagNumber: sireTag,
        damTagNumber: damTag,
      }

      const url = isEditing ? `/api/cattle/${cattle.tagNumber}` : "/api/cattle"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save")
      }

      toast.success(isEditing ? "Cattle updated" : "Cattle added successfully")
      if (values.status === "sold" && cattle?.status !== "sold") {
        toast("Cattle marked as sold", {
          description: "Would you like to record the sale income?",
          action: {
            label: "Add Income",
            onClick: () => router.push("/finances"),
          },
          duration: Infinity,
        })
      }
      onSuccess()
      onOpenChange(false)
      reset()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save cattle")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Cattle" : "Add New Cattle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Required Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tagNumber">Tag Number *</Label>
              <Input id="tagNumber" {...register("tagNumber")} placeholder="e.g. B001" disabled={isEditing} />
              {errors.tagNumber && <p className="text-xs text-destructive">{errors.tagNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
              {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sex *</Label>
              <Select
                value={watch("sex")}
                onValueChange={(v) => setValue("sex", v as "male" | "female")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female (Cow/Heifer)</SelectItem>
                  <SelectItem value="male">Male (Bull/Steer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed">Breed *</Label>
              <Input id="breed" {...register("breed")} placeholder="Brahman" />
              {errors.breed && <p className="text-xs text-destructive">{errors.breed.message}</p>}
            </div>
          </div>

          {/* Sire/Dam */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sire (Father)</Label>
              <TagCombobox
                value={sireTag}
                onChange={setSireTag}
                cattle={activeCattle}
                label="sire"
                filterSex="male"
              />
            </div>
            <div className="space-y-2">
              <Label>Dam (Mother)</Label>
              <TagCombobox
                value={damTag}
                onChange={setDamTag}
                cattle={activeCattle}
                label="dam"
                filterSex="female"
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input id="nickname" {...register("nickname")} placeholder="Optional name" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v as FormValues["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="deceased">Deceased</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthWeight">Birth Weight (kg)</Label>
              <Input id="birthWeight" type="number" step="0.1" {...register("birthWeight")} placeholder="0.0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weaningWeight">Weaning Weight (kg)</Label>
              <Input id="weaningWeight" type="number" step="0.1" {...register("weaningWeight")} placeholder="0.0" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Cattle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
