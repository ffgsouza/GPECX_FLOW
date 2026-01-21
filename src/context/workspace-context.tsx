"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
    WORKSPACES,
    DEFAULT_WORKSPACE_ID,
    getWorkspaceByIdOrDefault,
    hasRentalModule,
    hasSalesModule,
    hasServicesModule,
    getAllowedProposalTypes,
    getServiceCategories,
    canCreateProposalType,
    getProposalTypeOptions,
    type WorkspaceConfig,
    type WorkspaceId,
    type ProposalType,
    type ServiceCategory,
} from '@/lib/companies';
import type { RequiredModule } from '@/lib/sidebar-config';

const STORAGE_KEY = 'gpecx-active-workspace';

interface WorkspaceContextType {
    // Estado do workspace
    activeWorkspaceId: WorkspaceId;
    currentWorkspace: WorkspaceConfig;
    availableWorkspaces: WorkspaceConfig[];
    setActiveWorkspace: (id: WorkspaceId) => void;

    // Verificações de módulos (para sidebar)
    canAccessModule: (module: RequiredModule) => boolean;

    // Verificações de features
    hasRental: boolean;
    hasSales: boolean;
    hasServices: boolean;

    // Propostas
    allowedProposalTypes: ProposalType[];
    proposalTypeOptions: Array<{ value: ProposalType; label: string; shortLabel: string }>;
    canCreateProposal: (type: ProposalType) => boolean;

    // Categorias de serviço
    serviceCategories: ServiceCategory[];
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
    children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceId>(DEFAULT_WORKSPACE_ID);
    const [isHydrated, setIsHydrated] = useState(false);

    // Carregar do localStorage após hidratação
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && WORKSPACES.some(w => w.id === stored)) {
            setActiveWorkspaceId(stored as WorkspaceId);
        }
        setIsHydrated(true);
    }, []);

    // Persistir no localStorage
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem(STORAGE_KEY, activeWorkspaceId);
        }
    }, [activeWorkspaceId, isHydrated]);

    const currentWorkspace = getWorkspaceByIdOrDefault(activeWorkspaceId);

    const setActiveWorkspace = (id: WorkspaceId) => {
        setActiveWorkspaceId(id);
    };

    // Verificar acesso a módulo (para sidebar)
    const canAccessModule = (module: RequiredModule): boolean => {
        switch (module) {
            case 'RENTAL':
                return hasRentalModule(activeWorkspaceId);
            case 'SALES':
                return hasSalesModule(activeWorkspaceId);
            case 'SERVICES':
                return hasServicesModule(activeWorkspaceId);
            default:
                return true;
        }
    };

    // Features do workspace atual
    const hasRental = hasRentalModule(activeWorkspaceId);
    const hasSales = hasSalesModule(activeWorkspaceId);
    const hasServices = hasServicesModule(activeWorkspaceId);

    // Propostas permitidas
    const allowedProposalTypes = getAllowedProposalTypes(activeWorkspaceId);
    const proposalTypeOptions = getProposalTypeOptions(activeWorkspaceId);
    const canCreateProposal = (type: ProposalType) => canCreateProposalType(activeWorkspaceId, type);

    // Categorias de serviço
    const serviceCategories = getServiceCategories(activeWorkspaceId);

    const value: WorkspaceContextType = {
        // Estado
        activeWorkspaceId,
        currentWorkspace,
        availableWorkspaces: WORKSPACES,
        setActiveWorkspace,

        // Módulos
        canAccessModule,

        // Features
        hasRental,
        hasSales,
        hasServices,

        // Propostas
        allowedProposalTypes,
        proposalTypeOptions,
        canCreateProposal,

        // Serviços
        serviceCategories,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}
