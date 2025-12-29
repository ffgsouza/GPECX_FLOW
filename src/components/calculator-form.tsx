"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { 
  Search, 
  Trash2, 
  Check, 
  Info,
  Package, 
  Cpu, 
  FileCode, 
  Briefcase,
  Filter,
  DollarSign,
  User,
  Save,
  Calculator
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
import { SaleProduct } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

interface CustomerSimple {
  id: string;
  tradeName: string;
  companyName: string;
}

export function CalculatorForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { 
    products, 
    categories, 
    productTypes, 
    getCategoryNameById,
    globalSettings
  } = useAppContext();

  // --- ESTADOS ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<SaleProduct[]>([]);
  
  const [customers, setCustomers] = useState<CustomerSimple[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Parâmetros de Venda
  const [dolarRate, setDolarRate] = useState(globalSettings.exchangeRateUSD);
  const [marginPct, setMarginPct] = useState(globalSettings.marginFee * 100);

  useEffect(() => {
    setDolarRate(globalSettings.exchangeRateUSD);
    setMarginPct(globalSettings.marginFee * 100);
  }, [globalSettings]);


  // --- CARREGAR CLIENTES ---
  useEffect(() => {
    const { db: firestoreDb } = initializeFirebase();
    db = firestoreDb;
    const q = query(collection(db, "customers"), orderBy("tradeName"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        tradeName: doc.data().tradeName || doc.data().companyName,
        companyName: doc.data().companyName
      }));
      setCustomers(data);
    }, (error) => {
      console.error("Erro ao buscar clientes: ", error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível buscar a lista de clientes para o seletor.",
        variant: "destructive"
      })
    });
    return () => unsubscribe();
  }, [toast]);

  // --- ENGINE DE CÁLCULO ---
  const calculationResult = useMemo(() => {
    if (selectedProducts.length === 0) {
      return {
        totalFOB_USD: 0,
        totalLanded_BRL: 0,
        suggestedPrice: 0,
        profit: 0
      };
    }
    
    const hardwareProductType = productTypes.find(pt => pt.name.toLowerCase().includes('hardware') && !pt.name.toLowerCase().includes('acess'));
    const accessoryProductType = productTypes.find(pt => pt.name.toLowerCase().includes('acess'));
    const softwareProductType = productTypes.find(pt => pt.name.toLowerCase().includes('software'));

    const hardwareItems = selectedProducts.filter(p => 
        p.productTypeId === hardwareProductType?.id || p.productTypeId === accessoryProductType?.id);
    const softwareItems = selectedProducts.filter(p => p.productTypeId === softwareProductType?.id);

    const hardwareFobUSD = hardwareItems.reduce((acc, p) => acc + p.costUSD, 0);
    const mainFreightUSD = hardwareItems.length > 0 ? globalSettings.freightCostUSD : 0;
    const hardwareCifBRL = (hardwareFobUSD + mainFreightUSD) * dolarRate;
    
    let hardwareLandedCost = 0;
    if (hardwareItems.length > 0) {
      const iiValue = hardwareCifBRL * globalSettings.hardware_importTaxII;
      const ipiBase = hardwareCifBRL + iiValue;
      const ipiValue = ipiBase * globalSettings.hardware_ipiTax;
      const pisValueHw = hardwareCifBRL * globalSettings.hardware_pisTax;
      const cofinsValueHw = hardwareCifBRL * globalSettings.hardware_cofinsTax;
      const custoPreICMS = hardwareCifBRL + iiValue + ipiValue + pisValueHw + cofinsValueHw;
      const icmsBase = custoPreICMS / (1 - globalSettings.hardware_icmsTax);
      const icmsValue = icmsBase * globalSettings.hardware_icmsTax;
      hardwareLandedCost = custoPreICMS + icmsValue;
    }

    let totalSoftwareNetCostBRL = 0;
    let softwareLandedCost = 0;
    softwareItems.forEach(item => {
        const softwareNetCostBRL = item.costUSD * dolarRate;
        totalSoftwareNetCostBRL += softwareNetCostBRL;
        const irrfGrossUpBase = softwareNetCostBRL / (1 - globalSettings.software_irpjTax);
        const irpjValue = irrfGrossUpBase * globalSettings.software_irpjTax;
        let pisCofinsSwValue = 0;
        if (!item.isSoftwarePisCofinsFree) {
            pisCofinsSwValue = softwareNetCostBRL * (globalSettings.software_pisTax + globalSettings.software_cofinsTax);
        }
        const iofValue = softwareNetCostBRL * globalSettings.software_iofTax;
        const issValue = softwareNetCostBRL * globalSettings.software_issTax;
        softwareLandedCost += softwareNetCostBRL + irpjValue + pisCofinsSwValue + iofValue + issValue;
    });

    const totalSwiftFee = softwareItems.length > 0 ? globalSettings.swiftFee : 0;
    softwareLandedCost += totalSwiftFee;
    
    const desconsolidacaoBRL = hardwareItems.length > 0 ? (globalSettings.desconsolidacaoUSD * dolarRate) : 0;
    const siscomexFee = hardwareItems.length > 0 ? globalSettings.taxaSiscomex : 0;
    const customsExpensesTotal = globalSettings.customsClearanceFee + globalSettings.technicalConsultingFee + globalSettings.storageFee + desconsolidacaoBRL + siscomexFee;
    
    const totalFOB_USD = hardwareFobUSD + softwareItems.reduce((acc, p) => acc + p.costUSD, 0);
    const totalLanded_BRL = hardwareLandedCost + softwareLandedCost + customsExpensesTotal;
    
    const divisor = 1 - (globalSettings.simplesNacionalTax + globalSettings.salesCommission + (marginPct/100) - globalSettings.salesDiscount);
    const suggestedPrice = (totalLanded_BRL + globalSettings.financialFee + globalSettings.bdiFee) / (divisor > 0 ? divisor : 1);
    const profit = suggestedPrice - totalLanded_BRL - (suggestedPrice * (globalSettings.simplesNacionalTax + globalSettings.salesCommission - globalSettings.salesDiscount)) - globalSettings.financialFee - globalSettings.bdiFee;

    return {
      totalFOB_USD,
      totalLanded_BRL,
      suggestedPrice,
      profit,
    };
  }, [selectedProducts, dolarRate, marginPct, productTypes, globalSettings]);

  // --- SALVAR PROPOSTA ---
  const handleSaveProposal = async () => {
    if (selectedProducts.length === 0) {
      toast({ title: "Atenção", description: "Selecione pelo menos um produto.", variant: "destructive" });
      return;
    }
    if (!selectedCustomerId) {
      toast({ title: "Atenção", description: "Selecione um cliente para a proposta.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      
      const proposalData = {
        customerId: selectedCustomerId,
        customerName: customer?.tradeName || "Cliente Desconhecido",
        items: selectedProducts.map(p => ({
          id: p.id,
          name: p.name,
          costUSD: p.costUSD,
          type: productTypes.find(t => t.id === p.productTypeId)?.name
        })),
        totals: calculationResult,
        params: {
          dolarRate,
          marginPct
        },
        status: "DRAFT", // Rascunho
        createdAt: Date.now(),
        number: `PROP-${Date.now().toString().slice(-6)}`
      };

      await addDoc(collection(db, "quotes"), proposalData);
      
      toast({ title: "Sucesso!", description: "Proposta salva com sucesso."});
      setSelectedProducts([]);
      // router.push("/admin/quotes"); // Futuramente, redirecionar para a lista de propostas
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Não foi possível salvar a proposta.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- LÓGICA DE FILTROS ---
  const { visibleProducts, activeHardwareName } = useMemo(() => {
    const hardwareTypeObj = productTypes.find(t => 
      t.name.toLowerCase().includes("hardware") && !t.name.toLowerCase().includes("acess")
    );
    const hardwareTypeId = hardwareTypeObj?.id || 'hardware';
    const getProductType = (p: SaleProduct) => p.productTypeId;

    let filtered = products;

    if (searchQuery) filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterType !== "all") filtered = filtered.filter((p) => getProductType(p) === filterType);
    if (filterCategory !== "all") filtered = filtered.filter((p) => p.categoryId === filterCategory);

    const selectedHardwares = selectedProducts.filter(p => getProductType(p) === hardwareTypeId);
    const selectedHardwareIds = selectedHardwares.map(p => p.id);
    const hasHardwareSelected = selectedHardwareIds.length > 0;

    let activeHwName = null;

    if (hasHardwareSelected) {
      activeHwName = selectedHardwares[0].name;
      if (selectedHardwares.length > 1) activeHwName += ` e outros...`;

      filtered = filtered.filter(product => {
        if (selectedHardwareIds.includes(product.id)) return true;
        const compatibleList = Array.isArray(product.compatibleWith) ? product.compatibleWith : [];
        const isCompatible = compatibleList.some((hwId: string) => selectedHardwareIds.includes(hwId));
        if (isCompatible) return true;
        if (getProductType(product) === hardwareTypeId) return false; 
        return false; 
      });
    }
    return { visibleProducts: filtered, activeHardwareName: activeHwName };
  }, [products, productTypes, searchQuery, filterType, filterCategory, selectedProducts]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, SaleProduct[]> = {};
    visibleProducts.forEach((product) => {
      const catId = product.categoryId || 'uncategorized';
      if (!groups[catId]) groups[catId] = [];
      groups[catId].push(product);
    });
    return groups;
  }, [visibleProducts]);

  const toggleProductSelection = (product: SaleProduct) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      return exists ? prev.filter(p => p.id !== product.id) : [...prev, product];
    });
  };

  // --- RENDER ---
  return (
    <div className="space-y-6">
      
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Dados da Proposta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className="text-sm font-medium mb-1 block">Cliente</label>
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
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-1 block">Dólar (PTAX)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                <Input 
                  type="number" 
                  className="pl-9" 
                  value={dolarRate} 
                  onChange={e => setDolarRate(Number(e.target.value))} 
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-1 block">Margem Alvo (%)</label>
              <div className="relative">
                <Input 
                  type="number" 
                  value={marginPct} 
                  onChange={e => setMarginPct(Number(e.target.value))} 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex-1 flex gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Buscar produtos..." 
                  className="pl-9" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
             <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
             </Select>
          </div>
          
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded border border-primary/20">
            <span className="text-sm font-bold text-primary">ITENS: {selectedProducts.length}</span>
          </div>
        </div>

        {activeHardwareName && (
          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
            <Info className="h-4 w-4" />
            <AlertTitle>Modo Guiado</AlertTitle>
            <AlertDescription>Filtrando compatíveis com <strong>{activeHardwareName}</strong>.</AlertDescription>
          </Alert>
        )}

        {Object.entries(groupedProducts).map(([catId, items]) => (
          <Card key={catId} className="overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b font-medium text-sm flex justify-between">
              <span>{getCategoryNameById(catId)}</span>
              <Badge variant="outline">{items.length}</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">FOB (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(product => {
                  const isSelected = selectedProducts.some(p => p.id === product.id);
                  return (
                    <TableRow 
                      key={product.id} 
                      onClick={() => toggleProductSelection(product)}
                      className={`cursor-pointer ${isSelected ? 'bg-primary/10' : ''}`}
                    >
                      <TableCell>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-white' : ''}`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.costUSD, 'USD')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900 text-white border-slate-800 sticky bottom-4 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calculator className="w-5 h-5" />
            Resumo da Proposta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-slate-400 uppercase">Custo FOB Total</p>
              <p className="text-xl font-mono">{formatCurrency(calculationResult.totalFOB_USD, 'USD')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Custo Nacionalizado (Final)</p>
              <p className="text-xl font-mono">{formatCurrency(calculationResult.totalLanded_BRL, 'BRL')}</p>
            </div>
             <div>
              <p className="text-xs text-primary/80 uppercase font-bold">Lucro Estimado</p>
              <p className="text-xl font-mono text-primary">
                {formatCurrency(calculationResult.profit, 'BRL')} 
                <span className="text-sm ml-1 opacity-70">({marginPct.toFixed(1)}%)</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase">Preço Final Sugerido</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(calculationResult.suggestedPrice, 'BRL')}</p>
            </div>
          </div>
        </CardContent>
        <Separator className="bg-slate-700" />
        <CardFooter className="pt-6 flex justify-end gap-3">
            <Button variant="outline" className="text-black" onClick={() => setSelectedProducts([])}>
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white font-bold"
              onClick={handleSaveProposal}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? "Salvando..." : "Salvar Proposta"}
            </Button>
        </CardFooter>
      </Card>

    </div>
  );
}