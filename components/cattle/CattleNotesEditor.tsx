"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, Check, X, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CattleNotesEditorProps {
  tagNumber: string
  initialNotes: string
}

export function CattleNotesEditor({ tagNumber, initialNotes }: CattleNotesEditorProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes)
  const [draft, setDraft] = useState(initialNotes)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/cattle/${encodeURIComponent(tagNumber)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: draft }),
      })
      if (!res.ok) throw new Error("Failed to save")
      setNotes(draft)
      setEditing(false)
      toast.success("Notes saved")
      startTransition(() => router.refresh())
    } catch {
      toast.error("Failed to save notes")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDraft(notes)
    setEditing(false)
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Notes
        </CardTitle>
        {!editing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => { setDraft(notes); setEditing(true) }}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            {notes ? "Edit" : "Add note"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add notes about this animal…"
              className="min-h-[120px] resize-y"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Check className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : notes ? (
          <p className="text-sm whitespace-pre-wrap text-foreground">{notes}</p>
        ) : (
          <p className="text-sm text-muted-foreground py-1">No notes yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
