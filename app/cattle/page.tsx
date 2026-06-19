import { getAllCattle } from "@/lib/data"
import { CattleTable } from "@/components/cattle/CattleTable"
import { Beef } from "lucide-react"

export default function CattlePage() {
  const cattle = getAllCattle()

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Beef className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Cattle Herd</h1>
        </div>
        <p className="text-muted-foreground">Manage your cattle records.</p>
      </div>
      <CattleTable cattle={cattle} />
    </div>
  )
}
