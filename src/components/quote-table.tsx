"use client";

import { useState, useEffect } from "react";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    deleteDoc,
    doc,
    addDoc,
    getDocs,
    where
} from "firebase/firestore";
import { useAppContext } from "@/context/app-context";
import { useWorkspace } from "@/context/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Trash2, Pencil, Eye, Search, Split } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Quote } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";


export function QuoteTable() {
    const { toast } = useToast();
    const router = useRouter();
    const { db } = useAppContext();
    const { activeWorkspaceId, currentWorkspace } = useWorkspace();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"general" | "all">("general"); // Default: General only
    const [splittingId, setSplittingId] = useState<string | null>(null);

    useEffect(() => {
        if (!db) return;

        const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Quote[];
            setQuotes(data);
            setIsLoading(false);
        }, (error) => {
            console.error("Erro ao buscar propostas:", error);
            setIsLoading(false);
            toast({
                title: "Erro ao carregar dados",
                description: "Não foi possível buscar a lista de propostas.",
                variant: "destructive"
            });
        });
        return () => unsubscribe();
    }, [db, toast]);

    // Helper: verifica se uma proposta G já possui T/C relacionadas
    const hasSplitProposals = (quote: Quote): boolean => {
        if (!quote.number.includes('-G-')) return false;

        const parts = quote.number.split('-');
        const baseNumber = parts[2]; // Ex: 26001
        const prefix = parts[0]; // Ex: PLE ou PVE

        // Busca no array de quotes por T/C com mesmo número base
        const hasT = quotes.some(q => q.number.includes(`${prefix}-T-${baseNumber}-`));
        const hasC = quotes.some(q => q.number.includes(`${prefix}-C-${baseNumber}-`));

        return hasT || hasC;
    };

    const handleDelete = async (quote: Quote) => {
        if (!db) return;
        try {
            // Se for uma proposta G (Completa), deletar também T e C relacionadas
            if (quote.number.includes('-G-')) {
                const parts = quote.number.split('-');
                const baseNumber = parts[2]; // Ex: 26001
                const prefix = parts[0]; // Ex: PLE ou PVE

                // Extrair sufixo do cliente de forma robusta
                let clienteSuffix = '';
                const revisionIndex = quote.number.lastIndexOf('-R');
                if (revisionIndex !== -1) {
                    const afterRevision = quote.number.substring(revisionIndex + 1);
                    if (afterRevision.includes('-')) {
                        clienteSuffix = afterRevision.substring(afterRevision.indexOf('-'));
                    }
                }

                // Buscar e deletar propostas T e C relacionadas
                const quotesRef = collection(db, 'quotes');
                const allQuotes = await getDocs(quotesRef);
                const deletePromises: Promise<void>[] = [];

                allQuotes.forEach(docSnap => {
                    const docNum = docSnap.data().number as string;
                    if (docNum) {
                        const isTechnical = docNum.includes(`${prefix}-T-${baseNumber}-`);
                        const isCommercial = docNum.includes(`${prefix}-C-${baseNumber}-`);

                        if (clienteSuffix) {
                            if ((isTechnical || isCommercial) && docNum.includes(clienteSuffix)) {
                                deletePromises.push(deleteDoc(docSnap.ref));
                            }
                        } else {
                            if (isTechnical || isCommercial) {
                                deletePromises.push(deleteDoc(docSnap.ref));
                            }
                        }
                    }
                });

                if (deletePromises.length > 0) {
                    await Promise.all(deletePromises);
                    toast({
                        title: "Propostas relacionadas excluídas",
                        description: `${deletePromises.length} proposta(s) T/C também foram removidas.`
                    });
                }
            }

            // Se for proposta T ou C, deletar a outra também (T deleta C e vice-versa)
            if (quote.number.includes('-T-') || quote.number.includes('-C-')) {
                const parts = quote.number.split('-');
                const baseNumber = parts[2]; // Ex: 26001
                const prefix = parts[0]; // Ex: PLE ou PVE
                const isT = quote.number.includes('-T-');

                // Buscar a proposta complementar (T busca C, C busca T)
                const complementType = isT ? 'C' : 'T';
                const quotesRef = collection(db, 'quotes');
                const allQuotes = await getDocs(quotesRef);

                allQuotes.forEach(async docSnap => {
                    const docNum = docSnap.data().number as string;
                    if (docNum && docNum.includes(`${prefix}-${complementType}-${baseNumber}-`)) {
                        await deleteDoc(docSnap.ref);
                    }
                });

                toast({
                    title: "Proposta complementar excluída",
                    description: `A proposta ${complementType} relacionada também foi removida.`
                });
            }

            // Deletar a proposta principal
            await deleteDoc(doc(db, "quotes", quote.id));
            toast({ title: "Proposta excluída", description: `A proposta #${quote.number} foi removida.` });
        } catch (error) {
            console.error('Erro ao excluir proposta:', error);
            toast({ title: "Erro ao excluir", description: "Não foi possível remover a proposta.", variant: "destructive" });
        }
    };

    const handleSplitProposal = async (quote: Quote) => {
        if (!db) return;

        // Verificar se é proposta G
        if (!quote.number.includes('-G-')) {
            toast({ title: "Erro", description: "Apenas propostas Gerais (G) podem ser divididas.", variant: "destructive" });
            return;
        }

        setSplittingId(quote.id);
        try {
            // Extrair número base
            const parts = quote.number.split('-');
            // Formato: PLE-G-26001-R2-CLIENTE
            // parts[0]=PLE, parts[1]=G, parts[2]=26001, parts[3]=R2, parts[4]=CLIENTE...

            const baseNumber = parts[2]; // 26001
            const prefix = parts[0]; // PLE

            // Extrair sufixo do cliente de forma robusta
            // Pega tudo depois da revisão (ex: -R2-CLIENTE -> -CLIENTE)
            let clienteSuffix = '';
            const revisionIndex = quote.number.lastIndexOf('-R');
            if (revisionIndex !== -1) {
                const afterRevision = quote.number.substring(revisionIndex + 1); // R2-CLIENTE
                if (afterRevision.includes('-')) {
                    clienteSuffix = afterRevision.substring(afterRevision.indexOf('-')); // -CLIENTE
                }
            }

            // Criar proposta Técnica
            const { id: _techId, ...techData } = quote;
            const technicalProposal = {
                ...techData,
                number: `${prefix}-T-${baseNumber}-R0${clienteSuffix}`,
                proposalData: { ...(quote.proposalData || {}), docMode: 'TECHNICAL' },
                createdAt: Date.now(),
            };

            // Criar proposta Comercial
            const { id: _commId, ...commData } = quote;
            const commercialProposal = {
                ...commData,
                number: `${prefix}-C-${baseNumber}-R0${clienteSuffix}`,
                proposalData: { ...(quote.proposalData || {}), docMode: 'COMMERCIAL' },
                createdAt: Date.now(),
            };

            // Salvar ambas
            await addDoc(collection(db, 'quotes'), technicalProposal);
            await addDoc(collection(db, 'quotes'), commercialProposal);

            toast({ title: "Sucesso!", description: `Propostas T e C criadas com base ${baseNumber}` });

        } catch (error: any) {
            console.error('Erro ao dividir:', error);
            toast({ title: "Erro", description: error.message || "Falha ao criar propostas.", variant: "destructive" });
        } finally {
            setSplittingId(null);
        }
    };

    const handleEditG = async (quote: Quote) => {
        if (!db) return;

        // Extrair número base
        const parts = quote.number.split('-');
        const baseNumber = parts[2];
        const prefix = parts[0];
        const cliente = quote.number.split('-R0-')[1] || '';

        try {
            // Buscar e deletar T e C relacionadas
            const quotesRef = collection(db, 'quotes');
            const numT = cliente ? `${prefix}-T-${baseNumber}-R0-${cliente}` : `${prefix}-T-${baseNumber}-R0`;
            const numC = cliente ? `${prefix}-C-${baseNumber}-R0-${cliente}` : `${prefix}-C-${baseNumber}-R0`;

            const [qT, qC] = await Promise.all([
                getDocs(query(quotesRef, where('number', '==', numT))),
                getDocs(query(quotesRef, where('number', '==', numC)))
            ]);

            const deletePromises: Promise<void>[] = [];
            qT.forEach(d => deletePromises.push(deleteDoc(d.ref)));
            qC.forEach(d => deletePromises.push(deleteDoc(d.ref)));

            if (deletePromises.length > 0) {
                await Promise.all(deletePromises);
                toast({
                    title: "Propostas T/C removidas",
                    description: "Você pode recriá-las após editar a proposta G."
                });
            }
        } catch (error) {
            console.error('Erro ao deletar T/C:', error);
        }
    };


    const getStatusVariant = (stage: string) => {
        switch (stage) {
            case 'PROPOSAL': return 'secondary';
            case 'NEGOTIATION': return 'outline'; // Pode ser amarelo via CSS se customizado, ou outline padrão
            case 'FORMALIZATION': return 'secondary';
            case 'WON': return 'success';
            case 'LOST': return 'destructive';
            default: return 'outline';
        }
    }

    const getProposalTypeLabel = (docMode?: string) => {
        switch (docMode) {
            case 'COMPLETE': return { label: 'Completa', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' };
            case 'TECHNICAL': return { label: 'Técnica', color: 'bg-cyan-600 hover:bg-cyan-700 text-white' };
            case 'COMMERCIAL': return { label: 'Comercial', color: 'bg-purple-600 hover:bg-purple-700 text-white' };
            default: return { label: 'N/A', color: 'bg-slate-200 text-slate-600' };
        }
    };

    const getQuoteModality = (type?: string) => {
        switch (type) {
            case 'SALES': return { label: 'PVE', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' };
            case 'RENTAL': return { label: 'PLE', color: 'bg-blue-600 hover:bg-blue-700 text-white' };
            case 'SERVICE': return { label: 'PTC', color: 'bg-teal-600 hover:bg-teal-700 text-white' };
            default: return { label: 'N/A', color: 'bg-slate-200 text-slate-600' };
        }
    };

    // Filter quotes based on workspace, search and category
    const filteredQuotes = quotes.filter(quote => {
        // 0. Workspace Filter - ESSENCIAL
        // Propostas devem pertencer ao workspace ativo
        // Propostas legadas (sem workspaceId) só aparecem no EXS (padrão histórico)
        const matchesWorkspace = quote.workspaceId === activeWorkspaceId ||
            (!quote.workspaceId && activeWorkspaceId === 'EXS');
        if (!matchesWorkspace) return false;

        // 1. View Mode Filter
        if (viewMode === 'general') {
            // Only 'COMPLETE' (General) proposals
            // Compatibility: Treat undefined docMode as COMPLETE (old proposals)
            const isGeneral = !quote.proposalData?.docMode || quote.proposalData?.docMode === 'COMPLETE';
            if (!isGeneral) return false;
        }

        // 2. Search & Category Filter
        if (!searchQuery) return true;

        const searchLower = searchQuery.toLowerCase();

        switch (filterCategory) {
            case 'numero':
                return quote.number?.toLowerCase().includes(searchLower);
            case 'cliente':
                return quote.customerData?.tradeName?.toLowerCase().includes(searchLower);
            case 'modalidade':
                return getQuoteModality(quote.type).label.toLowerCase().includes(searchLower);
            case 'tipo':
                return getProposalTypeLabel(quote.proposalData?.docMode).label.toLowerCase().includes(searchLower);
                const statusMap: Record<string, string> = {
                    'ELABORATED': 'proposta elaborada',
                    'PROPOSAL': 'proposta enviada',
                    'NEGOTIATION': 'em negociação',
                    'FORMALIZATION': 'formalização',
                    'WON': 'ganho',
                    'LOST': 'perdido'
                };
                return statusMap[quote.stage || 'PROPOSAL']?.toLowerCase().includes(searchLower);
            case 'all':
            default:
                // Search in all fields
                return (
                    quote.number?.toLowerCase().includes(searchLower) ||
                    quote.customerData?.tradeName?.toLowerCase().includes(searchLower) ||
                    getQuoteModality(quote.type).label.toLowerCase().includes(searchLower) ||
                    getProposalTypeLabel(quote.proposalData?.docMode).label.toLowerCase().includes(searchLower)
                );
        }
    });

    // Counts for General proposals only
    const generalQuotesCount = quotes.filter(q => q.proposalData?.docMode === 'COMPLETE').length;
    const filteredGeneralQuotesCount = filteredQuotes.filter(q => q.proposalData?.docMode === 'COMPLETE').length;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            {/* View Mode Filter */}
            <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <Label className="text-sm font-bold text-slate-700 mb-3 block">Modo de Visualização</Label>
                <RadioGroup
                    defaultValue="general"
                    value={viewMode}
                    onValueChange={(v) => setViewMode(v as "general" | "all")}
                    className="flex gap-8"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="general" id="view-general" className="text-emerald-600 border-emerald-600" />
                        <Label htmlFor="view-general" className="cursor-pointer font-medium text-slate-700">Propostas Gerais (Padrão)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="view-all" />
                        <Label htmlFor="view-all" className="cursor-pointer text-slate-600">Todas Propostas (Geral + Técnica + Comercial)</Label>
                    </div>
                </RadioGroup>
            </div>

            {/* Advanced Filter Section */}
            <div className="mb-4 flex gap-3 items-end">
                <div className="flex-1 max-w-xs">
                    <label className="text-sm font-medium mb-1.5 block">Categoria de Busca</label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">🔍 Todas</SelectItem>
                            <SelectItem value="numero">📄 Número</SelectItem>
                            <SelectItem value="cliente">👤 Cliente</SelectItem>
                            <SelectItem value="modalidade">📋 Modalidade (PVE/PLE/PTC)</SelectItem>
                            <SelectItem value="tipo">🎯 Tipo (Completa/Técnica/Comercial)</SelectItem>
                            <SelectItem value="status">📊 Status</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1">
                    <label className="text-sm font-medium mb-1.5 block">Pesquisar</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Buscar por ${filterCategory === 'all' ? 'qualquer campo' : filterCategory}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="flex-none pb-0.5">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 block">
                        Total: <span className="text-slate-800">{filteredGeneralQuotesCount}</span>
                        {generalQuotesCount !== filteredGeneralQuotesCount && <span className="font-normal text-slate-400 ml-1"> (de {generalQuotesCount})</span>}
                    </span>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Proposta</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Modalidade</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Valor Final</TableHead>
                                <TableHead className="w-[200px] text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredQuotes.length > 0 ? (
                                filteredQuotes.map(quote => (
                                    <TableRow key={quote.id}>
                                        <TableCell className="font-medium">
                                            {(() => {
                                                // Exibe apenas PVE-G-26001-R0 (remove nome do cliente)
                                                // Formato esperado: PREFIXO-TIPO-NUMERO-REVISAO[-CLIENTE]
                                                const parts = quote.number.split('-');
                                                if (parts.length >= 4) {
                                                    // Reconstroi até a revisão (assumindo que revisão é a parte 4, índice 3, ex: R0)
                                                    // Mas cuidado com hifens extras no nome do cliente.
                                                    // A estratégia segura é pegar tudo ANTES do primeiro traço após a revisão?
                                                    // Ou simplesmente pegar as 4 primeiras partes se a quarta começar com R?

                                                    // Melhor: encontrar a parte que começa com 'R' e é numérica (R0, R1...), e cortar depois dela.
                                                    const revIndex = parts.findIndex(p => /^R\d+$/.test(p));
                                                    if (revIndex !== -1) {
                                                        return parts.slice(0, revIndex + 1).join('-');
                                                    }
                                                }
                                                return quote.number;
                                            })()}
                                        </TableCell>
                                        <TableCell>{quote.customerData?.tradeName || 'Cliente não encontrado'}</TableCell>
                                        <TableCell>
                                            {quote.createdAt ? format(new Date(quote.createdAt), 'dd/MM/yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                const modality = getQuoteModality(quote.type);
                                                return (
                                                    <Badge variant="outline" className={modality.color}>
                                                        {modality.label}
                                                    </Badge>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                const propType = getProposalTypeLabel(quote.proposalData?.docMode);
                                                return (
                                                    <Badge variant="outline" className={propType.color}>
                                                        {propType.label}
                                                    </Badge>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(quote.stage || 'PROPOSAL')}>
                                                {
                                                    ({
                                                        'ELABORATED': 'Proposta Elaborada',
                                                        'PROPOSAL': 'Proposta Enviada',
                                                        'NEGOTIATION': 'Em Negociação',
                                                        'FORMALIZATION': 'Formalização',
                                                        'WON': 'Ganho (Vendido)',
                                                        'LOST': 'Perdido',
                                                    } as Record<string, string>)[quote.stage || 'PROPOSAL'] || quote.stage
                                                }
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {quote.number.includes('-G-')
                                                ? formatCurrency(quote.totals.suggestedPrice)
                                                : <span className="text-slate-400 text-xs">-</span>
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                {/* Botão Editar - só para propostas G */}
                                                {quote.number.includes('-G-') && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={async () => {
                                                            await handleEditG(quote);
                                                            router.push(`/pricing?quoteId=${quote.id}`);
                                                        }}
                                                    >
                                                        <Pencil className="w-3 h-3 mr-1.5" />
                                                        Editar
                                                    </Button>
                                                )}
                                                <Link href={`/admin/quotes/${quote.id}/proposal`}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="w-3 h-3 mr-1.5" />
                                                        Visualizar
                                                    </Button>
                                                </Link>

                                                {/* Botão Dividir - só aparece para propostas G, desabilitado se já dividida */}
                                                {quote.number.includes('-G-') && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className={hasSplitProposals(quote) ? "text-slate-400" : "text-purple-600 hover:text-purple-700"}
                                                        onClick={() => handleSplitProposal(quote)}
                                                        disabled={splittingId === quote.id || hasSplitProposals(quote)}
                                                        title={hasSplitProposals(quote) ? "Esta proposta já foi dividida" : "Dividir em T e C"}
                                                    >
                                                        {splittingId === quote.id ? (
                                                            <>
                                                                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                                                Dividindo...
                                                            </>
                                                        ) : hasSplitProposals(quote) ? (
                                                            <>
                                                                <Split className="w-3 h-3 mr-1.5" />
                                                                Dividido
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Split className="w-3 h-3 mr-1.5" />
                                                                Dividir
                                                            </>
                                                        )}
                                                    </Button>
                                                )}

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta ação não pode ser desfeita. Isso excluirá permanentemente a proposta #{quote.number}.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(quote)}>Excluir</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                            <FileText className="w-10 h-10" />
                                            <p className="font-medium">Nenhuma proposta encontrada.</p>
                                            <p className="text-sm">Crie uma nova proposta na página de <a href="/pricing" className="underline text-primary">Elaborar Proposta</a>.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}

// Add success variant to badge
declare module "@/components/ui/badge" {
    interface BadgeProps {
        variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
    }
}
