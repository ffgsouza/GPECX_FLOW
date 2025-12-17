
import { FiscalMonitor } from "@/components/dashboard/fiscal-monitor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral e insights sobre sua operação.</p>
        </div>
        <FiscalMonitor />
    </div>
  );
}
