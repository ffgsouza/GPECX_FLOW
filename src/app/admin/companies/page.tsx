
import { CompanyTable } from "@/components/company-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompaniesPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Empresas (Emissores)</CardTitle>
          <CardDescription>
            Gerencie as entidades legais (CNPJs) que podem emitir propostas. O faturamento acumulado é usado para monitorar os limites do Simples Nacional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyTable />
        </CardContent>
      </Card>
    </div>
  );
}
