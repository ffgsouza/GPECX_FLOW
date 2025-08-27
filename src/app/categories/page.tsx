import { CategoryTable } from "@/components/category-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Categorias</CardTitle>
          <CardDescription>
            Gerencie as categorias dos seus produtos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryTable />
        </CardContent>
      </Card>
    </div>
  );
}
