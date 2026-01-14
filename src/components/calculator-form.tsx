"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Save, Loader2, Briefcase, Wrench, Printer,
    ShieldCheck, PackageCheck, LayoutTemplate,
    FileText, Banknote, CalendarClock, PackageOpen,
    Monitor, Cable, Plug, CheckCircle2, History, ChevronLeft, ChevronRight
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, where, getDocs, doc, getDoc, type Firestore } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";


import { initializeFirebase } from "@/firebase";
import { useAppContext } from "@/context/app-context";
import { SaleProduct, ProductKit, Quote, Customer, Vendor, Revision } from "@/lib/types";
import { generateSmartNumber } from "@/lib/generators";
import { formatCurrency } from "@/lib/utils";
import ProposalDocument from "./proposal-document";
import RentalProposalDocument from "./rental-proposal-document";

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


interface CustomerSimple { id: string; tradeName: string; document?: string; email?: string; phone?: string; contactName?: string; }


export function CalculatorForm() {
    const { products, customers, vendors, globalSettings, addQuote, updateQuote, productTypes, db, rentalEquipments } = useAppContext();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();

    // --- 1. DADOS & ESTADOS ---
    const [templates, setTemplates] = useState<ProductKit[]>([]);

    // Seleções
    const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
    const [quoteNumber, setQuoteNumber] = useState<string>("NOVA");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [selectedVendorId, setSelectedVendorId] = useState<string>("");
    const [quoteType, setQuoteType] = useState<"SALES" | "SERVICE" | "RENTAL">("SALES");
    const [docMode, setDocMode] = useState<"COMPLETE" | "TECHNICAL" | "COMMERCIAL">("COMPLETE");

    // Rental Dates
    const [rentalStartDate, setRentalStartDate] = useState<string>("");
    const [rentalEndDate, setRentalEndDate] = useState<string>("");

    const rentalDuration = useMemo(() => {
        if (!rentalStartDate || !rentalEndDate) return 0;

        const start = new Date(rentalStartDate);
        const end = new Date(rentalEndDate);

        // Zerar as horas para comparar apenas as datas
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        // Calcular diferença em dias (calendário)
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        // Se pegou e devolveu no mesmo dia (diff = 0), considera 1 diária
        // Se pegou dia 12 e devolveu dia 13 (diff = 1), considera 1 diária
        // Se pegou dia 12 e devolveu dia 14 (diff = 2), considera 2 diárias
        return Math.max(diffDays, 1);
    }, [rentalStartDate, rentalEndDate]);


    // Itens
    const [selectedProducts, setSelectedProducts] = useState<SaleProduct[]>([]);
    const [kitFixedPrice, setKitFixedPrice] = useState<number | null>(null);
    const [kitFixedCost, setKitFixedCost] = useState<number | null>(null);
    const [discountPct, setDiscountPct] = useState(0);

    // Inputs da Proposta
    const [revisions, setRevisions] = useState<Revision[]>([]);
    const [revisionDescription, setRevisionDescription] = useState("Emissão Inicial");
    const [paymentTerms, setPaymentTerms] = useState("50% no Pedido / 50% na Entrega");
    const [deliveryTime, setDeliveryTime] = useState(quoteType === "RENTAL" ? "24 horas após confirmação da locação" : "60 dias corridos");
    const [validityDays, setValidityDays] = useState("5");
    const [freightIncluded, setFreightIncluded] = useState(false);
    const [warrantyPeriod, setWarrantyPeriod] = useState(quoteType === "RENTAL" ? "N/A" : "24 Meses");
    const [additionalNotes, setAdditionalNotes] = useState("");

    // Estados para reutilização de número base
    const [useExistingBase, setUseExistingBase] = useState(false);
    const [baseNumberInput, setBaseNumberInput] = useState("");

    const [isPrintMode, setIsPrintMode] = useState(false);
    const [previewPage, setPreviewPage] = useState(1);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [dateStr, setDateStr] = useState(""); // Estado para evitar erro de hidratação

    // --- 2. INICIALIZAÇÃO ---
    useEffect(() => {
        // Corrige erro de Hidratação definindo a data apenas no cliente
        setDateStr(new Date().toLocaleDateString('pt-BR'));

        const fetchTemplates = async () => {
            if (!db) return;
            const snap = await getDocs(query(collection(db, "product_kits"), where("type", "==", "TEMPLATE")));
            setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ProductKit[]);
        };
        fetchTemplates();

        // Carregar proposta existente se quoteId estiver na URL
        const quoteId = searchParams.get('quoteId');


        if (quoteId && db) {
            setIsLoading(true);
            setEditingQuoteId(quoteId);
            const fetchQuote = async () => {
                if (!db) return;
                const quoteDoc = await getDoc(doc(db, "quotes", quoteId));
                if (quoteDoc.exists()) {
                    const quoteData = quoteDoc.data() as Quote;
                    setQuoteNumber(quoteData.number || "NOVA");
                    setSelectedCustomerId(quoteData.customerId);
                    setSelectedVendorId(quoteData.vendorId);
                    setQuoteType(quoteData.type || "SALES");
                    setDocMode(quoteData.proposalData?.docMode || "COMPLETE");
                    setRevisionDescription(""); // Limpa descrição da revisão ao carregar
                    setRevisions(quoteData.revisions || []);

                    const loadedProducts = quoteData.items.map(item => {
                        // Se for rental, o item pode não estar na lista 'products' (que é SaleProduct).
                        // Precisamos recuperar ou manter o item como está (adapter).
                        if (quoteData.type === 'RENTAL') return item;
                        return products.find(p => p.id === item.id) || item;
                    }).filter(p => p) as SaleProduct[];

                    setSelectedProducts(loadedProducts);

                    setKitFixedPrice(quoteData.totals.tablePrice || quoteData.totals.suggestedPrice / (1 - (quoteData.params.discountPct || 0)));
                    setKitFixedCost(quoteData.totals.totalLanded);
                    setDiscountPct(quoteData.params.discountPct ? quoteData.params.discountPct * 100 : 0);

                    setPaymentTerms(quoteData.proposalData?.paymentTerms || "50% Pedido / 50% Entrega");
                    setDeliveryTime(quoteData.proposalData?.deliveryTime || "30 dias");
                    setValidityDays(quoteData.proposalData?.validityDays || "5");
                    setFreightIncluded((quoteData.proposalData as any)?.freightIncluded !== false);
                    setWarrantyPeriod(quoteData.proposalData?.warrantyPeriod || "24 Meses");
                    setAdditionalNotes(quoteData.proposalData?.additionalNotes || "");

                    // Set Dates if Rental
                    if (quoteData.proposalData?.rentalStartDate) {
                        setRentalStartDate(format(new Date(quoteData.proposalData.rentalStartDate), "yyyy-MM-dd"));
                    }
                    if (quoteData.proposalData?.rentalEndDate) {
                        setRentalEndDate(format(new Date(quoteData.proposalData.rentalEndDate), "yyyy-MM-dd"));
                    }

                } else {
                    toast({ title: "Erro", description: "Proposta não encontrada.", variant: "destructive" });
                }
                setIsLoading(false);
            }
            if (products.length > 0 || quoteId) fetchQuote(); // Force fetch if editing
        } else {
            // Se não houver quoteId, garante que o form esteja limpo (Reset)
            setEditingQuoteId(null);
            setQuoteNumber("NOVA");
            setSelectedProducts([]);
            setKitFixedPrice(null);
            setKitFixedCost(null);
            setDiscountPct(0);
            setRevisionDescription("Emissão Inicial");
            setRevisions([]);
            setRentalStartDate("");
            setRentalEndDate("");
            setIsLoading(false);
        }
    }, [searchParams, products, customers, vendors, toast, db]);


    // --- 3. AUTO-PRINT (EXPORTAÇÃO PDF) --- ... (Unchanged)
    useEffect(() => {
        const shouldPrint = searchParams.get('autoPrint') === 'true' && !isLoading && editingQuoteId;
        if (shouldPrint) {
            setIsPrintMode(true);
            const originalTitle = document.title;
            if (quoteNumber && quoteNumber !== 'NOVA') {
                document.title = quoteNumber;
            }
            const timer = setTimeout(() => {
                const handleAfterPrint = () => {
                    setIsPrintMode(false);
                    document.title = originalTitle;
                    window.removeEventListener("afterprint", handleAfterPrint);
                };
                window.addEventListener("afterprint", handleAfterPrint);
                window.focus();
                window.print();
            }, 1000);
            return () => {
                clearTimeout(timer);
                document.title = originalTitle;
            };
        }
    }, [searchParams, isLoading, editingQuoteId]);


    // --- 4. RENTAL ACTIONS ---
    const handleAddRentalItem = (equipmentId: string) => {
        const equipment = rentalEquipments.find(e => e.id === equipmentId);
        if (!equipment) return;

        // Converter para SaleProduct (Adapter)
        const adapterProduct: SaleProduct = {
            id: equipment.id,
            name: equipment.name,
            productTypeId: "RENTAL", // Dummy
            description: equipment.notes,
            costUSD: 0, // Not used for rental pricing logic same as sales
            rentPrice: equipment.rentPrice || 0,
            isRental: true,
            categoryId: "", // Default empty for rental equipment
            ncm: "",
            netWeightKg: 0,
            partNumber: equipment.serialNumber, // Use SN as PN?
        };

        // ✅ Include rental-specific data not in SaleProduct interface
        (adapterProduct as any).accessories = equipment.accessories || [];
        (adapterProduct as any).serialNumber = equipment.serialNumber;
        (adapterProduct as any).imageUrl = equipment.imageUrl;


        setSelectedProducts([...selectedProducts, adapterProduct]);
    };


    // --- 3. CÁLCULOS ---
    const dolarRate = globalSettings.exchangeRateUSD;

    // Auto Update Discount for Rentals
    useEffect(() => {
        if (quoteType === 'RENTAL') {
            if (rentalDuration > 365) {
                setDiscountPct(40); // Annual
            } else if (rentalDuration > 30) {
                setDiscountPct(20); // Monthly
            } else {
                setDiscountPct(0); // Daily
            }
        }
    }, [rentalDuration, quoteType]);

    const currentTotalCost = useMemo(() => {
        if (quoteType === 'RENTAL') return 0; // Rental doesn't use CostUSD logic for margin usually, or we can use asset value.

        if (kitFixedCost !== null) return kitFixedCost;
        let total = 0;
        selectedProducts.forEach(p => total += p.costUSD || 0);
        return total * dolarRate * 1.85;
    }, [selectedProducts, dolarRate, kitFixedCost, quoteType]);

    const tablePrice = useMemo(() => {
        if (quoteType === 'RENTAL') {
            // Rental Price = Sum(DailyRates) * Duration
            const dailyTotal = selectedProducts.reduce((acc, p) => acc + (p.rentPrice || 0), 0);
            return dailyTotal * (rentalDuration || 1);
        }

        if (kitFixedPrice !== null && kitFixedPrice > 0) return kitFixedPrice;
        const fixed = globalSettings.financialFee + globalSettings.bdiFee;
        const variable = (globalSettings.simplesNacionalTax + globalSettings.salesCommission + globalSettings.marginFee) / 100;
        return (1 - variable) > 0 ? (currentTotalCost + fixed) / (1 - variable) : 0;
    }, [kitFixedPrice, currentTotalCost, globalSettings, quoteType, selectedProducts, rentalDuration]);

    const finalPrice = tablePrice * (1 - (discountPct / 100));
    const discountValue = tablePrice - finalPrice;

    const profitAnalysis = useMemo(() => {
        if (quoteType === 'RENTAL') return { margin: 100, value: finalPrice }; // Simplified ROI for rental

        if (finalPrice <= 0) return { margin: 0, value: 0 };
        const taxes = finalPrice * (globalSettings.simplesNacionalTax / 100);
        const comm = finalPrice * (globalSettings.salesCommission / 100);
        const fixed = globalSettings.financialFee + globalSettings.bdiFee;
        const profit = finalPrice - currentTotalCost - taxes - comm - fixed;
        return { value: profit, margin: profit / finalPrice };
    }, [finalPrice, currentTotalCost, globalSettings, quoteType]);


    // --- AÇÕES SALVAR ---
    // --- 4. AÇÕES ---
    const handleLoadTemplate = (templateId: string) => {
        const t = templates.find(temp => temp.id === templateId);
        if (!t) return;
        const items = t.items.map(kItem => {
            const p = products.find(prod => prod.id === kItem.id);
            return p ? { ...p } : (kItem as SaleProduct);
        }).filter(p => !!p);

        // Função de Ordenação Simplificada (Por PREFIXO do Nome)
        const getTypePriority = (p: SaleProduct) => {
            const name = (p.name || '').trim();

            // Verificar apenas o INÍCIO do nome
            if (name.startsWith('UTS')) return 1;
            if (name.startsWith('Licença')) return 2;
            if (name.startsWith('Acessório')) return 3;

            return 99; // Outros (Kit, etc.)
        };

        // Ordenar por tipo (prefixo), depois alfabeticamente
        items.sort((a, b) => {
            const priorityDiff = getTypePriority(a) - getTypePriority(b);
            if (priorityDiff !== 0) return priorityDiff;
            return a.name.localeCompare(b.name);
        });

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

    // Helper function to remove undefined fields from objects (Firebase doesn't accept undefined)
    const removeUndefinedFields = (obj: any): any => {
        if (Array.isArray(obj)) {
            return obj.map(item => removeUndefinedFields(item));
        }
        if (obj !== null && typeof obj === 'object') {
            return Object.entries(obj).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = removeUndefinedFields(value);
                }
                return acc;
            }, {} as any);
        }
        return obj;
    };

    const handleSaveProposal = async (andView: boolean) => {
        // ... (Validate)
        if (!selectedCustomerId || selectedProducts.length === 0) { // Removed Vendor Check? No, keep it ideally.
            if (!selectedVendorId) return toast({ title: "Dados Incompletos", description: "Selecione vendedor, cliente e produtos.", variant: "destructive" });
        }

        setIsSaving(true);
        let finalQuoteId = editingQuoteId;
        try {
            const customer = customers.find(c => c.id === selectedCustomerId);
            const vendor = vendors.find(v => v.id === selectedVendorId);

            if (!customer || !vendor) {
                toast({ title: "Dados inválidos", variant: "destructive" });
                setIsSaving(false); return;
            }

            const revisionNumber = editingQuoteId ? (revisions.length || 0) : 0;
            const newRevision: Revision = {
                revisionNumber: revisionNumber,
                description: revisionDescription || (revisionNumber === 0 ? "Emissão Inicial" : "Revisão"),
                authorInitials: vendor.initials,
                approverInitials: vendor.initials,
                date: Date.now()
            };

            const dataToSave: Partial<Quote> = {
                customerId: selectedCustomerId,
                customerData: customer,
                vendorId: selectedVendorId,
                vendorData: vendor,
                items: selectedProducts.map(p => ({
                    ...p, // Preserve all fields including imageUrl and accessories for RENTAL
                    costUSD: p.costUSD // Ensure costUSD is included
                })),
                totals: { totalLanded: currentTotalCost, tablePrice, discountValue, suggestedPrice: finalPrice, marginPct: profitAnalysis.margin, profitValue: profitAnalysis.value },
                params: { dolarRate, simplesPct: globalSettings.simplesNacionalTax / 100, commissionPct: globalSettings.salesCommission / 100, discountPct: discountPct / 100 },
                proposalData: {
                    paymentTerms,
                    validityDays,
                    freightIncluded,
                    docMode: 'COMPLETE', // Sempre criar propostas como Completa (G)
                    revisionDescription,
                    deliveryTime: deliveryTime || (quoteType === "RENTAL" ? "24 horas após confirmação" : "60 dias corridos"),
                    ...(warrantyPeriod && { warrantyPeriod }),
                    ...(additionalNotes && { additionalNotes }),
                    ...(rentalStartDate && { rentalStartDate: new Date(rentalStartDate).getTime() }),
                    ...(rentalEndDate && { rentalEndDate: new Date(rentalEndDate).getTime() }),
                    ...(rentalDuration && { rentalDuration })
                },
                revisions: [...revisions, newRevision],
                status: "DRAFT",
                stage: "PROPOSAL",
                type: quoteType,
            };

            if (editingQuoteId) {
                const currentNumber = (await getDoc(doc(db, "quotes", editingQuoteId))).data()?.number || "";

                // Formato esperado: PVE-G-26001-R0[-CLIENTE]
                const parts = currentNumber.split('-R');
                const baseInfo = parts[0]; // PVE-G-26001

                // Tenta extrair o nome do cliente da parte da revisão (ex: "0-CLIENTE")
                const revisionPart = parts[1] || '';
                const clientSuffix = revisionPart.includes('-')
                    ? revisionPart.substring(revisionPart.indexOf('-')) // "-CLIENTE"
                    : '';

                // Concatena novo R + sufixo do cliente
                dataToSave.number = `${baseInfo}-R${revisionNumber}${clientSuffix}`;
                // Remove undefined fields before saving
                const cleanData = removeUndefinedFields(dataToSave);
                await updateQuote(editingQuoteId, cleanData);
                toast({ title: "Sucesso!", description: `Proposta ${dataToSave.number} atualizada.` });
            } else {
                if (!db) throw new Error("Database not initialized");

                const customerData = customers.find(c => c.id === selectedCustomerId);
                const customerName = customerData?.companyName || customerData?.cnpj || '';
                const sanitizedName = customerName
                    .trim()
                    .replace(/[^a-zA-Z0-9\s]/g, '')
                    .substring(0, 30);

                // Determinar letra baseada em docMode
                const modalityLetter = docMode === 'COMPLETE' ? 'G'
                    : docMode === 'TECHNICAL' ? 'T'
                        : 'C'; // COMMERCIAL

                const quoteTypePrefix = quoteType === 'SALES' ? 'PVE'
                    : quoteType === 'RENTAL' ? 'PLE'
                        : 'PTC';

                // Sempre gerar novo número sequencial com letra G
                const baseNumber = await generateSmartNumber(db, quoteType); // Retorna: PLE-26001
                const parts = baseNumber.split('-'); // ['PLE', '26001']
                const numberWithLetter = `${parts[0]}-${modalityLetter}-${parts[1]}`; // PLE-G-26001

                // Formato final: PLE-G-26001-R0-CLIENTE
                const finalNumber = sanitizedName
                    ? `${numberWithLetter}-R0-${sanitizedName}`
                    : `${numberWithLetter}-R0`;

                dataToSave.number = finalNumber;
                dataToSave.createdAt = Date.now();
                // Remove undefined fields before saving
                const cleanData = removeUndefinedFields(dataToSave);
                const newRef = await addQuote(cleanData as Omit<Quote, 'id'>);
                finalQuoteId = newRef.id;
                toast({ title: "Sucesso!", description: `Proposta ${dataToSave.number} salva.` });
            }

            router.push('/quotes');

        } catch (e: any) {
            console.error(e);
            toast({ title: "Erro", description: "Falha ao salvar." });
        } finally { setIsSaving(false); }
    };

    const currentCustomer = customers.find(c => c.id === selectedCustomerId);
    const currentVendor = vendors.find(v => v.id === selectedVendorId);

    // --- HELPERS DE VISUALIZAÇÃO ---
    const showTech = docMode === "COMPLETE" || docMode === "TECHNICAL";
    const showComm = docMode === "COMPLETE" || docMode === "COMMERCIAL";

    const proposalProps = {
        quoteNumber,
        revisions,
        revisionDescription,
        dateStr,
        currentVendor,
        currentCustomer,
        selectedProducts,
        showTech,
        showComm,
        finalPrice,
        paymentTerms,
        deliveryTime,
        validityDays,
        freightIncluded,
        warrantyPeriod,
        additionalNotes,
        productTypes,
        previewPage,
        quoteType,  // Add quoteType to props
        // Rental-specific props
        rentalStartDate,
        rentalEndDate,
        rentalDuration
    };

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
                        {editingQuoteId && (
                            <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                                MODO EDIÇÃO
                            </span>
                        )}
                    </div>
                    {editingQuoteId && (
                        <div className="bg-amber-50 p-2 border-b border-amber-100 text-center text-xs text-amber-800">
                            Você está editando a proposta <span className="font-bold">{quoteNumber}</span>
                        </div>
                    )}
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-6">

                            {/* 1. SELETORES DE TIPO */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Modalidade</Label>
                                    <Select value={quoteType} onValueChange={(v: any) => setQuoteType(v)}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SALES">Venda (PVE)</SelectItem>
                                            <SelectItem value="RENTAL">Locação (PLE)</SelectItem>
                                            <SelectItem value="SERVICE">Serviço (PTC)</SelectItem>
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
                                <Label className="text-xs font-bold">
                                    {quoteType === 'RENTAL' ? 'Equipamentos & Período' : 'Kit / Modelo'}
                                </Label>

                                {quoteType === 'RENTAL' ? (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-[10px] text-slate-500">Início</Label>
                                                <Input type="date" className="h-8 text-xs" value={rentalStartDate} onChange={e => setRentalStartDate(e.target.value)} />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-slate-500">Fim</Label>
                                                <Input type="date" className="h-8 text-xs" value={rentalEndDate} onChange={e => setRentalEndDate(e.target.value)} />
                                            </div>
                                        </div>
                                        <Select onValueChange={handleAddRentalItem}>
                                            <SelectTrigger className="h-9 bg-slate-50"><SelectValue placeholder="Adicionar Equipamento..." /></SelectTrigger>
                                            <SelectContent>
                                                {rentalEquipments
                                                    .filter(eq => eq.status === 'AVAILABLE')
                                                    .map(eq => (
                                                        <SelectItem key={eq.id} value={eq.id}>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{eq.name}</span>
                                                                <span className="text-xs text-muted-foreground">S/N: {eq.serialNumber}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                }
                                                {rentalEquipments.filter(eq => eq.status === 'AVAILABLE').length === 0 && (
                                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                                        Nenhum equipamento disponível
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {rentalDuration > 0 && (
                                            <div className="text-xs text-center bg-emerald-50 text-emerald-800 rounded py-1 font-semibold border border-emerald-100">
                                                Duração: {rentalDuration} dias
                                                {rentalDuration > 365 && " (Desconto Anual)"}
                                                {rentalDuration > 30 && rentalDuration <= 365 && " (Desconto Mensal)"}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Select onValueChange={handleLoadTemplate}>
                                        <SelectTrigger className="h-9 bg-slate-50"><SelectValue placeholder="Carregar Kit/Modelo..." /></SelectTrigger>
                                        <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                )}
                            </div>

                            <Separator />

                            {/* 3. DADOS DA CAPA (PDF PÁG 1) */}
                            <div className="space-y-3 bg-slate-50 p-3 rounded border">
                                <Label className="text-[10px] uppercase font-bold text-slate-500 flex gap-2 items-center"><History className="w-3 h-3" /> Dados da Revisão</Label>
                                <Input value={revisionDescription} onChange={e => setRevisionDescription(e.target.value)} className="h-7 text-xs bg-white" placeholder="Descrição da Revisão (Ex: Inclusão de item)" />
                            </div>

                            {/* 4. DADOS COMERCIAIS (PDF PÁG 4) */}
                            <div className={`space-y-3 ${!showComm ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Label className="text-[10px] uppercase font-bold text-slate-500 flex gap-2 items-center"><Banknote className="w-3 h-3" /> Condições Comerciais</Label>

                                {/* Desconto */}
                                <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Label className="text-xs font-bold text-emerald-800 whitespace-nowrap">Desconto (%):</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100" // Allow more discount for rentals
                                            step="0.5"
                                            value={discountPct}
                                            onChange={e => setDiscountPct(Number(e.target.value))}
                                            className="h-7 text-xs w-20"
                                        />
                                        <span className="text-xs font-semibold text-emerald-700">
                                            = {formatCurrency(discountValue, 'BRL')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-emerald-800">
                                        <span>{quoteType === 'RENTAL' ? 'Total Diárias x Dias' : 'Preço Tabela'}: {formatCurrency(tablePrice, 'BRL')}</span>
                                        <span>Final: {formatCurrency(finalPrice, 'BRL')}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {/* Condição de Pagamento - Select */}
                                    <div>
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Condição de Pagamento</Label>
                                        <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="50% no Pedido / 50% na Entrega">50% Pedido / 50% Entrega</SelectItem>
                                                <SelectItem value="À Vista">À Vista</SelectItem>
                                                <SelectItem value="30/60/90">30/60/90 dias</SelectItem>
                                                <SelectItem value="Parcelado (customizado)">Parcelado (customizado)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Prazo de Entrega e Validade - Only for SALES/SERVICE */}
                                    {quoteType !== 'RENTAL' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Prazo Entrega</Label>
                                                <Input value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} className="h-8 text-xs" placeholder="30 dias" />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Validade (Dias)</Label>
                                                <Input
                                                    value={validityDays}
                                                    onChange={e => setValidityDays(e.target.value)}
                                                    className={`h-8 text-xs ${Number(validityDays) > 10 ? 'border-amber-400 focus:ring-amber-400' : ''}`}
                                                    placeholder="5"
                                                />
                                                {Number(validityDays) > 10 && (
                                                    <p className="text-[9px] text-amber-600 mt-0.5">⚠️ Validade acima de 10 dias</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Validade - Only for RENTAL */}
                                    {quoteType === 'RENTAL' && (
                                        <div>
                                            <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Validade (Dias)</Label>
                                            <Input
                                                value={validityDays}
                                                onChange={e => setValidityDays(e.target.value)}
                                                className={`h-8 text-xs ${Number(validityDays) > 10 ? 'border-amber-400 focus:ring-amber-400' : ''}`}
                                                placeholder="5"
                                            />
                                            {Number(validityDays) > 10 && (
                                                <p className="text-[9px] text-amber-600 mt-0.5">⚠️ Validade acima de 10 dias</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Garantia - Select - Only for SALES/SERVICE */}
                                    {quoteType !== 'RENTAL' && (
                                        <div>
                                            <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Garantia</Label>
                                            <Select value={warrantyPeriod} onValueChange={setWarrantyPeriod}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="12 Meses">12 Meses</SelectItem>
                                                    <SelectItem value="24 Meses">24 Meses</SelectItem>
                                                    <SelectItem value="36 Meses">36 Meses</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Tipo de Frete - RadioGroup */}
                                    <div>
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Tipo de Frete</Label>
                                        <RadioGroup value={freightIncluded ? "CIF" : "FOB"} onValueChange={(v) => setFreightIncluded(v === "CIF")} className="flex gap-4">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="CIF" id="cif" />
                                                <Label htmlFor="cif" className="text-xs font-normal cursor-pointer">CIF (Frete Incluso)</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="FOB" id="fob" />
                                                <Label htmlFor="fob" className="text-xs font-normal cursor-pointer">FOB (Cliente Retira)</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {/* Notas Adicionais - Textarea */}
                                    <div>
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Observações Especiais</Label>
                                        <textarea
                                            value={additionalNotes}
                                            onChange={e => setAdditionalNotes(e.target.value)}
                                            className="w-full h-20 text-xs border rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Condições especiais negociadas, exceções ou observações complementares..."
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </ScrollArea>

                    {/* Estilos de Impressão Renderizados */}
                    <style>{`
                        @media print {
                            /* =========================================
                               PORTAL PRINT - PAGINAÇÃO ROBUSTA 
                               ========================================= */
                            
                            /* 1. Reset Global de Layout para Impressão */
                            html, body {
                                width: 100% !important;
                                height: auto !important; /* Permite crescimento */
                                min-height: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                overflow: visible !important; /* CRÍTICO: Permite ver além da dobra */
                                display: block !important; /* Remove flex/grid do layout principal */
                                background: white !important;
                            }

                            /* 2. Esconde Interface do App */
                            body > * { display: none !important; }

                            /* 3. Exibe e Posiciona o Portal */
                            body > .print-portal-root {
                                display: block !important;
                                position: absolute !important; /* Sobrepõe tudo */
                                top: 0 !important;
                                left: 0 !important;
                                width: 100% !important;
                                height: auto !important; /* CRÍTICO: Cresce com o conteúdo */
                                z-index: 99999 !important;
                                overflow: visible !important;
                                background: white !important;
                            }
                            
                            /* 4. Visibilidade Interna */
                            .print-portal-root * { visibility: visible !important; }

                            /* 5. Configuração da Folha A4 */
                            @page {
                                size: A4 portrait;
                                margin: 0; /* Margens controladas pelo conteúdo (padding) */
                            }

                            /* 6. Estrutura das Páginas */
                            .print-content {
                                width: 210mm !important;
                                margin: 0 auto !important;
                                display: block !important; /* Garante fluxo vertical */
                            }

                            .print-content > div {
                                display: block !important;
                                width: 100% !important;
                                height: 297mm !important; /* Altura Fixa A4 para travar rodapé */
                                min-height: 297mm !important;
                                page-break-after: always !important; /* Quebra forçada */
                                break-after: page !important;
                                position: relative !important;
                                overflow: visible !important;
                                margin-top: 0 !important; /* Remove space-y do Tailwind */
                                margin-bottom: 0 !important;
                            }

                            /* Última página solta */
                            .print-content > div:last-child {
                                page-break-after: auto !important;
                                break-after: auto !important;
                            }

                            /* 7. Prevenção de Quebras em Tabelas */
                            tr { page-break-inside: avoid !important; }
                            
                            /* 8. Ajustes finos */
                            .-mt-4 { margin-top: 0 !important; }
                        }
                    `}</style>



                    <div className="p-3 border-t bg-slate-50">
                        <Button className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold transition-all shadow-md hover:shadow-lg" onClick={() => handleSaveProposal(true)} disabled={isSaving}>
                            <span className="flex items-center justify-center w-full gap-2">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                                {editingQuoteId ? 'Atualizar e Visualizar' : 'Gerar Proposta'}
                            </span>
                        </Button>
                    </div>
                </Card>

                {/* =========================================================
            PREVIEW PDF (DIREITA) - DAWN MODO
           ========================================================= */}
                <div id="proposal-preview" className="col-span-1 lg:col-span-8 bg-slate-400 rounded-lg border border-slate-500 shadow-inner flex flex-col overflow-hidden relative">

                    {/* BARRA DE FERRAMENTAS DO PREVIEW */}
                    <div className="bg-slate-800 text-white px-4 py-2 text-xs flex justify-between items-center z-10 shadow print:hidden">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-2 font-bold"><Printer className="w-4 h-4" /> Preview A4</span>
                            <div className="flex items-center bg-slate-700 rounded-md overflow-hidden border border-slate-600">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-8 rounded-none hover:bg-slate-600 text-slate-200"
                                    disabled={previewPage <= 1}
                                    onClick={() => {
                                        let prev = previewPage - 1;
                                        if (prev === 4 && !showComm) prev--;
                                        if (prev === 3 && !showTech) prev--;
                                        if (prev >= 1) setPreviewPage(prev);
                                    }}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="px-3 py-1 bg-slate-800 text-[10px] font-mono border-x border-slate-600 min-w-[30px] text-center">
                                    {previewPage}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-8 rounded-none hover:bg-slate-600 text-slate-200"
                                    disabled={previewPage >= (quoteType === 'RENTAL' ? 7 : 6)}
                                    onClick={() => {
                                        const maxPages = quoteType === 'RENTAL' ? 7 : 6;
                                        let next = previewPage + 1;
                                        if (next === 3 && !showTech) next++;
                                        if (next === 4 && !showComm) next = 6;
                                        if (next === 5 && !showComm) next = 6;
                                        if (next <= maxPages) setPreviewPage(next);
                                    }}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <span className="bg-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold">Página {previewPage} de {quoteType === 'RENTAL' ? 7 : 6}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-300 flex justify-center">
                        {/* RENDERIZAÇÃO DO COMPONENTE DE DOCUMENTO (PREVIEW SINGLE PAGE) */}
                        {quoteType === 'RENTAL' ? (
                            <RentalProposalDocument {...proposalProps} />
                        ) : (
                            <ProposalDocument {...proposalProps} />
                        )}
                    </div>
                </div>
            </div>

            {/* PORTAL DE IMPRESSÃO - RENDERIZADO DIRETAMENTE NO BODY QUANDO ATIVO */}
            {isPrintMode && typeof window !== 'undefined' && createPortal(
                <div className="print-portal-root">
                    {quoteType === 'RENTAL' ? (
                        <RentalProposalDocument {...proposalProps} />
                    ) : (
                        <ProposalDocument {...proposalProps} />
                    )}
                </div>,
                document.body
            )}

            {/* OVERLAY DE IMPRESSÃO AUTOMÁTICA */}
            {
                searchParams.get('autoPrint') === 'true' && (
                    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center print:hidden">
                        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800">Preparando Documento...</h2>
                        <p className="text-slate-500 mt-2">O diálogo de impressão abrirá automaticamente.</p>
                        <p className="text-xs text-slate-400 mt-8">Se não abrir, pressione Ctrl+P</p>
                    </div>
                )
            }
        </div >
    );
}
