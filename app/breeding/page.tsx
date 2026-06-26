import { getAllBreeding, getAllCattle } from "@/lib/data"
import { BreedingTable } from "@/components/breeding/BreedingTable"
import { HeartPulse } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function BreedingPage() {
  const [records, allCattle] = await Promise.all([getAllBreeding(), getAllCattle()])

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <HeartPulse className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Breeding Records</h1>
        </div>
        <p className="text-muted-foreground">Track breeding events and expected calving dates (283-day gestation).</p>
      </div>
      <BreedingTable records={records} allCattle={allCattle} />
    </div>
  )
}
