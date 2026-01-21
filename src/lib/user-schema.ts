import { z } from "zod";

export const userRoleEnum = z.enum(["admin", "manager", "user"]);

export const createUserSchema = z.object({
    email: z
        .string()
        .min(1, "Email é obrigatório")
        .email("Email inválido")
        .toLowerCase(),
    password: z
        .string()
        .min(6, "A senha deve ter pelo menos 6 caracteres"),
    name: z
        .string()
        .min(3, "O nome deve ter pelo menos 3 caracteres")
        .max(100, "O nome deve ter no máximo 100 caracteres"),
    role: userRoleEnum.default("user"),
    permissions: z.array(z.string()).default([]),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

// Available permissions/modules
export const availablePermissions = [
    { id: "dashboard", label: "Dashboard" },
    { id: "proposals", label: "Propostas" },
    { id: "customers", label: "Clientes" },
    { id: "products", label: "Produtos" },
    { id: "financial", label: "Financeiro" },
    { id: "settings", label: "Configurações" },
    { id: "users", label: "Gerenciar Usuários" },
] as const;

// Role display names
export const roleLabels = {
    admin: "Administrador",
    manager: "Gerente",
    user: "Usuário",
} as const;
