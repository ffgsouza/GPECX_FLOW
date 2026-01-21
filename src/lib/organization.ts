/**
 * ORGANIZATION STRUCTURE - GPECx Group
 * 
 * Configuração de estrutura organizacional para RBAC (Role-Based Access Control).
 * Este arquivo define departamentos, cargos e permissões de acesso aos módulos do sistema.
 */

// ============================================================================
// TIPOS E ENUMS
// ============================================================================

/** IDs das empresas/workspaces */
export type CompanyId = 'GROUP' | 'EXS' | 'PECS' | 'ISPCS';

/** Módulos disponíveis no sistema */
export type SystemModule =
    // Corporativo (GROUP)
    | 'DASHBOARD_BI'
    | 'APPROVAL_CENTER'
    | 'GLOBAL_FINANCE'
    | 'SYSTEM_CONFIG'
    | 'USER_MANAGEMENT'
    | 'CRM_MARKETING'
    | 'CUSTOMER_REGISTRY'
    // EXS
    | 'SALES_PIPELINE'
    | 'PROPOSAL_MANAGEMENT'
    | 'INVENTORY_VIEW'
    | 'FLEET_MANAGEMENT'
    | 'RENTAL_CALENDAR'
    | 'ASSET_MAINTENANCE'
    | 'SERVICE_ORDERS'
    | 'CALIBRATION_CERTS'
    // PECS
    | 'PROJECT_MANAGEMENT'
    | 'FIELD_REPORTS'
    // ISPCS
    | 'EDUCATIONAL_PIPELINE'
    | 'INSTRUCTOR_AGENDA'
    | 'CERTIFICATE_EMISSION'
    | 'ATTENDANCE_LIST'
    // Financeiro (Compartilhado)
    | 'FINANCE_MODULE'
    | 'INVOICING'
    | 'CONTRACT_MANAGEMENT';

/** Tipos de proposta */
export type ProposalType = 'PVE' | 'PLE' | 'PTC';

/** IDs dos departamentos */
export type DepartmentId =
    // GROUP
    | 'GROUP_BOARD'
    | 'GROUP_FINANCE'
    | 'GROUP_HR'
    | 'GROUP_MARKETING'
    // EXS
    | 'EXS_COMMERCIAL'
    | 'EXS_FLEET'
    | 'EXS_LAB'
    // PECS
    | 'PECS_COMMERCIAL'
    | 'PECS_ENGINEERING'
    // ISPCS
    | 'ISPCS_COMMERCIAL'
    | 'ISPCS_ACADEMIC';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Department {
    id: DepartmentId;
    name: string;
    companyId: CompanyId;
    focus: string;
    modules: SystemModule[];
    proposalTypes: ProposalType[];
    icon?: string;
}

export interface Role {
    id: string;
    name: string;
    departmentId: DepartmentId;
    companyId: CompanyId;
    canAccess: SystemModule[];
    denyAccess?: SystemModule[];
    allowedProposalTypes: ProposalType[];
    isAdmin?: boolean;
}

export interface CompanyConfig {
    id: CompanyId;
    name: string;
    shortName: string;
    color: string;
    departments: DepartmentId[];
}

// ============================================================================
// CONFIGURAÇÃO DE EMPRESAS
// ============================================================================

export const COMPANIES: Record<CompanyId, CompanyConfig> = {
    GROUP: {
        id: 'GROUP',
        name: 'Grupo GPECx (Corporativo)',
        shortName: 'GPECx',
        color: '#6366F1', // Indigo
        departments: ['GROUP_BOARD', 'GROUP_FINANCE', 'GROUP_HR', 'GROUP_MARKETING'],
    },
    EXS: {
        id: 'EXS',
        name: 'EXS Solutions',
        shortName: 'EXS',
        color: '#10B981', // Emerald
        departments: ['EXS_COMMERCIAL', 'EXS_FLEET', 'EXS_LAB'],
    },
    PECS: {
        id: 'PECS',
        name: 'P&Control Services',
        shortName: 'PECS',
        color: '#3B82F6', // Blue
        departments: ['PECS_COMMERCIAL', 'PECS_ENGINEERING'],
    },
    ISPCS: {
        id: 'ISPCS',
        name: 'Instituto ISPCS',
        shortName: 'ISPCS',
        color: '#8B5CF6', // Violet
        departments: ['ISPCS_COMMERCIAL', 'ISPCS_ACADEMIC'],
    },
};

// ============================================================================
// CONFIGURAÇÃO DE DEPARTAMENTOS
// ============================================================================

