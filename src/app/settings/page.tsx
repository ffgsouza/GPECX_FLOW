import SettingsForm from "@/components/settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Configurações Globais</CardTitle>
          <CardDescription>
            Ajuste as variáveis globais de importação e as taxas de venda. Estes valores serão usados em todos os cálculos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm />
        </CardContent>
      </Card>
    </div>
  );
}
