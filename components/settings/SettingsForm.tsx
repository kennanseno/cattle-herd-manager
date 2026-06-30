"use client"

import { useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Upload, X } from "lucide-react"
import Image from "next/image"
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
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [logoPath, setLogoPath] = useState(initialSettings.logoPath || "")
  const [logoPreview, setLogoPreview] = useState(
    initialSettings.logoPath ? `/api/images/${initialSettings.logoPath.split("/").pop()}` : ""
  )

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
        body: JSON.stringify({ ...values, logoPath }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Farm settings saved successfully")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  async function uploadLogoFile(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setLogoPath(data.path)
      setLogoPreview(`/api/images/${data.filename}`)
      toast.success("Logo uploaded")
    } catch {
      toast.error("Failed to upload logo")
    } finally {
      setUploading(false)
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadLogoFile(file)
  }

  function handleLogoDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) uploadLogoFile(file)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Farm Logo</CardTitle>
          <CardDescription>Upload your farm logo. It will appear in the sidebar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`flex items-center gap-6 rounded-lg border-2 border-dashed p-4 transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleLogoDrop}
          >
            <div className="relative h-24 w-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted shrink-0">
              {logoPreview ? (
                <>
                  <Image src={logoPreview} alt="Farm logo" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => { setLogoPath(""); setLogoPreview("") }}
                    className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5 cursor-pointer hover:bg-background"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <span className="text-3xl">🐄</span>
              )}
            </div>
            <div>
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent transition-colors">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Upload Logo"}
                </div>
              </Label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WebP up to 5MB</p>
              <p className="mt-0.5 text-xs text-muted-foreground">or drag & drop an image here</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
