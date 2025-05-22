import AppLayout from "@/components/layout/AppLayout";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "../hooks/useAuth";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inspeção Colet",
  description: "Sistema de Inspeção Colet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
        {process.env.NODE_ENV === 'development' && (
          <Script src="/test-session-expiration.js" />
        )}
      </body>
    </html>
  );
}
