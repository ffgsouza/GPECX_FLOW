import { VendorTable } from "@/components/vendor-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VendorsPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Vendedores</CardTitle>
          <CardDescription>
            Gerencie os usuários que podem elaborar e assinar propostas comerciais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VendorTable />
        </CardContent>
      </Card>
    </div>
  );
}
