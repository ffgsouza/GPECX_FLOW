"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Search, Save, Loader2, PackageOpen, Percent, 
  Briefcase, Wrench, CalendarClock, Printer, 
  MapPin, ShieldCheck, Users, PackageCheck, FileText, LayoutTemplate 
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, where, getDocs, type Firestore } from "firebase/firestore";

import { initializeFirebase } from "@/firebase";
import { useAppContext } from "@/context/app-context";
import { SaleProduct, ProductKit } from "@/lib/types";
import { generateSmartNumber } from "@/lib/generators"; // Sua função PVE/PTC
import { formatCurrency } from "@/lib/utils";

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- DADOS PADRÃO PARA INICIALIZAÇÃO ---
const DEFAULT_INTRO = `Prezados,\n\nA EXS Solutions (Grupo GPECX) tem a satisfação de apresentar nossa proposta técnico-comercial.\nMais do que equipamentos, entregamos segurança operacional. Com nossa expertise no setor elétrico, garantimos não apenas a qualidade do produto, mas o suporte contínuo.`;
const INCLUDED_ITEMS = [
    "Certificado de Calibração Rastreável", "Software Vitalício", 
    "Kit Acessórios Completo", "Treinamento Operacional", "Comunidade EXS Colab"
];

interface CustomerSimple {
  id: string; 
  tradeName: string; 
  companyName: string;
}

