import { CategoryTable } from "@/components/category-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Categorias de Produto</CardTitle>
          <CardDescription>
            Gerencie as famílias ou grupos principais dos seus produtos. Ex: "Analisadores de TC/TP", "Testadores Universais".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryTable />
        </CardContent>
      </Card>
    </div>
  );
}
