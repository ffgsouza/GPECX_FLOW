import { CalculatorForm } from "@/components/calculator-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Calculadora de Preços</CardTitle>
          <CardDescription>Selecione um produto e insira a margem de lucro para calcular o preço final de venda.</CardDescription>
        </CardHeader>
        <CardContent>
          <CalculatorForm />
        </CardContent>
      </Card>
    </div>
  );
}
