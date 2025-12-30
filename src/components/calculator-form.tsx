
"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Trash2, 
  User,
  Save,
  Calculator,
  Loader2,
  Wrench,
  Package
} from "lucide-react";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  type Firestore
} from "firebase/firestore";
import { useRouter } from "next/navigation";

import { initializeFirebase } from "@/firebase";
import { useAppContext } from "@/context/app-context";
import { ProductKit, SaleProduct } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

let db: Firestore;

// --- TIPOS AUXILIARES ---
interface CustomerSimple {
  id: string;
  tradeName: string;
  companyName: string;
}

export function CalculatorForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { 
    globalSettings
  } = useAppContext();

  // --- ESTADOS ---
  const [kits, setKits] = useState<ProductKit[]>([]);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);

  const [customers, setCustomers] = useState<CustomerSimple[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Parâmetros de Venda
  const [marginPct, setMarginPct] = useState(globalSettings.marginFee * 100);
  const [commissionPct, setCommissionPct] = useState(globalSettings.salesCommission * 100);
  const [simplesPct, setSimplesPct] = useState(globalSettings.simplesNacionalTax * 100);
  const [discountPct, setDiscountPct] = useState(globalSettings.salesDiscount * 100);

  // --- CARREGAR DADOS (CLIENTES E KITS) ---
  useEffect(() => {
    const { db: firestoreDb } = initializeFirebase();
    db = firestoreDb;
    
    // Carregar Clientes
    const qCustomers = query(collection(db, "customers"), orderBy("tradeName"));
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        tradeName: doc.data().tradeName || doc.data().companyName,
        companyName: doc.data().companyName
      }));
      setCustomers(data);
    }, (error) => {
      console.error("Erro ao carregar clientes: ", error);
      toast({ title: "Erro ao carregar clientes", variant: "destructive" });
    });

    // Carregar Kits
    const qKits = query(collection(db, "product_kits"), orderBy("createdAt", "desc"));
    const unsubKits = onSnapshot(qKits, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ProductKit[];
        setKits(data);
    }, (error) => {
      console.error("Erro ao carregar kits: ", error);
      toast({ title: "Erro ao carregar kits", variant: "destructive" });
    });


    return () => {
        unsubCustomers();
        unsubKits();
    };
  }, [toast]);

  const selectedKit = useMemo(() => {
    if (!selectedKitId) return null;
    return kits.find(k => k.id === selectedKitId) || null;
  }, [selectedKitId, kits]);

  // --- ENGINE DE CÁLCULO DE VENDA ---
  const calculationResult = useMemo(() => {
    const landedCost = selectedKit?.calculation?.totalGeral || 0;
    
    // Divisor de Mark-up
    const divisor = 1 - (
        (marginPct / 100) + 
        (commissionPct / 100) + 
        (simplesPct / 100) -
        (discountPct / 100)
    );

    const priceBeforeFees = divisor > 0 ? landedCost / divisor : landedCost;
    const finalPrice = priceBeforeFees + globalSettings.financialFee + globalSettings.bdiFee;

    const profit = finalPrice - landedCost - (finalPrice * (commissionPct/100)) - (finalPrice * (simplesPct/100)) - globalSettings.financialFee - globalSettings.bdiFee;

    return {
      landedCost,
      finalPrice,
      profit
    };
  }, [selectedKit, marginPct, commissionPct, simplesPct, discountPct, globalSettings]);

  // --- SALVAR PROPOSTA ---
  const handleSaveProposal = async () => {
    if (!selectedKit) {
      toast({ title: "Atenção", description: "Selecione um Kit de produtos.", variant: "destructive"});
      return;
    }
    if (!selectedCustomerId) {
      toast({ title: "Atenção", description: "Selecione um cliente para a proposta.", variant: "destructive"});
      return;
    }

    setIsSaving(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      
      const proposalData = {
        customerId: selectedCustomerId,
        customerName: customer?.tradeName || "Cliente Desconhecido",
        kitId: selectedKit.id,
        kitName: selectedKit.name,
        items: selectedKit.items,
        totals: {
            ...calculationResult,
            fobUSD: (selectedKit.calculation.fobHwUSD || 0) + (selectedKit.calculation.fobSwUSD || 0)
        },
        params: {
          marginPct,
          commissionPct,
          simplesPct,
          discountPct
        },
        status: "DRAFT",
        createdAt: Date.now(),
        number: `PROP-${Date.now().toString().slice(-6)}`
      };

      await addDoc(collection(db, "quotes"), proposalData);
      
      toast({ title: "Sucesso!", description: "Proposta salva com sucesso!"});
      setSelectedKitId(null);
      setSelectedCustomerId("");
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Erro ao salvar proposta.", variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  const renderParamInput = (label: string, value: number, setter: (val: number) => void) => (
    <div>
        <label className="text-xs text-slate-400 uppercase tracking-wider">{label}</label>
        <div className="relative">
            <Input 
            type="number" 
            value={value} 
            onChange={e => setter(Number(e.target.value))}
            className="bg-slate-800 border-slate-700 text-white"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
        </div>
    </div>
  );

  // --- RENDER ---
  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUNA ESQUERDA: DADOS DE ENTRADA */}
        <div className="space-y-6">
            <Card className="border-l-4 border-l-primary shadow-sm">
                <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    1. Cliente
                </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger>
                        <SelectValue placeholder="Selecione o Cliente..." />
                        </SelectTrigger>
                        <SelectContent>
                        {customers.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.tradeName}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-primary shadow-sm">
                <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary" />
                    2. Kit de Produtos
                </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedKitId || ""} onValueChange={setSelectedKitId}>
                        <SelectTrigger>
                        <SelectValue placeholder="Selecione o Kit..." />
                        </SelectTrigger>
                        <SelectContent>
                        {kits.map(k => (
                            <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedKit && (
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Itens no Kit "{selectedKit.name}"
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-right">Custo FOB</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedKit.items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.costUSD, "USD")}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="font-bold bg-muted">
                                    <TableCell>Total FOB</TableCell>
                                    <TableCell className="text-right">{formatCurrency((selectedKit.calculation.fobHwUSD || 0) + (selectedKit.calculation.fobSwUSD || 0), "USD")}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

        </div>

        {/* COLUNA DIREITA: CÁLCULO FINAL */}
        <Card className="bg-slate-900 text-white border-slate-800 shadow-lg sticky top-6">
            <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-primary">
                <Calculator className="w-5 h-5" />
                3. Preço de Venda Final
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                
                <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Custo Nacionalizado do Kit (Landed Cost)</p>
                    <p className="text-2xl font-mono">{formatCurrency(calculationResult.landedCost, 'BRL')}</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderParamInput("Margem (%)", marginPct, setMarginPct)}
                    {renderParamInput("Comissão (%)", commissionPct, setCommissionPct)}
                    {renderParamInput("Imposto (%)", simplesPct, setSimplesPct)}
                    {renderParamInput("Desconto (%)", discountPct, setDiscountPct)}
                </div>

                <Separator className="bg-slate-700" />
                
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs text-primary uppercase font-bold tracking-wider">Lucro Estimado</p>
                        <p className="text-2xl font-mono text-primary">
                            {formatCurrency(calculationResult.profit, 'BRL')} 
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Preço Final da Proposta</p>
                        <p className="text-4xl font-bold text-white tracking-tight">{formatCurrency(calculationResult.finalPrice, 'BRL')}</p>
                    </div>
                </div>


            </CardContent>
            <CardFooter className="pt-6 flex justify-end gap-3 bg-slate-900/50 border-t border-slate-800">
                <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white font-bold w-full"
                onClick={handleSaveProposal}
                disabled={isSaving || !selectedKit || !selectedCustomerId}
                >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2" />}
                {isSaving ? "Salvando..." : "Salvar Proposta"}
                </Button>
            </CardFooter>
        </Card>
      </div>

    </div>
  );
}

    