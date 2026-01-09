"use client";

import { useEffect, useState } from 'react';
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
  TooltipTrigger,
  TooltipContent,
  sidebarMenuButtonVariants
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calculator, Package, Tags, Settings, Briefcase, DraftingCompass, Building2, ShoppingCart, BarChart3, Bot, Database, Folder, HelpCircle, BookUser, Users, FileText, Wrench, Filter, Container } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        { href: '/admin/rental-equipments', label: 'Equipamentos de Locação', icon: Wrench },
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
    if (pathname.includes('/proposal')) {
      return false;
    }
    return true;
  });

  if (pathname.includes('/admin/quotes')) {
    return (
      <AppContextProvider>
        {children}
      </AppContextProvider>
    );
  }

  if (!isMounted) {
    return (
      <AppContextProvider>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </AppContextProvider>
    );
  }

  return (
    <AppContextProvider>
      <SidebarProvider>
        <div className="md:flex">
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <div className="flex items-center gap-2 p-3">
                <div className="flex flex-col leading-none">
                  <h1 className="text-xl font-black tracking-tighter text-white">
                    GPECX <span className="text-[#10B981]">FLOW</span>
                  </h1>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Da proposta à entrega</span>
                </div>
                <SidebarTrigger className="ml-auto text-white/70 hover:text-white" />
              </div>
            </SidebarHeader>
            <SidebarContent>
              {menuItems.map(group => (
                <SidebarGroup key={group.group}>
                  <SidebarGroupLabel className="text-white/50 uppercase tracking-wider text-[10px]">{group.group}</SidebarGroupLabel>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <Tooltip>
                          <TooltipTrigger>
                            <SidebarMenuButton
                              asChild
                              isActive={pathname.startsWith(item.href)}
                              className="data-[active=true]:bg-[#10B981] data-[active=true]:text-white hover:bg-slate-800 hover:text-white text-slate-300"
                            >
                              <Link href={item.href}>
                                <item.icon />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="center" className="bg-[#061629] text-white border-slate-700">
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
            <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-[#061629] text-white md:hidden shadow-md">
              <SidebarTrigger className="text-white" />
              <div className="flex items-center gap-2 ml-4">
                <h1 className="text-lg font-black tracking-tighter text-white">
                  EXS <span className="text-[#10B981]">SOLUTIONS</span>
                </h1>
              </div>
            </header>
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AppContextProvider>
  );
}
