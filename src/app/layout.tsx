import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

export const metadata: Metadata = {
  title: 'GPECx SGC',
  description: 'Sistema automatizado de cálculo de preço de venda.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <style>
          {`
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          `}
        </style>
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <AuthWrapper>{children}</AuthWrapper>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