export const DEPARTMENTS: Record<DepartmentId, Department> = {
    // ======================== GRUPO GPECx (Corporativo) ========================
    GROUP_BOARD: {
        id: 'GROUP_BOARD',
        name: 'Diretoria (Board)',
        companyId: 'GROUP',
        focus: 'Estratégia, Metas e Aprovação Final',
        modules: ['DASHBOARD_BI', 'APPROVAL_CENTER', 'GLOBAL_FINANCE'],
        proposalTypes: ['PVE', 'PLE', 'PTC'], // Visualização de todos
        icon: 'Crown',
    },
    GROUP_FINANCE: {
        id: 'GROUP_FINANCE',
        name: 'Financeiro & Controladoria',
        companyId: 'GROUP',
        focus: 'Contas a Pagar/Receber, Fiscal, Faturamento',
        modules: ['FINANCE_MODULE', 'INVOICING', 'CONTRACT_MANAGEMENT'],
        proposalTypes: [],
        icon: 'Calculator',
    },
    GROUP_HR: {
        id: 'GROUP_HR',
        name: 'RH & Administração',
        companyId: 'GROUP',
        focus: 'Gestão de Pessoas e Acessos',
        modules: ['SYSTEM_CONFIG', 'USER_MANAGEMENT'],
        proposalTypes: [],
        icon: 'Users',
    },
    GROUP_MARKETING: {
        id: 'GROUP_MARKETING',
        name: 'Marketing',
        companyId: 'GROUP',
        focus: 'Geração de Leads e Eventos',
        modules: ['CRM_MARKETING', 'CUSTOMER_REGISTRY'],
        proposalTypes: [],
        icon: 'Megaphone',
    },

    // ======================== EXS SOLUTIONS (Powerhouse) ========================
    EXS_COMMERCIAL: {
        id: 'EXS_COMMERCIAL',
        name: 'Comercial EXS',
        companyId: 'EXS',
        focus: 'Venda de Produtos e Locação',
        modules: ['SALES_PIPELINE', 'PROPOSAL_MANAGEMENT', 'INVENTORY_VIEW'],
        proposalTypes: ['PVE', 'PLE', 'PTC'],
        icon: 'Briefcase',
    },
    EXS_FLEET: {
        id: 'EXS_FLEET',
        name: 'Gestão de Ativos (Frota)',
        companyId: 'EXS',
        focus: 'Logística e Controle de Equipamentos',
        modules: ['FLEET_MANAGEMENT', 'RENTAL_CALENDAR', 'ASSET_MAINTENANCE'],
        proposalTypes: [],
        icon: 'Truck',
    },
    EXS_LAB: {
        id: 'EXS_LAB',
        name: 'Laboratório (Técnico)',
        companyId: 'EXS',
        focus: 'Reparo, Calibração e Manutenção',
        modules: ['SERVICE_ORDERS', 'CALIBRATION_CERTS'],
        proposalTypes: [],
        icon: 'FlaskConical',
    },

    // ======================== P&CONTROL (PECS) (Engenharia) ========================
    PECS_COMMERCIAL: {
        id: 'PECS_COMMERCIAL',
        name: 'Comercial PECS',
        companyId: 'PECS',
        focus: 'Venda de Produtos e Projetos',
        modules: ['SALES_PIPELINE', 'PROPOSAL_MANAGEMENT'],
        proposalTypes: ['PVE', 'PTC'], // SEM PLE (Locação)
        icon: 'Briefcase',
    },
    PECS_ENGINEERING: {
        id: 'PECS_ENGINEERING',
        name: 'Engenharia de Aplicação',
        companyId: 'PECS',
        focus: 'Estudos, Projetos e Serviços de Campo',
        modules: ['PROJECT_MANAGEMENT', 'FIELD_REPORTS'],
        proposalTypes: [],
        icon: 'HardHat',
    },

    // ======================== ISPCS (Instituto) ========================
    ISPCS_COMMERCIAL: {
        id: 'ISPCS_COMMERCIAL',
        name: 'Comercial Educacional',
        companyId: 'ISPCS',
        focus: 'Venda de Cursos e Treinamentos',
        modules: ['EDUCATIONAL_PIPELINE', 'PROPOSAL_MANAGEMENT'],
        proposalTypes: ['PTC'], // Apenas Cursos
        icon: 'GraduationCap',
    },
    ISPCS_ACADEMIC: {
        id: 'ISPCS_ACADEMIC',
        name: 'Acadêmico / Pedagógico',
        companyId: 'ISPCS',
        focus: 'Gestão de Turmas e Alunos',
        modules: ['INSTRUCTOR_AGENDA', 'CERTIFICATE_EMISSION', 'ATTENDANCE_LIST'],
        proposalTypes: [],
        icon: 'BookOpen',
    },
};

