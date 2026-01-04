"use client";

import { useEffect, useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { 
  Container, DollarSign, TrendingUp, TrendingDown, Loader2 
} from "lucide-react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useAppContext } from "@/context/app-context";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Quote } from "@/lib/types";


interface ProcurementItem extends Quote {
    // A interface Quote já contém quase tudo que precisamos
}

export default function ProcurementPage() {
  const { toast } = useToast();
  const { db } = useAppContext();
  const [orders, setOrders] = useState<ProcurementItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProcurementItem | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [inputDolar, setInputDolar] = useState(0);
  const [inputCustoTotal, setInputCustoTotal] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!db) return;

    const q = query(
        collection(db, "quotes"), 
        where("procurementStatus", "in", ["OPEN", "IN_TRANSIT", "COMPLETED"])
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
      })) as ProcurementItem[];
      setOrders(data);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching procurement orders: ", error);
        setLoading(false);
        toast({ title: "Erro ao buscar ordens", variant: "destructive" });
    });

    return () => unsub();
  }, [db, toast]);

  const handleCalculateReal = async () => {
    if (!selectedOrder || !db) return;
    setIsSaving(true);

    const salePrice = selectedOrder.totals.suggestedPrice;
    const realProfit = salePrice - inputCustoTotal - (salePrice * selectedOrder.params.simplesPct) - (salePrice * selectedOrder.params.commissionPct);

    try {
      await updateDoc(doc(db, "quotes", selectedOrder.id), {
        procurementStatus: "COMPLETED",
        realData: {
            dolar: inputDolar,
            totalCost: inputCustoTotal,
            profit: realProfit
        }
      });
      toast({ title: "Sucesso!", description: "Apuração de custos reais foi salva." });
      setSelectedOrder(null);
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao salvar apuração", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const openDialog = (order: ProcurementItem) => {
    setSelectedOrder(order);
    setInputDolar(order.realData?.dolar || order.params.dolarRate);
    setInputCustoTotal(order.realData?.totalCost || order.totals.totalLanded);
  };

  if (loading) {
    return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary"/> Carregando Ordens de Compra...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Container className="w-6 h-6 text-orange-600"/> Gestão de Importação & Compras
          </CardTitle>
          <CardDescription>
            Aqui confrontamos a "Estimativa da Venda" com a "Realidade da Importação".
            Registre os custos reais das Invoices e DIs para apurar o lucro verdadeiro.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Cliente / Proposta</TableHead>
                <TableHead>Preço Travado (R$)</TableHead>
                <TableHead>Custo Estimado (Venda)</TableHead>
                <TableHead>Lucro Projetado</TableHead>
                <TableHead className="bg-orange-50 text-orange-800">Lucro Real (Apurado)</TableHead>
                <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                            Nenhuma ordem de compra aberta. Vendas ganhas no Pipeline aparecerão aqui.
                        </TableCell>
                    </TableRow>
                ) : orders.map(order => {
                    const profitDiff = (order.realData?.profit || 0) - order.totals.profitValue;
                    const isBetter = profitDiff >= 0;
                    
                    return (
                    <TableRow key={order.id}>
                        <TableCell>
                            <div className="font-bold">{order.customerData.tradeName}</div>
                            <div className="text-xs text-gray-400">{order.number}</div>
                        </TableCell>
                        <TableCell className="font-mono">{formatCurrency(order.totals.suggestedPrice, 'BRL')}</TableCell>
                        <TableCell className="font-mono text-gray-500">{formatCurrency(order.totals.totalLanded, 'BRL')}</TableCell>
                        <TableCell className="font-mono text-blue-600">{formatCurrency(order.totals.profitValue, 'BRL')}</TableCell>
                        
                        <TableCell className="bg-orange-50/50">
                            {order.procurementStatus === 'COMPLETED' && order.realData ? (
                                <div className="flex flex-col">
                                    <span className={`font-bold font-mono ${isBetter ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {formatCurrency(order.realData.profit || 0, 'BRL')}
                                    </span>
                                    <span className={`text-[10px] flex items-center gap-1 ${isBetter ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {isBetter ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                                        {formatCurrency(profitDiff, 'BRL')}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-gray-400 italic text-xs">Pendente Apuração</span>
                            )}
                        </TableCell>

                        <TableCell className="text-right">
                            {order.procurementStatus === 'COMPLETED' ? (
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Finalizado</Badge>
                            ) : (
                                <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedOrder(null)}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" onClick={() => openDialog(order)}>
                                            <Container className="w-4 h-4 mr-2"/> Apurar Custos
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Apuração Real de Importação</DialogTitle>
                                        </DialogHeader>
                                        {selectedOrder && <div className="space-y-4 py-4">
                                            <div className="p-4 bg-blue-50 rounded border border-blue-100 text-sm mb-4">
                                                <p><strong>Meta de Venda:</strong> Preço fixo de {formatCurrency(selectedOrder.totals.suggestedPrice, 'BRL')}.</p>
                                                <p>O custo estimado foi {formatCurrency(selectedOrder.totals.totalLanded, 'BRL')}.</p>
                                            </div>

                                            <div className="grid gap-2">
                                                <label className="text-sm font-bold">Dólar de Fechamento (R$)</label>
                                                <Input 
                                                    type="number" 
                                                    value={inputDolar} 
                                                    onChange={e => setInputDolar(Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-bold">Custo Total Real (Landed Cost)</label>
                                                <p className="text-xs text-gray-500">Soma de Invoice (convertida) + II + IPI/PIS/COFINS + Taxas Siscomex + Despesas Despachante.</p>
                                                <Input 
                                                    type="number" 
                                                    value={inputCustoTotal} 
                                                    onChange={e => setInputCustoTotal(Number(e.target.value))}
                                                />
                                            </div>
                                        </div>}
                                        <DialogFooter>
                                            <Button onClick={handleCalculateReal} disabled={isSaving} className="bg-orange-600 hover:bg-orange-700">
                                                {isSaving ? "Salvando..." : "Salvar Apuração Real"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </TableCell>
                    </TableRow>
                    );
                })}
            </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
