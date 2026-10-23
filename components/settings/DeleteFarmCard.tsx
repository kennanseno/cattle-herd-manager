"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DeleteFarmCardProps {
  farmName: string
}

export function DeleteFarmCard({ farmName }: DeleteFarmCardProps) {
  const router = useRouter()
  const [confirmationName, setConfirmationName] = useState("")
  const [acknowledged, setAcknowledged] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  const canDelete = confirmationName === farmName && acknowledged && !deleting

  async function deleteFarm() {
    setDeleting(true)
    setError("")
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmName: confirmationName }),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(result?.error || "We couldn't delete your farm. Please try again.")
      }

      toast.success("Farm and account deleted.")
      router.replace("/")
      router.refresh()
    } catch (deleteError) {
      const message = deleteError instanceof Error
        ? deleteError.message
        : "We couldn't delete your farm. Please try again."
      setError(message)
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Delete Farm</CardTitle>
        <CardDescription>
          Permanently delete this farm workspace, all records stored for it, and your sign-in account.
          This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This only removes data in this app&apos;s Supabase workspace. It does not access or delete
          data stored outside this app.
        </p>
        <div className="space-y-2">
          <Label htmlFor="delete-farm-name">Type <span className="font-semibold text-foreground">{farmName}</span> to confirm</Label>
          <Input
            id="delete-farm-name"
            autoComplete="off"
            value={confirmationName}
            onChange={(event) => setConfirmationName(event.target.value)}
            placeholder={farmName}
            disabled={deleting}
          />
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            id="confirm-farm-deletion"
            checked={acknowledged}
            onCheckedChange={(checked) => setAcknowledged(checked === true)}
            disabled={deleting}
            className="mt-0.5"
          />
          <Label htmlFor="confirm-farm-deletion" className="font-normal leading-5">
            I understand this permanently deletes my account and all of this farm&apos;s app records.
          </Label>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button
          type="button"
          variant="destructive"
          disabled={!canDelete}
          onClick={deleteFarm}
        >
          {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          {deleting ? "Deleting farm…" : "Permanently delete farm"}
        </Button>
      </CardContent>
    </Card>
  )
}
