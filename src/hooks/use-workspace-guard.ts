"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkspace } from '@/context/workspace-context';
import { ROUTE_MODULE_MAP } from '@/lib/sidebar-config';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook que protege rotas baseado nos módulos disponíveis para o workspace ativo.
 * Se o usuário tentar acessar uma rota de módulo indisponível, redireciona para /dashboard.
 */
export function useWorkspaceGuard() {
    const pathname = usePathname();
    const router = useRouter();
    const { currentWorkspace, canAccessModule } = useWorkspace();
    const { toast } = useToast();

    useEffect(() => {
        // Verificar se a rota atual requer um módulo específico
        for (const [route, requiredModule] of Object.entries(ROUTE_MODULE_MAP)) {
            if (pathname.startsWith(route)) {
                if (!canAccessModule(requiredModule)) {
                    toast({
                        variant: "destructive",
                        title: "Módulo não disponível",
                        description: `Este módulo não está disponível para ${currentWorkspace.name}.`,
                    });
                    router.replace('/dashboard');
                    return;
                }
            }
        }
    }, [pathname, currentWorkspace, canAccessModule, router, toast]);

    return { currentWorkspace };
}
