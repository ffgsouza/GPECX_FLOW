/**
 * COMPANIES CONFIGURATION - GPECx FLOW
 * 
 * Configuração refinada de workspaces com features, categorias de serviço
 * e lógica de filtragem por empresa.
 */

// ============================================================================
// TIPOS
// ============================================================================

export type WorkspaceId = 'EXS' | 'PECS' | 'ISPCS';

export type ProposalType = 'PVE' | 'PLE' | 'PTC';

export type ServiceCategory =
    | 'MAINTENANCE_CALIBRATION'  // EXS: Manutenção e Calibração
    | 'ENGINEERING_CONSULTING'   // PECS: Engenharia e Consultoria
    | 'TRAINING_COURSES';        // ISPCS: Treinamentos e Cursos

export interface FeatureConfig {
    enabled: boolean;
    canDisable?: boolean; // Feature flag para futura desativação
}

export interface WorkspaceConfig {
    id: WorkspaceId;
    name: string;
    shortName: string;
    role: string; // Papel estratégico da empresa
    color: string;
    bgColor: string;

    // Branding
    logoUrl: string; // URL do logo para propostas
    slogan: string; // Slogan da empresa

    // Feature Flags
    features: {
        sales: FeatureConfig;
        rental: FeatureConfig;
        service: FeatureConfig;
    };

    // Categorias de serviço permitidas
    serviceCategories: ServiceCategory[];

    // Tipos de proposta permitidos
    allowedProposalTypes: ProposalType[];

    // Módulos bloqueados explicitamente
    blockedModules?: string[];
}

// ============================================================================
// CONFIGURAÇÃO DAS EMPRESAS
// ============================================================================

export const WORKSPACES: WorkspaceConfig[] = [
    // ======================== EXS SOLUTIONS ========================
    {
        id: 'EXS',
        name: 'EXS Solutions',
        shortName: 'EXS',
        role: 'The Powerhouse', // Faz tudo
        color: '#10B981', // Emerald
        bgColor: '#10B98120',

        // Branding
        logoUrl: '', // Usa texto estilizado (sem logo externo)
        slogan: 'Inovação que define soluções',

        features: {
            sales: { enabled: true },
            rental: { enabled: true },
            service: { enabled: true },
        },

        serviceCategories: ['MAINTENANCE_CALIBRATION'],
        allowedProposalTypes: ['PVE', 'PLE', 'PTC'],
    },

    // ======================== P&CONTROL SERVICES ========================
    {
        id: 'PECS',
        name: 'P&Control Services',
        shortName: 'PECS',
        role: 'Engineering & Sales Relief', // Apoio Tributário
        color: '#3B82F6', // Blue
        bgColor: '#3B82F620',

        // Branding
        logoUrl: 'https://firebasestorage.googleapis.com/v0/b/comexs-r1g97.firebasestorage.app/o/Geral%20do%20Sistema%2FLogo%20PECS.png?alt=media&token=5be5c0f1-8f4b-46f1-82d8-48c2c3d662fc',
        slogan: 'Excelência em Engenharia e Controle',

        features: {
            sales: { enabled: true, canDisable: true }, // Feature flag
            rental: { enabled: false }, // BLOQUEADO - Nunca aluga
            service: { enabled: true },
        },

        serviceCategories: ['ENGINEERING_CONSULTING'],
        allowedProposalTypes: ['PVE', 'PTC'], // SEM PLE
        blockedModules: ['RENTAL_CALENDAR', 'FLEET_MANAGEMENT', 'ASSET_MAINTENANCE'],
    },

    // ======================== INSTITUTO ISPCS ========================
    {
        id: 'ISPCS',
        name: 'Instituto ISPCS',
        shortName: 'ISPCS',
        role: 'Education', // Ensino
        color: '#8B5CF6', // Violet
        bgColor: '#8B5CF620',

        // Branding
        logoUrl: 'https://firebasestorage.googleapis.com/v0/b/comexs-r1g97.firebasestorage.app/o/Geral%20do%20Sistema%2FLogo%20ispcs%20preto.png?alt=media&token=f3745814-c8cb-4cd3-93b1-a4b552c0415a',
        slogan: 'Capacitando profissionais para o setor elétrico',

        features: {
            sales: { enabled: false }, // Não vende hardware
            rental: { enabled: false }, // Não aluga
            service: { enabled: true },
        },

        serviceCategories: ['TRAINING_COURSES'],
        allowedProposalTypes: ['PTC'], // Apenas serviços
        blockedModules: [
            'RENTAL_CALENDAR',
            'FLEET_MANAGEMENT',
            'ASSET_MAINTENANCE',
            'INVENTORY_VIEW',
            'SALES_PIPELINE',
        ],
    },
];

