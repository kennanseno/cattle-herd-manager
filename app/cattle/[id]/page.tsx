import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getAllCattle } from "@/lib/data"
import { formatDate, getAgeInYears, getAgeInMonths, isCalf } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FamilyTree } from "@/components/cattle/FamilyTree"
import { CattleDetailActions } from "@/components/cattle/CattleDetailActions"
import { CattlePDFButton } from "@/components/cattle/CattlePDFButton"
import { CattlePhotoGallery } from "@/components/cattle/CattlePhotoGallery"
import { CattleNotesEditor } from "@/components/cattle/CattleNotesEditor"
import { ArrowLeft, Baby } from "lucide-react"
import type { Cattle } from "@/types"
import { getSettings } from "@/lib/data"

export default async function CattleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = decodeURIComponent(rawId)
  const allCattle = getAllCattle()
  const cattle = allCattle.find((c) => c.tagNumber === id)

  if (!cattle) notFound()

  const settings = getSettings()

  // Progeny: cattle that have this animal as sire or dam (exclude archived), sorted newest → oldest
  const progeny = allCattle
    .filter((c) => (c.sireTagNumber === cattle.tagNumber || c.damTagNumber === cattle.tagNumber) && c.status !== "archived")
    .sort((a, b) => b.dateOfBirth.localeCompare(a.dateOfBirth))

  function calvingInterval(earlier: string, later: string): string {
    const days = Math.round((new Date(later).getTime() - new Date(earlier).getTime()) / 86_400_000)
    return `${days} day${days !== 1 ? "s" : ""}`
  }

  function progenyAge(dob: string): string {
    const months = getAgeInMonths(dob)
    if (months < 1) {
      const days = Math.round((new Date().getTime() - new Date(dob).getTime()) / 86_400_000)
      return `${days}d old`
    }
    if (months < 12) return `${months}mo old`
    const years = Math.floor(months / 12)
    const rem = months % 12
    return rem > 0 ? `${years}yr ${rem}mo old` : `${years}yr old`
  }

  const ageMonths = getAgeInMonths(cattle.dateOfBirth)
  const ageYears = getAgeInYears(cattle.dateOfBirth)
  const remainingMonths = ageMonths - ageYears * 12
  const ageLabel = ageMonths < 12
    ? `${ageMonths} month${ageMonths !== 1 ? "s" : ""}`
    : remainingMonths > 0
      ? `${ageYears} year${ageYears !== 1 ? "s" : ""} ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`
      : `${ageYears} year${ageYears !== 1 ? "s" : ""}`

  const statusColors: Record<Cattle["status"], string> = {
    active: "success",
    sold: "secondary",
    deceased: "destructive",
    archived: "outline",
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/cattle"><ArrowLeft className="mr-2 h-4 w-4" />Back to Herd</Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-xl overflow-hidden border bg-muted flex items-center justify-center text-3xl shrink-0">
            {cattle.imagePath ? (
              <Image
                src={`/api/images/${cattle.imagePath.split("/").pop()}`}
                alt={cattle.tagNumber}
                fill
                className="object-cover"
              />
            ) : "🐄"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono">{cattle.tagNumber}</h1>
              {cattle.nickname && <span className="text-xl text-muted-foreground">({cattle.nickname})</span>}
              <Badge variant={statusColors[cattle.status] as "success" | "secondary" | "destructive" | "outline"}>{cattle.status}</Badge>
              {isCalf(cattle.dateOfBirth) && <Badge variant="warning">Calf</Badge>}
            </div>
            <p className="text-muted-foreground">
              <span className={cattle.sex === "male" ? "text-blue-500" : "text-pink-500"}>
                {cattle.sex === "male" ? "♂" : "♀"}
              </span>
              {" "}{cattle.sex === "male" ? "Male (Bull/Steer)" : "Female (Cow/Heifer)"} · {cattle.breed} · {ageLabel}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <CattlePDFButton cattle={cattle} allCattle={allCattle} settings={settings} />
          <CattleDetailActions cattle={cattle} allCattle={allCattle} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Tag Number", cattle.tagNumber],
              ["Nickname", cattle.nickname || "—"],
              ["Date of Birth", formatDate(cattle.dateOfBirth)],
              ["Age", ageLabel],
              ["Sex", cattle.sex === "male" ? "♂ Male" : "♀ Female"],
              ["Breed", cattle.breed],
              ["Birth Weight", cattle.birthWeight ? `${cattle.birthWeight} kg` : "—"],
              ["Weaning Weight", cattle.weaningWeight ? `${cattle.weaningWeight} kg` : "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Parents */}
        <Card>
          <CardHeader><CardTitle className="text-base">Parents</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Sire (Father)", cattle.sireTagNumber],
              ["Dam (Mother)", cattle.damTagNumber],
            ].map(([label, tag]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-muted-foreground">{label}</span>
                {tag ? (
                  <Link href={`/cattle/${tag}`} className="font-mono font-semibold text-primary hover:underline">
                    {tag}
                    {(() => {
                      const parent = allCattle.find((c) => c.tagNumber === tag)
                      return parent?.nickname ? ` (${parent.nickname})` : ""
                    })()}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Unknown</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Family Tree */}
      <Card className="mt-4">
        <CardContent>
          <FamilyTree cattle={cattle} allCattle={allCattle} />
        </CardContent>
      </Card>

      {/* Progeny */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Baby className="h-4 w-4" />
            Progeny ({progeny.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {progeny.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No progeny recorded in the herd.</p>
          ) : (
            <div className="space-y-1">
              {progeny.map((p, i) => (
                <div key={p.tagNumber}>
                  {i > 0 && (
                    <div className="flex items-center gap-2 py-1 px-1">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground shrink-0">
                        ↕ {calvingInterval(p.dateOfBirth, progeny[i - 1].dateOfBirth)} apart
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  <Link
                    href={`/cattle/${p.tagNumber}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold">{p.tagNumber}</span>
                      {p.nickname && <span className="text-muted-foreground">({p.nickname})</span>}
                      <Badge variant="outline" className={`text-xs ${p.sex === "male" ? "border-blue-400 text-blue-500" : "border-pink-400 text-pink-500"}`}>
                        {p.sex === "male" ? "♂ Male" : "♀ Female"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {p.sireTagNumber === cattle.tagNumber ? "Sire" : "Dam"}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{formatDate(p.dateOfBirth)}</div>
                      <div className="text-xs text-muted-foreground">{progenyAge(p.dateOfBirth)}</div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <CattleNotesEditor
        tagNumber={cattle.tagNumber}
        initialNotes={cattle.notes || ""}
      />

      {/* Photo Gallery */}
      <CattlePhotoGallery
        tagNumber={cattle.tagNumber}
        initialPhotos={(cattle.photos || "").split(",").map((p) => p.trim()).filter(Boolean)}
      />
    </div>
  )
}
