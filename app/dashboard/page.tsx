import {
  getAllCattle, getAllBreeding, getAllFinances, getSettings,
} from "@/lib/data"
import { isCalf, daysUntil, formatDate, formatPHP, getAgeInYears, getAgeInMonths, calcCalvingDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import {
  Beef, Baby, Users, AlertTriangle, TrendingUp, TrendingDown, CalendarDays, Milk,
} from "lucide-react"
import { InfoTooltip } from "@/components/ui/info-tooltip"

export default function DashboardPage() {
  const allCattle = getAllCattle()
  const allBreeding = getAllBreeding()
  const allFinances = getAllFinances()
  const settings = getSettings()
  const cattleByTag = new Map(allCattle.map((c) => [c.tagNumber, c]))

  const activeCattle = allCattle.filter((c) => c.status === "active")
  const calves = activeCattle.filter((c) => isCalf(c.dateOfBirth))
  const bulls = activeCattle.filter((c) => c.sex === "male" && !isCalf(c.dateOfBirth))
  const cows = activeCattle.filter((c) => c.sex === "female" && !isCalf(c.dateOfBirth))

  // Upcoming calvings (pending, calving in next 60 days)
  const upcomingCalvings = allBreeding
    .filter((r) => r.status === "pending" && r.possibleCalvingDate)
    .map((r) => ({ ...r, daysLeft: daysUntil(r.possibleCalvingDate) }))
    .filter((r) => r.daysLeft <= 60)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  // Finance summary (all time)
  const { totalIncome, totalExpense } = allFinances.reduce(
    (totals, f) => {
      const amount = parseFloat(f.amount)
      if (f.type === "income") totals.totalIncome += amount
      if (f.type === "expense") totals.totalExpense += amount
      return totals
    },
    { totalIncome: 0, totalExpense: 0 },
  )
  const netBalance = totalIncome - totalExpense

  // Weaning alerts: calves aged 5–7 months (approaching or at weaning window)
  // and calves over 7 months still active (overdue)
  const weaningCalves = activeCattle
    .filter((c) => isCalf(c.dateOfBirth))
    .map((c) => ({ ...c, ageMonths: getAgeInMonths(c.dateOfBirth) }))
    .filter((c) => c.ageMonths >= 5)
    .sort((a, b) => b.ageMonths - a.ageMonths)

  // Alerts: females age > 4yr with no calving records OR last calving > 2yr ago
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  const latestCalvingByCow = allBreeding.reduce((acc, r) => {
    if (r.status !== "calved") return acc
    const date = r.possibleCalvingDate || r.breedDate
    if (!date) return acc

    const latest = acc.get(r.cowTagNumber)
    if (!latest || date > latest) {
      acc.set(r.cowTagNumber, date)
    }
    return acc
  }, new Map<string, string>())

  const alertCows = cows.filter((cow) => {
    if (getAgeInYears(cow.dateOfBirth) < 4) return false
    const lastCalving = latestCalvingByCow.get(cow.tagNumber)
    if (!lastCalving) return true
    return new Date(lastCalving) < twoYearsAgo
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{settings.ownerName ? `, ${settings.ownerName}` : ""}!
          {settings.farmName ? ` — ${settings.farmName}` : ""}
        </p>
      </div>

      {/* Herd Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Active", value: activeCattle.length, icon: Beef, color: "text-primary", href: "/cattle" },
          { label: "Calves (≤12 mo)", value: calves.length, icon: Baby, color: "text-amber-600", href: "/cattle" },
          { label: "Cows", value: cows.length, icon: Users, color: "text-pink-600", href: "/cattle" },
          { label: "Bulls", value: bulls.length, icon: Beef, color: "text-blue-600", href: "/cattle" },
        ].map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-full p-3 bg-muted ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Upcoming Calvings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Upcoming Calvings (next 60 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingCalvings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming calvings in the next 60 days.</p>
            ) : (
              <div className="space-y-3">
                {upcomingCalvings.map((r) => {
                  const cow = cattleByTag.get(r.cowTagNumber)
                  const calvingFrom = calcCalvingDate(r.breedDate)
                  const calvingTo = r.breedDateTo ? calcCalvingDate(r.breedDateTo) : null
                  const calvingDisplay = calvingTo ? `${formatDate(calvingFrom)} to ${formatDate(calvingTo)}` : formatDate(r.possibleCalvingDate)
                  return (
                    <div key={r.id} className="flex items-center justify-between">
                      <div>
                        <Link href={`/cattle/${encodeURIComponent(r.cowTagNumber)}`} className="font-mono font-semibold hover:underline text-primary">
                          {r.cowTagNumber}
                        </Link>
                        {cow?.nickname && <span className="text-muted-foreground ml-1 text-sm">({cow.nickname})</span>}
                        {r.sireTagNumber && (
                          <span className="text-muted-foreground ml-2 text-sm">
                            × <Link href={`/cattle/${encodeURIComponent(r.sireTagNumber)}`} className="font-mono font-semibold hover:underline text-primary">{r.sireTagNumber}</Link>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-muted-foreground">{calvingDisplay}</span>
                          {calvingTo && <span className="text-xs text-muted-foreground">Est. range</span>}
                        </div>
                        <Badge variant={r.daysLeft <= 14 ? "warning" : r.daysLeft < 0 ? "destructive" : "outline"}>
                          {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)}d overdue` : `${r.daysLeft}d`}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Finance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Finances (All Time)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <TrendingUp className="h-3.5 w-3.5" /> Income
              </span>
              <span className="font-semibold text-green-600">{formatPHP(totalIncome)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-red-600">
                <TrendingDown className="h-3.5 w-3.5" /> Expenses
              </span>
              <span className="font-semibold text-red-600">{formatPHP(totalExpense)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Net Balance</span>
              <span className={`font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {netBalance >= 0 ? "+" : "−"}{formatPHP(Math.abs(netBalance))}
              </span>
            </div>
            <Link href="/finances" className="block text-xs text-primary hover:underline text-center pt-1">
              View all transactions →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Weaning Soon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Milk className="h-4 w-4 text-primary" />
            Weaning Alerts ({weaningCalves.length})
            <InfoTooltip text={"Calves aged 5–7 months are approaching the weaning window.\nCalves over 7 months are overdue for weaning."} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weaningCalves.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No calves approaching weaning age yet.
            </p>
          ) : (
            <div className="space-y-2">
              {weaningCalves.map((calf) => {
                const isOverdue = calf.ageMonths > 7
                const ageStr = `${calf.ageMonths} month${calf.ageMonths !== 1 ? "s" : ""}`
                return (
                  <Link
                    key={calf.tagNumber}
                    href={`/cattle/${encodeURIComponent(calf.tagNumber)}`}
                    className="flex items-center justify-between rounded border px-3 py-2 hover:bg-muted transition-colors"
                  >
                    <span>
                      <span className="font-mono font-semibold">{calf.tagNumber}</span>
                      {calf.nickname && <span className="text-muted-foreground ml-2">({calf.nickname})</span>}
                      <span className="text-xs text-muted-foreground ml-2">born {formatDate(calf.dateOfBirth)}</span>
                    </span>
                    <Badge variant={isOverdue ? "warning" : "outline"} className="text-xs">
                      {isOverdue ? `${ageStr} — overdue` : `${ageStr} — wean soon`}
                    </Badge>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Breeding Alerts ({alertCows.length})
              <InfoTooltip text={"Shows active cows that are:\n• Over 4 years old with no calving record, OR\n• Have not calved in the last 2 years."} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertCows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No breeding alerts at this time.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  These cows are over 4 years old with no calving or haven&apos;t calved in over 2 years:
                </p>
                <div className="space-y-2">
                  {alertCows.map((cow) => (
                    <Link
                      key={cow.tagNumber}
                      href={`/cattle/${cow.tagNumber}`}
                      className="flex items-center justify-between rounded border px-3 py-2 hover:bg-muted transition-colors"
                    >
                      <span>
                        <span className="font-mono font-semibold">{cow.tagNumber}</span>
                        {cow.nickname && <span className="text-muted-foreground ml-2">({cow.nickname})</span>}
                      </span>
                      <Badge variant="warning" className="text-xs">
                        {getAgeInYears(cow.dateOfBirth)}y old
                      </Badge>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
