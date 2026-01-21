/**
 * SALES PIPELINES CONFIGURATION - GPECx FLOW
 * 
 * Configuração de funis de vendas dinâmicos por workspace.
 * Cada empresa tem seu próprio fluxo de estágios.
 */

import type { WorkspaceId } from './companies';
import { LucideIcon, Users, FileText, Handshake, FileCheck, Truck, CheckCircle, XCircle, GraduationCap, CreditCard, ClipboardList, Search, Scale, Package } from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export type PipelineStageId =
    // Engineering Flow (EXS & PECS)
    | 'LEAD'
    | 'TECH_ANALYSIS'
    | 'PROPOSAL'
    | 'NEGOTIATION'
    | 'CONTRACT'
    | 'LOGISTICS'
    | 'WON'
    | 'LOST'
    // Education Flow (ISPCS)
    | 'INTEREST'
    | 'PROPOSAL_SENT'
    | 'ENROLLMENT'
    | 'PAYMENT_PENDING';

export type PipelineType = 'ENGINEERING' | 'EDUCATION';

export interface PipelineStage {
    id: PipelineStageId;
    label: string;
    shortLabel: string;
    color: string;        // Tailwind color class
    bgColor: string;      // Background color for cards
    textColor: string;    // Text color
    icon: LucideIcon;
    order: number;
    isFinal?: boolean;    // WON ou LOST
    isPositive?: boolean; // WON = true, LOST = false
}

export interface PipelineConfig {
    id: PipelineType;
    name: string;
    description: string;
    stages: PipelineStage[];
    workspaces: WorkspaceId[];
}

// ============================================================================
// ESTÁGIOS DO FUNIL DE ENGENHARIA (EXS & PECS)
// ============================================================================

const ENGINEERING_STAGES: PipelineStage[] = [
    {
        id: 'LEAD',
        label: 'Lead / Qualificação',
        shortLabel: 'Lead',
        color: 'slate',
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-700',
        icon: Users,
        order: 1,
    },
    {
        id: 'TECH_ANALYSIS',
        label: 'Análise Técnica',
        shortLabel: 'Técnico',
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: Search,
        order: 2,
    },
    {
        id: 'PROPOSAL',
        label: 'Proposta Enviada',
        shortLabel: 'Proposta',
        color: 'indigo',
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-700',
        icon: FileText,
        order: 3,
    },
    {
        id: 'NEGOTIATION',
        label: 'Negociação / Jurídico',
        shortLabel: 'Negociação',
        color: 'amber',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        icon: Scale,
        order: 4,
    },
    {
        id: 'CONTRACT',
        label: 'Aprovado (Aguardando PO)',
        shortLabel: 'Contrato',
        color: 'cyan',
        bgColor: 'bg-cyan-100',
        textColor: 'text-cyan-700',
        icon: FileCheck,
        order: 5,
    },
    {
        id: 'LOGISTICS',
        label: 'Preparação / Logística',
        shortLabel: 'Logística',
        color: 'purple',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700',
        icon: Package,
        order: 6,
    },
    {
        id: 'WON',
        label: 'Faturado / Concluído',
        shortLabel: 'Ganho',
        color: 'emerald',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-700',
        icon: CheckCircle,
        order: 99,
        isFinal: true,
        isPositive: true,
    },
    {
        id: 'LOST',
        label: 'Perdido',
        shortLabel: 'Perdido',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        icon: XCircle,
        order: 100,
        isFinal: true,
        isPositive: false,
    },
];

// ============================================================================
// ESTÁGIOS DO FUNIL EDUCACIONAL (ISPCS)
// ============================================================================

const EDUCATION_STAGES: PipelineStage[] = [
    {
        id: 'INTEREST',
        label: 'Interesse / Lead',
        shortLabel: 'Interesse',
        color: 'slate',
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-700',
        icon: Users,
        order: 1,
    },
    {
        id: 'PROPOSAL_SENT',
        label: 'Proposta Enviada',
        shortLabel: 'Proposta',
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: FileText,
        order: 2,
    },
    {
        id: 'ENROLLMENT',
        label: 'Inscrição Confirmada',
        shortLabel: 'Inscrito',
        color: 'violet',
        bgColor: 'bg-violet-100',
        textColor: 'text-violet-700',
        icon: GraduationCap,
        order: 3,
    },
    {
        id: 'PAYMENT_PENDING',
        label: 'Aguardando Pagamento',
        shortLabel: 'Pagamento',
        color: 'amber',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        icon: CreditCard,
        order: 4,
    },
    {
        id: 'WON',
        label: 'Concluído',
        shortLabel: 'Ganho',
        color: 'emerald',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-700',
        icon: CheckCircle,
        order: 99,
        isFinal: true,
        isPositive: true,
    },
    {
        id: 'LOST',
        label: 'Perdido / Cancelado',
        shortLabel: 'Perdido',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        icon: XCircle,
        order: 100,
        isFinal: true,
        isPositive: false,
    },
];

