"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Info, ChevronsUpDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import type { FinanceRecord, Cattle } from "@/types"

const CATEGORIES_INCOME = ["Cattle Sale", "Milk Sale", "Stud Fee", "Government Subsidy", "Other Income"]
const CATEGORIES_EXPENSE = ["Feed", "Veterinary", "Medicine", "Labor", "Equipment", "Utilities", "Transport", "Breeding", "Other Expense"]

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().min(1, "Description is required"),
  notes: z.string().optional().default(""),
  relatedTagNumber: z.string().optional().default(""),
}).superRefine((data, ctx) => {
  if (data.type === "income" && data.category === "Cattle Sale" && !data.relatedTagNumber?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Tag number is required for cattle sales",
      path: ["relatedTagNumber"],
    })
  }
})

type FormValues = z.output<typeof schema>

interface FinanceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: FinanceRecord | null
  allCattle: Cattle[]
  onSuccess: () => void
}

export function FinanceForm({ open, onOpenChange, record, allCattle, onSuccess }: FinanceFormProps) {
  const router = useRouter()
  const isEditing = !!record
  const [saving, setSaving] = useState(false)
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      date: record?.date || "",
      type: record?.type || "expense",
      category: record?.category || "",
      amount: record?.amount?.toString() || "",
      description: record?.description || "",
      notes: record?.notes || "",
      relatedTagNumber: record?.relatedTagNumber || "",
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        date: record?.date || "",
        type: record?.type || "expense",
        category: record?.category || "",
        amount: record?.amount?.toString() || "",
        description: record?.description || "",
        notes: record?.notes || "",
        relatedTagNumber: record?.relatedTagNumber || "",
      })
    }
  }, [open, record])

  const txType = watch("type")
  const txCategory = watch("category")
  const relatedTag = watch("relatedTagNumber")
  const isCattleSale = txType === "income" && txCategory === "Cattle Sale"
  const categories = txType === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const url = isEditing ? `/api/finances/${record.id}` : "/api/finances"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, amount: parseFloat(values.amount) }),
      })

      if (!res.ok) throw new Error("Failed")
      toast.success(isEditing ? "Transaction updated" : "Transaction added")
      onSuccess()
      onOpenChange(false)
      reset()
      router.refresh()
    } catch {
      toast.error("Failed to save transaction")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup
              value={txType}
              onValueChange={(v) => setValue("type", v as "income" | "expense")}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income" className="font-normal text-green-600 dark:text-green-400 cursor-pointer">Income</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense" className="font-normal text-red-600 dark:text-red-400 cursor-pointer">Expense</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₱) *</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} placeholder="0.00" />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input id="description" {...register("description")} placeholder="Brief description..." />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="relatedTagNumber">
              {isCattleSale ? "Cattle Tag *" : "Related Cattle Tag"}
            </Label>
            {isCattleSale ? (
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn("w-full justify-between font-normal", !relatedTag && "text-muted-foreground")}
                  >
                    {relatedTag
                      ? (() => {
                          const c = allCattle.find((x) => x.tagNumber === relatedTag)
                          return c?.nickname ? `${c.tagNumber} — ${c.nickname}` : relatedTag
                        })()
                      : "Search cattle..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by tag or name..." />
                    <CommandList>
                      <CommandEmpty>No cattle found.</CommandEmpty>
                      <CommandGroup>
                        {allCattle
                          .filter((c) => c.status !== "archived")
                          .map((c) => (
                            <CommandItem
                              key={c.tagNumber}
                              value={`${c.tagNumber} ${c.nickname || ""}`}
                              onSelect={() => {
                                setValue("relatedTagNumber", c.tagNumber)
                                setTagPopoverOpen(false)
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", relatedTag === c.tagNumber ? "opacity-100" : "opacity-0")} />
                              <span className="font-mono font-semibold">{c.tagNumber}</span>
                              {c.nickname && <span className="ml-1.5 text-muted-foreground">— {c.nickname}</span>}
                              <span className={cn("ml-auto text-xs", c.status === "active" ? "text-green-600" : "text-muted-foreground")}>{c.status}</span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <Input
                id="relatedTagNumber"
                {...register("relatedTagNumber")}
                placeholder="Optional tag number..."
              />
            )}
            {errors.relatedTagNumber && <p className="text-xs text-destructive">{errors.relatedTagNumber.message}</p>}
            {isCattleSale && relatedTag?.trim() && (
              <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Remember to update the cattle record for <strong>{relatedTag.trim()}</strong> to <strong>Sold</strong> status.
                </span>
              </div>
            )}
            {isCattleSale && !relatedTag?.trim() && (
              <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Select the sold cattle above. Remember to also update that cattle&apos;s status to <strong>Sold</strong>.</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={2} placeholder="Additional notes..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
