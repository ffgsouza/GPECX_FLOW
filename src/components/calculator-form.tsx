
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
  Calculator,
  Loader2
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
  
  // Estado de Clientes
  const [customers, setCustomers] = useState<CustomerSimple[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Parâmetros de Venda (Padrões que podem vir de config)
  const [dolarRate, setDolarRate] = useState(globalSettings.exchangeRateUSD);
  const [marginPct, setMarginPct] = useState(globalSettings.marginFee * 100);

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
      console.error("Erro ao carregar clientes: ", error);
      toast({
          title: "Erro ao carregar clientes",
          description: "Não foi possível buscar a lista de clientes.",
          variant: "destructive"
      });
    });
    return () => unsubscribe();
  }, [toast]);

  // --- ENGINE DE CÁLCULO ---
  const calculationResult = useMemo(() => {
    let totalFOB_USD = 0;
    let totalLanded_BRL = 0;

    selectedProducts.forEach(product => {
      const costUSD = product.costUSD || 0;
      totalFOB_USD += costUSD;

      const typeObj = productTypes.find(t => t.id === product.productTypeId);
      const typeName = typeObj?.name.toLowerCase() || "";
      
      const isHardware = typeName.includes("hardware") || typeName.includes("acess");
      const isSoftware = typeName.includes("soft") || typeName.includes("licen");

      const costBRL = costUSD * dolarRate;
      let itemTaxBRL = 0;
      let landedCostItem = costBRL;

      if (isHardware) {
        const baseHw = costBRL;
        const taxII = baseHw * globalSettings.hardware_importTaxII;
        const baseIPI = baseHw + taxII;
        const taxIPI = baseIPI * globalSettings.hardware_ipiTax;
        const basePisCofins = baseHw;
        const taxPIS = basePisCofins * globalSettings.hardware_pisTax;
        const taxCOFINS = basePisCofins * globalSettings.hardware_cofinsTax;
        const baseICMS = (baseHw + taxII + taxIPI + taxPIS + taxCOFINS) / (1 - globalSettings.hardware_icmsTax);
        const taxICMS = baseICMS * globalSettings.hardware_icmsTax;
        landedCostItem = baseICMS;
      } else if (isSoftware) {
        const baseSw = costBRL;
        const baseIRRF = baseSw / (1 - globalSettings.software_irpjTax);
        const taxIRRF = baseIRRF - baseSw;
        const taxPIS = baseSw * globalSettings.software_pisTax;
        const taxCOFINS = baseSw * globalSettings.software_cofinsTax;
        const taxIOF = baseSw * globalSettings.software_iofTax;
        const taxISS = baseSw * globalSettings.software_issTax;
        landedCostItem = baseSw + taxIRRF + taxPIS + taxCOFINS + taxIOF + taxISS;
      }

      totalLanded_BRL += landedCostItem;
    });

    const divisor = 1 - (marginPct / 100);
    const suggestedPrice = totalLanded_BRL / (divisor > 0 ? divisor : 1);
    const profit = suggestedPrice - totalLanded_BRL;

    return {
      totalFOB_USD,
      totalLanded_BRL,
      suggestedPrice,
      profit
    };
  }, [selectedProducts, dolarRate, marginPct, productTypes, globalSettings]);

  // --- SALVAR PROPOSTA ---
  const handleSaveProposal = async () => {
    if (selectedProducts.length === 0) {
      toast({ title: "Atenção", description: "Selecione pelo menos um produto.", variant: "destructive"});
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
        status: "DRAFT",
        createdAt: Date.now(),
        number: `PROP-${Date.now().toString().slice(-6)}`
      };

      await addDoc(collection(db, "quotes"), proposalData);
      
      toast({ title: "Sucesso!", description: "Proposta salva com sucesso!"});
      setSelectedProducts([]);
      setSelectedCustomerId("");
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Erro ao salvar proposta.", variant: "destructive"});
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
    const getProductType = (p: any) => p.productTypeId;

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
      
      {/* 1. SELEÇÃO DE CLIENTE & PARÂMETROS */}
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Dados da Proposta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className="text-sm font-medium mb-1 block text-gray-700">Cliente</label>
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
              <label className="text-sm font-medium mb-1 block text-gray-700">Dólar (PTAX)</label>
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
              <label className="text-sm font-medium mb-1 block text-gray-700">Margem Alvo (%)</label>
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

      {/* 2. SELEÇÃO DE PRODUTOS (TABELA) */}
      <div className="space-y-4">
        {/* Cabeçalho de Filtros */}
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

        {/* Tabelas Agrupadas */}
        {Object.entries(groupedProducts).map(([catId, items]) => (
          <Card key={catId} className="overflow-hidden shadow-sm border">
            <div className="bg-gray-50 px-4 py-2 border-b font-medium text-sm flex justify-between items-center">
              <span className="font-semibold text-gray-700">{getCategoryNameById(catId)}</span>
              <Badge variant="secondary" className="font-normal">{items.length} itens</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
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
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted/50'}`}
                    >
                      <TableCell>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'}`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">{product.name}</TableCell>
                      <TableCell className="text-right font-mono text-gray-600">{formatCurrency(product.costUSD, 'USD')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ))}
      </div>

      {/* 3. PAINEL DE RESULTADOS (FOOTER FIXO OU FINAL) */}
      <Card className="bg-slate-900 text-white border-slate-800 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calculator className="w-5 h-5" />
            Resumo da Proposta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Custo FOB Total</p>
              <p className="text-xl font-mono">{formatCurrency(calculationResult.totalFOB_USD, 'USD')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Custo Nacionalizado (Est.)</p>
              <p className="text-xl font-mono">{formatCurrency(calculationResult.totalLanded_BRL, 'BRL')}</p>
            </div>
             <div>
              <p className="text-xs text-primary uppercase font-bold tracking-wider">Lucro Estimado</p>
              <p className="text-xl font-mono text-primary">
                {formatCurrency(calculationResult.profit, 'BRL')} 
                <span className="text-sm ml-2 opacity-70 font-sans">({marginPct}%)</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Preço Final Sugerido</p>
              <p className="text-3xl font-bold text-white tracking-tight">{formatCurrency(calculationResult.suggestedPrice, 'BRL')}</p>
            </div>
          </div>
        </CardContent>
        <Separator className="bg-slate-700" />
        <CardFooter className="pt-6 flex justify-end gap-3">
            <Button variant="outline" className="text-black bg-white hover:bg-gray-100 border-none" onClick={() => setSelectedProducts([])}>
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
