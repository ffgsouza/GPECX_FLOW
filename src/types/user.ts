import type { DepartmentId } from '@/lib/organization';
import type { WorkspaceId } from '@/lib/companies';

/**
 * Roles básicas do sistema (compatibilidade com código existente)
 */
export type UserRole = "admin" | "manager" | "user";

/**
 * Permissões legadas (serão substituídas pelo RBAC)
 * @deprecated Use roleId do organization.ts
 */
export interface UserPermissions {
    dashboard: boolean;
    proposals: boolean;
    customers: boolean;
    products: boolean;
    financial: boolean;
    settings: boolean;
    users: boolean;
}

/**
 * Perfil do usuário no sistema
 */
export interface UserProfile {
    uid: string;
    email: string;
    name: string;

    // Campos legados (manter para compatibilidade)
    role: UserRole;
    permissions: string[];

    // Novos campos RBAC
    /** ID do role no sistema organization.ts (ex: 'EXS_SALES_AGENT') */
    roleId?: string;
    /** ID do departamento (ex: 'EXS_COMMERCIAL') */
    departmentId?: DepartmentId;
    /** Workspace padrão do usuário */
    defaultWorkspaceId?: WorkspaceId;
    /** Workspaces que o usuário pode acessar */
    allowedWorkspaces?: WorkspaceId[];

    // Metadados
    active: boolean;
    createdAt: Date;
    createdBy?: string;
    updatedAt?: Date;
}

/**
 * Dados para criação de novo usuário
 */
export interface CreateUserData {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    permissions: string[];

    // Novos campos RBAC
    roleId?: string;
    departmentId?: DepartmentId;
    defaultWorkspaceId?: WorkspaceId;
    allowedWorkspaces?: WorkspaceId[];
}

/**
 * Dados para atualização de usuário
 */
export interface UpdateUserData {
    name?: string;
    role?: UserRole;
    permissions?: string[];
    roleId?: string;
    departmentId?: DepartmentId;
    defaultWorkspaceId?: WorkspaceId;
    allowedWorkspaces?: WorkspaceId[];
    active?: boolean;
}
