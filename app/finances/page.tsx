import { getAllFinances, getAllCattle } from "@/lib/data"
import { FinanceTable } from "@/components/finances/FinanceTable"
import { DollarSign } from "lucide-react"

export default function FinancesPage() {
  const records = getAllFinances()
  const allCattle = getAllCattle()

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Finances</h1>
        </div>
        <p className="text-muted-foreground">Track income and expenses for your farm operation.</p>
      </div>
      <FinanceTable records={records} allCattle={allCattle} />
    </div>
  )
}
