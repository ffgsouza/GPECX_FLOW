"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Save, Loader2, Briefcase, Wrench, Printer, 
  ShieldCheck, PackageCheck, LayoutTemplate, 
  FileText, Banknote, CalendarClock, PackageOpen,
  Monitor, Cable, Plug, CheckCircle2, History
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
import { Checkbox } from "@/components/ui/checkbox";


// --- TEXTOS LEGAIS (CONFORME PDF) ---
const LEGAL_TERMS = [
  { title: "5.1 Aceite", text: "A aceitação de nossa proposta implica na aceitação destas Condições Gerais de Vendas ou aceite por escrito da EXS Solutions. Modificações na proposta prevalecem sobre estas condições." },
  { title: "5.2 Fornecimento Adicional", text: "Todo fornecimento não listado expressamente na proposta será considerado adicional e cobrado à parte." },
  { title: "5.3 Responsabilidade", text: "A EXS não responde por lucros cessantes ou danos indiretos. A garantia limita-se ao reparo/substituição de itens defeituosos (exceto mal uso)." },
  { title: "5.4 Inadimplência", text: "Atrasos no pagamento geram multa de 10%, juros de 2% a.m. e honorários de 20% em caso de cobrança judicial." },
  { title: "5.5 Proteção (Empréstimo)", text: "Ocorrendo atraso na entrega por culpa da EXS, concederemos empréstimo de equipamento similar até a entrega do novo." },
  { title: "5.6 Cancelamento", text: "Multa de 10% sobre o valor total em caso de quebra de contrato/desistência." },
  { title: "5.7 Tributos", text: "Novos tributos ou alterações de alíquotas após a proposta implicarão em revisão de preços." },
  { title: "5.8 Retirada", text: "Cliente tem 5 dias úteis para retirar após aviso. Após isso, inicia-se contagem para pagamentos restantes." }
];

interface CustomerSimple { id: string; tradeName: string; document?: string; email?: string; phone?: string; contactName?: string; }


