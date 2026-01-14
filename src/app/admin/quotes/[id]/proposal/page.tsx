"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAppContext } from "@/context/app-context";
import { doc, getDoc } from "firebase/firestore";
import type { Quote, SaleProduct } from "@/lib/types";
import ProposalDocument from "@/components/proposal-document";
import RentalProposalDocument from "@/components/rental-proposal-document";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function ProposalContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const { db, products, customers, vendors, productTypes } = useAppContext();

    const [quote, setQuote] = useState<Quote | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [previewPage, setPreviewPage] = useState(1);

    useEffect(() => {
        if (!db || !id) return;
        const fetchQuote = async () => {
            try {
                const docRef = doc(db, "quotes", id);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setQuote({ id: snap.id, ...snap.data() } as Quote);
                }
            } catch (error) {
                console.error("Erro ao carregar proposta", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuote();
    }, [db, id]);

    // Atualizar título da página com número da proposta
    useEffect(() => {
        if (quote?.number) {
            // Atualiza document.title
            document.title = quote.number;

            // Também atualiza o elemento <title> no head
            const titleElement = document.querySelector('title');
            if (titleElement) {
                titleElement.textContent = quote.number;
            }
        }
        return () => {
            document.title = 'GPECX SGC';
            const titleElement = document.querySelector('title');
            if (titleElement) {
                titleElement.textContent = 'GPECX SGC';
            }
        };
    }, [quote]);

    // Lógica de Impressão Automática via URL
    useEffect(() => {
        if (searchParams.get('autoPrint') === 'true' && !isLoading && quote) {
            const originalTitle = document.title;
            if (quote.number) {
                document.title = quote.number;
            }
            setTimeout(() => {
                const handleAfter = () => {
                    document.title = originalTitle;
                    window.removeEventListener("afterprint", handleAfter);
                }
                window.addEventListener("afterprint", handleAfter);
                window.print();
            }, 1000);
        }
    }, [searchParams, isLoading, quote]);

    if (isLoading || !quote) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
                <p className="text-slate-500">Preparando visualização...</p>
            </div>
        );
    }

    // Resolvendo Dados Relacionados
    const currentCustomer = customers.find(c => c.id === quote.customerId) || quote.customerData;
    const currentVendor = vendors.find(v => v.id === quote.vendorId) || quote.vendorData;

    // Para RENTAL, usa os itens salvos diretamente (já têm imageUrl, accessories, etc.)
    // Para SALES/SERVICE, tenta buscar do catálogo products
    const resolvedProducts = quote.type === 'RENTAL'
        ? quote.items as SaleProduct[]
        : quote.items.map(item => {
            const p = products.find(prod => prod.id === item.id);
            return p ? { ...p, costUSD: item.costUSD } : item; // Fallback para item salvo
        }) as SaleProduct[];

    // Recalcular ou usar totais salvos? Usar salvos é mais seguro para consistência.
    const finalPrice = quote.totals.suggestedPrice;

    const showTech = quote.proposalData?.docMode === "COMPLETE" || quote.proposalData?.docMode === "TECHNICAL";
    const showComm = quote.proposalData?.docMode === "COMPLETE" || quote.proposalData?.docMode === "COMMERCIAL";

    // Navegação de Páginas do Preview
    const handlePrev = () => {
        let prev = previewPage - 1;
        if (prev === 5 && !showComm) prev = showTech ? 3 : 2;
        if (prev === 4 && !showComm) prev = showTech ? 3 : 2;
        if (prev === 3 && !showTech) prev = 2; // Pula Pág 3 se não tiver técnica
        if (prev < 1) prev = 1;
        setPreviewPage(prev);
    }
    const handleNext = () => {
        // Calcular maxPages dinamicamente
        let maxPages = 6; // PVE base
        if (quote.type === 'RENTAL') {
            // PLE: 4 base + 1 (tech) + 2 (comm)
            maxPages = 4;
            if (showTech) maxPages += 1;
            if (showComm) maxPages += 2;
        } else {
            // PVE: 3 base + 1 (tech) + 2 (comm)
            maxPages = 3;
            if (showTech) maxPages += 1;
            if (showComm) maxPages += 2;
        }

        let next = previewPage + 1;
        if (next === 3 && !showTech) next = 4;
        if (next === 4 && !showComm) next = 6;
        if (next === 5 && !showComm) next = 6;
        if (next > maxPages) next = maxPages;
        setPreviewPage(next);
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col print:bg-white print:p-0">
            {/* Toolbar Superior (Escondida na impressão) */}
            <div className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm print:hidden sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/quotes">
                        <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
                            <ArrowLeft className="w-4 h-4" /> Voltar
                        </Button>
                    </Link>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <h1 className="font-bold text-slate-800 text-sm">Visualizar Proposta: {quote.number}</h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* Paginação */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-4">
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handlePrev} disabled={previewPage <= 1}>&lt;</Button>
                        <span className="text-xs font-bold text-slate-600 px-2 w-16 text-center">Pág {previewPage}</span>
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleNext} disabled={previewPage >= (quote.type === 'RENTAL' ? 7 : 6)}>&gt;</Button>
                    </div>

                    <Button className="bg-[#10B981] hover:bg-[#059669] text-white font-bold gap-2" size="sm" onClick={() => {
                        // Garante que o título seja definido antes da impressão
                        const setTitle = () => {
                            if (quote.number) {
                                document.title = quote.number;
                                const titleElement = document.querySelector('title');
                                if (titleElement) {
                                    titleElement.textContent = quote.number;
                                }
                            }
                        };

                        // Define título imediatamente
                        setTitle();

                        // Adiciona listener para beforeprint (backup)
                        const handleBeforePrint = () => {
                            setTitle();
                            window.removeEventListener('beforeprint', handleBeforePrint);
                        };
                        window.addEventListener('beforeprint', handleBeforePrint);

                        // Aguarda um frame antes de imprimir
                        requestAnimationFrame(() => {
                            window.print();
                        });
                    }}>
                        <Printer className="w-4 h-4" />
                        Imprimir PDF
                    </Button>
                </div>
            </div>

            {/* Área de Visualização */}
            <div className="flex-1 overflow-auto p-8 flex justify-center print:p-0 print:overflow-visible">
                {/* Versão para PREVIEW (tela) - mostra apenas página atual */}
                <div className="print:hidden">
                    {quote.type === 'RENTAL' ? (
                        <RentalProposalDocument
                            quoteNumber={quote.number}
                            revisions={quote.revisions || []}
                            revisionDescription={quote.proposalData?.revisionDescription || ""}
                            dateStr={new Date(quote.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                            currentVendor={currentVendor}
                            currentCustomer={currentCustomer}
                            selectedProducts={resolvedProducts}
                            showTech={showTech}
                            showComm={showComm}
                            finalPrice={finalPrice}
                            paymentTerms={quote.proposalData?.paymentTerms || ""}
                            deliveryTime={quote.proposalData?.deliveryTime || ""}
                            validityDays={quote.proposalData?.validityDays || ""}
                            rentalStartDate={quote.proposalData?.rentalStartDate ? new Date(quote.proposalData.rentalStartDate).toISOString().split('T')[0] : ""}
                            rentalEndDate={quote.proposalData?.rentalEndDate ? new Date(quote.proposalData.rentalEndDate).toISOString().split('T')[0] : ""}
                            rentalDuration={quote.proposalData?.rentalDuration || 1}
                            additionalNotes={quote.proposalData?.additionalNotes || ""}
                            previewPage={previewPage}
                        />
                    ) : (
                        <ProposalDocument
                            quoteNumber={quote.number}
                            revisions={quote.revisions || []}
                            revisionDescription={quote.proposalData?.revisionDescription || ""}
                            dateStr={new Date(quote.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                            currentVendor={currentVendor}
                            currentCustomer={currentCustomer}
                            selectedProducts={resolvedProducts}
                            showTech={showTech}
                            showComm={showComm}
                            finalPrice={finalPrice}
                            paymentTerms={quote.proposalData?.paymentTerms || ""}
                            deliveryTime={quote.proposalData?.deliveryTime || ""}
                            validityDays={quote.proposalData?.validityDays || ""}
                            freightIncluded={(quote.proposalData as any)?.freightIncluded !== false}
                            previewPage={previewPage}
                            productTypes={productTypes}
                        />
                    )}
                </div>

                {/* Versão para IMPRESSÃO - mostra todas as páginas */}
                <div className="hidden print:block print:w-full">
                    {quote.type === 'RENTAL' ? (
                        <RentalProposalDocument
                            quoteNumber={quote.number}
                            revisions={quote.revisions || []}
                            revisionDescription={quote.proposalData?.revisionDescription || ""}
                            dateStr={new Date(quote.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                            currentVendor={currentVendor}
                            currentCustomer={currentCustomer}
                            selectedProducts={resolvedProducts}
                            showTech={showTech}
                            showComm={showComm}
                            finalPrice={finalPrice}
                            paymentTerms={quote.proposalData?.paymentTerms || ""}
                            deliveryTime={quote.proposalData?.deliveryTime || ""}
                            validityDays={quote.proposalData?.validityDays || ""}
                            rentalStartDate={quote.proposalData?.rentalStartDate ? new Date(quote.proposalData.rentalStartDate).toISOString().split('T')[0] : ""}
                            rentalEndDate={quote.proposalData?.rentalEndDate ? new Date(quote.proposalData.rentalEndDate).toISOString().split('T')[0] : ""}
                            rentalDuration={quote.proposalData?.rentalDuration || 1}
                            additionalNotes={quote.proposalData?.additionalNotes || ""}
                            previewPage={undefined}
                        />
                    ) : (
                        <ProposalDocument
                            quoteNumber={quote.number}
                            revisions={quote.revisions || []}
                            revisionDescription={quote.proposalData?.revisionDescription || ""}
                            dateStr={new Date(quote.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                            currentVendor={currentVendor}
                            currentCustomer={currentCustomer}
                            selectedProducts={resolvedProducts}
                            showTech={showTech}
                            showComm={showComm}
                            finalPrice={finalPrice}
                            paymentTerms={quote.proposalData?.paymentTerms || ""}
                            deliveryTime={quote.proposalData?.deliveryTime || ""}
                            validityDays={quote.proposalData?.validityDays || ""}
                            freightIncluded={(quote.proposalData as any)?.freightIncluded !== false}
                            previewPage={undefined}
                            productTypes={productTypes}
                        />
                    )}
                </div>
            </div>
            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { background: white; }
                    .print\\:hidden { display: none !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:w-full { width: 100% !important; max-width: none !important; }
                }
            `}</style>
        </div>
    );
}

export default function ProposalPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
                <p className="text-slate-500">Carregando...</p>
            </div>
        }>
            <ProposalContent />
        </Suspense>
    );
}
