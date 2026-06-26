import { getSettings } from "@/lib/data"
import { SettingsForm } from "@/components/settings/SettingsForm"
import { DataPortabilityCard } from "@/components/settings/DataPortabilityCard"
import { Settings } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Farm Settings</h1>
        </div>
        <p className="text-muted-foreground">Manage your farm information and preferences.</p>
      </div>
      <div className="space-y-6">
        <SettingsForm initialSettings={settings} />
        <DataPortabilityCard />
      </div>
    </div>
  )
}
