"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "../ui/Loading";
import Navbar from "./Navbar";

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const pathname = usePathname();
    const { isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    const isLoginPage = pathname === '/login';

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !isLoginPage) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, isLoginPage, router]);

    if (isLoading && !isLoginPage) {
        return <LoadingSpinner fullScreen size="medium" />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {!isLoginPage && isAuthenticated && <Navbar />}
            <main className={!isLoginPage && isAuthenticated ? "pt-16 pb-4 px-4 sm:px-6 lg:px-10" : ""}>
                {children}
            </main>
        </div>
    );
}
