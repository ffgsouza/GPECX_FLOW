'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log do erro no console (visível no F12 do navegador)
        console.error('Aplicação encontrou um erro:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4">
            <div className="p-4 rounded-full bg-red-100 mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Algo deu errado!</h2>
            <p className="text-gray-600 max-w-md">
                Encontramos um erro inesperado. Tente recarregar a página.
            </p>

            {/* Área Técnica para Debug (Vital para diagnosticar Vercel) */}
            <div className="w-full max-w-lg p-4 mt-6 bg-slate-900 rounded-md text-left overflow-auto max-h-60">
                <p className="text-xs font-mono text-red-400 font-bold mb-2">DETALHES DO ERRO (Envie isso para o suporte):</p>
                <pre className="text-xs font-mono text-gray-300 break-words whitespace-pre-wrap">
                    {error.message}
                    {error.stack && `\n\nStack:\n${error.stack}`}
                </pre>
            </div>

            <div className="flex gap-4 mt-6">
                <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
                    Voltar ao Dashboard
                </Button>
                <Button onClick={() => reset()} className="bg-red-600 hover:bg-red-700 text-white">
                    Tentar Novamente
                </Button>
            </div>
        </div>
    );
}
