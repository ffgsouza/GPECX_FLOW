"use client";

import { useState, useEffect } from "react";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    deleteDoc,
    doc
} from "firebase/firestore";
import { useAppContext } from "@/context/app-context";
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
import { Loader2, FileText, Trash2, Pencil, Eye, FileDown, Search } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { Quote } from "@/lib/types";


export function QuoteTable() {
    const { toast } = useToast();
    const { db } = useAppContext();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");

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

    const handleDelete = async (quote: Quote) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, "quotes", quote.id));
            toast({ title: "Proposta excluída", description: `A proposta #${quote.number} foi removida.` });
        } catch (error) {
            toast({ title: "Erro ao excluir", description: "Não foi possível remover a proposta.", variant: "destructive" });
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

    // Função para imprimir via iframe oculto
    const handlePrint = (quoteId: string) => {
        // Remove frame anterior se existir
        const existingFrame = document.getElementById('print-frame');
        if (existingFrame) document.body.removeChild(existingFrame);

        // Cria novo iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'print-frame';
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.left = '-9999px';
        iframe.style.top = '0px';

        // Define a URL com autoPrint=true
        iframe.src = `/admin/quotes/${quoteId}/proposal?autoPrint=true`;

        document.body.appendChild(iframe);

        toast({
            title: "Preparando impressão...",
            description: "Aguarde o diálogo de impressão abrir.",
            duration: 3000,
        });
    };

    const getProposalTypeLabel = (docMode?: string) => {
        switch (docMode) {
            case 'COMPLETE': return { label: 'Completa', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' };
            case 'TECHNICAL': return { label: 'Técnica', color: 'bg-cyan-600 hover:bg-cyan-700 text-white' };
            case 'COMMERCIAL': return { label: 'Comercial', color: 'bg-purple-600 hover:bg-purple-700 text-white' };
            default: return { label: 'N/A', color: 'bg-slate-200 text-slate-600' };
        }
    };

    const getQuoteModality = (quoteType?: string) => {
        switch (quoteType) {
            case 'SALES': return { label: 'PVE', color: 'bg-blue-600 hover:bg-blue-700 text-white' };
            case 'RENTAL': return { label: 'PLE', color: 'bg-orange-600 hover:bg-orange-700 text-white' };
            case 'SERVICE': return { label: 'PTC', color: 'bg-teal-600 hover:bg-teal-700 text-white' };
            default: return { label: 'N/A', color: 'bg-slate-200 text-slate-600' };
        }
    };

    // Filter quotes based on search and category
    const filteredQuotes = quotes.filter(quote => {
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
            case 'status':
                const statusMap: Record<string, string> = {
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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
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
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Número</TableHead>
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
                                        <TableCell className="font-medium">{quote.number}</TableCell>
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
                                            {formatCurrency(quote.totals.suggestedPrice)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link href={`/pricing?quoteId=${quote.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        <Pencil className="w-3 h-3 mr-1.5" />
                                                        Editar
                                                    </Button>
                                                </Link>
                                                <Link href={`/admin/quotes/${quote.id}/proposal`}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="w-3 h-3 mr-1.5" />
                                                        Visualizar
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-blue-600 hover:text-blue-700"
                                                    onClick={() => handlePrint(quote.id)}
                                                >
                                                    <FileDown className="w-3 h-3 mr-1.5" />
                                                    Exportar PDF
                                                </Button>
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
