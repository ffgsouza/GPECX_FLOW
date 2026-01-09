import { RentalEquipmentTable } from "@/components/rental-equipment-table";

export default function RentalEquipmentsPage() {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Equipamentos de Locação (Ativos)</h1>
                <p className="text-muted-foreground mt-2">
                    Gerencie o inventário de máquinas e equipamentos disponíveis para aluguel.
                    Controle de número de série, calibração e manutenção.
                </p>
            </div>
            <RentalEquipmentTable />
        </div>
    );
}
