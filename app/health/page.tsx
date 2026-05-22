import { getAllHealth, getAllCattle } from "@/lib/data"
import { HealthTable } from "@/components/health/HealthTable"
import { Stethoscope } from "lucide-react"

export default function HealthPage() {
  const records = getAllHealth()
  const allCattle = getAllCattle()

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Stethoscope className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Health Records</h1>
        </div>
        <p className="text-muted-foreground">Track vaccinations, treatments, and veterinary visits.</p>
      </div>
      <HealthTable records={records} allCattle={allCattle} />
    </div>
  )
}
