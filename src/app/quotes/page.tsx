import { QuoteBuilder } from "@/components/quote-builder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function QuotesPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Configurador de Orçamento</CardTitle>
          <CardDescription>
            Selecione um equipamento principal e adicione os acessórios para montar um orçamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuoteBuilder />
        </CardContent>
      </Card>
    </div>
  );
}
