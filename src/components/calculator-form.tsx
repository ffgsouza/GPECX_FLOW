"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Save, Loader2, Briefcase, Wrench, Printer, 
  ShieldCheck, PackageCheck, LayoutTemplate, AlertCircle, 
  FileText, Banknote, CalendarClock, PackageOpen
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, where, getDocs, doc, getDoc, type Firestore } from "firebase/firestore";

import { initializeFirebase } from "@/firebase";
import { useAppContext } from "@/context/app-context";
import { SaleProduct, ProductKit, Quote } from "@/lib/types";
import { generateSmartNumber } from "@/lib/generators"; 
import { formatCurrency } from "@/lib/utils";

// UI imports
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams } from "next/navigation";

const DEFAULT_INTRO = `Prezados,\n\nA EXS Solutions (Grupo GPECX) tem a satisfação de apresentar nossa proposta.\nMais do que equipamentos, entregamos segurança operacional. Com nossa expertise no setor elétrico, garantimos qualidade e suporte contínuo.`;
const INCLUDED_ITEMS = ["Certificado de Calibração", "Software Vitalício", "Kit Acessórios", "Treinamento", "Comunidade EXS Colab"];
const GENERAL_TERMS = [
    {
        title: "5.1 Aceite e Validade",
        text: "A aceitação desta proposta implica na concordância integral com estas Condições Gerais. Modificações na proposta prevalecem sobre estas condições. O prazo de validade desta proposta é de 5 dias corridos."
    },
    {
        title: "5.2 Escopo de Fornecimento",
        text: "Todo e qualquer item ou serviço não expressamente listado nesta proposta será considerado fornecimento adicional e sujeito a novo orçamento."
    },
    {
        title: "5.3 Garantia e Responsabilidade",
        text: "Garantia de 24 meses (2 anos) contra defeitos de fabricação (exceto mal uso). A EXS Solutions limita-se ao reparo ou substituição. Em nenhuma hipótese responderá por lucros cessantes ou danos indiretos."
    },
    {
        title: "5.4 Inadimplência",
        text: "Em caso de atraso no pagamento, incidirá multa de 10%, juros de mora de 2% ao mês e, se necessário cobrança judicial, honorários advocatícios estipulados em 20% sobre o valor da causa."
    },
    {
        title: "5.5 Proteção contra Atraso (Empréstimo)",
        text: "Diferencial EXS: Ocorrendo atraso na entrega do equipamento por nossa culpa, concederemos como empréstimo um equipamento de mesmo modelo até a entrega do novo."
    },
    {
        title: "5.6 Cancelamento (Quebra de Contrato)",
        text: "Em caso de desistência/cancelamento, incidirá multa de 10% sobre o valor total, sem devolução do sinal pago inicialmente."
    },
    {
        title: "5.7 Tributos e Revisão",
        text: "A EXS é optante pelo Simples Nacional. Novos tributos ou alterações de alíquotas que impactem o custo após a data da proposta implicarão na revisão automática dos preços."
    },
    {
        title: "5.8 Retirada e Pagamento",
        text: "Após o aviso de prontidão, o cliente tem 5 dias úteis para retirar. Após este prazo, inicia-se a contagem para vencimento das parcelas restantes, independente da retirada."
    }
];

interface CustomerSimple {
  id: string; 
  tradeName: string; 
  companyName: string;
  cnpj: string;
}

