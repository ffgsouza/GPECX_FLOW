"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Save, Loader2, Briefcase, Wrench, Printer, 
  ShieldCheck, PackageCheck, LayoutTemplate, AlertCircle, 
  FileText, Banknote, CalendarClock, PackageOpen, Eye
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, where, getDocs, doc, getDoc, type Firestore } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";


import { initializeFirebase } from "@/firebase";
import { useAppContext } from "@/context/app-context";
import { SaleProduct, ProductKit, Quote, Customer, Vendor, Revision } from "@/lib/types";
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


const DEFAULT_INTRO = `Prezados,\n\nA EXS Solutions (Grupo GPECX) tem a satisfação de apresentar nossa proposta.\nMais do que equipamentos, entregamos segurança operacional. Com nossa expertise no setor elétrico, garantimos qualidade e suporte contínuo.`;
const INCLUDED_ITEMS = ["Certificado de Calibração", "Software Vitalício", "Kit Acessórios", "Treinamento", "Comunidade EXS Colab"];


export function CalculatorForm() {
  const { products, customers, vendors, globalSettings, addQuote, updateQuote } = useAppContext();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  let db: Firestore;

  // --- 1. ESTADOS DE DADOS (Inputs) ---
  const [templates, setTemplates] = useState<ProductKit[]>([]);
  
  // --- 2. SELETORES PRINCIPAIS ---
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [quoteType, setQuoteType] = useState<"SALES" | "SERVICE" | "RENTAL">("SALES");
  const [docMode, setDocMode] = useState<"COMPLETE" | "TECHNICAL" | "COMMERCIAL">("COMPLETE");
  const [revisionDescription, setRevisionDescription] = useState("");

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
  const [revisions, setRevisions] = useState<Revision[]>([]);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
  }, []);

  // --- 5. INITIAL FETCH ---
  useEffect(() => {
    const { db: firestoreDb } = initializeFirebase();
    db = firestoreDb;
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
          setSelectedVendorId(quoteData.vendorId);
          setQuoteType(quoteData.type || "SALES");
          setDocMode(quoteData.proposalData?.docMode || "COMPLETE");
          setRevisionDescription(""); // Limpa descrição da revisão ao carregar
          setRevisions(quoteData.revisions || []);
          
          const loadedProducts = quoteData.items.map(item => products.find(p => p.id === item.id)).filter(p => p) as SaleProduct[];
          setSelectedProducts(loadedProducts);
          
          setKitFixedPrice(quoteData.totals.tablePrice || quoteData.totals.suggestedPrice / (1 - (quoteData.params.discountPct || 0)));
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
      if (products.length > 0) fetchQuote();
    }
  }, [searchParams, products, customers, vendors, toast]);

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

  const handleSaveProposal = async (andView: boolean) => {
    if (!selectedCustomerId || selectedProducts.length === 0 || !selectedVendorId) {
        return toast({ title: "Dados Incompletos", description: "Selecione um cliente, um vendedor e ao menos um produto.", variant: "destructive" });
    }
    setIsSaving(true);
    let finalQuoteId = editingQuoteId;
    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      const vendor = vendors.find(v => v.id === selectedVendorId);

      if (!customer || !vendor) {
        toast({ title: "Erro de Dados", description: "Cliente ou vendedor não encontrado.", variant: "destructive" });
        setIsSaving(false);
        return;
      }
      
      const revisionNumber = editingQuoteId ? (revisions.length || 0) : 0;
      
      const newRevision: Revision = {
          revisionNumber: revisionNumber,
          description: revisionDescription || (revisionNumber === 0 ? "Emissão Inicial" : "Revisão de valores/escopo"),
          authorInitials: vendor.initials,
          approverInitials: vendor.initials, // TODO: Mudar para aprovador real
          date: Date.now()
      };
      
      const updatedRevisions = [...revisions, newRevision];

      const dataToSave: Partial<Quote> = {
        customerId: selectedCustomerId,
        customerData: customer,
        vendorId: selectedVendorId,
        vendorData: vendor,
        items: selectedProducts.map(p => ({ id: p.id, name: p.name, costUSD: p.costUSD, productTypeId: p.productTypeId, ncm: p.ncm, netWeightKg: p.netWeightKg })),
        totals: { totalLanded: currentTotalCost, tablePrice, discountValue, suggestedPrice: finalPrice, marginPct: profitAnalysis.margin, profitValue: profitAnalysis.value },
        params: { dolarRate, simplesPct: globalSettings.simplesNacionalTax/100, commissionPct: globalSettings.salesCommission/100, discountPct: discountPct / 100 },
        proposalData: { introText, paymentTerms, deliveryTime, validityDays, freightType, docMode, revisionDescription },
        revisions: updatedRevisions,
        status: "DRAFT", 
        stage: "PROPOSAL", 
        type: quoteType,
      };

      if (editingQuoteId) {
        const currentNumber = (await getDoc(doc(db, "quotes", editingQuoteId))).data()?.number || "";
        const baseNumber = currentNumber.split('-R')[0];
        dataToSave.number = `${baseNumber}-R${revisionNumber}`;
        
        await updateQuote(editingQuoteId, dataToSave);
        toast({ title: "Sucesso!", description: `Proposta ${dataToSave.number} atualizada.` });
      } else {
        const smartNumber = await generateSmartNumber(quoteType);
        dataToSave.number = `${smartNumber}-R0`;
        dataToSave.createdAt = Date.now();
        const newDocRef = await addQuote(dataToSave as Omit<Quote, 'id'>);
        finalQuoteId = newDocRef.id;
        toast({ title: "Sucesso!", description: `Proposta ${dataToSave.number} salva.` });
      }

      if (andView && finalQuoteId) {
        router.push(`/admin/quotes/${finalQuoteId}/proposal`);
      } else {
        setDiscountPct(0); setSelectedProducts([]); setKitFixedPrice(null); setSelectedCustomerId(""); setEditingQuoteId(null); setRevisionDescription("");
      }

    } catch (e: any) { 
        console.error(e);
        toast({ title: "Erro", description: e.message || "Falha ao salvar.", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  return (
    <div className="h-[calc(100vh-120px)] w-full bg-slate-100 p-2 overflow-hidden">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        
        <Card className="col-span-1 lg:col-span-4 flex flex-col h-full bg-white shadow-lg border-slate-200 overflow-hidden">
          <div className="p-3 border-b bg-slate-50 flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-700">{editingQuoteId ? "Editor de Proposta" : "Construtor de Proposta"}</h2>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              
              <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">1. Modalidade de Negócio</Label>
                  <RadioGroup value={quoteType} onValueChange={(v:any) => setQuoteType(v)} className="grid grid-cols-3 gap-1">
                      <Label htmlFor="m1" className={`flex flex-col items-center justify-center p-2 rounded border cursor-pointer ${quoteType === 'SALES' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white'}`}>
                          <RadioGroupItem value="SALES" id="m1" className="sr-only"/>
                          <Briefcase className="w-4 h-4 mx-auto mb-1"/>
                          <span className="text-[10px] font-bold">Venda</span>
                      </Label>
                      <Label htmlFor="m2" className={`flex flex-col items-center justify-center p-2 rounded border cursor-pointer ${quoteType === 'RENTAL' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white'}`}>
                          <RadioGroupItem value="RENTAL" id="m2" className="sr-only"/>
                          <CalendarClock className="w-4 h-4 mx-auto mb-1"/>
                          <span className="text-[10px] font-bold">Locação</span>
                      </Label>
                       <Label htmlFor="m3" className={`flex flex-col items-center justify-center p-2 rounded border cursor-pointer ${quoteType === 'SERVICE' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}>
                          <RadioGroupItem value="SERVICE" id="m3" className="sr-only"/>
                           <Wrench className="w-4 h-4 mx-auto mb-1"/>
                           <span className="text-[10px] font-bold">Serviço</span>
                      </Label>
                  </RadioGroup>
              </div>

              <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">2. Modo de Documento (Compliance)</Label>
                  <RadioGroup value={docMode} onValueChange={(v:any) => setDocMode(v)} className="grid grid-cols-1 gap-1">
                      <Label htmlFor="d1" className={`flex items-center p-2 rounded border cursor-pointer ${docMode === 'COMPLETE' ? 'bg-slate-100 border-slate-500' : 'bg-white'}`}>
                          <RadioGroupItem value="COMPLETE" id="d1" className="sr-only"/>
                          <PackageOpen className="w-4 h-4 mr-2"/>
                          <span className="text-xs font-bold w-full">Completa (Padrão)</span>
                      </Label>
                       <Label htmlFor="d2" className={`flex items-center p-2 rounded border cursor-pointer ${docMode === 'TECHNICAL' ? 'bg-slate-100 border-slate-500' : 'bg-white'}`}>
                          <RadioGroupItem value="TECHNICAL" id="d2" className="sr-only"/>
                           <FileText className="w-4 h-4 mr-2"/>
                           <span className="text-xs font-bold w-full">Apenas Técnica (Sem Preço)</span>
                      </Label>
                      <Label htmlFor="d3" className={`flex items-center p-2 rounded border cursor-pointer ${docMode === 'COMMERCIAL' ? 'bg-slate-100 border-slate-500' : 'bg-white'}`}>
                          <RadioGroupItem value="COMMERCIAL" id="d3" className="sr-only"/>
                           <Banknote className="w-4 h-4 mr-2"/>
                           <span className="text-xs font-bold w-full">Apenas Comercial</span>
                      </Label>
                  </RadioGroup>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label className="text-xs font-bold">Cliente</Label>
                      <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.tradeName}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
                   <div>
                      <Label className="text-xs font-bold">Vendedor</Label>
                      <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
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
                <TabsContent value="intro" className="pt-2">
                    <Textarea value={introText} onChange={e => setIntroText(e.target.value)} className="text-xs h-24" />
                </TabsContent>
                <TabsContent value="terms" className="space-y-2 pt-2">
                    <Input placeholder="Pagamento" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="h-8 text-xs"/>
                    <Input placeholder="Entrega" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} className="h-8 text-xs"/>
                     <Input placeholder="Descrição da Revisão (Opcional)" value={revisionDescription} onChange={e => setRevisionDescription(e.target.value)} className="h-8 text-xs"/>
                </TabsContent>
              </Tabs>

            </div>
          </ScrollArea>

          <div className="p-3 border-t bg-slate-50 grid grid-cols-2 gap-2">
            <Button className="w-full" variant="outline" onClick={() => handleSaveProposal(false)} disabled={isSaving}>
                <span className="flex items-center justify-center w-full">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    {editingQuoteId ? 'Salvar' : 'Salvar'}
                </span>
            </Button>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => handleSaveProposal(true)} disabled={isSaving}>
                <span className="flex items-center justify-center w-full">
                    <Eye className="w-4 h-4 mr-2"/>
                    Salvar e Visualizar
                </span>
            </Button>
          </div>
        </Card>

        {/* COLUNA DE ITENS SELECIONADOS */}
        <div className="col-span-1 lg:col-span-8 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden relative p-4">
           <h3 className="font-bold text-lg mb-4">Itens da Proposta</h3>
           {selectedProducts.length > 0 ? (
                <div className="space-y-2">
                    {selectedProducts.map((p, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                            <span className="font-medium text-sm">{p.name}</span>
                            <span className="text-sm font-mono">{formatCurrency(p.costUSD, 'USD')}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 border-2 border-dashed rounded-lg">
                    <PackageOpen className="w-12 h-12 mb-2"/>
                    <p className="font-bold">Nenhum item selecionado</p>
                    <p className="text-xs">Carregue um Kit ou adicione produtos manualmente.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
