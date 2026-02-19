'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (user) {
                // Se usuário está logado, redireciona para dashboard
                router.push('/dashboard');
            } else {
                // Se não está logado, redireciona para login
                router.push('/login');
            }
        }
    }, [user, loading, router]);

    // Página em branco enquanto redireciona
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">GPECx SGC</h2>
                <p className="text-muted-foreground">Carregando...</p>
            </div>
        </div>
    );
}