export function CalculatorForm() {
  const { products, categories, getCategoryNameById, globalSettings, addQuote } = useAppContext();
  const { toast } = useToast();
  let db: Firestore;

  // --- 1. ESTADOS DE DADOS (Inputs) ---
  const [customers, setCustomers] = useState<CustomerSimple[]>([]);
  const [templates, setTemplates] = useState<ProductKit[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [quoteType, setQuoteType] = useState<"SALES" | "SERVICE" | "RENTAL">("SALES");
  
  // Itens e Preços
  const [selectedProducts, setSelectedProducts] = useState<SaleProduct[]>([]);
  const [kitFixedPrice, setKitFixedPrice] = useState<number | null>(null);
  const [kitFixedCost, setKitFixedCost] = useState<number | null>(null);
  const [discountPct, setDiscountPct] = useState(0);

  // Textos da Proposta (Edição em Tempo Real)
  const [introText, setIntroText] = useState(DEFAULT_INTRO);
  const [paymentTerms, setPaymentTerms] = useState("50% Pedido / 50% Entrega");
  const [deliveryTime, setDeliveryTime] = useState("30 dias");
  const [validityDays, setValidityDays] = useState("5");
  const [freightType, setFreightType] = useState("CIF");

  const [isSaving, setIsSaving] = useState(false);

  // --- 2. CARREGAMENTO INICIAL ---
  useEffect(() => {
    const { db: firestoreDb } = initializeFirebase();
    db = firestoreDb;

    // Clientes
    const qCustomers = query(collection(db, "customers"), orderBy("tradeName"));
    const unsub = onSnapshot(qCustomers, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, tradeName: d.data().tradeName || d.data().companyName, companyName: d.data().companyName })));
    });

    // Templates (Kits)
    const fetchTemplates = async () => {
        const qTemplates = query(collection(db, "product_kits"), where("type", "==", "TEMPLATE"));
        const snapshot = await getDocs(qTemplates);
        setTemplates(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ProductKit[]);
    };
    fetchTemplates();

    return () => unsub();
  }, []);

  // --- 3. LÓGICA DE NEGÓCIO (Cálculos) ---
  
  // A. Custo
  const dolarRate = globalSettings.exchangeRateUSD;
  const currentTotalCost = useMemo(() => {
    if (kitFixedCost !== null) return kitFixedCost;
    let totalUSD = 0;
    selectedProducts.forEach(p => totalUSD += p.costUSD || 0);
    return totalUSD * dolarRate * 1.85; 
  }, [selectedProducts, dolarRate, kitFixedCost]);

  // B. Preço de Tabela (Base)
  const tablePrice = useMemo(() => {
    if (kitFixedPrice !== null && kitFixedPrice > 0) return kitFixedPrice;
    
    // Cálculo avulso se não for kit
    const totalFixed = globalSettings.financialFee + globalSettings.bdiFee;
    const variable = (globalSettings.simplesNacionalTax/100) + (globalSettings.salesCommission/100) + (globalSettings.marginFee/100);
    const divisor = 1 - variable;
    return divisor > 0 ? (currentTotalCost + totalFixed) / divisor : 0;
  }, [kitFixedPrice, currentTotalCost, globalSettings]);

  // C. Preço Final (Com Desconto)
  const finalPrice = tablePrice * (1 - (discountPct / 100));

  // D. Margem Real (Informativo Interno)
  const profitAnalysis = useMemo(() => {
    if (finalPrice <= 0) return { margin: 0, value: 0 };
    const taxes = finalPrice * (globalSettings.simplesNacionalTax/100);
    const comm = finalPrice * (globalSettings.salesCommission/100);
    const fixed = globalSettings.financialFee + globalSettings.bdiFee;
    const profit = finalPrice - currentTotalCost - taxes - comm - fixed;
    return { value: profit, margin: profit / finalPrice };
  }, [finalPrice, currentTotalCost, globalSettings]);


  // --- 4. FUNÇÕES DE AÇÃO ---
  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Carrega Itens
    const recoveredItems: SaleProduct[] = template.items.map(kitItem => {
      const p = products.find(prod => prod.id === kitItem.id);
      return p ? { ...p } : (kitItem as SaleProduct);
    }).filter(p => !!p);
    setSelectedProducts(recoveredItems);

    // Carrega Custos/Preços Fixos (Engenharia)
    const cost = template.costCalculation?.totalLanded || null;
    let price = template.pricingStrategy?.suggestedPrice;
    if (!price) price = (template as any).totals?.suggestedPrice;

    setKitFixedCost(cost ? Number(cost) : null);
    setKitFixedPrice(price ? Number(price) : null);
    setDiscountPct(0);

    // Resetar textos para o padrão ao carregar novo kit? Opcional.
    // setIntroText(DEFAULT_INTRO); 
    
    toast({ title: "Kit Carregado", description: `Preço Base: ${formatCurrency(price || 0, 'BRL')}` });
  };

  const handleSaveProposal = async () => {
    if (selectedProducts.length === 0) return toast({ title: "Erro", description: "Adicione itens.", variant: "destructive" });
    if (!selectedCustomerId) return toast({ title: "Erro", description: "Selecione o cliente.", variant: "destructive" });

    setIsSaving(true);
    try {
      const smartNumber = await generateSmartNumber(quoteType);
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
        params: { dolarRate, simplesPct: globalSettings.simplesNacionalTax/100, commissionPct: globalSettings.salesCommission/100 },
        
        // SALVA OS TEXTOS PERSONALIZADOS
        proposalData: {
            introText,
            paymentTerms,
            deliveryTime,
            validityDays,
            freightType
        },

        status: "DRAFT",
        stage: "PROPOSAL",
        type: quoteType,
        createdAt: Date.now(),
        number: smartNumber
      });

      toast({ title: "Proposta Criada!", description: `${smartNumber} salva no pipeline.` });
      // Limpa tudo ou redireciona
      setDiscountPct(0); setSelectedProducts([]); setSelectedCustomerId(""); setKitFixedPrice(null);
    } catch (e) { 
        toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  // Helper para visualização do PDF
  const selectedCustomerName = customers.find(c => c.id === selectedCustomerId)?.tradeName || "Cliente Exemplo Ltda";


  // --- RENDERIZAÇÃO (SPLIT VIEW) ---
  return (
    <div className="flex flex-col xl:flex-row h-[calc(100vh-100px)] gap-6 overflow-hidden">
      
      {/* =================================================================
          LADO ESQUERDO: PAINEL DE CONTROLE (BUILDER) - 35% LARGURA
      ================================================================== */}
      <Card className="w-full xl:w-[400px] flex flex-col h-full border-0 xl:border shadow-none xl:shadow-md bg-white">
        <div className="p-4 border-b bg-slate-50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><LayoutTemplate className="w-4 h-4"/> Construtor de Proposta</h2>
        </div>
        
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">

                {/* 1. TIPO DE PROPOSTA */}
                <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase">1. Modalidade</Label>
                    <RadioGroup value={quoteType} onValueChange={(v:any) => setQuoteType(v)} className="flex gap-2">
                        <div className={`flex-1 flex items-center justify-center p-2 rounded border cursor-pointer ${quoteType === 'SALES' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white'}`}>
                            <RadioGroupItem value="SALES" id="t1" className="sr-only"/>
                            <Label htmlFor="t1" className="cursor-pointer text-xs font-bold flex flex-col items-center gap-1">
                                <Briefcase className="w-4 h-4"/> Venda (PVE)
                            </Label>
                        </div>
                        <div className={`flex-1 flex items-center justify-center p-2 rounded border cursor-pointer ${quoteType === 'SERVICE' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}>
                            <RadioGroupItem value="SERVICE" id="t2" className="sr-only"/>
                            <Label htmlFor="t2" className="cursor-pointer text-xs font-bold flex flex-col items-center gap-1">
                                <Wrench className="w-4 h-4"/> Serviço (PTC)
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* 2. CLIENTE */}
                <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase">2. Cliente</Label>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.tradeName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* 3. KIT / PRODUTOS */}
                <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase">3. Carregar Kit (Engenharia)</Label>
                    <Select onValueChange={handleLoadTemplate}>
                        <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Selecionar Modelo..." /></SelectTrigger>
                        <SelectContent>
                            {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    {/* Lista rápida de itens selecionados */}
                    {selectedProducts.length > 0 && (
                        <div className="text-[10px] text-slate-500 mt-2 bg-slate-50 p-2 rounded border">
                            <span className="font-bold block mb-1">{selectedProducts.length} itens inclusos:</span>
                            <ul className="list-disc pl-3 max-h-20 overflow-y-auto">
                                {selectedProducts.map((p, i) => <li key={i}>{p.name}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                <Separator />

                {/* 4. PRECIFICAÇÃO */}
                <div className="space-y-4">
                    <Label className="text-xs font-black text-slate-400 uppercase">4. Negociação</Label>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs">Preço Tabela</Label>
                            <Input readOnly value={formatCurrency(tablePrice, 'BRL')} className="bg-slate-100 font-bold text-slate-500" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-emerald-600 font-bold">Preço Final</Label>
                            <Input readOnly value={formatCurrency(finalPrice, 'BRL')} className="bg-emerald-50 border-emerald-200 font-bold text-emerald-700" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Desconto Comercial (%)</Label>
                            <span className="text-xs font-bold text-slate-500">{discountPct}%</span>
                        </div>
                        <input 
                            type="range" min="0" max={globalSettings.salesDiscount || 10} step="0.5"
                            value={discountPct} 
                            onChange={(e) => setDiscountPct(Number(e.target.value))}
                            className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                         {/* Indicador de Margem Interna */}
                         <div className={`text-[10px] text-right ${profitAnalysis.margin < 0 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                            Margem Interna: {(profitAnalysis.margin * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>

                <Separator />

                {/* 5. TEXTOS PERSONALIZADOS */}
                <Tabs defaultValue="condicoes">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="condicoes">Condições</TabsTrigger>
                        <TabsTrigger value="intro">Introdução</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="condicoes" className="space-y-3 pt-2">
                        <div className="space-y-1">
                            <Label className="text-xs">Pagamento</Label>
                            <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="h-8 text-xs" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Entrega</Label>
                                <Input value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} className="h-8 text-xs" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Validade (Dias)</Label>
                                <Input value={validityDays} onChange={e => setValidityDays(e.target.value)} className="h-8 text-xs" />
                            </div>
                        </div>
                         <div className="space-y-1">
                                <Label className="text-xs">Tipo de Frete</Label>
                                <Select value={freightType} onValueChange={setFreightType}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CIF">CIF (Pago pela EXS)</SelectItem>
                                        <SelectItem value="FOB">FOB (Retira Cliente)</SelectItem>
                                    </SelectContent>
                                </Select>
                        </div>
                    </TabsContent>

                    <TabsContent value="intro" className="pt-2">
                        <Textarea 
                            value={introText} 
                            onChange={e => setIntroText(e.target.value)} 
                            className="text-xs min-h-[120px]" 
                            placeholder="Texto de introdução..."
                        />
                    </TabsContent>
                </Tabs>

            </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-slate-50">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold h-12" onClick={handleSaveProposal} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
                SALVAR E GERAR {quoteType === 'SALES' ? 'PVE' : 'PTC'}
            </Button>
        </div>
      </Card>


      {/* =================================================================
          LADO DIREITO: PREVIEW A4 (REAL TIME) - 65% LARGURA
          O usuário vê a proposta tomando forma enquanto edita.
      ================================================================== */}
      <div className="flex-1 bg-slate-200/50 rounded-lg overflow-hidden flex flex-col border border-slate-200 shadow-inner">
         <div className="bg-white border-b px-4 py-2 flex justify-between items-center text-xs text-slate-500">
             <span className="flex items-center gap-1"><Printer className="w-3 h-3"/> Pré-visualização de Impressão (A4)</span>
             <span>Página 1 de 2</span>
         </div>
         
         <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-200">
             {/* SIMULAÇÃO DA FOLHA DE PAPEL A4 (CSS SCALE PARA CABER NA TELA) */}
             <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl p-0 text-slate-800 relative flex flex-col origin-top transform scale-[0.65] lg:scale-[0.75] xl:scale-[0.85] 2xl:scale-100 transition-all mb-[-200px]">
                
                {/* CABEÇALHO (COR DINÂMICA) */}
                <div className={`h-3 w-full ${quoteType === 'SERVICE' ? 'bg-blue-600' : 'bg-emerald-600'}`}></div>
                <header className="px-10 py-6 flex justify-between items-end border-b border-slate-100">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter">EXS <span className={quoteType === 'SERVICE' ? 'text-blue-600' : 'text-emerald-600'}>SOLUTIONS</span></h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {quoteType === 'SERVICE' ? 'Laboratório de Calibração' : 'Grupo GPECX - Energia & Alta Tensão'}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`${quoteType === 'SERVICE' ? 'bg-blue-50 text-blue-800' : 'bg-emerald-50 text-emerald-800'} px-3 py-1 rounded text-xs font-bold inline-block mb-1`}>
                            {quoteType === 'SERVICE' ? 'PROPOSTA DE SERVIÇO' : 'PROPOSTA DE VENDA'} (PREVIEW)
                        </div>
                        <p className="text-xs text-slate-500">{new Date().toLocaleDateString()}</p>
                    </div>
                </header>

                <div className="px-10 py-6 flex-1">
                    {/* CLIENTE */}
                    <div className="flex justify-between items-start mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Cliente</p>
                            <h2 className="text-lg font-bold text-slate-800">{selectedCustomerName}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Validade</p>
                            <p className="font-bold text-emerald-700">{validityDays} DIAS</p>
                        </div>
                    </div>

                    {/* INTRODUÇÃO */}
                    <div className="text-sm text-slate-600 mb-6 whitespace-pre-line leading-relaxed text-justify">
                        {introText}
                    </div>

                    {/* TABELA DE PREÇOS */}
                    <div className="mb-6">
                        <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                             <PackageCheck className="w-4 h-4 text-slate-600"/> INVESTIMENTO E ESCOPO
                        </h3>
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className={quoteType === 'SERVICE' ? 'bg-blue-700 text-white' : 'bg-emerald-700 text-white'}>
                                    <th className="p-2 text-left w-2/3 rounded-tl">Descrição</th>
                                    <th className="p-2 text-right rounded-tr">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedProducts.map((p, i) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        <td className="p-2 font-medium text-slate-700">{p.name}</td>
                                        <td className="p-2 text-right font-bold text-slate-800">{i===0 ? formatCurrency(finalPrice, 'BRL') : '-'}</td>
                                    </tr>
                                ))}
                                {selectedProducts.length === 0 && <tr><td colSpan={2} className="p-4 text-center text-slate-400 italic">Nenhum item selecionado</td></tr>}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50">
                                    <td className="p-2 text-right font-bold text-xs uppercase">Total</td>
                                    <td className="p-2 text-right font-black text-xl text-emerald-700">{formatCurrency(finalPrice, 'BRL')}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* DIFERENCIAIS (INCLUSOS) */}
                    <div className="mb-6 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
                        <h3 className="font-bold text-emerald-800 text-xs mb-3 uppercase">O que está incluso:</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {INCLUDED_ITEMS.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-[10px] font-medium text-slate-700">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CONDIÇÕES COMERCIAIS */}
                    <div className="grid grid-cols-2 gap-6 mb-4">
                        <div>
                            <h4 className="font-bold text-[10px] text-slate-400 uppercase mb-1">Pagamento</h4>
                            <p className="text-xs font-bold text-slate-800 border-l-2 border-emerald-500 pl-2">{paymentTerms}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-[10px] text-slate-400 uppercase mb-1">Frete & Entrega</h4>
                            <p className="text-xs font-bold text-slate-800 border-l-2 border-emerald-500 pl-2">{freightType} - {deliveryTime}</p>
                        </div>
                    </div>

                    {/* RODAPÉ DO PAPEL */}
                    <div className="mt-auto pt-4 border-t text-center">
                        <p className="text-[9px] text-slate-400">EXS Solutions - Americana/SP - Documento gerado via Sistema GPECX</p>
                    </div>

                </div>
             </div>
         </div>
      </div>
      
    </div>
  );
}
