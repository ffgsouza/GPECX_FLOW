import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Configure os parâmetros globais para seus cálculos de preço.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
