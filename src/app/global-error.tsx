'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-4 bg-gray-50 font-sans">
                    <h2 className="text-2xl font-bold text-gray-900">Erro Crítico de Sistema</h2>
                    <p className="text-gray-600">Ocorreu uma falha no carregamento principal da aplicação.</p>

                    <div className="w-full max-w-lg p-4 mt-6 bg-slate-900 rounded-md text-left overflow-auto">
                        <p className="text-xs font-mono text-red-400 font-bold mb-2">ERRO CRÍTICO:</p>
                        <pre className="text-xs font-mono text-gray-300 break-words whitespace-pre-wrap">
                            {error.message}
                        </pre>
                    </div>

                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </body>
        </html>
    );
}
