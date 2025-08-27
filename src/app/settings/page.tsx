import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure the global parameters for your price calculations.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
