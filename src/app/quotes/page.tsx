import { QuoteTable } from "@/components/quote-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function QuotesPage() {
  return (
    <div className="flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Propostas Comerciais</h1>
            <p className="text-muted-foreground mt-2">Gerencie as propostas geradas, seus status e detalhes.</p>
        </div>
        <QuoteTable />
    </div>
  );
}
