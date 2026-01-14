"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/app-context";
import { doc, getDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import type { Quote, SaleProduct } from "@/lib/types";
import ProposalDocument from "@/components/proposal-document";
import RentalProposalDocument from "@/components/rental-proposal-document";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Split } from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function ProposalContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;
    const { db, products, customers, vendors, productTypes } = useAppContext();

    const [quote, setQuote] = useState<Quote | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [previewPage, setPreviewPage] = useState(1);
    const [isSplitting, setIsSplitting] = useState(false);

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

    // Função para dividir proposta em T + C
    const handleSplitProposal = async () => {
        if (!quote || !db) return;

        // Verificar se é proposta G
        if (!quote.number.includes('-G-')) {
            toast({ title: "Erro", description: "Apenas propostas Gerais (G) podem ser divididas.", variant: "destructive" });
            return;
        }

        setIsSplitting(true);
        try {
            // Extrair número base (ex: PLE-G-26001-R0-CLIENTE → 26001)
            const parts = quote.number.split('-');
            const baseNumber = parts[2]; // 26001
            const prefix = parts[0]; // PLE
            const clienteParts = quote.number.split('-R0-');
            const clienteNome = clienteParts[1] || '';

            // Criar proposta Técnica
            const { id: _techId, ...techData } = quote;
            const technicalProposal = {
                ...techData,
                number: clienteNome ? `${prefix}-T-${baseNumber}-R0-${clienteNome}` : `${prefix}-T-${baseNumber}-R0`,
                proposalData: { ...quote.proposalData, docMode: 'TECHNICAL' },
                createdAt: Date.now(),
            };

            // Criar proposta Comercial
            const { id: _commId, ...commData } = quote;
            const commercialProposal = {
                ...commData,
                number: clienteNome ? `${prefix}-C-${baseNumber}-R0-${clienteNome}` : `${prefix}-C-${baseNumber}-R0`,
                proposalData: { ...quote.proposalData, docMode: 'COMMERCIAL' },
                createdAt: Date.now(),
            };

            // Salvar ambas
            await addDoc(collection(db, 'quotes'), technicalProposal);
            await addDoc(collection(db, 'quotes'), commercialProposal);

            toast({ title: "Sucesso!", description: `Propostas T e C criadas com base ${baseNumber}` });
            router.push('/admin/quotes');

        } catch (error) {
            console.error('Erro ao dividir:', error);
            toast({ title: "Erro", description: "Falha ao criar propostas.", variant: "destructive" });
        } finally {
            setIsSplitting(false);
        }
    };


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
    // Calcular maxPages dinamicamente baseado no tipo de proposta e docMode
    const maxPages = (() => {
        const isRental = quote.type === 'RENTAL';
        // Base: Cover(1), About(1), Equipment(1) = 3 para Sales
        // Rental adds Attachments(1) = 4
        const base = isRental ? 4 : 3;
        return base + (showTech ? 1 : 0) + (showComm ? 2 : 0);
    })();

    const handlePrev = () => {
        setPreviewPage(prev => Math.max(1, prev - 1));
    }

    const handleNext = () => {
        setPreviewPage(prev => Math.min(maxPages, prev + 1));
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
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleNext} disabled={previewPage >= maxPages}>&gt;</Button>
                    </div>

                    <Button className="bg-[#10B981] hover:bg-[#059669] text-white font-bold gap-2" size="sm" onClick={async () => {
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

                        // Pré-carregar todas as imagens antes de imprimir
                        const preloadImages = async () => {
                            // Busca todas as imagens na área de impressão
                            const printArea = document.querySelector('.print\\:block');
                            if (!printArea) return;

                            const images = printArea.querySelectorAll('img');
                            const imagePromises = Array.from(images).map((img) => {
                                return new Promise<void>((resolve) => {
                                    if (img.complete) {
                                        resolve();
                                    } else {
                                        img.onload = () => resolve();
                                        img.onerror = () => resolve(); // Resolve mesmo em erro para não travar
                                    }
                                });
                            });

                            // Aguarda todas as imagens carregarem (timeout de 5 segundos)
                            await Promise.race([
                                Promise.all(imagePromises),
                                new Promise(resolve => setTimeout(resolve, 5000))
                            ]);
                        };

                        // Aguarda carregamento das imagens
                        await preloadImages();

                        // Pequeno delay adicional para garantir renderização
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // Agora imprime
                        window.print();
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
