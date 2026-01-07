"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function ProposalPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    useEffect(() => {
        // Redireciona para o CalculatorForm carregado com esta proposta
        router.replace(`/pricing?quoteId=${id}`);
    }, [id, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Carregando proposta...</p>
            </div>
        </div>
    );
}
