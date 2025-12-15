import { CalculatorForm } from "@/components/calculator-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PricingPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Calculadora de Preços de Custo</CardTitle>
          <CardDescription>Selecione um ou mais itens do catálogo para simular o custo de importação (Landed Cost) e formar o preço de venda.</CardDescription>
        </CardHeader>
        <CardContent>
          <CalculatorForm />
        </CardContent>
      </Card>
    </div>
  );
}
