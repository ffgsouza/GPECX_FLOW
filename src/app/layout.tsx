import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { RecaptchaLegal } from '@/components/auth/recaptcha-legal';

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
      <body className="font-body antialiased" suppressHydrationWarning>
        <AuthProvider>
          <AuthWrapper>{children}</AuthWrapper>
          <Toaster />
          <RecaptchaLegal />
          <div className="fixed bottom-1 right-1 bg-blue-600 text-white text-[12px] px-2 py-1 rounded z-[9999] pointer-events-none font-bold">
            DEBUG: Fix.V2.Nuclear
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
