"use client";

import { useState } from 'react';
import { useWorkspace } from '@/context/workspace-context';
import { Check, ChevronsUpDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { WorkspaceId, WorkspaceConfig } from '@/lib/companies';
import { resetWorkspaceWelcomeStorage } from '@/context/workspace-welcome-context';

export function WorkspaceSwitcher() {
    const { currentWorkspace, availableWorkspaces, setActiveWorkspace } = useWorkspace();
    const [pendingWorkspace, setPendingWorkspace] = useState<WorkspaceConfig | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handleWorkspaceClick = (workspace: WorkspaceConfig) => {
        // Se for o mesmo workspace, não faz nada
        if (workspace.id === currentWorkspace.id) return;

        // Mostrar dialog de confirmação
        setPendingWorkspace(workspace);
        setShowConfirmDialog(true);
    };

    const handleConfirmSwitch = () => {
        if (pendingWorkspace) {
            // Resetar a tela de boas-vindas para o novo workspace
            resetWorkspaceWelcomeStorage(pendingWorkspace.id);

            // Trocar workspace
            setActiveWorkspace(pendingWorkspace.id as WorkspaceId);
        }
        setShowConfirmDialog(false);
        setPendingWorkspace(null);
    };

    const handleCancelSwitch = () => {
        setShowConfirmDialog(false);
        setPendingWorkspace(null);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="w-full justify-between px-3 py-2 h-auto text-left hover:bg-slate-800 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
                    >
                        <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                                style={{ backgroundColor: currentWorkspace.color }}
                            >
                                {currentWorkspace.shortName.slice(0, 2)}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-white text-sm">{currentWorkspace.shortName}</span>
                                <span className="text-[10px] text-slate-400">{currentWorkspace.name}</span>
                            </div>
                        </div>
                        <div
                            className="hidden group-data-[collapsible=icon]:flex w-8 h-8 rounded-lg items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: currentWorkspace.color }}
                        >
                            {currentWorkspace.shortName.slice(0, 2)}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 text-slate-400 shrink-0 group-data-[collapsible=icon]:hidden" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="start"
                    className="w-[220px] bg-[#0c2340] border-slate-700"
                    sideOffset={8}
                >
                    {availableWorkspaces.map((workspace) => (
                        <DropdownMenuItem
                            key={workspace.id}
                            onClick={() => handleWorkspaceClick(workspace)}
                            className="flex items-center gap-3 cursor-pointer hover:bg-slate-800 focus:bg-slate-800 text-white"
                        >
                            <div
                                className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-[10px]"
                                style={{ backgroundColor: workspace.color }}
                            >
                                {workspace.shortName.slice(0, 2)}
                            </div>
                            <div className="flex flex-col flex-1">
                                <span className="font-medium text-sm">{workspace.shortName}</span>
                                <span className="text-[10px] text-slate-400">{workspace.name}</span>
                            </div>
                            {currentWorkspace.id === workspace.id && (
                                <Check className="h-4 w-4 text-emerald-400" />
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialog de Confirmação de Troca */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Trocar de Workspace?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4">
                                <p>
                                    Você está prestes a sair do workspace atual e entrar em outro.
                                </p>

                                {/* Visualização da Troca */}
                                <div className="flex items-center justify-center gap-4 py-4">
                                    {/* Workspace Atual */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                                            style={{ backgroundColor: currentWorkspace.color }}
                                        >
                                            {currentWorkspace.shortName.slice(0, 2)}
                                        </div>
                                        <span className="text-xs font-medium text-slate-600">
                                            {currentWorkspace.shortName}
                                        </span>
                                    </div>

                                    {/* Seta */}
                                    <div className="text-2xl text-slate-400">→</div>

                                    {/* Novo Workspace */}
                                    {pendingWorkspace && (
                                        <div className="flex flex-col items-center gap-2">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ring-2 ring-offset-2"
                                                style={{
                                                    backgroundColor: pendingWorkspace.color
                                                }}
                                            >
                                                {pendingWorkspace.shortName.slice(0, 2)}
                                            </div>
                                            <span className="text-xs font-medium text-slate-900">
                                                {pendingWorkspace.shortName}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm text-slate-500">
                                    Os dados e permissões serão ajustados de acordo com o novo workspace.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelSwitch}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmSwitch}
                            className="bg-slate-900 hover:bg-slate-800"
                        >
                            Confirmar Troca
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
