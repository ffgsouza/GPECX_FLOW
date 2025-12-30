
import { KitBuilderSpreadsheet } from "@/components/finance/kit-builder-spreadsheet";

export default function KitBuilderPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
          <h1 className="text-3xl font-bold tracking-tight">Planilha de Análise de Custos</h1>
          <p className="text-muted-foreground mt-2">Simule um conjunto de produtos para analisar o custo nacionalizado detalhado (Landed Cost) e salvar "Kits" para a equipe comercial.</p>
      </div>
      <KitBuilderSpreadsheet />
    </div>
  );
}
