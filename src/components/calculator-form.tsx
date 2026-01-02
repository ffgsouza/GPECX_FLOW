"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Search, Trash2, Check, Info, User, Save, Calculator, Loader2, PackageOpen, RefreshCw, Percent, Tag
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, where, getDocs } from "firebase/firestore";

import { initializeFirebase } from "@/firebase";
import { useAppContext } from "@/context/app-context";
import { SaleProduct, ProductKit } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


// --- TIPOS ---
interface CustomerSimple {
  id: string;
  tradeName: string;
  companyName: string;
}

export function CalculatorForm() {
  const { products, categories, getCategoryNameById, globalSettings, addQuote } = useAppContext();
  const { toast } = useToast();

  // --- ESTADOS GERAIS ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<SaleProduct[]>([]);
  
  const [customers, setCustomers] = useState<CustomerSimple[]>([]);
  const [templates, setTemplates] = useState<ProductKit[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Novo estado para guardar o preço do template carregado
  const [templateTablePrice, setTemplateTablePrice] = useState<number | null>(null);

  // --- PARÂMETROS FINANCEIROS (DO VENDEDOR) ---
  const [discountPct, setDiscountPct] = useState(0); 

  // --- PARÂMETROS FINANCEIROS (DO FINANCEIRO - GLOBAL SETTINGS) ---
  const dolarRate = globalSettings.exchangeRateUSD;
  const simplesPct = globalSettings.simplesNacionalTax / 100;
  const targetMarginPct = globalSettings.marginFee / 100;
  const commissionPct = globalSettings.salesCommission / 100; 

  // --- 1. CARREGAR DADOS INICIAIS (Clientes, Templates) ---
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
  
  // --- 2. CARREGAR TEMPLATE ---
  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
  
    const recoveredItems: SaleProduct[] = template.items.map(kitItem => {
      const fullProduct = products.find(p => p.id === kitItem.id);
      return fullProduct ? { ...fullProduct } : (kitItem as SaleProduct);
    }).filter((p): p is SaleProduct => !!p);
  
    setSelectedProducts(recoveredItems);
    // GUARDA O PREÇO DE TABELA DO TEMPLATE
    setTemplateTablePrice(template.pricingStrategy?.suggestedPrice || null);
    setDiscountPct(0); // Reseta o desconto
    
    toast({
      title: "Template Carregado!",
      description: `O kit "${template.name}" e seu preço de tabela foram carregados.`
    });
  };
  
  // --- 3. ENGINE DE CÁLCULO (Custo Landed para itens avulsos) ---
  const custoTotalLanded = useMemo(() => {
    let total = 0;
    selectedProducts.forEach(product => {
      total += product.costUSD || 0;
    });
    return total * dolarRate; // Simplificação para o escopo da calculadora
  }, [selectedProducts, dolarRate]);

  // --- 4. LÓGICA DE PRECIFICAÇÃO (TOP-DOWN) ---

  // A. Preço de Tabela
  const tablePrice = useMemo(() => {
    // SE um template foi carregado, USE o preço dele.
    if (templateTablePrice !== null) {
      return templateTablePrice;
    }
    
    // SENÃO, calcule o preço para itens avulsos.
    const totalFixedCosts = globalSettings.financialFee + globalSettings.bdiFee;
    const variableRates = simplesPct + commissionPct + targetMarginPct;
    const divisor = 1 - variableRates;
    return divisor > 0 ? (custoTotalLanded + totalFixedCosts) / divisor : 0;
  }, [templateTablePrice, custoTotalLanded, simplesPct, commissionPct, targetMarginPct, globalSettings]);

  // Validação do Desconto
  const handleDiscountChange = (value: number) => {
    const maxDiscount = globalSettings.salesDiscount || 5;
    if (value > maxDiscount) {
        setDiscountPct(maxDiscount);
        toast({
            title: "Limite de Desconto Atingido",
            description: `O desconto máximo permitido é de ${maxDiscount}%.`,
            variant: "destructive"
        });
    } else {
        setDiscountPct(value < 0 ? 0 : value);
    }
  };

  // B. Preço Final com Desconto
  const finalPrice = tablePrice * (1 - (discountPct / 100));
  
  // C. Margem de Lucro Final (Resultado do Desconto)
  const finalMarginPct = useMemo(() => {
    if (finalPrice <= 0) return 0;
    const totalCosts = custoTotalLanded + globalSettings.financialFee + globalSettings.bdiFee;
    const totalVariableTaxesValue = finalPrice * (simplesPct + commissionPct);
    const profit = finalPrice - totalCosts - totalVariableTaxesValue;
    return finalPrice > 0 ? profit / finalPrice : 0;
  }, [finalPrice, custoTotalLanded, simplesPct, commissionPct, globalSettings]);


  // --- 5. RESULTADOS FINAIS ---
  const resultados = {
    custo: custoTotalLanded,
    impostosVendaValor: finalPrice * simplesPct,
    lucroValor: finalPrice > 0 ? finalPrice - (custoTotalLanded + (finalPrice * (simplesPct + commissionPct)) + globalSettings.financialFee + globalSettings.bdiFee) : 0,
    precoDeTabela: tablePrice,
    precoFinal: finalPrice,
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
      const customer = customers.find(c => c.id === selectedCustomerId);
      const quoteData = {
        customerId: selectedCustomerId,
        customerName: customer?.tradeName || "Cliente",
        items: selectedProducts.map(p => ({
          id: p.id, name: p.name, costUSD: p.costUSD
        })),
        totals: {
            totalLanded: resultados.custo,
            suggestedPrice: resultados.precoFinal,
            marginPct: finalMarginPct,
            profitValue: resultados.lucroValor
        },
        params: { dolarRate, simplesPct, commissionPct },
        status: "DRAFT" as const,
        stage: "PROPOSAL" as const,
        createdAt: Date.now(),
        number: `PROP-${Date.now().toString().slice(-6)}`
      };

      await addQuote(quoteData);

      toast({ title: "Proposta Salva!", description: "A nova proposta foi registrada." });
      setDiscountPct(0);
      setSelectedProducts([]);
      setSelectedCustomerId("");
      setTemplateTablePrice(null); // Limpa o preço do template
    } catch (e) { 
        toast({ title: "Erro ao Salvar", description: "Não foi possível registrar a proposta.", variant: "destructive"});
    } 
    finally { setIsSaving(false); }
  };
  
  const { groupedProducts } = useMemo(() => {
    let filtered = products;
    if (searchQuery) filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterCategory !== "all") filtered = filtered.filter((p) => p.categoryId === filterCategory);
    
    const groups: Record<string, SaleProduct[]> = {};
    filtered.forEach((product) => {
      const catId = product.categoryId || 'uncategorized';
      if (!groups[catId]) groups[catId] = [];
      groups[catId].push(product);
    });
    return { groupedProducts: groups };
  }, [products, searchQuery, filterCategory]);

  const toggleProductSelection = (product: SaleProduct) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      const newSelection = exists ? prev.filter(p => p.id !== product.id) : [...prev, product];

      // Se a seleção mudar, limpamos o preço do template
      if(templateTablePrice !== null) {
          setTemplateTablePrice(null);
      }
      
      return newSelection;
    });
    setDiscountPct(0); // Reseta o desconto ao mudar a seleção
  };

  const clearSelection = () => {
    setSelectedProducts([]);
    setDiscountPct(0);
    setTemplateTablePrice(null);
  }

  return (
    <div className="space-y-6 pb-24">
      
      {/* 1. SELEÇÃO E PARÂMETROS BÁSICOS */}
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Dados da Proposta</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-12">
              <Label>Cliente</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{customers.map(c => (<SelectItem key={c.id} value={c.id}>{c.tradeName}</SelectItem>))}</SelectContent>
              </Select>
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

      {/* 3. LISTAGEM DE PRODUTOS */}
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

      {/* 4. PAINEL DE FECHAMENTO */}
      <Card className="bg-slate-900 text-white border-slate-800 shadow-xl sticky bottom-4 z-20">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex justify-between items-center text-primary-foreground text-lg">
            <span className="flex items-center gap-2"><Calculator className="w-5 h-5" /> Negociação & Fechamento</span>
            <div className="text-sm font-normal text-slate-400">
                Custo Landed Total: {formatCurrency(resultados.custo, 'BRL')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            <div className="space-y-2">
                <Label className="text-slate-300">Preço de Tabela (R$)</Label>
                <div className="relative">
                    <Input 
                        type="text" 
                        readOnly
                        className="bg-slate-800 border-slate-700 text-white text-lg font-bold"
                        value={resultados.precoDeTabela.toFixed(2)}
                    />
                </div>
                <p className="text-xs text-slate-500">Margem Alvo (Financeiro): {(targetMarginPct * 100).toFixed(2)}%</p>
            </div>

            <div className="space-y-2">
                <Label className="text-primary font-bold">Desconto de Venda (%)</Label>
                 <div className="relative">
                    <Input 
                        type="number"
                        className="bg-primary/10 border-primary/50 text-primary text-xl font-bold h-12"
                        value={discountPct.toFixed(2)}
                        onChange={(e) => handleDiscountChange(Number(e.target.value))}
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                </div>
                 <p className="text-xs text-slate-400 text-center">Máximo: {globalSettings.salesDiscount}%</p>
            </div>

            <div className="space-y-2 text-right">
                <Label className="text-primary font-bold">PREÇO FINAL</Label>
                <div className="text-3xl font-bold text-primary">
                    {formatCurrency(resultados.precoFinal, 'BRL')}
                </div>
                 <div className="text-xs text-slate-400 px-1">
                    Lucro Final: {formatCurrency(resultados.lucroValor, 'BRL')} ({(finalMarginPct * 100).toFixed(2)}%)
                </div>
            </div>

          </div>
        </CardContent>
        <Separator className="bg-slate-800" />
        <CardFooter className="pt-4 flex justify-end gap-3 bg-slate-950/30">
            <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={clearSelection}>
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
