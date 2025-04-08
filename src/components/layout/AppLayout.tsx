"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { LoadingSpinner } from "../ui/Loading";
import Navbar from "./Navbar";

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const pathname = usePathname();
    const { isLoading, isAuthenticated } = useAuth();

    // Don't show the navbar on the login page
    const isLoginPage = pathname === '/login';

    // Show loading spinner while auth state is being determined
    if (isLoading) {
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
