"use client";

import { AppContextProvider } from '@/context/app-context';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarInset, 
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  sidebarMenuButtonVariants
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calculator, Package, Tags, Settings, Briefcase, DraftingCompass, Building2, ShoppingCart, BarChart3, Bot, Database, Folder, HelpCircle, BookUser, Users, FileText, Wrench, Filter, Container } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
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
        { href: '/admin/companies', label: 'Empresas', icon: Building2 },
        { href: '/admin/customers', label: 'Clientes', icon: Users },
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
  ].filter(group => {
    // Esconder o grupo "Ajuda" se a rota atual for a do gerador de propostas
    if (pathname.includes('/proposal')) {
      return false;
    }
    return true;
  });

  if (pathname.includes('/proposal')) {
    return (
      <AppContextProvider>
        {children}
      </AppContextProvider>
    );
  }

  return (
    <AppContextProvider>
      <SidebarProvider>
        <div className="md:flex">
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                <h1 className="text-xl font-bold font-headline text-primary">GPECx SGC</h1>
                 <SidebarTrigger className="ml-auto" />
              </div>
            </SidebarHeader>
            <SidebarContent>
              {menuItems.map(group => (
                <SidebarGroup key={group.group}>
                  <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                         <Tooltip>
                          <TooltipTrigger asChild>
                              <Link
                                href={item.href}
                                className={cn(
                                  sidebarMenuButtonVariants({ variant: 'default', size: 'default' }),
                                  {
                                    'bg-sidebar-accent text-sidebar-accent-foreground': pathname.startsWith(item.href)
                                  }
                                )}
                              >
                                <item.icon />
                                <span>{item.label}</span>
                              </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="center">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-background/80 backdrop-blur-sm md:hidden">
              <SidebarTrigger />
              <div className="flex items-center gap-2 ml-4">
                 <h1 className="text-lg font-bold font-headline text-primary">GPECx SGC</h1>
              </div>
            </header>
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AppContextProvider>
  );
}
