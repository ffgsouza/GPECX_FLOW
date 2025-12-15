import { ProductTypeTable } from "@/components/product-type-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductTypesPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Item</CardTitle>
          <CardDescription>
            Defina a natureza fiscal e física de um item para controlar as regras de cálculo e os campos no cadastro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductTypeTable />
        </CardContent>
      </Card>
    </div>
  );
}
