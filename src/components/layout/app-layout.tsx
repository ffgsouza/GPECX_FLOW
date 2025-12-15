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
  SidebarGroupLabel
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calculator, Package, Tags, Settings, Briefcase, DraftingCompass, Building2, ShoppingCart, BarChart3, Bot } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    {
        group: 'Insights',
        items: [
            { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
        ]
    },
    {
      group: 'Cadastros Gerais',
      items: [
        { href: '/admin/categories', label: 'Categorias', icon: Tags },
        { href: '/admin/product-types', label: 'Tipos de Item', icon: DraftingCompass },
      ]
    },
    {
      group: 'Catálogo',
      items: [
        { href: '/catalog/products', label: 'Produtos e Serviços', icon: Package },
        { href: '/catalog/accessories', label: 'Acessórios', icon: Briefcase },
      ]
    },
    {
      group: 'Financeiro',
      items: [
        { href: '/settings', label: 'Parâmetros de Custo', icon: Settings },
        { href: '/pricing', label: 'Formação de Preço', icon: Calculator },
      ]
    },
    {
      group: 'Comercial',
      items: [
        { href: '/quotes', label: 'Gerador de Propostas', icon: Bot },
      ]
    }
  ]

  return (
    <AppContextProvider>
      <SidebarProvider>
        <div className="md:flex">
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                <h1 className="text-xl font-bold font-headline text-primary">ExS Com</h1>
              </div>
            </SidebarHeader>
            <SidebarContent>
              {menuItems.map(group => (
                <SidebarGroup key={group.group}>
                  <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href}
                          tooltip={{ children: item.label, side:'right', align: 'center' }}
                        >
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
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
                 <h1 className="text-lg font-bold font-headline text-primary">ExS Com</h1>
              </div>
            </header>
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AppContextProvider>
  );
}
