"use client";

import { useState } from "react";
import { useWorkspace } from "@/context/workspace-context";
import { useWorkspaceWelcome } from "@/context/workspace-welcome-context";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WorkspaceWelcome() {
    const { currentWorkspace } = useWorkspace();
    const { showWelcome, dismissWelcome } = useWorkspaceWelcome();
    const [isExiting, setIsExiting] = useState(false);

    const handleContinue = () => {
        // Animação de saída
        setIsExiting(true);
        setTimeout(() => {
            dismissWelcome();
            setIsExiting(false);
        }, 300);
    };

    if (!showWelcome) return null;

    return (
        <div
            className={`fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'
                }`}
            style={{
                left: '18rem', // Largura da sidebar
                marginLeft: '0',
            }}
        >
            <div className={`text-center max-w-lg px-8 transition-all duration-300 ${isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
                }`}>
                {/* Ícone do Workspace */}
                <div
                    className="w-24 h-24 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-2xl"
                    style={{ backgroundColor: currentWorkspace.color }}
                >
                    <span className="text-4xl font-bold text-white">
                        {currentWorkspace.shortName.slice(0, 2)}
                    </span>
                </div>

                {/* Nome do Workspace */}
                <h1 className="text-4xl font-bold text-white mb-3">
                    {currentWorkspace.name}
                </h1>

                {/* Role/Descrição */}
                <p className="text-lg text-slate-400 mb-2">
                    {currentWorkspace.role}
                </p>

                {/* Features disponíveis */}
                <div className="flex justify-center gap-3 mb-8">
                    {currentWorkspace.features.sales.enabled && (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                            Vendas
                        </span>
                    )}
                    {currentWorkspace.features.rental.enabled && (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                            Locação
                        </span>
                    )}
                    {currentWorkspace.features.service.enabled && (
                        <span className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-sm font-medium">
                            Serviços
                        </span>
                    )}
                </div>

                {/* Botão Continuar */}
                <Button
                    onClick={handleContinue}
                    size="lg"
                    className="px-8 py-6 text-lg font-semibold bg-white text-slate-900 hover:bg-slate-100"
                >
                    Acessar Workspace
                    <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                {/* Dica */}
                <p className="text-sm text-slate-500 mt-6">
                    Você pode trocar de workspace a qualquer momento pelo menu lateral
                </p>
            </div>
        </div>
    );
}