// ============================================================================
// CONFIGURAÇÃO DE PIPELINES
// ============================================================================

export const SALES_PIPELINES: Record<PipelineType, PipelineConfig> = {
    ENGINEERING: {
        id: 'ENGINEERING',
        name: 'Pipeline de Vendas',
        description: 'Fluxo para vendas técnicas, locações e projetos',
        stages: ENGINEERING_STAGES,
        workspaces: ['EXS', 'PECS'],
    },
    EDUCATION: {
        id: 'EDUCATION',
        name: 'Pipeline de Vendas',
        description: 'Fluxo para cursos e treinamentos',
        stages: EDUCATION_STAGES,
        workspaces: ['ISPCS'],
    },
};

// ============================================================================
// MAPEAMENTO WORKSPACE -> PIPELINE
// ============================================================================

export const WORKSPACE_PIPELINE_MAP: Record<WorkspaceId, PipelineType> = {
    EXS: 'ENGINEERING',
    PECS: 'ENGINEERING',
    ISPCS: 'EDUCATION',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Retorna a configuração do pipeline para um workspace.
 */
export function getPipelineForWorkspace(workspaceId: WorkspaceId): PipelineConfig {
    const pipelineType = WORKSPACE_PIPELINE_MAP[workspaceId];
    return SALES_PIPELINES[pipelineType];
}

/**
 * Retorna os estágios do pipeline para um workspace.
 */
export function getPipelineStages(workspaceId: WorkspaceId): PipelineStage[] {
    return getPipelineForWorkspace(workspaceId).stages;
}

/**
 * Retorna apenas os estágios ativos (não finais) para o Kanban.
 */
export function getActiveStages(workspaceId: WorkspaceId): PipelineStage[] {
    return getPipelineStages(workspaceId).filter(s => !s.isFinal);
}

/**
 * Retorna um estágio específico pelo ID.
 */
export function getStageById(workspaceId: WorkspaceId, stageId: PipelineStageId): PipelineStage | undefined {
    return getPipelineStages(workspaceId).find(s => s.id === stageId);
}

/**
 * Retorna o primeiro estágio (inicial) de um pipeline.
 */
export function getInitialStage(workspaceId: WorkspaceId): PipelineStage {
    const stages = getPipelineStages(workspaceId);
    return stages.reduce((min, s) => s.order < min.order ? s : min, stages[0]);
}

/**
 * Retorna os próximos estágios possíveis a partir de um estágio atual.
 */
export function getNextPossibleStages(workspaceId: WorkspaceId, currentStageId: PipelineStageId): PipelineStage[] {
    const stages = getPipelineStages(workspaceId);
    const currentStage = stages.find(s => s.id === currentStageId);

    if (!currentStage || currentStage.isFinal) return [];

    // Pode avançar para qualquer estágio com order maior ou para finais
    return stages.filter(s => s.order > currentStage.order || s.isFinal);
}

/**
 * Retorna as cores do badge para um estágio.
 */
export function getStageBadgeClasses(stage: PipelineStage): string {
    return `${stage.bgColor} ${stage.textColor} border-${stage.color}-200`;
}

/**
 * Retorna a cor do workspace para identificação visual nos cards.
 */
export function getWorkspaceCardColor(workspaceId: WorkspaceId): string {
    switch (workspaceId) {
        case 'EXS': return 'border-l-emerald-500';
        case 'PECS': return 'border-l-blue-500';
        case 'ISPCS': return 'border-l-violet-500';
        default: return 'border-l-slate-500';
    }
}

// ============================================================================
// EXPORTAÇÃO CONSOLIDADA
// ============================================================================

export const PIPELINES = {
    configs: SALES_PIPELINES,
    workspaceMap: WORKSPACE_PIPELINE_MAP,
    getForWorkspace: getPipelineForWorkspace,
    getStages: getPipelineStages,
    getActiveStages,
    getStageById,
    getInitialStage,
    getNextPossibleStages,
} as const;

export default PIPELINES;
