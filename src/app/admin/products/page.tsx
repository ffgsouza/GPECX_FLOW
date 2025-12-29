
import { ProductTable } from "@/components/product-table";

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos e Serviços</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus produtos, licenças de software e serviços. Estes itens estarão disponíveis na calculadora.</p>
      </div>
      <ProductTable />
    </div>
  );
}
