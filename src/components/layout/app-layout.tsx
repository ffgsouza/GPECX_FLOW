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
import { Calculator, Package, Settings } from 'lucide-react';

function PriceWiseLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className="h-8 w-8 text-primary"
    >
      <rect width="256" height="256" fill="none" />
      <path
        d="M160,128a32,32,0,1,1-32-32,32,32,0,0,1,32,32Z"
        opacity="0.2"
      />
      <path
        d="M44.4,188.4A103.2,103.2,0,0,1,32,128,104,104,0,0,1,167.3,36.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <path
        d="M211.6,67.6A103.2,103.2,0,0,1,224,128,104,104,0,0,1,88.7,219.3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <circle
        cx="128"
        cy="128"
        r="32"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <line
        x1="128"
        y1="48"
        x2="128"
        y2="24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <line
        x1="128"
        y1="232"
        x2="128"
        y2="208"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <line
        x1="208"
        y1="128"
        x2="232"
        y2="128"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <line
        x1="24"
        y1="128"
        x2="48"
        y2="128"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
    </svg>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Calculator', icon: Calculator },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <AppContextProvider>
      <SidebarProvider>
        <div className="md:flex">
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                <PriceWiseLogo />
                <h1 className="text-xl font-bold font-headline">PriceWise</h1>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => (
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
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-background/80 backdrop-blur-sm md:hidden">
              <SidebarTrigger />
              <div className="flex items-center gap-2 ml-4">
                 <PriceWiseLogo />
                 <h1 className="text-lg font-bold font-headline">PriceWise</h1>
              </div>
            </header>
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AppContextProvider>
  );
}
