import AppLayout from "@/components/layout/AppLayout";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
      <body className={inter.className}>
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
