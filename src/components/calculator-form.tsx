"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Search, Trash2, Check, User, Save, Calculator, Loader2, PackageOpen, Percent
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, where, getDocs, type Firestore } from "firebase/firestore";

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

interface CustomerSimple {
  id: string;
  tradeName: string;
  companyName: string;
}

export function CalculatorForm() {
  const { products, categories, getCategoryNameById, globalSettings, addQuote } = useAppContext();
  const { toast } = useToast();
  let db: Firestore;

  // --- ESTADOS ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<SaleProduct[]>([]);
  
  const [customers, setCustomers] = useState<CustomerSimple[]>([]);
  const [templates, setTemplates] = useState<ProductKit[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  
  // --- A FONTE DA VERDADE DO KIT ---
  // Se for !== null, significa que estamos no "Modo Kit" e obedecemos esse valor cegamente.
  const [kitFixedPrice, setKitFixedPrice] = useState<number | null>(null);
  const [kitFixedCost, setKitFixedCost] = useState<number | null>(null);

  // Parâmetro do Vendedor
  const [discountPct, setDiscountPct] = useState(0); 

  // Parâmetros Globais (Apenas para análise de lucro, NÃO afetam o preço do Kit)
  const dolarRate = globalSettings.exchangeRateUSD;
  const simplesPct = globalSettings.simplesNacionalTax / 100;
  const commissionPct = globalSettings.salesCommission / 100; 
  const targetMarginPct = globalSettings.marginFee / 100; // Só usado para itens avulsos

  // --- 1. CARREGAR DADOS ---
  useEffect(() => {
    const { db: firestoreDb } = initializeFirebase();
    db = firestoreDb;

    const qCustomers = query(collection(db, "customers"), orderBy("tradeName"));
    const unsubCustomers = onSnapshot(qCustomers, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, tradeName: d.data().tradeName || d.data().companyName, companyName: d.data().companyName })));
    }, (error) => console.error(error));

    const fetchTemplates = async () => {
      try {
        const qTemplates = query(collection(db, "product_kits"), where("type", "==", "TEMPLATE"));
        const snapshot = await getDocs(qTemplates);
        setTemplates(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ProductKit[]);
      } catch (e) { console.error(e); }
    };
    fetchTemplates();

    return () => unsubCustomers();
  }, []);
  
  // --- 2. CARREGAR TEMPLATE (LÓGICA BLINDADA) ---
  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
  
    // 1. Carrega Produtos
    const recoveredItems: SaleProduct[] = template.items.map(kitItem => {
      const fullProduct = products.find(p => p.id === kitItem.id);
      return fullProduct ? { ...fullProduct } : (kitItem as SaleProduct);
    }).filter((p): p is SaleProduct => !!p);
    setSelectedProducts(recoveredItems);

    // 2. Carrega Custo (Engenharia)
    if (template.costCalculation?.totalLanded) {
        setKitFixedCost(template.costCalculation.totalLanded);
    } else {
        // Fallback: Se o kit for antigo e não tiver custo salvo, recalculamos na hora
        // Isso evita "NaN" ou zeros.
        let fallbackCost = 0;
        recoveredItems.forEach(p => fallbackCost += (p.costUSD || 0));
        setKitFixedCost(fallbackCost * dolarRate * 1.85); 
    }

    // 3. Carrega Preço (Engenharia) - SEM CÁLCULOS EXTRAS
    if (template.pricingStrategy?.suggestedPrice) {
        setKitFixedPrice(template.pricingStrategy.suggestedPrice);
        toast({
            title: "Kit Carregado",
            description: `Preço Tabela: ${formatCurrency(template.pricingStrategy.suggestedPrice, 'BRL')}`
        });
    } else {
        // Se o kit não tem preço salvo (antigo), avisamos e forçamos o recálculo
        setKitFixedPrice(null); 
        toast({
            title: "Atenção",
            description: "Este kit não tem preço fixo salvo. O sistema calculou um sugerido.",
            variant: "destructive"
        });
    }

    setDiscountPct(0);
  };
  
  // --- 3. CÁLCULO DE CUSTO ---
  const currentTotalCost = useMemo(() => {
    // Se temos um custo de kit travado, usa ele.
    if (kitFixedCost !== null) return kitFixedCost;

    // Senão, calcula avulso (Fallback)
    let totalUSD = 0;
    selectedProducts.forEach(product => totalUSD += product.costUSD || 0);
    return totalUSD * dolarRate * 1.85; 
  }, [selectedProducts, dolarRate, kitFixedCost]);

  // --- 4. PREÇO DE TABELA (A LÓGICA DO PREÇO) ---
  const tablePrice = useMemo(() => {
    // CENÁRIO A: É UM KIT?
    // Retorna o valor exato do banco de dados. Sem "mais imposto", sem "mais margem".
    // É o valor puro que a engenharia mandou.
    if (kitFixedPrice !== null) {
      return kitFixedPrice;
    }
    
    // CENÁRIO B: ITENS AVULSOS (Recalcula do zero)
    // Aqui sim aplicamos as margens globais porque não existe um "preço definido".
    const totalFixedCosts = globalSettings.financialFee + globalSettings.bdiFee;
    const variableRates = simplesPct + commissionPct + targetMarginPct;
    const divisor = 1 - variableRates;
    return divisor > 0 ? (currentTotalCost + totalFixedCosts) / divisor : 0;
  }, [kitFixedPrice, currentTotalCost, simplesPct, commissionPct, targetMarginPct, globalSettings]);

  // --- 5. APLICAR DESCONTO ---
  const handleDiscountChange = (value: number) => {
    const maxDiscount = globalSettings.salesDiscount || 5;
    if (value > maxDiscount) {
        setDiscountPct(maxDiscount);
        toast({ title: "Limite atingido", description: `Máximo permitido: ${maxDiscount}%`, variant: "destructive" });
    } else {
        setDiscountPct(value < 0 ? 0 : value);
    }
  };

  // Preço Final = Preço Tabela (Puro) - Desconto
  const finalPrice = tablePrice * (1 - (discountPct / 100));
  
  // --- 6. ANÁLISE DE LUCRO (Apenas Informativo) ---
  // Isso não muda o preço, apenas mostra pro vendedor quanto sobra.
  const profitAnalysis = useMemo(() => {
    if (finalPrice <= 0) return { margin: 0, value: 0 };
    
    // O que sai do bolso na venda:
    const taxesValue = finalPrice * simplesPct;      // Imposto sobre a venda
    const commissionValue = finalPrice * commissionPct; // Comissão
    const fixedValue = globalSettings.financialFee + globalSettings.bdiFee; // Custo Fixo

    // Lucro = Preço Final - Custo Produto - Imposto Venda - Comissão - Custo Fixo
    const profitValue = finalPrice - currentTotalCost - taxesValue - commissionValue - fixedValue;
    
    return {
        value: profitValue,
        margin: profitValue / finalPrice
    };
  }, [finalPrice, currentTotalCost, simplesPct, commissionPct, globalSettings]);


  // --- SAVE ---
  const handleSaveProposal = async () => {
    if (selectedProducts.length === 0) return toast({ title: "Erro", description: "Selecione produtos.", variant: "destructive" });
    if (!selectedCustomerId) return toast({ title: "Erro", description: "Selecione um cliente.", variant: "destructive" });

    setIsSaving(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      
      await addQuote({
        customerId: selectedCustomerId,
        customerName: customer?.tradeName || "Cliente",
        items: selectedProducts.map(p => ({ id: p.id, name: p.name, costUSD: p.costUSD })),
        totals: {
            totalLanded: currentTotalCost,
            suggestedPrice: finalPrice, 
            marginPct: profitAnalysis.margin,
            profitValue: profitAnalysis.value
        },
        params: { dolarRate, simplesPct, commissionPct },
        status: "DRAFT",
        stage: "PROPOSAL",
        createdAt: Date.now(),
        number: `PROP-${Date.now().toString().slice(-6)}`
      });

      toast({ title: "Proposta Salva!", description: "Disponível no Pipeline." });
      
      // Reset
      setDiscountPct(0);
      setSelectedProducts([]);
      setSelectedCustomerId("");
      setKitFixedPrice(null);
      setKitFixedCost(null);
    } catch (e) { 
        toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive"});
    } 
    finally { setIsSaving(false); }
  };
  
  // UI Helpers
  const toggleProductSelection = (product: SaleProduct) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      const newSelection = exists ? prev.filter(p => p.id !== product.id) : [...prev, product];
      
      // Se mexeu nos itens, o kit deixa de ser kit.
      if (kitFixedPrice !== null) {
          setKitFixedPrice(null);
          setKitFixedCost(null);
          toast({ title: "Personalizado", description: "Kit modificado. Preços recalculados (Modo Avulso)."});
      }
      return newSelection;
    });
    setDiscountPct(0);
  };

  const clearSelection = () => {
    setSelectedProducts([]);
    setDiscountPct(0);
    setKitFixedPrice(null);
    setKitFixedCost(null);
  }

  const { groupedProducts } = useMemo(() => {
    let filtered = products;
    if (searchQuery) filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterCategory !== "all") filtered = filtered.filter((p) => p.categoryId === filterCategory);
    const groups: Record<string, SaleProduct[]> = {};
    filtered.forEach((p) => {
      const c = p.categoryId || 'uncategorized';
      if (!groups[c]) groups[c] = [];
      groups[c].push(p);
    });
    return { groupedProducts: groups };
  }, [products, searchQuery, filterCategory]);


  return (
    <div className="space-y-6 pb-24">
      
      {/* CLIENTE */}
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Dados da Proposta</CardTitle></CardHeader>
        <CardContent>
             <Label>Cliente</Label>
             <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
               <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
               <SelectContent>{customers.map(c => (<SelectItem key={c.id} value={c.id}>{c.tradeName}</SelectItem>))}</SelectContent>
             </Select>
        </CardContent>
      </Card>

      {/* TEMPLATES */}
      {templates.length > 0 && (
          <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-primary">
              <PackageOpen className="w-5 h-5" />
              <div><span className="font-bold text-sm block">Carregar Kit (Engenharia)</span></div>
            </div>
            <Select onValueChange={handleLoadTemplate}>
                <SelectTrigger className="w-[300px] bg-white"><SelectValue placeholder="Selecione um Kit..." /></SelectTrigger>
                <SelectContent>{templates.map(t => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
      )}

      {/* LISTAGEM (Visualização) */}
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
         
         <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto border rounded p-2 bg-slate-50/50">
            {Object.entries(groupedProducts).map(([catId, items]) => (
                <div key={catId}>
                    <div className="font-bold text-xs text-slate-500 bg-slate-100 p-1 mb-1">{getCategoryNameById(catId)}</div>
                    {items.map(p => {
                         const isSelected = selectedProducts.some(s => s.id === p.id);
                         return (
                            <div key={p.id} onClick={() => toggleProductSelection(p)} 
                                className={`flex justify-between p-2 text-sm cursor-pointer border-b hover:bg-slate-100 ${isSelected ? 'bg-primary/10' : ''}`}>
                                <span>{p.name}</span>
                                <span className="font-mono text-slate-600">{formatCurrency(p.costUSD, 'USD')}</span>
                            </div>
                         )
                    })}
                </div>
            ))}
         </div>
      </div>

      {/* PAINEL DE FECHAMENTO (SIMPLIFICADO E CORRETO) */}
      <Card className="bg-slate-900 text-white border-slate-800 shadow-xl sticky bottom-4 z-20">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex justify-between items-center text-primary-foreground text-lg">
            <span className="flex items-center gap-2"><Calculator className="w-5 h-5" /> Fechamento</span>
            <div className="text-sm font-normal text-slate-400">
               {/* Informativo apenas */}
               Custo Base: {formatCurrency(currentTotalCost, 'BRL')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            {/* 1. PREÇO DE TABELA (IMUTÁVEL SE FOR KIT) */}
            <div className="space-y-2">
                <Label className="text-slate-300">Preço Tabela Sugerido</Label>
                <Input 
                    readOnly 
                    className="bg-slate-800 border-slate-700 text-white text-lg font-bold" 
                    value={formatCurrency(tablePrice, 'BRL')} 
                />
                {kitFixedPrice !== null && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3"/> Fixado pela Engenharia
                    </span>
                )}
            </div>

            {/* 2. DESCONTO (ÚNICA VARIÁVEL DO VENDEDOR) */}
            <div className="space-y-2">
                <Label className="text-primary font-bold">Desconto (%)</Label>
                 <div className="relative">
                    <Input type="number" className="bg-primary/10 border-primary/50 text-primary text-xl font-bold h-12"
                        value={discountPct} onChange={(e) => handleDiscountChange(Number(e.target.value))} />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                </div>
            </div>

            {/* 3. PREÇO FINAL */}
            <div className="space-y-2 text-right">
                <Label className="text-primary font-bold">PREÇO FINAL</Label>
                <div className="text-3xl font-bold text-primary">{formatCurrency(finalPrice, 'BRL')}</div>
                 
                 {/* Análise de Lucro Real (Informativo) */}
                 <div className={`text-xs px-1 ${profitAnalysis.margin < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    Margem Real na Venda: {(profitAnalysis.margin * 100).toFixed(2)}%
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
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-5 h-5 mr-2" />} Salvar
            </Button>
        </CardFooter>
      </Card>

    </div>
  );
}