// ============================================================================
// CONFIGURAÇÃO DE ROLES (CARGOS)
// ============================================================================

export const ROLES: Role[] = [
    // ======================== SUPER ADMIN ========================
    {
        id: 'SUPER_ADMIN',
        name: 'Super Administrador',
        departmentId: 'GROUP_BOARD',
        companyId: 'GROUP',
        canAccess: Object.values(DEPARTMENTS).flatMap(d => d.modules) as SystemModule[],
        allowedProposalTypes: ['PVE', 'PLE', 'PTC'],
        isAdmin: true,
    },

    // ======================== GRUPO GPECx ========================
    {
        id: 'GROUP_DIRECTOR',
        name: 'Diretor',
        departmentId: 'GROUP_BOARD',
        companyId: 'GROUP',
        canAccess: ['DASHBOARD_BI', 'APPROVAL_CENTER', 'GLOBAL_FINANCE'],
        allowedProposalTypes: ['PVE', 'PLE', 'PTC'],
    },
    {
        id: 'GROUP_FINANCE_MANAGER',
        name: 'Gerente Financeiro',
        departmentId: 'GROUP_FINANCE',
        companyId: 'GROUP',
        canAccess: ['FINANCE_MODULE', 'INVOICING', 'CONTRACT_MANAGEMENT', 'DASHBOARD_BI'],
        allowedProposalTypes: [],
    },
    {
        id: 'GROUP_FINANCE_ANALYST',
        name: 'Analista Financeiro',
        departmentId: 'GROUP_FINANCE',
        companyId: 'GROUP',
        canAccess: ['FINANCE_MODULE', 'INVOICING'],
        allowedProposalTypes: [],
    },
    {
        id: 'GROUP_HR_MANAGER',
        name: 'Gerente de RH',
        departmentId: 'GROUP_HR',
        companyId: 'GROUP',
        canAccess: ['SYSTEM_CONFIG', 'USER_MANAGEMENT'],
        allowedProposalTypes: [],
    },
    {
        id: 'GROUP_MARKETING_MANAGER',
        name: 'Gerente de Marketing',
        departmentId: 'GROUP_MARKETING',
        companyId: 'GROUP',
        canAccess: ['CRM_MARKETING', 'CUSTOMER_REGISTRY'],
        allowedProposalTypes: [],
    },

    // ======================== EXS SOLUTIONS ========================
    {
        id: 'EXS_COMMERCIAL_MANAGER',
        name: 'Gerente Comercial EXS',
        departmentId: 'EXS_COMMERCIAL',
        companyId: 'EXS',
        canAccess: ['SALES_PIPELINE', 'PROPOSAL_MANAGEMENT', 'INVENTORY_VIEW', 'DASHBOARD_BI'],
        allowedProposalTypes: ['PVE', 'PLE', 'PTC'],
    },
    {
        id: 'EXS_SALES_AGENT',
        name: 'Vendedor EXS',
        departmentId: 'EXS_COMMERCIAL',
        companyId: 'EXS',
        canAccess: ['SALES_PIPELINE', 'PROPOSAL_MANAGEMENT', 'INVENTORY_VIEW'],
        allowedProposalTypes: ['PVE', 'PLE', 'PTC'],
    },
    {
        id: 'EXS_FLEET_MANAGER',
        name: 'Gerente de Frota',
        departmentId: 'EXS_FLEET',
        companyId: 'EXS',
        canAccess: ['FLEET_MANAGEMENT', 'RENTAL_CALENDAR', 'ASSET_MAINTENANCE'],
        allowedProposalTypes: [],
    },
    {
        id: 'EXS_FLEET_OPERATOR',
        name: 'Operador de Frota',
        departmentId: 'EXS_FLEET',
        companyId: 'EXS',
        canAccess: ['FLEET_MANAGEMENT', 'RENTAL_CALENDAR'],
        allowedProposalTypes: [],
    },
    {
        id: 'EXS_LAB_MANAGER',
        name: 'Gerente de Laboratório',
        departmentId: 'EXS_LAB',
        companyId: 'EXS',
        canAccess: ['SERVICE_ORDERS', 'CALIBRATION_CERTS'],
        allowedProposalTypes: [],
    },
    {
        id: 'EXS_TECHNICIAN',
        name: 'Técnico de Laboratório',
        departmentId: 'EXS_LAB',
        companyId: 'EXS',
        canAccess: ['SERVICE_ORDERS', 'CALIBRATION_CERTS'],
        allowedProposalTypes: [],
    },

    // ======================== P&CONTROL (PECS) ========================
    {
        id: 'PECS_COMMERCIAL_MANAGER',
        name: 'Gerente Comercial PECS',
        departmentId: 'PECS_COMMERCIAL',
        companyId: 'PECS',
        canAccess: ['SALES_PIPELINE', 'PROPOSAL_MANAGEMENT', 'DASHBOARD_BI'],
        denyAccess: ['FLEET_MANAGEMENT', 'RENTAL_CALENDAR'], // Bloqueio explícito de Locação
        allowedProposalTypes: ['PVE', 'PTC'],
    },
    {
        id: 'PECS_SALES_AGENT',
        name: 'Vendedor PECS',
        departmentId: 'PECS_COMMERCIAL',
        companyId: 'PECS',
        canAccess: ['SALES_PIPELINE', 'PROPOSAL_MANAGEMENT'],
        denyAccess: ['FLEET_MANAGEMENT', 'RENTAL_CALENDAR'],
        allowedProposalTypes: ['PVE', 'PTC'],
    },
    {
        id: 'PECS_ENGINEER',
        name: 'Engenheiro de Aplicação',
        departmentId: 'PECS_ENGINEERING',
        companyId: 'PECS',
        canAccess: ['PROJECT_MANAGEMENT', 'FIELD_REPORTS'],
        denyAccess: ['FLEET_MANAGEMENT', 'RENTAL_CALENDAR'],
        allowedProposalTypes: [],
    },
    {
        id: 'PECS_FIELD_TECH',
        name: 'Técnico de Campo',
        departmentId: 'PECS_ENGINEERING',
        companyId: 'PECS',
        canAccess: ['FIELD_REPORTS'],
        denyAccess: ['FLEET_MANAGEMENT', 'RENTAL_CALENDAR'],
        allowedProposalTypes: [],
    },

    // ======================== ISPCS (Instituto) ========================
    {
        id: 'ISPCS_COMMERCIAL_MANAGER',
        name: 'Gerente Comercial Educacional',
        departmentId: 'ISPCS_COMMERCIAL',
        companyId: 'ISPCS',
        canAccess: ['EDUCATIONAL_PIPELINE', 'PROPOSAL_MANAGEMENT', 'DASHBOARD_BI'],
        denyAccess: ['FLEET_MANAGEMENT', 'RENTAL_CALENDAR', 'INVENTORY_VIEW'],
        allowedProposalTypes: ['PTC'],
    },
    {
        id: 'ISPCS_SALES_AGENT',
        name: 'Consultor Educacional',
        departmentId: 'ISPCS_COMMERCIAL',
        companyId: 'ISPCS',
        canAccess: ['EDUCATIONAL_PIPELINE', 'PROPOSAL_MANAGEMENT'],
        denyAccess: ['FLEET_MANAGEMENT', 'RENTAL_CALENDAR', 'INVENTORY_VIEW'],
        allowedProposalTypes: ['PTC'],
    },
    {
        id: 'ISPCS_INSTRUCTOR',
        name: 'Instrutor',
        departmentId: 'ISPCS_ACADEMIC',
        companyId: 'ISPCS',
        canAccess: ['INSTRUCTOR_AGENDA', 'CERTIFICATE_EMISSION', 'ATTENDANCE_LIST'],
        denyAccess: ['FLEET_MANAGEMENT', 'RENTAL_CALENDAR', 'INVENTORY_VIEW', 'SALES_PIPELINE'],
        allowedProposalTypes: [],
    },
    {
        id: 'ISPCS_COORDINATOR',
        name: 'Coordenador Pedagógico',
        departmentId: 'ISPCS_ACADEMIC',
        companyId: 'ISPCS',
        canAccess: ['INSTRUCTOR_AGENDA', 'CERTIFICATE_EMISSION', 'ATTENDANCE_LIST', 'EDUCATIONAL_PIPELINE'],
        denyAccess: ['FLEET_MANAGEMENT', 'RENTAL_CALENDAR', 'INVENTORY_VIEW'],
        allowedProposalTypes: [],
    },
];

