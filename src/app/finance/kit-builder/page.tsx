
import { KitBuilderForm } from "@/components/finance/kit-builder-form";

export default function KitBuilderPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
          <h1 className="text-3xl font-bold tracking-tight">Montagem de Kits</h1>
          <p className="text-muted-foreground mt-2">Crie e analise os custos de conjuntos de produtos para salvar como "Kits" para a equipe de vendas.</p>
      </div>
      <KitBuilderForm />
    </div>
  );
}
