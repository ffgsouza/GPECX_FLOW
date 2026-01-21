import {
    BarChart3,
    Package,
    Wrench,
    Building2,
    Users,
    Briefcase,
    Tags,
    DraftingCompass,
    Settings,
    Filter,
    Calculator,
    FileText,
    Container,
    Database,
    BookUser,
    HelpCircle,
    type LucideIcon
} from 'lucide-react';

export type RequiredModule = 'RENTAL' | 'SALES' | 'SERVICES';

export interface SidebarItem {
    href: string;
    label: string;
    icon: LucideIcon;
    requiredModule?: RequiredModule;
}

export interface SidebarGroup {
    group: string;
    items: SidebarItem[];
}

export const SIDEBAR_CONFIG: SidebarGroup[] = [
    {
        group: 'Visão Geral',
        items: [
            { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
        ]
    },
    {
        group: 'Cadastros',
        items: [
            { href: '/admin/products', label: 'Produtos e Serviços', icon: Package },
            { href: '/admin/rental-equipments', label: 'Equipamentos de Locação', icon: Wrench, requiredModule: 'RENTAL' },
            { href: '/admin/companies', label: 'Empresas', icon: Building2 },
            { href: '/admin/customers', label: 'Clientes', icon: Users },
            { href: '/admin/vendors', label: 'Vendedores', icon: Briefcase },
            { href: '/admin/categories', label: 'Categorias', icon: Tags },
            { href: '/admin/product-types', label: 'Tipos de Item', icon: DraftingCompass },
        ]
    },
    {
        group: 'Financeiro',
        items: [
            { href: '/settings', label: 'Parâmetros de Custo', icon: Settings },
            { href: '/finance', label: 'Simulador (Precificação)', icon: Wrench },
        ]
    },
    {
        group: 'Comercial',
        items: [
            { href: '/pipeline', label: 'Pipeline de Vendas', icon: Filter },
            { href: '/pricing', label: 'Elaborar Proposta', icon: Calculator },
            { href: '/quotes', label: 'Gestão de Propostas', icon: FileText },
        ]
    },
    {
        group: 'Operacional',
        items: [
            { href: '/procurement', label: 'Compras/Importação', icon: Container }
        ]
    },
    {
        group: 'Administração',
        items: [
            { href: '/admin/users', label: 'Usuários', icon: Users },
            { href: '/admin/seed', label: 'Popular Dados (Seed)', icon: Database },
        ]
    },
    {
        group: 'Ajuda',
        items: [
            { href: '/help/registration', label: 'Guia de Cadastro', icon: BookUser },
            { href: '/help/pricing-calculation', label: 'Como os Custos São Calculados', icon: HelpCircle },
        ]
    }
];

// Mapeamento de rotas para módulos requeridos (para proteção de rotas)
export const ROUTE_MODULE_MAP: Record<string, RequiredModule> = {
    '/admin/rental-equipments': 'RENTAL',
    '/rentals': 'RENTAL',
};
