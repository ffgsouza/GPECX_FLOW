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
  
  // ESTADOS DE "FONTE DA VERDADE" DO KIT
  // Se estes estiverem preenchidos, o sistema usa eles em vez de recalcular
  const [templateTablePrice, setTemplateTablePrice] = useState<number | null>(null);
  const [templateLandedCost, setTemplateLandedCost] = useState<number | null>(null); // <--- NOVO: Trava o custo

  // Parâmetros Vendedor
  const [discountPct, setDiscountPct] = useState(0); 

  // Parâmetros Globais (Financeiro)
  const dolarRate = globalSettings.exchangeRateUSD;
  const simplesPct = globalSettings.simplesNacionalTax / 100;
  const targetMarginPct = globalSettings.marginFee / 100;
  const commissionPct = globalSettings.salesCommission / 100; 

  // --- 1. CARREGAR DADOS ---
  useEffect(() => {
    const { db: firestoreDb } = initializeFirebase();
    db = firestoreDb;

    const qCustomers = query(collection(db, "customers"), orderBy("tradeName"));
    const unsubCustomers = onSnapshot(qCustomers, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, tradeName: d.data().tradeName || d.data().companyName, companyName: d.data().companyName })));
    }, (error) => toast({ title: "Erro ao carregar clientes", variant: "destructive" }));

    const fetchTemplates = async () => {
      try {
        const qTemplates = query(collection(db, "product_kits"), where("type", "==", "TEMPLATE"));
        const snapshot = await getDocs(qTemplates);
        setTemplates(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ProductKit[]);
      } catch (e) { 
        console.error(e);
      }
    };
    fetchTemplates();

    return () => unsubCustomers();
  }, [toast]);
  
  // --- 2. CARREGAR TEMPLATE (CORE FIX) ---
  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
  
    // 1. Recupera produtos
    const recoveredItems: SaleProduct[] = template.items.map(kitItem => {
      const fullProduct = products.find(p => p.id === kitItem.id);
      return fullProduct ? { ...fullProduct } : (kitItem as SaleProduct);
    }).filter((p): p is SaleProduct => !!p);
  
    setSelectedProducts(recoveredItems);

    // 2. CORREÇÃO CRÍTICA: Carrega o PREÇO e o CUSTO salvos pela engenharia
    // O sistema agora não "chuta" mais o custo. Ele usa o que foi calculado tecnicamente.
    if (template.pricingStrategy?.suggestedPrice) {
        setTemplateTablePrice(template.pricingStrategy.suggestedPrice);
    } else {
        setTemplateTablePrice(null); // Fallback para kits legados
    }

    if (template.calculation?.totalGeral) {
        setTemplateLandedCost(template.calculation.totalGeral);
    } else {
        setTemplateLandedCost(null); // Fallback recalcula se não houver registro
    }

    setDiscountPct(0);
    
    toast({
      title: "Template Carregado!",
      description: `Kit "${template.name}": Preço e Custos de Engenharia aplicados.`
    });
  };
  
  // --- 3. ENGINE DE CÁLCULO DE CUSTO ---
  const custoTotalLanded = useMemo(() => {
    // REGRA DE OURO: Se veio do Kit (Engenharia), usa o custo do Kit.
    if (templateLandedCost !== null) {
        return templateLandedCost;
    }

    // Fallback: Se for itens avulsos, usa estimativa global (1.85)
    let totalUSD = 0;
    selectedProducts.forEach(product => totalUSD += product.costUSD || 0);
    return totalUSD * dolarRate * 1.85; 
  }, [selectedProducts, dolarRate, templateLandedCost]);

  // --- 4. PRECIFICAÇÃO (TOP-DOWN) ---
  const tablePrice = useMemo(() => {
    // REGRA DE OURO: Se veio do Kit, o Preço de Tabela é imutável.
    if (templateTablePrice !== null) {
      return templateTablePrice;
    }
    
    // Cálculo reverso para itens avulsos (Bottom-Up)
    const totalFixedCosts = globalSettings.financialFee + globalSettings.bdiFee;
    const variableRates = simplesPct + commissionPct + targetMarginPct;
    const divisor = 1 - variableRates;
    return divisor > 0 ? (custoTotalLanded + totalFixedCosts) / divisor : 0;
  }, [templateTablePrice, custoTotalLanded, simplesPct, commissionPct, targetMarginPct, globalSettings]);

  // Validação Desconto
  const handleDiscountChange = (value: number) => {
    const maxDiscount = globalSettings.salesDiscount || 5;
    if (value > maxDiscount) {
        setDiscountPct(maxDiscount);
        toast({ title: "Limite atingido", description: `Máximo permitido: ${maxDiscount}%`, variant: "destructive" });
    } else {
        setDiscountPct(value < 0 ? 0 : value);
    }
  };

  // Preço Final (Com desconto comercial)
  const finalPrice = tablePrice * (1 - (discountPct / 100));
  
  // --- 5. MARGEM REAL (CORRIGIDA) ---
  // A conta de padaria que não falha: Sobra = Venda - (Custo + Imposto + Taxas)
  const finalMarginPct = useMemo(() => {
    if (finalPrice <= 0) return 0;
    
    // Custos Variáveis de Venda (Imposto Venda + Comissão)
    const variableSalesCost = finalPrice * (simplesPct + commissionPct);
    
    // Custos Fixos (Financeiro + BDI)
    const fixedSalesCost = globalSettings.financialFee + globalSettings.bdiFee;

    // Lucro Líquido Real
    const profit = finalPrice - custoTotalLanded - variableSalesCost - fixedSalesCost;
    
    return profit / finalPrice;
  }, [finalPrice, custoTotalLanded, simplesPct, commissionPct, globalSettings]);


  // --- SAVE ---
  const handleSaveProposal = async () => {
    if (selectedProducts.length === 0) return toast({ title: "Erro", description: "Selecione produtos.", variant: "destructive" });
    if (!selectedCustomerId) return toast({ title: "Erro", description: "Selecione um cliente.", variant: "destructive" });

    setIsSaving(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      
      // Cálculo dos totais para salvar
      const profitValue = finalPrice - (custoTotalLanded + (finalPrice * (simplesPct + commissionPct)) + globalSettings.financialFee + globalSettings.bdiFee);

      await addQuote({
        customerId: selectedCustomerId,
        customerName: customer?.tradeName || "Cliente",
        items: selectedProducts.map(p => ({ id: p.id, name: p.name, costUSD: p.costUSD })),
        totals: {
            totalLanded: custoTotalLanded,
            suggestedPrice: finalPrice, // Salva o preço final negociado
            marginPct: finalMarginPct,
            profitValue: profitValue
        },
        params: { dolarRate, simplesPct, commissionPct },
        status: "DRAFT",
        stage: "PROPOSAL",
        createdAt: Date.now(),
        number: `PROP-${Date.now().toString().slice(-6)}`
      });

      toast({ title: "Proposta Salva!", description: "Disponível no Pipeline." });
      
      // Reset Inteligente
      setDiscountPct(0);
      setSelectedProducts([]);
      setSelectedCustomerId("");
      setTemplateTablePrice(null);
      setTemplateLandedCost(null);
    } catch (e) { 
        toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive"});
    } 
    finally { setIsSaving(false); }
  };
  
  // --- UI HELPERS ---
  const toggleProductSelection = (product: SaleProduct) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      const newSelection = exists ? prev.filter(p => p.id !== product.id) : [...prev, product];
      
      // Se mexer nos itens, PERDE a garantia da engenharia (vira custom)
      if (templateTablePrice !== null) {
          setTemplateTablePrice(null);
          setTemplateLandedCost(null);
          toast({ title: "Modo Personalizado", description: "O kit foi modificado. Preços recalculados pelo padrão global."});
      }
      return newSelection;
    });
    setDiscountPct(0);
  };

  const clearSelection = () => {
    setSelectedProducts([]);
    setDiscountPct(0);
    setTemplateTablePrice(null);
    setTemplateLandedCost(null);
  }

  // Agrupamento para UI (Visual apenas)
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
      
      {/* SELEÇÃO DE CLIENTE */}
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

      {/* PRODUTOS (Visualização Simplificada) */}
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

      {/* PAINEL DE FECHAMENTO (CORRIGIDO) */}
      <Card className="bg-slate-900 text-white border-slate-800 shadow-xl sticky bottom-4 z-20">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex justify-between items-center text-primary-foreground text-lg">
            <span className="flex items-center gap-2"><Calculator className="w-5 h-5" /> Fechamento</span>
            <div className="text-sm font-normal text-slate-400">
                {templateLandedCost !== null ? "Custo Engenharia" : "Custo Estimado"}: {formatCurrency(custoTotalLanded, 'BRL')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            <div className="space-y-2">
                <Label className="text-slate-300">Preço Tabela</Label>
                <Input readOnly className="bg-slate-800 border-slate-700 text-white text-lg font-bold" value={formatCurrency(tablePrice, 'BRL')} />
            </div>

            <div className="space-y-2">
                <Label className="text-primary font-bold">Desconto (%)</Label>
                 <div className="relative">
                    <Input type="number" className="bg-primary/10 border-primary/50 text-primary text-xl font-bold h-12"
                        value={discountPct} onChange={(e) => handleDiscountChange(Number(e.target.value))} />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                </div>
            </div>

            <div className="space-y-2 text-right">
                <Label className="text-primary font-bold">PREÇO FINAL</Label>
                <div className="text-3xl font-bold text-primary">{formatCurrency(finalPrice, 'BRL')}</div>
                 <div className={`text-xs px-1 ${finalMarginPct < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    Margem Real: {(finalMarginPct * 100).toFixed(2)}%
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

    