import { ProductTable } from "@/components/product-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Produtos e Serviços</CardTitle>
          <CardDescription>
            Gerencie seus produtos, licenças de software e serviços. Estes itens estarão disponíveis na calculadora.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductTable />
        </CardContent>
      </Card>
    </div>
  );
}
