"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { FarmSettings } from "@/types"

const schema = z.object({
  farmName: z.string().min(1, "Farm name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email("Invalid email").optional().or(z.literal("")).default(""),
  website: z.string().optional().default(""),
})

type FormValues = z.infer<typeof schema>

interface SettingsFormProps {
  initialSettings: FarmSettings
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      farmName: initialSettings.farmName || "",
      ownerName: initialSettings.ownerName || "",
      address: initialSettings.address || "",
      phone: initialSettings.phone || "",
      email: initialSettings.email || "",
      website: initialSettings.website || "",
    },
  })

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Farm settings saved successfully")
      router.refresh()
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Farm Information */}
      <Card>
        <CardHeader>
          <CardTitle>Farm Information</CardTitle>
          <CardDescription>Basic details about your farm.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="farmName">Farm Name *</Label>
              <Input id="farmName" {...register("farmName")} placeholder="e.g. Santos Ranch" />
              {errors.farmName && <p className="text-xs text-destructive">{errors.farmName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name *</Label>
              <Input id="ownerName" {...register("ownerName")} placeholder="e.g. Juan Santos" />
              {errors.ownerName && <p className="text-xs text-destructive">{errors.ownerName.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} placeholder="Farm address" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" {...register("phone")} placeholder="+63 912 345 6789" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" {...register("email")} placeholder="farm@example.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" {...register("website")} placeholder="https://www.myfarm.com" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="min-w-[120px]">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </form>
  )
}
