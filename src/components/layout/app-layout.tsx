"use client";

import { useEffect, useState } from 'react';
import { AppContextProvider } from '@/context/app-context';
import { WorkspaceProvider, useWorkspace } from '@/context/workspace-context';
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
  SidebarFooter,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { SIDEBAR_CONFIG } from '@/lib/sidebar-config';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { useWorkspaceGuard } from '@/hooks/use-workspace-guard';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../ui/resizable';
import { WorkspaceWelcome } from '@/components/workspace-welcome';
import { WorkspaceWelcomeProvider, useWorkspaceWelcome } from '@/context/workspace-welcome-context';

function AppSidebar() {
  const pathname = usePathname();
  const { currentWorkspace, canAccessModule } = useWorkspace();
  const { user, signOut } = useAuth();
  const { isNavigationBlocked } = useWorkspaceWelcome();

  // Usar o guardião de rotas
  useWorkspaceGuard();

  // Filtrar menu baseado nos módulos do workspace
  const filteredMenu = SIDEBAR_CONFIG.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.requiredModule) return true;
      return canAccessModule(item.requiredModule);
    })
  })).filter(group => group.items.length > 0);

  // Extrair iniciais do nome do usuário
  const getUserInitials = (): string => {
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = (): string => {
    return user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex flex-col gap-3 p-3">
          {/* Título do Sistema */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
              <h1 className="text-xl font-black tracking-tighter text-white">
                GPECX <span style={{ color: currentWorkspace.color }}>FLOW</span>
              </h1>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Da proposta à entrega
              </span>
            </div>
            <SidebarTrigger className="text-white/70 hover:text-white" />
          </div>

          {/* Seletor de Empresa */}
          <div className="group-data-[collapsible=icon]:hidden">
            <WorkspaceSwitcher />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {filteredMenu.map(group => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="text-white/50 uppercase tracking-wider text-[10px]">
              {group.group}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        asChild={!isNavigationBlocked}
                        isActive={pathname.startsWith(item.href)}
                        disabled={isNavigationBlocked}
                        className={`data-[active=true]:bg-[#10B981] data-[active=true]:text-white hover:bg-slate-800 hover:text-white text-slate-300 ${isNavigationBlocked ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''}`}
                      >
                        {isNavigationBlocked ? (
                          <span className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </span>
                        ) : (
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        )}
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" className="bg-[#061629] text-white border-slate-700">
                      {isNavigationBlocked ? 'Acesse o workspace primeiro' : item.label}
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer com informações do usuário */}
      <SidebarFooter>
        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback
                className="text-xs font-bold text-white"
                style={{ backgroundColor: currentWorkspace.color }}
              >
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium text-white truncate">{getUserDisplayName()}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-slate-400 hover:text-white hover:bg-slate-800 shrink-0 group-data-[collapsible=icon]:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Páginas de proposta sem sidebar
  if (pathname.includes('/admin/quotes')) {
    return <>{children}</>;
  }

  if (!isMounted) {
    return <main className="p-4 sm:p-6 lg:p-8">{children}</main>;
  }

  return (
    <WorkspaceWelcomeProvider>
      <SidebarProvider>
        <div className="md:flex w-full min-h-screen">
          <AppSidebar />
          <SidebarInset className="flex-1">
            {/* Header Mobile */}
            <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-[#061629] text-white md:hidden shadow-md">
              <SidebarTrigger className="text-white" />
              <div className="flex items-center gap-2 ml-4">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-[10px]"
                  style={{ backgroundColor: currentWorkspace.color }}
                >
                  {currentWorkspace.shortName.slice(0, 2)}
                </div>
                <h1 className="text-lg font-black tracking-tighter text-white">
                  {currentWorkspace.shortName} <span style={{ color: currentWorkspace.color }}>FLOW</span>
                </h1>
              </div>
            </header>
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>

            {/* Tela de Boas-Vindas ao Workspace */}
            <WorkspaceWelcome />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </WorkspaceWelcomeProvider>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Esconder menu em páginas de proposta
  const menuItems = SIDEBAR_CONFIG.filter(group => {
    if (pathname.includes('/proposal')) {
      return false;
    }
    return true;
  });

  return (
    <WorkspaceProvider>
      <AppContextProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
      </AppContextProvider>
    </WorkspaceProvider>
  );
}
