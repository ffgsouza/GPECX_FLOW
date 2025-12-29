
import { CustomerTable } from "@/components/customer-table";

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes (CRM)</h1>
          <p className="text-muted-foreground mt-2">Gerencie sua base de clientes para emissão de propostas.</p>
      </div>
      <CustomerTable />
    </div>
  );
}
