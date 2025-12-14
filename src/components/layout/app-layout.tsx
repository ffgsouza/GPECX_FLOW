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
  SidebarTrigger 
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calculator, Package, Tags, ClipboardList } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Calculadora de Venda', icon: Calculator },
    { href: '/quotes', label: 'Kingsine Quote Builder', icon: ClipboardList },
    { href: '/products', label: 'Produtos (Venda)', icon: Package },
    { href: '/categories', label: 'Categorias (Venda)', icon: Tags },
  ];

  return (
    <AppContextProvider>
      <SidebarProvider>
        <div className="md:flex">
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                <h1 className="text-xl font-bold font-headline text-primary">GPECX</h1>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
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
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-background/80 backdrop-blur-sm md:hidden">
              <SidebarTrigger />
              <div className="flex items-center gap-2 ml-4">
                 <h1 className="text-lg font-bold font-headline text-primary">GPECX</h1>
              </div>
            </header>
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AppContextProvider>
  );
}
