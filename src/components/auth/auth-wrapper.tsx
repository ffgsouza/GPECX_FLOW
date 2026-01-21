"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";

interface AuthWrapperProps {
    children: React.ReactNode;
}

const publicRoutes = ["/login"];

export function AuthWrapper({ children }: AuthWrapperProps) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const isPublicRoute = publicRoutes.includes(pathname);

    useEffect(() => {
        if (!loading) {
            // Redirect to login if not authenticated and trying to access protected route
            if (!user && !isPublicRoute) {
                router.push("/login");
            }
            // Redirect to dashboard if authenticated and trying to access login page
            if (user && isPublicRoute) {
                router.push("/dashboard");
            }
        }
    }, [user, loading, isPublicRoute, router, pathname]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-4 text-white font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    // Render login page without AppLayout
    if (isPublicRoute) {
        return <>{children}</>;
    }

    // Render authenticated pages with AppLayout
    if (user) {
        return <AppLayout>{children}</AppLayout>;
    }

    // Fallback (shouldn't reach here due to redirect)
    return null;
}
