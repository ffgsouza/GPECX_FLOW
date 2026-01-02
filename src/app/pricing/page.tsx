
import CalculatorForm from "@/components/calculator-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PricingPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Calculadora de Venda (Comercial)</CardTitle>
          <CardDescription>Selecione um cliente, carregue um kit padrão ou escolha itens avulsos para gerar uma proposta.</CardDescription>
        </CardHeader>
        <CardContent>
          <CalculatorForm />
        </CardContent>
      </Card>
    </div>
  );
}
