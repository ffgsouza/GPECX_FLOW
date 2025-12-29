"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  deleteDoc,
  doc,
  type Firestore
} from "firebase/firestore";
import { initializeFirebase } from "@/firebase";
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
import { Loader2, FileText, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";

let db: Firestore;

interface Quote {
    id: string;
    number: string;
    customerName: string;
    createdAt: any;
    status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
    totals: {
      suggestedPrice: number;
    };
}

export function QuoteTable() {
    const { toast } = useToast();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const { db: firestoreDb } = initializeFirebase();
        db = firestoreDb;
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
    }, [toast]);

    const handleDelete = async (quote: Quote) => {
        try {
            await deleteDoc(doc(db, "quotes", quote.id));
            toast({ title: "Proposta excluída", description: `A proposta #${quote.number} foi removida.` });
        } catch (error) {
            toast({ title: "Erro ao excluir", description: "Não foi possível remover a proposta.", variant: "destructive" });
        }
    };

    const getStatusVariant = (status: Quote['status']) => {
        switch (status) {
            case 'DRAFT': return 'secondary';
            case 'SENT': return 'default';
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'destructive';
            default: return 'outline';
        }
    }

     if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Valor Final</TableHead>
                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {quotes.length > 0 ? (
                            quotes.map(quote => (
                                <TableRow key={quote.id}>
                                    <TableCell className="font-medium">{quote.number}</TableCell>
                                    <TableCell>{quote.customerName}</TableCell>
                                    <TableCell>
                                        {quote.createdAt ? format(new Date(quote.createdAt), 'dd/MM/yyyy') : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(quote.status)}>
                                            {quote.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatCurrency(quote.totals.suggestedPrice)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-0">
                                            <Button variant="ghost" size="icon" disabled>
                                                <Eye className="w-4 h-4" />
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
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <FileText className="w-10 h-10" />
                                        <p className="font-medium">Nenhuma proposta encontrada.</p>
                                        <p className="text-sm">Crie uma nova proposta na página de <a href="/pricing" className="underline text-primary">Formação de Preço</a>.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// Add success variant to badge
declare module "@/components/ui/badge" {
    interface BadgeProps {
        variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
    }
}