export function CalculatorForm() {
  const { products, customers, vendors, globalSettings, addQuote, updateQuote } = useAppContext();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  let db: Firestore;

  // --- 1. DADOS & ESTADOS ---
  const [templates, setTemplates] = useState<ProductKit[]>([]);
  
  // Seleções
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [quoteType, setQuoteType] = useState<"SALES" | "SERVICE" | "RENTAL">("SALES");
  const [docMode, setDocMode] = useState<"COMPLETE" | "TECHNICAL" | "COMMERCIAL">("COMPLETE");

  
  // Itens
  const [selectedProducts, setSelectedProducts] = useState<SaleProduct[]>([]);
  const [kitFixedPrice, setKitFixedPrice] = useState<number | null>(null);
  const [kitFixedCost, setKitFixedCost] = useState<number | null>(null);
  const [discountPct, setDiscountPct] = useState(0);

  // Inputs da Proposta
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [revisionDescription, setRevisionDescription] = useState("Emissão Inicial");
  const [paymentTerms, setPaymentTerms] = useState("50% no Pedido / 50% na Entrega");
  const [deliveryTime, setDeliveryTime] = useState("30 dias");
  const [validityDays, setValidityDays] = useState("5");
  const [freightIncluded, setFreightIncluded] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dateStr, setDateStr] = useState(""); // Estado para evitar erro de hidratação

  // --- 2. INICIALIZAÇÃO ---
  useEffect(() => {
    // Corrige erro de Hidratação definindo a data apenas no cliente
    setDateStr(new Date().toLocaleDateString('pt-BR'));

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
          
          setPaymentTerms(quoteData.proposalData?.paymentTerms || "50% Pedido / 50% Entrega");
          setDeliveryTime(quoteData.proposalData?.deliveryTime || "30 dias");
          setValidityDays(quoteData.proposalData?.validityDays || "5");
          setFreightIncluded(quoteData.proposalData?.freightIncluded === false ? false : true);

        } else {
            toast({title: "Erro", description: "Proposta não encontrada.", variant: "destructive"});
        }
        setIsLoading(false);
      }
      if (products.length > 0) fetchQuote();
    }
  }, [searchParams, products, customers, vendors, toast]);


  // --- 3. CÁLCULOS ---
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


  // --- 4. AÇÕES ---
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
    toast({ title: "Kit Carregado", description: `Modelo: ${t.name}` });
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
        proposalData: { paymentTerms, deliveryTime, validityDays, freightIncluded, docMode, revisionDescription },
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
        const smartNumber = await generateSmartNumber(db, quoteType);
        dataToSave.number = `${smartNumber}-R0`;
        dataToSave.createdAt = Date.now();
        const newDocRef = await addQuote(dataToSave as Omit<Quote, 'id'>);
        finalQuoteId = newDocRef.id;
        toast({ title: "Sucesso!", description: `Proposta ${dataToSave.number} salva.` });
      }

      if (andView && finalQuoteId) {
        router.push(`/admin/quotes/${finalQuoteId}/proposal`);
      } else if (!andView && !editingQuoteId) {
        setDiscountPct(0); setSelectedProducts([]); setKitFixedPrice(null); setSelectedCustomerId(""); setEditingQuoteId(null); setRevisionDescription("Emissão Inicial");
      }

    } catch (e: any) { 
        console.error(e);
        toast({ title: "Erro", description: e.message || "Falha ao salvar.", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  const currentCustomer = customers.find(c => c.id === selectedCustomerId);
  const currentVendor = vendors.find(v => v.id === selectedVendorId);

  // --- HELPERS DE VISUALIZAÇÃO ---
  const showTech = docMode === "COMPLETE" || docMode === "TECHNICAL";
  const showComm = docMode === "COMPLETE" || docMode === "COMMERCIAL";

  return (
    <div className="h-[calc(100vh-120px)] w-full bg-slate-100 p-2 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        
        {/* =========================================================
            EDITOR (ESQUERDA) - CONTROLES
           ========================================================= */}
        <Card className="col-span-1 lg:col-span-4 flex flex-col h-full bg-white shadow-lg border-slate-200 overflow-hidden">
          <div className="p-3 border-b bg-slate-50 flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-700">Construtor Padrão EXS</h2>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              
              {/* 1. SELETORES DE TIPO */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Modalidade</Label>
                    <Select value={quoteType} onValueChange={(v:any) => setQuoteType(v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="SALES">Venda (PVE)</SelectItem>
                            <SelectItem value="RENTAL">Locação (PLE)</SelectItem>
                            <SelectItem value="SERVICE">Serviço (PTC)</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Visualização</Label>
                    <Select value={docMode} onValueChange={(v:any) => setDocMode(v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="COMPLETE">Completa</SelectItem>
                            <SelectItem value="TECHNICAL">Só Técnica</SelectItem>
                            <SelectItem value="COMMERCIAL">Só Comercial</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
              </div>

              <Separator />

              {/* 2. DADOS DO CLIENTE E KIT */}
              <div className="space-y-3">
                <Label className="text-xs font-bold">Cliente & Vendedor</Label>
                 <div className="grid grid-cols-2 gap-2">
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Selecione Cliente..." /></SelectTrigger>
                        <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.tradeName}</SelectItem>)}</SelectContent>
                    </Select>
                     <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Selecione Vendedor..." /></SelectTrigger>
                        <SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                    </Select>
                 </div>
                 <Label className="text-xs font-bold">Equipamento</Label>
                <Select onValueChange={handleLoadTemplate}>
                    <SelectTrigger className="h-9 bg-slate-50"><SelectValue placeholder="Carregar Kit/Modelo..." /></SelectTrigger>
                    <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <Separator />

              {/* 3. DADOS DA CAPA (PDF PÁG 1) */}
              <div className="space-y-3 bg-slate-50 p-3 rounded border">
                 <Label className="text-[10px] uppercase font-bold text-slate-500 flex gap-2 items-center"><History className="w-3 h-3"/> Dados da Revisão</Label>
                 <Input value={revisionDescription} onChange={e => setRevisionDescription(e.target.value)} className="h-7 text-xs bg-white" placeholder="Descrição da Revisão (Ex: Inclusão de item)"/>
              </div>

              {/* 4. DADOS COMERCIAIS (PDF PÁG 4) */}
              <div className={`space-y-3 ${!showComm ? 'opacity-50 pointer-events-none' : ''}`}>
                 <Label className="text-[10px] uppercase font-bold text-slate-500 flex gap-2 items-center"><Banknote className="w-3 h-3"/> Condições Comerciais</Label>
                 
                 {/* Desconto */}
                 <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                     <div className="flex justify-between text-xs mb-1 font-bold text-emerald-800">
                        <span>Preço Tabela: {formatCurrency(tablePrice, 'BRL')}</span>
                        <span>Final: {formatCurrency(finalPrice, 'BRL')}</span>
                     </div>
                     <input type="range" min="0" max="15" step="0.5" value={discountPct} onChange={e => setDiscountPct(Number(e.target.value))} className="w-full h-2 bg-emerald-200 rounded appearance-none cursor-pointer" />
                     <div className="text-[9px] text-right text-emerald-600 mt-1">Desconto: {discountPct}%</div>
                 </div>

                 <div className="space-y-2">
                    <Input placeholder="Cond. Pagamento (Ex: 50% Sinal)" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="h-8 text-xs"/>
                    <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Prazo Entrega" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} className="h-8 text-xs"/>
                        <Input placeholder="Validade (Dias)" value={validityDays} onChange={e => setValidityDays(e.target.value)} className="h-8 text-xs"/>
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                        <Checkbox id="frete" checked={freightIncluded} onCheckedChange={(v) => setFreightIncluded(!!v)} />
                        <Label htmlFor="frete" className="text-xs">Frete Incluso (CIF)</Label>
                    </div>
                 </div>
              </div>

            </div>
          </ScrollArea>

          <div className="p-3 border-t bg-slate-50 grid grid-cols-2 gap-2">
            <Button className="w-full" variant="outline" onClick={() => handleSaveProposal(false)} disabled={isSaving}>
                <span className="flex items-center justify-center w-full gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                    {editingQuoteId ? 'Salvar' : 'Salvar'}
                </span>
            </Button>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => handleSaveProposal(true)} disabled={isSaving}>
                <span className="flex items-center justify-center w-full gap-2">
                    <Printer className="w-4 h-4"/>
                    Salvar e Visualizar
                </span>
            </Button>
          </div>
        </Card>

        {/* =========================================================
            PREVIEW PDF (DIREITA) - RÉPLICA FIEL DO PDF ENVIADO
           ========================================================= */}
        <div className="col-span-1 lg:col-span-8 bg-slate-400 rounded-lg border border-slate-500 shadow-inner flex flex-col overflow-hidden relative">
            <div className="bg-slate-800 text-white px-4 py-2 text-xs flex justify-between items-center z-10 shadow">
                <span className="flex items-center gap-2 font-bold"><Printer className="w-4 h-4"/> Preview A4 (Fiel ao Padrão)</span>
                <span className="bg-slate-700 px-2 py-0.5 rounded text-[10px]">PVE 25169 STYLE</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start bg-slate-300">
                <div className="bg-white shadow-2xl transition-all duration-300 origin-top text-slate-900 leading-tight" 
                     style={{ width: '210mm', minHeight: '297mm', padding: '15mm', transform: 'scale(0.85)', marginBottom: '-100px', fontSize: '11px' }}>
                    
                    {/* --- PÁGINA 1: CAPA --- */}
                    <div className="border-b-2 border-emerald-600 pb-4 mb-6">
                        <div className="flex justify-between items-center">
                             {/* LOGO */}
                             <div className="text-2xl font-black text-slate-800 tracking-tighter">EXS <span className="text-emerald-600">SOLUTIONS</span></div>
                             <div className="text-[10px] text-slate-400 font-bold">GRUPO GPECX</div>
                        </div>
                        <div className="mt-8 text-center">
                            <h1 className="text-xl font-bold uppercase text-slate-800 border-2 border-slate-800 py-2 inline-block px-8">
                                {`DOCUMENTO: ${quoteType === 'SALES' ? 'PVE' : quoteType === 'RENTAL' ? 'PLE' : 'PTC'} ${new Date().getFullYear()}`}
                            </h1>
                             <p className="mt-2 text-sm text-slate-600 font-bold uppercase">PROPOSTA DE {quoteType === 'SALES' ? 'VENDA' : quoteType === 'SERVICE' ? 'SERVIÇO' : 'LOCAÇÃO'} DE EQUIPAMENTOS</p>
                        </div>
                    </div>

                    {/* TABELA DE REVISÃO (PÁG 1) */}
                    <table className="w-full text-xs border-collapse border border-slate-300 mb-8 text-center">
                        <thead className="bg-slate-100 font-bold">
                            <tr>
                                <td className="border border-slate-300 p-1 w-10">REV.</td>
                                <td className="border border-slate-300 p-1">DESCRIÇÃO</td>
                                <td className="border border-slate-300 p-1 w-16">ELAB.</td>
                                <td className="border border-slate-300 p-1 w-16">APROV.</td>
                                <td className="border border-slate-300 p-1 w-24">DATA</td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-slate-300 p-1">{String(revisions.length || 0).padStart(2, '0')}</td>
                                <td className="border border-slate-300 p-1 text-left">{revisionDescription}</td>
                                <td className="border border-slate-300 p-1">{currentVendor?.initials || 'VEND'}</td>
                                <td className="border border-slate-300 p-1">GER</td>
                                <td className="border border-slate-300 p-1">{dateStr}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* TABELA DE DADOS DO CLIENTE (PÁG 1) */}
                    <table className="w-full text-xs border-collapse border border-slate-300 mb-12">
                         <tbody>
                            <tr>
                                <td className="border border-slate-300 p-2 font-bold bg-slate-50 w-32">Solicitante:</td>
                                <td className="border border-slate-300 p-2">{currentCustomer?.tradeName || "..."}</td>
                            </tr>
                            <tr>
                                <td className="border border-slate-300 p-2 font-bold bg-slate-50">CNPJ:</td>
                                <td className="border border-slate-300 p-2">{currentCustomer?.document || "..."}</td>
                            </tr>
                            <tr>
                                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Responsável:</td>
                                <td className="border border-slate-300 p-2">{currentCustomer?.contactName || "..."}</td>
                            </tr>
                            <tr>
                                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Email:</td>
                                <td className="border border-slate-300 p-2">{currentCustomer?.email || "..."}</td>
                            </tr>
                            <tr>
                                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Telefone:</td>
                                <td className="border border-slate-300 p-2">{currentCustomer?.phone || "..."}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* RODAPÉ DA CAPA */}
                    <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] text-xs">
                        <p>Atenciosamente,</p>
                        <p className="font-bold mt-2">{currentVendor?.name || "Departamento Comercial"}</p>
                        <p>EXS Solutions | {currentVendor?.phone || "(19) 3468-0000"}</p>
                        <p>{currentVendor?.email || "comercial@gpecx.com"}</p>
                    </div>

                    <div className="break-before-page mt-8 border-t-2 border-dashed border-slate-200 pt-4"></div>

                    {/* --- PÁGINA 2: INTRODUÇÃO --- */}
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-slate-800 uppercase border-b border-emerald-500 mb-2">1. Sobre a Empresa</h2>
                        <p className="text-justify mb-4 text-xs">
                            A EXS SOLUTIONS, integrante do Grupo GPECX, possui experiência desde 2014 em atendimento ao mercado nos segmentos de geração, distribuição e transmissão de energia elétrica. Somos especialistas em desenvolvimento de produtos e soluções, atendendo setores como Engenharia Elétrica, Automação, Controle e Desenvolvimento de Produtos.
                        </p>
                        <div className="text-xs bg-slate-50 p-2 rounded">
                            <p><strong>Razão Social:</strong> EXS SOLUTIONS LTDA</p>
                            <p><strong>CNPJ:</strong> 42.982.549/0001-79</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-slate-800 uppercase border-b border-emerald-500 mb-2">2. Objetivo</h2>
                        <p className="text-justify text-xs">
                            O presente documento tem como objetivo apresentar uma proposta técnica comercial para o referido solicitante. O conteúdo desta proposta é confidencial.
                        </p>
                    </div>

                    {/* --- PÁGINA 3: PROPOSTA TÉCNICA (CONDICIONAL) --- */}
                    {showTech && (
                        <div className="mb-6">
                            <h2 className="text-sm font-bold text-slate-800 uppercase border-b border-emerald-500 mb-2">3. Proposta Técnica</h2>
                            <p className="mb-2 text-xs"><strong>3.1 Escopo Geral:</strong> Fornecimento dos itens citados abaixo.</p>
                            
                            <table className="w-full text-xs border-collapse border border-slate-300 mb-4">
                                <thead className="bg-slate-100 font-bold">
                                    <tr>
                                        <td className="border border-slate-300 p-1">Equipamento</td>
                                        <td className="border border-slate-300 p-1 w-32">Modelo</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProducts.map((p, i) => (
                                        <tr key={i}>
                                            <td className="border border-slate-300 p-1">{p.name}</td>
                                            <td className="border border-slate-300 p-1 font-bold text-center">UTS/UTD</td>
                                        </tr>
                                    ))}
                                    {selectedProducts.length === 0 && <tr><td colSpan={2} className="p-2 text-center border">Nenhum item.</td></tr>}
                                </tbody>
                            </table>

                            <div className="text-xs">
                                <p className="font-bold mb-1">Inclusos no fornecimento:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Certificado de calibração;</li>
                                    <li>Software de utilização atualizado;</li>
                                    <li>Todos os acessórios (Anexo A);</li>
                                    <li>Treinamento de usuário.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                     <div className="break-before-page mt-8 border-t-2 border-dashed border-slate-200 pt-4"></div>

                    {/* --- PÁGINA 4: PROPOSTA COMERCIAL (CONDICIONAL) --- */}
                    {showComm && (
                        <div className="mb-6">
                            <h2 className="text-sm font-bold text-slate-800 uppercase border-b border-emerald-500 mb-2">4. Proposta Comercial</h2>
                            
                            <table className="w-full text-xs border-collapse border border-slate-300 mb-4">
                                <thead className="bg-slate-100 font-bold">
                                    <tr>
                                        <td className="border border-slate-300 p-1 w-8">Item</td>
                                        <td className="border border-slate-300 p-1">Descrição</td>
                                        <td className="border border-slate-300 p-1 w-8">Qtd</td>
                                        <td className="border border-slate-300 p-1 w-24">Unitário</td>
                                        <td className="border border-slate-300 p-1 w-24">Total</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProducts.map((p, i) => (
                                        <tr key={i}>
                                            <td className="border border-slate-300 p-1 text-center">{i+1}</td>
                                            <td className="border border-slate-300 p-1">{p.name}</td>
                                            <td className="border border-slate-300 p-1 text-center">1</td>
                                            <td className="border border-slate-300 p-1 text-right">{formatCurrency(tablePrice, 'BRL')}</td>
                                            <td className="border border-slate-300 p-1 text-right">{formatCurrency(tablePrice, 'BRL')}</td>
                                        </tr>
                                    ))}
                                    {selectedProducts.length === 0 && (
                                        <tr><td colSpan={5} className="p-4 text-center border-b">Nenhum item selecionado.</td></tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold">
                                        <td colSpan={4} className="p-1 text-right border">Preço de Tabela:</td>
                                        <td className="p-1 text-right border">{formatCurrency(tablePrice, 'BRL')}</td>
                                    </tr>
                                    {discountPct > 0 && (
                                        <tr className="font-bold text-red-600">
                                            <td colSpan={4} className="p-1 text-right border">Desconto Comercial:</td>
                                            <td className="p-1 text-right border">{formatCurrency(discountValue * -1, 'BRL')}</td>
                                        </tr>
                                    )}
                                    <tr className="font-black text-base bg-emerald-50 text-emerald-800">
                                        <td colSpan={4} className="p-1 text-right border">TOTAL FINAL:</td>
                                        <td className="p-1 text-right border">{formatCurrency(finalPrice, 'BRL')}</td>
                                    </tr>
                                </tfoot>
                            </table>

                            <div className="text-xs space-y-2 mb-4">
                                <p><strong>4.2 Frete:</strong> {freightIncluded ? "☑ Incluso" : "☑ Não Incluso (FOB)"}</p>
                                <p><strong>4.3 Condições de Pagamento:</strong> {paymentTerms}</p>
                                <p><strong>4.4 Prazo de Entrega:</strong> {deliveryTime}</p>
                                <p><strong>4.5 Validade:</strong> {validityDays} dias.</p>
                                <p><strong>4.6 Garantia:</strong> 2 anos contra defeitos de fabricação.</p>
                                <p><strong>4.7 Local de Retirada:</strong> Sede EXS Solutions (Americana/SP).</p>
                                <p><strong>4.8 Impostos:</strong> A EXS é optante pelo Simples Nacional.</p>
                            </div>

                            <h2 className="text-sm font-bold text-slate-800 uppercase border-b border-emerald-500 mb-2 mt-6">5. Condições Gerais de Venda</h2>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[9px] text-justify leading-tight">
                                {LEGAL_TERMS.map((term, i) => (
                                    <div key={i}>
                                        <span className="font-bold">{term.title}: </span>{term.text}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 text-[9px] text-center italic">
                                <strong>6. FORO:</strong> O foro de Americana/SP será o único competente para ações judiciais.
                            </div>
                        </div>
                    )}

                    {/* --- PÁGINA 7: ANEXO (VISUAL) --- */}
                     <div className="break-before-page mt-8 border-t-2 border-dashed border-slate-200 pt-4"></div>
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-slate-800 uppercase border-b border-emerald-500 mb-4">Anexo A - Acessórios Inclusos</h2>
                        
                        {selectedProducts.map((p, i) => (
                            <div key={i} className="mb-6 border p-2 rounded">
                                <h3 className="font-bold text-xs bg-slate-100 p-1 mb-2">{p.name}</h3>
                                <table className="w-full text-xs border-collapse border border-slate-300">
                                    <thead className="bg-slate-50">
                                        <tr><td className="border p-1 w-10">Qtd</td><td className="border p-1">Item</td></tr>
                                    </thead>
                                    <tbody>
                                        <tr><td className="border p-1 text-center">1</td><td className="border p-1">Mala de transporte com alça, rodinhas e espuma</td></tr>
                                        <tr><td className="border p-1 text-center">1</td><td className="border p-1">Cabo de alimentação e Kit de Cabos de Teste</td></tr>
                                        <tr><td className="border p-1 text-center">1</td><td className="border p-1">Licença de Software Vitalícia</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        ))}
                         {selectedProducts.length === 0 && <p className="text-xs text-center text-slate-400">Nenhum equipamento principal selecionado para detalhar acessórios.</p>}
                    </div>

                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
