"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CattlePhotoGalleryProps {
  tagNumber: string
  initialPhotos: string[]
}

export function CattlePhotoGallery({ tagNumber, initialPhotos }: CattlePhotoGalleryProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function photoUrl(p: string) {
    const filename = p.split("/").pop() || ""
    return `/api/images/${encodeURIComponent(filename)}`
  }

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return
    setUploading(true)
    for (const file of files) {
      try {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch(`/api/cattle/${encodeURIComponent(tagNumber)}/photos`, {
          method: "POST",
          body: fd,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Upload failed")
        setPhotos((prev) => [...prev, data.path])
        toast.success(`${file.name} uploaded`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`)
      }
    }
    setUploading(false)
  }, [tagNumber])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const filename = deleteTarget.split("/").pop() || ""
      const res = await fetch(
        `/api/cattle/${encodeURIComponent(tagNumber)}/photos/${encodeURIComponent(filename)}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Delete failed")
      setPhotos((prev) => prev.filter((p) => p !== deleteTarget))
      toast.success("Photo removed")
    } catch {
      toast.error("Failed to remove photo")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Photos ({photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop zone */}
          <div
            className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer
              ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"}`}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))
              uploadFiles(files)
            }}
          >
            {uploading
              ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              : <Upload className="h-8 w-8 text-muted-foreground" />
            }
            <p className="text-sm text-muted-foreground">
              {uploading ? "Uploading…" : "Drag & drop photos here, or click to select"}
            </p>
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP · max 5 MB each</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  uploadFiles(Array.from(e.target.files))
                  e.target.value = ""
                }
              }}
            />
          </div>

          {/* Gallery grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo}
                  className="relative group aspect-square rounded-lg overflow-hidden bg-muted border"
                >
                  <Image
                    src={photoUrl(photo)}
                    alt="Cattle photo"
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="object-cover"
                  />
                  <button
                    onClick={() => setDeleteTarget(photo)}
                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              The photo will be permanently deleted and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