// ============================================================================
// CONSTANTES DE ACESSO RÁPIDO
// ============================================================================

export const DEFAULT_WORKSPACE_ID: WorkspaceId = 'EXS';

export const WORKSPACE_MAP: Record<WorkspaceId, WorkspaceConfig> =
    WORKSPACES.reduce((acc, ws) => {
        acc[ws.id] = ws;
        return acc;
    }, {} as Record<WorkspaceId, WorkspaceConfig>);

// ============================================================================
// LABELS PARA UI
// ============================================================================

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
    MAINTENANCE_CALIBRATION: 'Manutenção e Calibração',
    ENGINEERING_CONSULTING: 'Engenharia e Consultoria',
    TRAINING_COURSES: 'Treinamentos e Cursos',
};

export const PROPOSAL_TYPE_LABELS: Record<ProposalType, string> = {
    PVE: 'Proposta de Venda',
    PLE: 'Proposta de Locação',
    PTC: 'Proposta Técnico-Comercial (Serviço)',
};

export const PROPOSAL_TYPE_SHORT_LABELS: Record<ProposalType, string> = {
    PVE: 'Venda',
    PLE: 'Locação',
    PTC: 'Serviço',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Retorna a configuração de um workspace pelo ID.
 */
export function getWorkspaceById(id: WorkspaceId): WorkspaceConfig | undefined {
    return WORKSPACE_MAP[id];
}

/**
 * Retorna a configuração de um workspace pelo ID, com fallback para EXS.
 */
export function getWorkspaceByIdOrDefault(id: WorkspaceId): WorkspaceConfig {
    return WORKSPACE_MAP[id] ?? WORKSPACE_MAP[DEFAULT_WORKSPACE_ID];
}

/**
 * Retorna as categorias de serviço permitidas para uma empresa.
 * Usado para filtrar o catálogo de serviços ao criar proposta PTC.
 */
export function getServiceCategories(companyId: WorkspaceId): ServiceCategory[] {
    const workspace = getWorkspaceById(companyId);
    return workspace?.serviceCategories ?? [];
}

/**
 * Retorna os tipos de proposta permitidos para uma empresa.
 * Usado para montar o dropdown de "Nova Proposta".
 */
export function getAllowedProposalTypes(companyId: WorkspaceId): ProposalType[] {
    const workspace = getWorkspaceById(companyId);
    return workspace?.allowedProposalTypes ?? [];
}

/**
 * Verifica se uma empresa tem um módulo/feature habilitado.
 */
export function hasFeature(
    companyId: WorkspaceId,
    feature: 'sales' | 'rental' | 'service'
): boolean {
    const workspace = getWorkspaceById(companyId);
    return workspace?.features[feature]?.enabled ?? false;
}

/**
 * Verifica se uma empresa pode criar um tipo específico de proposta.
 */
export function canCreateProposalType(
    companyId: WorkspaceId,
    proposalType: ProposalType
): boolean {
    const allowedTypes = getAllowedProposalTypes(companyId);
    return allowedTypes.includes(proposalType);
}

/**
 * Retorna as opções para o dropdown de Nova Proposta.
 */
export function getProposalTypeOptions(companyId: WorkspaceId): Array<{
    value: ProposalType;
    label: string;
    shortLabel: string;
}> {
    const allowedTypes = getAllowedProposalTypes(companyId);

    return allowedTypes.map(type => ({
        value: type,
        label: PROPOSAL_TYPE_LABELS[type],
        shortLabel: PROPOSAL_TYPE_SHORT_LABELS[type],
    }));
}

/**
 * Verifica se um módulo está bloqueado para uma empresa.
 */
export function isModuleBlocked(companyId: WorkspaceId, moduleId: string): boolean {
    const workspace = getWorkspaceById(companyId);
    return workspace?.blockedModules?.includes(moduleId) ?? false;
}

/**
 * Retorna se a empresa tem módulo de locação (para exibir/ocultar widgets).
 */
export function hasRentalModule(companyId: WorkspaceId): boolean {
    return hasFeature(companyId, 'rental');
}

/**
 * Retorna se a empresa tem módulo de vendas.
 */
export function hasSalesModule(companyId: WorkspaceId): boolean {
    return hasFeature(companyId, 'sales');
}

/**
 * Retorna se a empresa tem módulo de serviços.
 */
export function hasServicesModule(companyId: WorkspaceId): boolean {
    return hasFeature(companyId, 'service');
}

// ============================================================================
// EXPORTS PARA COMPATIBILIDADE COM CÓDIGO EXISTENTE
// ============================================================================

// Re-exportar tipos para compatibilidade
export type { WorkspaceId as CompanyId };
