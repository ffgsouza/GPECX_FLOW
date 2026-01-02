"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Search, Trash2, Check, Info, User, Save, Calculator, Loader2, PackageOpen, RefreshCw, Percent
} from "lucide-react";
import { collection, addDoc, query, orderBy, onSnapshot, where, getDocs, doc, getDoc, type Firestore } from "firebase/firestore";

import { initializeFirebase } from "@/firebase";
import { useAppContext } from "@/context/app-context";
import { SaleProduct, ProductKit } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FormField } from "./ui/form";


// --- TIPOS ---
interface CustomerSimple {
  id: string;
  tradeName: string;
  companyName: string;
}

export function CalculatorForm() {
  const { products, categories, productTypes, getCategoryNameById, globalSettings } = useAppContext();
  const { toast } = useToast();

  // --- ESTADOS GERAIS ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<SaleProduct[]>([]);
  
  const [customers, setCustomers] = useState<CustomerSimple[]>([]);
  const [templates, setTemplates] = useState<ProductKit[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // --- PARÂMETROS FINANCEIROS ---
  const [dolarRate, setDolarRate] = useState(globalSettings.exchangeRateUSD);
  const [simplesPct, setSimplesPct] = useState(globalSettings.simplesNacionalTax);
  const [commissionPct, setCommissionPct] = useState(globalSettings.salesCommission);
  
  // O Core do Bidirecional: Margem vs Preço
  const [marginPct, setMarginPct] = useState(globalSettings.marginFee); 
  const [manualPriceOverride, setManualPriceOverride] = useState<number | null>(null);

  // --- 1. CARREGAR DADOS INICIAIS (Clientes, Settings, Templates) ---
  useEffect(() => {
    const { db } = initializeFirebase();
    // Clientes
    const qCustomers = query(collection(db, "customers"), orderBy("tradeName"));
    const unsubCustomers = onSnapshot(qCustomers, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, tradeName: d.data().tradeName || d.data().companyName, companyName: d.data().companyName })));
    }, (error) => {
        console.error("Erro ao carregar clientes: ", error);
        toast({ title: "Erro ao carregar clientes", variant: "destructive" });
    });

    // Templates de Kits
    const fetchTemplates = async () => {
      try {
        const qTemplates = query(collection(db, "product_kits"), where("type", "==", "TEMPLATE"));
        const snapshot = await getDocs(qTemplates);
        setTemplates(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ProductKit[]);
      } catch (e) { 
        console.error("Erro ao carregar templates", e);
        toast({ title: "Erro ao carregar templates", variant: "destructive" });
      }
    };
    fetchTemplates();

    return () => unsubCustomers();
  }, [toast]);
  
  // Sincronizar com as configurações globais quando elas mudarem
  useEffect(() => {
    setDolarRate(globalSettings.exchangeRateUSD);
    setSimplesPct(globalSettings.simplesNacionalTax);
    setCommissionPct(globalSettings.salesCommission);
    setMarginPct(globalSettings.marginFee);
  }, [globalSettings])

  // --- 2. CARREGAR TEMPLATE (RESET PREÇO TABELA) ---
  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const recoveredItems: SaleProduct[] = template.items.map(kitItem => {
      const fullProduct = products.find(p => p.id === kitItem.id);
      return fullProduct ? { ...fullProduct } : (kitItem as SaleProduct);
    });

    setSelectedProducts(recoveredItems);
    setManualPriceOverride(null); // Reseta qualquer preço manual para usar a margem padrão (Preço Tabela)
    toast({
        title: "Template Carregado!",
        description: `O kit "${template.name}" foi carregado na sua seleção.`
    });
  };

  // --- 3. ENGINE DE CÁLCULO (Custo Landed) ---
  const custoTotalLanded = useMemo(() => {
    let total = 0;
    selectedProducts.forEach(product => {
      const costUSD = product.costUSD || 0;
      const typeObj = productTypes.find(t => t.id === product.productTypeId);
      const typeName = typeObj?.name.toLowerCase() || "";
      const isHardware = typeName.includes("hardware") || typeName.includes("acess");
      
      const costBRL = costUSD * dolarRate;
      // Estimativas rápidas de custo de entrada (Landed)
      const multiplier = isHardware ? 1.85 : 1.40; // Ex: 85% impostos HW, 40% SW
      total += costBRL * multiplier; // Atenção: Isso é uma simplificação. O ideal é a lógica completa.
    });
    return total;
  }, [selectedProducts, dolarRate, productTypes]);

  // --- 4. LÓGICA BIDIRECIONAL (Margem <-> Preço) ---
  
  // A. Preço Calculado (Baseado na Margem)
  const calculatedPriceByMargin = useMemo(() => {
    // Fórmula: Preço = Custo / (1 - (Impostos + Comissão + Margem))
    const taxesRate = (simplesPct + commissionPct + marginPct);
    const divisor = 1 - taxesRate;
    return divisor > 0 ? (custoTotalLanded + globalSettings.financialFee + globalSettings.bdiFee) / divisor : 0;
  }, [custoTotalLanded, simplesPct, commissionPct, marginPct, globalSettings]);

  // B. Preço Final (O que vale)
  const finalPrice = manualPriceOverride !== null ? manualPriceOverride : calculatedPriceByMargin;

  // C. Função para mudar o Preço Manualmente (Recalcula Margem)
  const handlePriceChange = (newPrice: number) => {
    setManualPriceOverride(newPrice);
    if (newPrice > 0 && custoTotalLanded > 0) {
      // Engenharia Reversa: Margem = 1 - (CustoTotal / Preço) - Impostos - Comissão
      const divisor = newPrice - globalSettings.financialFee - globalSettings.bdiFee;
      const costRatio = divisor > 0 ? custoTotalLanded / divisor : 0;
      const otherTaxes = simplesPct + commissionPct;
      const newMargin = (1 - costRatio - otherTaxes);
      setMarginPct(parseFloat((newMargin).toFixed(4))); // Atualiza a margem visualmente
    }
  };

  // D. Função para mudar a Margem Manualmente (Recalcula Preço)
  const handleMarginChange = (newMargin: number) => {
    setMarginPct(newMargin);
    setManualPriceOverride(null); // Remove o override para voltar a ser calculado pela fórmula
  };

  // --- 5. RESULTADOS FINAIS ---
  const resultados = {
    custo: custoTotalLanded,
    impostosVendaValor: finalPrice * simplesPct,
    comissaoValor: finalPrice * commissionPct,
    lucroValor: finalPrice - custoTotalLanded - (finalPrice * (simplesPct + commissionPct)) - globalSettings.financialFee - globalSettings.bdiFee,
    precoFinal: finalPrice
  };

  // --- SAVE ---
  const handleSaveProposal = async () => {
    if (selectedProducts.length === 0) {
        toast({ title: "Atenção", description: "Selecione produtos para a proposta.", variant: "destructive" });
        return;
    }
    if (!selectedCustomerId) {
        toast({ title: "Atenção", description: "Selecione um cliente.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    try {
      const { db } = initializeFirebase();
      const customer = customers.find(c => c.id === selectedCustomerId);
      await addDoc(collection(db, "quotes"), {
        customerId: selectedCustomerId,
        customerName: customer?.tradeName || "Cliente",
        items: selectedProducts.map(p => ({
          id: p.id, name: p.name, costUSD: p.costUSD,
          type: productTypes.find(t => t.id === p.productTypeId)?.name
        })),
        totals: {
            totalLanded: resultados.custo,
            suggestedPrice: resultados.precoFinal,
            marginPct: marginPct,
            profitValue: resultados.lucroValor
        },
        params: { dolarRate, simplesPct, commissionPct },
        status: "DRAFT",
        createdAt: Date.now(),
        number: `PROP-${Date.now().toString().slice(-6)}`
      });
      toast({ title: "Proposta Salva!", description: "A nova proposta foi registrada." });
      setManualPriceOverride(null);
      setSelectedProducts([]);
      setSelectedCustomerId("");
    } catch (e) { 
        toast({ title: "Erro ao Salvar", description: "Não foi possível registrar a proposta.", variant: "destructive"});
    } 
    finally { setIsSaving(false); }
  };
  
  const { visibleProducts, groupedProducts } = useMemo(() => {
    let filtered = products;
    if (searchQuery) filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterCategory !== "all") filtered = filtered.filter((p) => p.categoryId === filterCategory);
    
    const groups: Record<string, SaleProduct[]> = {};
    filtered.forEach((product) => {
      const catId = product.categoryId || 'uncategorized';
      if (!groups[catId]) groups[catId] = [];
      groups[catId].push(product);
    });
    return { visibleProducts: filtered, groupedProducts: groups };
  }, [products, searchQuery, filterCategory]);

  const toggleProductSelection = (product: SaleProduct) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      return exists ? prev.filter(p => p.id !== product.id) : [...prev, product];
    });
    setManualPriceOverride(null); // Reseta o preço manual ao mudar a seleção
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* 1. SELEÇÃO E PARÂMETROS BÁSICOS */}
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Dados da Proposta</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <Label>Cliente</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{customers.map(c => (<SelectItem key={c.id} value={c.id}>{c.tradeName}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Dólar (R$)</Label>
              <Input type="number" value={dolarRate} onChange={e => setDolarRate(Number(e.target.value))} />
            </div>
             <div className="md:col-span-2">
              <Label>Imp. Venda (%)</Label>
              <Input type="number" value={simplesPct * 100} onChange={e => setSimplesPct(Number(e.target.value) / 100)} />
            </div>
             <div className="md:col-span-2">
              <Label>Comissão (%)</Label>
              <Input type="number" value={commissionPct * 100} onChange={e => setCommissionPct(Number(e.target.value) / 100)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. ACELERADOR (TEMPLATES) */}
      {templates.length > 0 && (
          <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-primary">
              <PackageOpen className="w-5 h-5" />
              <div><span className="font-bold text-sm block">Carregar Preço de Tabela (Template)</span></div>
            </div>
            <Select onValueChange={handleLoadTemplate}>
                <SelectTrigger className="w-[300px] bg-white"><SelectValue placeholder="Selecione um Kit..." /></SelectTrigger>
                <SelectContent>{templates.map(t => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
      )}

      {/* 3. LISTAGEM DE PRODUTOS (Resumida) */}
      <div className="space-y-4">
         <div className="flex gap-4">
             <Input placeholder="Buscar produtos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1" />
             <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
             </Select>
         </div>
         
         <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto border rounded p-2 bg-slate-50/50">
            {Object.keys(groupedProducts).length > 0 ? Object.entries(groupedProducts).map(([catId, items]) => (
                <div key={catId}>
                    <div className="font-bold text-xs text-slate-500 bg-slate-100 p-1.5 mb-1 sticky top-0">{getCategoryNameById(catId)}</div>
                    {items.map(p => {
                         const isSelected = selectedProducts.some(s => s.id === p.id);
                         return (
                            <div key={p.id} onClick={() => toggleProductSelection(p)} 
                                className={`flex justify-between items-center p-2 text-sm cursor-pointer border-b hover:bg-slate-100 ${isSelected ? 'bg-primary/10' : ''}`}>
                                <span>{p.name}</span>
                                <div className="flex items-center gap-4">
                                  <span className="font-mono text-slate-600">{formatCurrency(p.costUSD, 'USD')}</span>
                                  <div className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'}`}>
                                    {isSelected && <Check className="w-3 h-3" />}
                                  </div>
                                </div>
                            </div>
                         )
                    })}
                </div>
            )) : <p className="text-center text-sm text-slate-500 py-8">Nenhum produto encontrado.</p>}
         </div>
      </div>

      {/* 4. PAINEL DE FECHAMENTO (BIDIRECIONAL) */}
      <Card className="bg-slate-900 text-white border-slate-800 shadow-xl sticky bottom-4 z-20">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex justify-between items-center text-primary text-lg">
            <span className="flex items-center gap-2"><Calculator className="w-5 h-5" /> Negociação & Fechamento</span>
            <div className="text-sm font-normal text-slate-400">
                Custo Landed Total: {formatCurrency(resultados.custo, 'BRL')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            {/* INPUT DE MARGEM */}
            <div className="space-y-2">
                <Label className="text-slate-300">Margem Alvo (%)</Label>
                <div className="relative">
                    <Input 
                        type="number" 
                        className="bg-slate-800 border-slate-700 text-white text-lg font-bold pr-8"
                        value={(marginPct * 100).toFixed(2)}
                        onChange={(e) => handleMarginChange(Number(e.target.value) / 100)}
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
                <p className="text-xs text-slate-500">Lucro Líq: {formatCurrency(resultados.lucroValor, 'BRL')}</p>
            </div>

            {/* ÍCONE DE CONVERSÃO */}
            <div className="hidden md:flex justify-center text-slate-600">
                <RefreshCw className="w-6 h-6 animate-pulse" />
            </div>

            {/* INPUT DE PREÇO FINAL (OVERRIDE) */}
            <div className="space-y-2">
                <Label className="text-primary font-bold">PREÇO FINAL (R$)</Label>
                <div className="relative">
                    <Input 
                        type="number" 
                        className="bg-primary/10 border-primary/50 text-primary text-2xl font-bold h-14"
                        value={resultados.precoFinal.toFixed(2)}
                        onChange={(e) => handlePriceChange(Number(e.target.value))}
                    />
                </div>
                <div className="flex justify-between text-xs text-slate-400 px-1">
                    <span>Impostos: {formatCurrency(resultados.impostosVendaValor, 'BRL')}</span>
                    <span>Comissão: {formatCurrency(resultados.comissaoValor, 'BRL')}</span>
                </div>
            </div>

          </div>
        </CardContent>
        <Separator className="bg-slate-800" />
        <CardFooter className="pt-4 flex justify-end gap-3 bg-slate-950/30">
            <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => {setSelectedProducts([]); setManualPriceOverride(null);}}>
              <Trash2 className="w-4 h-4 mr-2" /> Limpar
            </Button>
            <Button size="lg" className="bg-primary hover:bg-primary/90 font-bold px-8" onClick={handleSaveProposal} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-5 h-5 mr-2" />} Salvar Proposta
            </Button>
        </CardFooter>
      </Card>

    </div>
  );
}
