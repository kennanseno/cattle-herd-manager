"use client"

import React from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts"
import { formatPHP } from "@/lib/utils"

export interface YearlyFinanceDatum {
  year: string
  income: number
  expense: number
  net: number
}

interface FinanceTrendChartProps {
  data: YearlyFinanceDatum[]
}

function TooltipContent({ payload, label }: any) {
  if (!payload || payload.length === 0) return null
  return (
    <div className="rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground">
      <div className="font-semibold">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{formatPHP(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function FinanceTrendChart({ data }: FinanceTrendChartProps) {
  const chartData = data.map((d) => ({ year: d.year, Income: d.income, Expense: d.expense, Net: d.net }))

  if (!data || data.length === 0) {
    return <div className="rounded-md border border-muted p-6 text-sm text-muted-foreground">No finance data available yet.</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Yearly finance trend</h3>
          <p className="text-xs text-muted-foreground">Income, expense, and net totals per year. Hover to inspect details.</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-green-600" /> Income</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" /> Expense</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" /> Net</span>
        </div>
      </div>

      <div className="h-60 w-full rounded-2xl border border-muted bg-card p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 12, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="year" tick={{ fill: "#374151" }} />
            <YAxis tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{ fill: "#374151" }} />
            <Tooltip content={<TooltipContent />} />
            <Legend />
            <Line type="monotone" dataKey="Income" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Expense" stroke="#dc2626" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Net" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} strokeDasharray="6 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
