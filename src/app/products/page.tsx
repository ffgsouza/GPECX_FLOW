import { ProductTable } from "@/components/product-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            Manage your products and their base costs here. These products will be available in the calculator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductTable />
        </CardContent>
      </Card>
    </div>
  );
}