export function CalculatorForm() {
  const { products, globalSettings, addQuote, updateQuote } = useAppContext();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  let db: Firestore;

  // --- 1. ESTADOS DE DADOS (Inputs) ---
  const [customers, setCustomers] = useState<CustomerSimple[]>([]);
  const [templates, setTemplates] = useState<ProductKit[]>([]);
  
  // --- 2. SELETORES PRINCIPAIS ---
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [quoteType, setQuoteType] = useState<"SALES" | "SERVICE" | "RENTAL">("SALES");
  const [docMode, setDocMode] = useState<"COMPLETE" | "TECHNICAL" | "COMMERCIAL">("COMPLETE");

  // --- 3. ITENS E VALORES ---
  const [selectedProducts, setSelectedProducts] = useState<SaleProduct[]>([]);
  const [kitFixedPrice, setKitFixedPrice] = useState<number | null>(null);
  const [kitFixedCost, setKitFixedCost] = useState<number | null>(null);
  const [discountPct, setDiscountPct] = useState(0);

  // --- 4. TEXTOS E CONDIÇÕES ---
  const [introText, setIntroText] = useState(DEFAULT_INTRO);
  const [paymentTerms, setPaymentTerms] = useState("50% Pedido / 50% Entrega");
  const [deliveryTime, setDeliveryTime] = useState("30 dias");
  const [validityDays, setValidityDays] = useState("5");
  const [freightType, setFreightType] = useState("CIF");

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState<string | null>(null);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
  }, []);

  // --- 5. INITIAL FETCH ---
  useEffect(() => {
    const { db: firestoreDb } = initializeFirebase();
    db = firestoreDb;
    const unsub = onSnapshot(query(collection(db, "customers"), orderBy("tradeName")), (snap) => {
      setCustomers(snap.docs.map(d => ({ 
        id: d.id, 
        tradeName: d.data().tradeName || d.data().companyName, 
        companyName: d.data().companyName,
        cnpj: d.data().cnpj,
      })));
    });
    const fetchTemplates = async () => {
        const snap = await getDocs(query(collection(db, "product_kits"), where("type", "==", "TEMPLATE")));
        setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ProductKit[]);
    };
    fetchTemplates();

    // Carregar proposta existente se quoteId estiver na URL
    const quoteId = searchParams.get('quoteId');
    if (quoteId) {
      setIsLoading(true);
      setEditingQuoteId(quoteId);
      const fetchQuote = async () => {
        const quoteDoc = await getDoc(doc(db, "quotes", quoteId));
        if (quoteDoc.exists()) {
          const quoteData = quoteDoc.data() as Quote;
          setSelectedCustomerId(quoteData.customerId);
          setQuoteType(quoteData.type || "SALES");
          setDocMode(quoteData.proposalData?.docMode || "COMPLETE");
          
          const loadedProducts = quoteData.items.map(item => products.find(p => p.id === item.id)).filter(p => p) as SaleProduct[];
          setSelectedProducts(loadedProducts);
          
          setKitFixedPrice(quoteData.totals.suggestedPrice / (1 - (quoteData.params.discountPct || 0))); // Calcula preço de tabela
          setKitFixedCost(quoteData.totals.totalLanded);
          setDiscountPct(quoteData.params.discountPct ? quoteData.params.discountPct * 100 : 0);
          
          setIntroText(quoteData.proposalData?.introText || DEFAULT_INTRO);
          setPaymentTerms(quoteData.proposalData?.paymentTerms || "50% Pedido / 50% Entrega");
          setDeliveryTime(quoteData.proposalData?.deliveryTime || "30 dias");
          setValidityDays(quoteData.proposalData?.validityDays || "5");
          setFreightType(quoteData.proposalData?.freightType || "CIF");

        } else {
            toast({title: "Erro", description: "Proposta não encontrada.", variant: "destructive"});
        }
        setIsLoading(false);
      }
      if (products.length > 0) fetchQuote(); // Garante que os produtos estão carregados antes
    }

    return () => unsub();
  }, [searchParams, products]);

  // --- 6. CÁLCULOS ---
  const dolarRate = globalSettings.exchangeRateUSD;
  const currentTotalCost = useMemo(() => {
    if (kitFixedCost !== null) return kitFixedCost;
    let total = 0;
    selectedProducts.forEach(p => total += p.costUSD || 0);
    return total * dolarRate * 1.85; 
  }, [selectedProducts, dolarRate, kitFixedCost]);

  const tablePrice = useMemo(() => {
    if (kitFixedPrice !== null && kitFixedPrice > 0) return kitFixedPrice;
    const fixed = globalSettings.financialFee + globalSettings.bdiFee;
    const variable = (globalSettings.simplesNacionalTax + globalSettings.salesCommission + globalSettings.marginFee) / 100;
    return (1 - variable) > 0 ? (currentTotalCost + fixed) / (1 - variable) : 0;
  }, [kitFixedPrice, currentTotalCost, globalSettings]);

  const finalPrice = tablePrice * (1 - (discountPct / 100));
  const discountValue = tablePrice - finalPrice;

  const profitAnalysis = useMemo(() => {
    if (finalPrice <= 0) return { margin: 0, value: 0 };
    const taxes = finalPrice * (globalSettings.simplesNacionalTax/100);
    const comm = finalPrice * (globalSettings.salesCommission/100);
    const fixed = globalSettings.financialFee + globalSettings.bdiFee;
    const profit = finalPrice - currentTotalCost - taxes - comm - fixed;
    return { value: profit, margin: profit / finalPrice };
  }, [finalPrice, currentTotalCost, globalSettings]);

  // --- 7. HELPER DE VISUALIZAÇÃO (SHOW/HIDE) ---
  const showPrices = docMode !== "TECHNICAL";
  const showPayment = docMode !== "TECHNICAL";
  const showTechDetails = docMode !== "COMMERCIAL";

  const handleLoadTemplate = (templateId: string) => {
    const t = templates.find(temp => temp.id === templateId);
    if (!t) return;
    const items = t.items.map(kItem => {
      const p = products.find(prod => prod.id === kItem.id);
      return p ? { ...p } : (kItem as SaleProduct);
    }).filter(p => !!p);
    setSelectedProducts(items);
    
    let price = null;
    if (t.pricingStrategy && typeof t.pricingStrategy.suggestedPrice === 'number') {
        price = t.pricingStrategy.suggestedPrice;
    } else if ((t as any).totals?.suggestedPrice) {
        price = (t as any).totals.suggestedPrice;
    }

    const cost = t.costCalculation?.totalLanded || 0;
    setKitFixedPrice(price !== null ? Number(price) : null);
    setKitFixedCost(Number(cost));
    setDiscountPct(0);
    toast({ title: "Kit Carregado", description: `Valor Base: ${formatCurrency(price !== null ? Number(price) : 0, 'BRL')}` });
  };

  const handleSaveProposal = async () => {
    if (!selectedCustomerId || selectedProducts.length === 0) return toast({ title: "Erro", description: "Preencha os dados.", variant: "destructive" });
    setIsSaving(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      const dataToSave: Omit<Quote, 'id' | 'number' | 'createdAt'> & {number?: string; createdAt?: number } = {
        customerId: selectedCustomerId,
        customerName: customer?.tradeName || "Cliente",
        items: selectedProducts.map(p => ({ id: p.id, name: p.name, costUSD: p.costUSD })),
        totals: { totalLanded: currentTotalCost, suggestedPrice: finalPrice, marginPct: profitAnalysis.margin, profitValue: profitAnalysis.value },
        params: { dolarRate, simplesPct: globalSettings.simplesNacionalTax/100, commissionPct: globalSettings.salesCommission/100, discountPct: discountPct / 100 },
        proposalData: { introText, paymentTerms, deliveryTime, validityDays, freightType, docMode },
        status: "DRAFT", stage: "PROPOSAL", type: quoteType,
      };

      if (editingQuoteId) {
        await updateQuote(editingQuoteId, dataToSave);
        toast({ title: "Sucesso!", description: `Proposta atualizada.` });
      } else {
        const smartNumber = await generateSmartNumber(quoteType);
        dataToSave.number = smartNumber;
        dataToSave.createdAt = Date.now();
        await addQuote(dataToSave as Omit<Quote, 'id'>);
        toast({ title: "Sucesso!", description: `Proposta ${smartNumber} salva.` });
      }

      setDiscountPct(0); setSelectedProducts([]); setKitFixedPrice(null); setSelectedCustomerId(""); setEditingQuoteId(null);
    } catch (e) { toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="h-[calc(100vh-120px)] w-full bg-slate-100 p-2 overflow-hidden">
      
      {/* GRID DE DIVISÃO: EDITOR (Esq) vs PAPEL (Dir) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        
        {/* ================= EDITOR (4 COLUNAS) ================= */}
        <Card className="col-span-1 lg:col-span-4 flex flex-col h-full bg-white shadow-lg border-slate-200 overflow-hidden">
          <div className="p-3 border-b bg-slate-50 flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-700">{editingQuoteId ? "Editor de Proposta" : "Construtor de Proposta"}</h2>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              
              {/* 1. SELETOR DE MODALIDADE (PVE/PLE/PTC) */}
              <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">1. Modalidade de Negócio</Label>
                  <RadioGroup value={quoteType} onValueChange={(v:any) => setQuoteType(v)} className="grid grid-cols-3 gap-1">
                      <div className={`flex flex-col items-center justify-center p-2 rounded border cursor-pointer ${quoteType === 'SALES' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white'}`}>
                          <RadioGroupItem value="SALES" id="m1" className="sr-only"/>
                          <Label htmlFor="m1" className="cursor-pointer">
                              <div className="flex flex-col items-center">
                                <Briefcase className="w-4 h-4 mx-auto mb-1"/>
                                <span className="text-[10px] font-bold">Venda</span>
                              </div>
                          </Label>
                      </div>
                      <div className={`flex flex-col items-center justify-center p-2 rounded border cursor-pointer ${quoteType === 'RENTAL' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white'}`}>
                          <RadioGroupItem value="RENTAL" id="m2" className="sr-only"/>
                           <Label htmlFor="m2" className="cursor-pointer">
                             <div className="flex flex-col items-center">
                                <CalendarClock className="w-4 h-4 mx-auto mb-1"/>
                                <span className="text-[10px] font-bold">Locação</span>
                             </div>
                          </Label>
                      </div>
                      <div className={`flex flex-col items-center justify-center p-2 rounded border cursor-pointer ${quoteType === 'SERVICE' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}>
                          <RadioGroupItem value="SERVICE" id="m3" className="sr-only"/>
                          <Label htmlFor="m3" className="cursor-pointer">
                             <div className="flex flex-col items-center">
                                <Wrench className="w-4 h-4 mx-auto mb-1"/>
                                <span className="text-[10px] font-bold">Serviço</span>
                             </div>
                          </Label>
                      </div>
                  </RadioGroup>
              </div>

              {/* 2. SELETOR DE VISUALIZAÇÃO (COMPLETA/TÉCNICA/COMERCIAL) */}
              <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">2. Modo de Documento (Compliance)</Label>
                  <RadioGroup value={docMode} onValueChange={(v:any) => setDocMode(v)} className="grid grid-cols-1 gap-1">
                      <div className={`flex items-center p-2 rounded border cursor-pointer ${docMode === 'COMPLETE' ? 'bg-slate-100 border-slate-500' : 'bg-white'}`}>
                          <RadioGroupItem value="COMPLETE" id="d1" className="sr-only"/>
                          <Label htmlFor="d1" className="cursor-pointer text-xs font-bold w-full">
                            <div className="flex gap-2 items-center">
                                <PackageOpen className="w-4 h-4"/> Completa (Padrão)
                            </div>
                          </Label>
                      </div>
                      <div className={`flex items-center p-2 rounded border cursor-pointer ${docMode === 'TECHNICAL' ? 'bg-slate-100 border-slate-500' : 'bg-white'}`}>
                          <RadioGroupItem value="TECHNICAL" id="d2" className="sr-only"/>
                          <Label htmlFor="d2" className="cursor-pointer text-xs font-bold w-full">
                             <div className="flex gap-2 items-center">
                                <FileText className="w-4 h-4"/> Apenas Técnica (Sem Preço)
                             </div>
                          </Label>
                      </div>
                      <div className={`flex items-center p-2 rounded border cursor-pointer ${docMode === 'COMMERCIAL' ? 'bg-slate-100 border-slate-500' : 'bg-white'}`}>
                          <RadioGroupItem value="COMMERCIAL" id="d3" className="sr-only"/>
                           <Label htmlFor="d3" className="cursor-pointer text-xs font-bold w-full">
                             <div className="flex gap-2 items-center">
                                <Banknote className="w-4 h-4"/> Apenas Comercial
                             </div>
                          </Label>
                      </div>
                  </RadioGroup>
              </div>

              <Separator />

              {/* DADOS DO CLIENTE E KIT */}
              <div className="space-y-3">
                <div>
                    <Label className="text-xs font-bold">Cliente</Label>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.tradeName}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs font-bold">Carregar Kit / Escopo</Label>
                    <Select onValueChange={handleLoadTemplate}>
                        <SelectTrigger className="h-9 bg-slate-50"><SelectValue placeholder="Buscar..." /></SelectTrigger>
                        <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
              </div>

              <Separator />

              {/* PREÇO (SÓ HABILITA SE NÃO FOR TÉCNICA) */}
              <div className={`space-y-3 ${!showPrices ? 'opacity-50 pointer-events-none' : ''}`}>
                 <div className="flex justify-between items-end">
                    <Label className="text-xs font-bold">Desconto (%)</Label>
                    <span className="text-xs font-bold text-slate-500">{discountPct}%</span>
                 </div>
                 <input type="range" min="0" max="15" step="0.5" value={discountPct} onChange={e => setDiscountPct(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                 <div className="text-right">
                    <span className="block text-emerald-600 font-bold text-xs">Preço de Venda Sugerido</span>
                    <span className="font-black text-lg text-emerald-700">{formatCurrency(finalPrice, 'BRL')}</span>
                 </div>
              </div>

              <Tabs defaultValue="intro" className="w-full">
                <TabsList className="w-full grid grid-cols-2 h-8">
                    <TabsTrigger value="intro" className="text-xs">Texto</TabsTrigger>
                    <TabsTrigger value="terms" className="text-xs">Condições</TabsTrigger>
                </TabsList>
                <TabsContent value="intro" className="pt-2"><Textarea value={introText} onChange={e => setIntroText(e.target.value)} className="text-xs h-24" /></TabsContent>
                <TabsContent value="terms" className="space-y-2 pt-2">
                    <Input placeholder="Pagamento" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="h-8 text-xs"/>
                    <Input placeholder="Entrega" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} className="h-8 text-xs"/>
                </TabsContent>
              </Tabs>

            </div>
          </ScrollArea>

          <div className="p-3 border-t bg-slate-50">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={handleSaveProposal} disabled={isSaving}>
                <span className="flex items-center justify-center w-full">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    {editingQuoteId ? 'ATUALIZAR PROPOSTA' : 'SALVAR NOVA PROPOSTA'}
                </span>
            </Button>
          </div>
        </Card>

        {/* ================= PREVIEW REAL TIME (8 COLUNAS) ================= */}
        <div className="col-span-1 lg:col-span-8 bg-slate-300 rounded-lg border border-slate-400 shadow-inner flex flex-col overflow-hidden relative">
            <div className="bg-slate-700 text-white px-4 py-2 text-xs flex justify-between items-center z-10 shadow">
                <span className="flex items-center gap-2 font-bold"><Printer className="w-4 h-4"/> Preview em Tempo Real</span>
                <span className="bg-slate-600 px-2 py-0.5 rounded text-[10px]">Modo: {docMode === 'COMPLETE' ? 'Completo' : docMode === 'TECHNICAL' ? 'Técnico (Sem Preço)' : 'Comercial'}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start bg-slate-300">
                <div className="bg-white shadow-2xl transition-all duration-300 origin-top" style={{ width: '210mm', minHeight: '297mm', padding: '0', transform: 'scale(0.85)', marginBottom: '-100px' }}>
                    
                    {/* CABEÇALHO DINÂMICO */}
                    <div className={`h-4 w-full ${quoteType === 'SERVICE' ? 'bg-blue-600' : quoteType === 'RENTAL' ? 'bg-orange-500' : 'bg-emerald-600'}`}></div>
                    <div className="px-10 py-8 flex justify-between items-end border-b">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">EXS <span className={quoteType === 'SERVICE' ? 'text-blue-600' : quoteType === 'RENTAL' ? 'text-orange-500' : 'text-emerald-600'}>SOLUTIONS</span></h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {quoteType === 'SERVICE' ? 'Laboratório de Calibração' : quoteType === 'RENTAL' ? 'Locação de Equipamentos' : 'Energia & Alta Tensão'}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className={`${quoteType === 'SERVICE' ? 'bg-blue-50 text-blue-800' : quoteType === 'RENTAL' ? 'bg-orange-50 text-orange-800' : 'bg-emerald-50 text-emerald-800'} px-3 py-1 rounded text-xs font-bold inline-block mb-1`}>
                                {docMode === 'TECHNICAL' ? 'PROPOSTA TÉCNICA' : docMode === 'COMMERCIAL' ? 'PROPOSTA COMERCIAL' : 'PROPOSTA COMPLETA'}
                            </div>
                            <p className="text-xs text-slate-500">{currentDate}</p>
                        </div>
                    </div>

                    <div className="px-10 py-8">
                        {/* CLIENTE */}
                        <div className="flex justify-between items-start mb-8 bg-slate-50 p-4 rounded border">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Cliente</p>
                                <h2 className="text-lg font-bold text-slate-800">{selectedCustomer?.tradeName || 'Cliente Exemplo'}</h2>
                                <p className="text-sm text-muted-foreground">{selectedCustomer?.companyName}</p>
                                <p className="text-xs text-muted-foreground">{selectedCustomer?.cnpj}</p>
                            </div>
                            {showPrices && (
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Validade</p>
                                    <p className="text-lg font-bold text-emerald-700">{validityDays} Dias</p>
                                </div>
                            )}
                        </div>

                        {/* TEXTO */}
                        <div className="text-sm text-slate-600 mb-8 whitespace-pre-line text-justify leading-relaxed">{introText}</div>

                        {/* TABELA DE ITENS (CONDICIONAL) */}
                        <div className="mb-8">
                            <h3 className="font-bold text-sm mb-2 flex items-center gap-2 uppercase">
                                <PackageCheck className="w-4 h-4"/> {docMode === 'TECHNICAL' ? 'Escopo Técnico' : 'Itens e Valores'}
                            </h3>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className={quoteType === 'SERVICE' ? 'bg-blue-700 text-white' : quoteType === 'RENTAL' ? 'bg-orange-600 text-white' : 'bg-emerald-700 text-white'}>
                                        <th className="p-2 text-left w-12">Item</th>
                                        <th className={`p-2 text-left ${showPrices ? 'w-2/3' : 'w-full'}`}>Descrição</th>
                                        {showPrices && <th className="p-2 text-right">Valor</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProducts.length > 0 && showPrices && (
                                        <tr className="border-b border-slate-100">
                                            <td className="p-2 text-center">-</td>
                                            <td className="p-2 text-slate-700 font-medium">Preço de Tabela</td>
                                            <td className="p-2 text-right font-bold text-slate-800">{formatCurrency(tablePrice, 'BRL')}</td>
                                        </tr>
                                    )}
                                    {selectedProducts.map((p, i) => (
                                        <tr key={i} className="border-b border-slate-100">
                                            <td className="p-2 text-center font-semibold">{i + 1}</td>
                                            <td className="p-2 text-slate-700">{p.name}</td>
                                            {showPrices && i > 0 && <td className="p-2 text-right font-bold text-slate-800">-</td>}
                                        </tr>
                                    ))}
                                    {selectedProducts.length === 0 && <tr><td colSpan={showPrices ? 3 : 2} className="p-4 text-center text-slate-400">Aguardando seleção...</td></tr>}
                                    
                                    {showPrices && discountValue > 0 && (
                                        <tr className="border-b border-slate-100">
                                            <td className="p-2 text-center">-</td>
                                            <td className="p-2 text-slate-700 font-medium">Desconto Comercial</td>
                                            <td className="p-2 text-right font-bold text-red-500">-{formatCurrency(discountValue, 'BRL')}</td>
                                        </tr>
                                    )}
                                </tbody>
                                {showPrices && (
                                    <tfoot>
                                        <tr className="bg-slate-100 font-bold text-slate-800">
                                            <td colSpan={2} className="p-2 text-right uppercase text-xs">Total Final</td>
                                            <td className="p-2 text-right text-lg text-emerald-700">{formatCurrency(finalPrice, 'BRL')}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {/* INCLUSOS E PAGAMENTO */}
                        {showTechDetails && (
                            <div className="mb-8 bg-slate-50 p-4 rounded border">
                                <h4 className="font-bold text-xs uppercase text-slate-500 mb-2">Incluso no Escopo:</h4>
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-700">
                                    {INCLUDED_ITEMS.map((item, i) => (<div key={i} className="flex gap-1"><ShieldCheck className="w-3 h-3"/> {item}</div>))}
                                </div>
                            </div>
                        )}

                        {showPayment && (
                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Pagamento</span><span className="text-xs font-bold text-slate-800">{paymentTerms}</span></div>
                                <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Entrega</span><span className="text-xs font-bold text-slate-800">{freightType} - {deliveryTime}</span></div>
                            </div>
                        )}

                        {/* CONDIÇÕES GERAIS */}
                        <div className="mb-4 border-t pt-4 mt-8 break-inside-avoid">
                            <h3 className="font-bold text-slate-900 text-xs uppercase mb-3">5. Condições Gerais de Venda</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[9px] text-slate-500 text-justify leading-tight">
                                {GENERAL_TERMS.map((term, i) => (
                                    <div key={i}>
                                        <span className="font-bold text-slate-700">{term.title}: </span>
                                        {term.text}
                                    </div>
                                ))}
                            </div>
                            <p className="text-[9px] text-slate-400 mt-3 text-center italic">
                                Fica eleito o foro da comarca de Americana/SP para dirimir quaisquer dúvidas oriundas deste contrato.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

    