// ============================================================================
// MAPEAMENTO DE MÓDULOS PARA ROTAS DO SISTEMA
// ============================================================================

export const MODULE_ROUTE_MAP: Record<SystemModule, string> = {
    // Corporativo
    DASHBOARD_BI: '/dashboard',
    APPROVAL_CENTER: '/approvals',
    GLOBAL_FINANCE: '/finance/global',
    SYSTEM_CONFIG: '/admin/settings',
    USER_MANAGEMENT: '/admin/users',
    CRM_MARKETING: '/crm/marketing',
    CUSTOMER_REGISTRY: '/admin/customers',
    // Comercial
    SALES_PIPELINE: '/pipeline',
    PROPOSAL_MANAGEMENT: '/quotes',
    INVENTORY_VIEW: '/admin/products',
    // Frota/Locação
    FLEET_MANAGEMENT: '/admin/rental-equipments',
    RENTAL_CALENDAR: '/rentals/calendar',
    ASSET_MAINTENANCE: '/rentals/maintenance',
    // Laboratório
    SERVICE_ORDERS: '/lab/orders',
    CALIBRATION_CERTS: '/lab/certificates',
    // Projetos/Engenharia
    PROJECT_MANAGEMENT: '/projects',
    FIELD_REPORTS: '/projects/reports',
    // Educacional
    EDUCATIONAL_PIPELINE: '/pipeline',
    INSTRUCTOR_AGENDA: '/academic/agenda',
    CERTIFICATE_EMISSION: '/academic/certificates',
    ATTENDANCE_LIST: '/academic/attendance',
    // Financeiro
    FINANCE_MODULE: '/finance',
    INVOICING: '/finance/invoicing',
    CONTRACT_MANAGEMENT: '/finance/contracts',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Retorna os módulos disponíveis para um usuário baseado no seu role e empresa.
 */
export function getAvailableModules(roleId: string, companyId?: CompanyId): SystemModule[] {
    const role = ROLES.find(r => r.id === roleId);

    if (!role) {
        return [];
    }

    // Se for admin, retorna todos os módulos
    if (role.isAdmin) {
        return Object.values(DEPARTMENTS).flatMap(d => d.modules) as SystemModule[];
    }

    // Filtra módulos permitidos menos os bloqueados
    const allowedModules = new Set(role.canAccess);

    if (role.denyAccess) {
        role.denyAccess.forEach(m => allowedModules.delete(m));
    }

    return Array.from(allowedModules);
}

/**
 * Verifica se um usuário pode acessar um módulo específico.
 */
export function canAccessModule(roleId: string, module: SystemModule): boolean {
    const role = ROLES.find(r => r.id === roleId);

    if (!role) return false;
    if (role.isAdmin) return true;
    if (role.denyAccess?.includes(module)) return false;

    return role.canAccess.includes(module);
}

/**
 * Retorna os tipos de proposta permitidos para um role.
 */
export function getAllowedProposalTypes(roleId: string): ProposalType[] {
    const role = ROLES.find(r => r.id === roleId);
    return role?.allowedProposalTypes ?? [];
}

/**
 * Verifica se um usuário pode criar um tipo específico de proposta.
 */
export function canCreateProposalType(roleId: string, proposalType: ProposalType): boolean {
    return getAllowedProposalTypes(roleId).includes(proposalType);
}

/**
 * Retorna os departamentos de uma empresa.
 */
export function getCompanyDepartments(companyId: CompanyId): Department[] {
    return Object.values(DEPARTMENTS).filter(d => d.companyId === companyId);
}

/**
 * Retorna os roles disponíveis para um departamento.
 */
export function getDepartmentRoles(departmentId: DepartmentId): Role[] {
    return ROLES.filter(r => r.departmentId === departmentId);
}

/**
 * Retorna as rotas permitidas para um role (para renderização de menu).
 */
export function getAllowedRoutes(roleId: string): string[] {
    const modules = getAvailableModules(roleId);
    return modules.map(m => MODULE_ROUTE_MAP[m]).filter(Boolean);
}

/**
 * Verifica se uma rota é permitida para um role.
 */
export function isRouteAllowed(roleId: string, route: string): boolean {
    const allowedRoutes = getAllowedRoutes(roleId);
    return allowedRoutes.some(r => route.startsWith(r));
}

// ============================================================================
// EXPORTAÇÃO CONSOLIDADA
// ============================================================================

export const ORGANIZATION_STRUCTURE = {
    companies: COMPANIES,
    departments: DEPARTMENTS,
    roles: ROLES,
    moduleRoutes: MODULE_ROUTE_MAP,
} as const;

export default ORGANIZATION_STRUCTURE;
