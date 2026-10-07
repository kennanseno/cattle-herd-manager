"use client"

import { useState } from "react"
import { Eye, EyeOff, TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatPHP } from "@/lib/utils"
import Link from "next/link"

interface FinanceSummaryCardProps {
  totalIncome: number
  totalExpense: number
  netBalance: number
}

export function FinanceSummaryCard({ totalIncome, totalExpense, netBalance }: FinanceSummaryCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const amountClassName = isVisible ? "" : "blur-sm select-none"

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Finances (All Time)
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label={isVisible ? "Hide financial amounts" : "Show financial amounts"}
            aria-pressed={isVisible}
            title={isVisible ? "Hide financial amounts" : "Show financial amounts"}
            onClick={() => setIsVisible((visible) => !visible)}
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <TrendingUp className="h-3.5 w-3.5" /> Income
          </span>
          <span className={`font-semibold text-green-600 ${amountClassName}`}>{formatPHP(totalIncome)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm text-red-600">
            <TrendingDown className="h-3.5 w-3.5" /> Expenses
          </span>
          <span className={`font-semibold text-red-600 ${amountClassName}`}>{formatPHP(totalExpense)}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Net Balance</span>
          <span className={`font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"} ${amountClassName}`}>
            {netBalance >= 0 ? "+" : "−"}{formatPHP(Math.abs(netBalance))}
          </span>
        </div>
        <Link href="/finances" className="block text-xs text-primary hover:underline text-center pt-1">
          View all transactions →
        </Link>
      </CardContent>
    </Card>
  )
}