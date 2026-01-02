"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Search, Trash2, Check, Info, User, Save, Calculator, Loader2, PackageOpen
} from "lucide-react";
import { collection, addDoc, query, orderBy, onSnapshot, where, getDocs, type Firestore } from "firebase/firestore";
import { useRouter } from "next/navigation";

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
import { useToast } from "@/hooks/use-toast";

let db: Firestore;

// --- TIPOS AUXILIARES ---
interface CustomerSimple {
  id: string;
  tradeName: string;
  companyName: string;
}

export function CalculatorForm() {
  const { products, categories, productTypes, getCategoryNameById, globalSettings } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();

  // --- ESTADOS ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<SaleProduct[]>([]);
  
  // Estado de Clientes e Templates
  const [customers, setCustomers] = useState<CustomerSimple[]>([]);
  const [templates, setTemplates] = useState<ProductKit[]>([]); // Estado para os Kits Padrão
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Parâmetros de Venda
  const [dolarRate, setDolarRate] = useState(globalSettings.exchangeRateUSD);
  const [marginPct, setMarginPct] = useState(globalSettings.marginFee * 100);
  const [commissionPct, setCommissionPct] = useState(globalSettings.salesCommission * 100);
  const [simplesPct, setSimplesPct] = useState(globalSettings.simplesNacionalTax * 100);
  const [discountPct, setDiscountPct] = useState(globalSettings.salesDiscount * 100);

  // --- CARREGAR DADOS ---
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

    // Carregar Templates de Kits
    const qTemplates = query(collection(db, "product_kits"), where("type", "==", "TEMPLATE"), orderBy("createdAt", "desc"));
    const unsubTemplates = onSnapshot(qTemplates, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductKit[];
      setTemplates(data);
    }, (error) => {
      console.error("Erro ao carregar templates:", error);
      toast({ title: "Erro ao carregar templates", variant: "destructive" });
    });

    return () => {
        unsubCustomers();
        unsubTemplates();
    };
  }, [toast]);

  // --- FUNÇÃO: CARREGAR UM TEMPLATE ---
  const handleLoadTemplate = (templateId: string) => {
    if (!templateId) return;
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const recoveredItems: SaleProduct[] = template.items.map(kitItem => {
      const fullProduct = products.find(p => p.id === kitItem.id);
      return fullProduct ? { ...fullProduct } : (kitItem as SaleProduct);
    }).filter((p): p is SaleProduct => p !== undefined);

    setSelectedProducts(recoveredItems);
    toast({
        title: "Template Carregado!",
        description: `O kit "${template.name}" foi carregado na sua seleção.`
    });
  };

  // --- ENGINE DE CÁLCULO (Híbrida) ---
   const calculationResult = useMemo(() => {
    let landedCost = 0;
    let fobUSD = 0;

    selectedProducts.forEach(product => {
      const kitTemplate = templates.find(t => t.items.some(i => i.id === product.id));
      if (kitTemplate) {
        // Encontrou um kit que contém este produto. 
        // Idealmente, a engine aqui seria a mesma da engenharia.
        // Por simplicidade, vamos pegar o valor total do kit se ele for o único item.
        // A lógica mais robusta seria recalcular item a item.
        // Vamos assumir que se um item de um kit está aqui, o kit inteiro está.
        // Esta lógica pode ser aprimorada.
      }
      
      // Simples fallback: se o produto não faz parte de um kit conhecido (ou lógica complexa), calcula avulso.
      // Esta estimativa é simplificada.
      const typeObj = productTypes.find(t => t.id === product.productTypeId);
      const isHardware = typeObj?.name.toLowerCase().includes("hardware") || typeObj?.name.toLowerCase().includes("acess");
      
      // Fator de mark-up de custo simplificado. 
      // 1.85 para hardware e 1.40 para software (estimativa)
      const costFactor = isHardware ? 1.85 : 1.40; 
      
      landedCost += (product.costUSD * dolarRate * costFactor);
      fobUSD += product.costUSD;
    });

    const totalLandedCost = selectedProducts.reduce((acc, product) => {
       const template = templates.find(t => t.name === product.name);
       // Se o item selecionado é um kit inteiro
       if (template && selectedProducts.length === 1 && selectedProducts[0].id === template.items[0].id) {
           return template.calculation.totalGeral;
       }
       // Se não, usa a lógica de fallback (deve ser melhorada)
        const typeObj = productTypes.find(t => t.id === product.productTypeId);
        const isHardware = typeObj?.name.toLowerCase().includes("hardware") || typeObj?.name.toLowerCase().includes("acess");
        const costFactor = isHardware ? 1.85 : 1.40;
        return acc + (product.costUSD * dolarRate * costFactor);
    }, 0);


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
      totalFOB_USD: fobUSD,
      totalLanded_BRL: landedCost,
      suggestedPrice: finalPrice,
      profit
    };
  }, [selectedProducts, dolarRate, marginPct, commissionPct, simplesPct, discountPct, productTypes, templates, globalSettings]);


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
          id: p.id, name: p.name, costUSD: p.costUSD,
          type: productTypes.find(t => t.id === p.productTypeId)?.name
        })),
        totals: calculationResult,
        params: { dolarRate, marginPct, commissionPct, simplesPct, discountPct },
        status: "DRAFT",
        createdAt: Date.now(),
        number: `PROP-${Date.now().toString().slice(-6)}`
      };

      await addDoc(collection(db, "quotes"), proposalData);
      
      toast({ title: "Proposta Salva!", description: "A nova proposta foi registrada com sucesso." });
      setSelectedProducts([]);
      setSelectedCustomerId("");
    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro ao Salvar", description: error.message || "Não foi possível salvar a proposta.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- FILTROS E AGRUPAMENTO ---
    const { visibleProducts, activeHardwareName } = useMemo(() => {
        const hardwareTypeObj = productTypes.find(t =>
        t.name.toLowerCase().includes("hardware") && !t.name.toLowerCase().includes("acess")
        );
        const hardwareTypeId = hardwareTypeObj?.id;

        let filtered = [...products];

        if (searchQuery) {
            filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (filterCategory !== "all") {
            filtered = filtered.filter((p) => p.categoryId === filterCategory);
        }

        const selectedHardwares = selectedProducts.filter(p => p.productTypeId === hardwareTypeId);
        const selectedHardwareIds = selectedHardwares.map(p => p.id);
        const hasHardwareSelected = selectedHardwareIds.length > 0;
        let activeHwName = null;

        if (hasHardwareSelected && hardwareTypeId) {
            activeHwName = selectedHardwares[0].name;
            if (selectedHardwares.length > 1) activeHwName += ` e outros...`;

            filtered = products.filter(product => {
                if (selectedHardwareIds.includes(product.id)) return true; // Mostrar o próprio hardware
                const compatibleList = Array.isArray(product.compatibleWith) ? product.compatibleWith : [];
                if (compatibleList.some((hwId: string) => selectedHardwareIds.includes(hwId))) return true; // Mostrar itens compatíveis
                if (product.productTypeId === hardwareTypeId) return false; // Esconder outros hardwares
                if (compatibleList.length > 0) return false; // Esconder acessórios de outros hardwares
                
                // Para itens que não tem compatibilidade definida (ex: software avulso),
                // é preciso decidir se eles devem aparecer. Por hora, vamos esconder.
                return false; 
            });
        }
        
        return { visibleProducts: filtered, activeHardwareName: activeHwName };
    }, [products, productTypes, searchQuery, filterCategory, selectedProducts]);

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
            <div className="md:col-span-12">
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
          </div>
        </CardContent>
      </Card>

      {/* 2. ÁREA DE PRODUTOS */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 space-y-4">
            {/* BARRA DE AÇÕES RÁPIDAS (NOVO) */}
            {templates.length > 0 && (
            <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-primary">
                <PackageOpen className="w-5 h-5" />
                <div>
                    <span className="font-bold text-sm block">Acelerador de Vendas</span>
                    <span className="text-xs opacity-80">Carregue um kit padrão para começar rápido.</span>
                </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                <Select onValueChange={handleLoadTemplate}>
                    <SelectTrigger className="w-full md:w-[300px] bg-white border-primary/20">
                    <SelectValue placeholder="Selecione um Kit Padrão..." />
                    </SelectTrigger>
                    <SelectContent>
                    {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
            </div>
            )}

            {/* FILTROS E BUSCA */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex-1 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input 
                    placeholder="Ou busque produtos avulsos..." 
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
            </div>

            {activeHardwareName && (
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <Info className="h-4 w-4" />
                <AlertTitle>Modo Guiado</AlertTitle>
                <AlertDescription>Filtrando compatíveis com <strong>{activeHardwareName}</strong>.</AlertDescription>
            </Alert>
            )}

            {/* TABELAS AGRUPADAS */}
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

        {/* PAINEL DE RESULTADOS */}
        <div className="col-span-12 lg:col-span-5">
          <Card className="bg-slate-900 text-white border-slate-800 shadow-lg sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Calculator className="w-5 h-5" />
                Resumo e Fechamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                    {renderParamInput("Dólar (R$)", dolarRate, setDolarRate)}
                    {renderParamInput("Margem (%)", marginPct, setMarginPct)}
                    {renderParamInput("Comissão (%)", commissionPct, setCommissionPct)}
                    {renderParamInput("Imposto (%)", simplesPct, setSimplesPct)}
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
                        <p className="text-4xl font-bold text-white tracking-tight">{formatCurrency(calculationResult.suggestedPrice, 'BRL')}</p>
                    </div>
                </div>


            </CardContent>
            <CardFooter className="pt-6 flex justify-end gap-3 bg-slate-900/50 border-t border-slate-800">
                <Button variant="outline" className="text-slate-900 bg-white hover:bg-slate-100" onClick={() => setSelectedProducts([])}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar
                </Button>
                <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white font-bold"
                onClick={handleSaveProposal}
                disabled={isSaving || selectedProducts.length === 0 || !selectedCustomerId}
                >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2" />}
                {isSaving ? "Salvando..." : "Salvar Proposta"}
                </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

    </div>
  );
}
