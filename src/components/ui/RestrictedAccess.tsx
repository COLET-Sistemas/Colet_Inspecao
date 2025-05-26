"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { AlertState } from "@/types/cadastros/posto";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface RestrictedAccessProps {
    hasPermission: boolean;
    isLoading: boolean;
    customMessage?: string;
    customTitle?: string;
    redirectTo?: string;
    redirectDelay?: number;
}

export function RestrictedAccess({
    hasPermission,
    isLoading,
    customMessage,
    customTitle,
    redirectTo = "/dashboard",
    redirectDelay = 2000,
}: RestrictedAccessProps) {
    const router = useRouter();

    // Alert state for displaying messages
    const [alert, setAlert] = useState<AlertState>({ message: null, type: "error" });

    // Clear alert message
    const clearAlert = useCallback(() => {
        setAlert({ message: null, type: "success" });
    }, []);

    // Handle redirect when user doesn't have permission
    useEffect(() => {
        if (!isLoading && !hasPermission) {
            setAlert({
                message: "Você não tem permissão para acessar esta página. Redirecionando...",
                type: "error"
            });

            // Redirect after showing the message for the specified delay
            const timer = setTimeout(() => {
                router.push(redirectTo);
            }, redirectDelay);

            return () => clearTimeout(timer);
        }
    }, [hasPermission, isLoading, router, redirectTo, redirectDelay]);

    // If auth is still loading or user has permission, don't render the restricted access screen
    if (isLoading || hasPermission) {
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
            <AlertMessage
                message={alert.message}
                type={alert.type}
                onDismiss={clearAlert}
                autoDismiss={true}
                dismissDuration={5000}
            />
            <div className="text-center">
                <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {customTitle || "Acesso Restrito"}
                </h2>
                <p className="text-gray-600 mb-4">
                    {customMessage || "Esta página está disponível apenas para usuários com permissão de Gestor."}
                </p>
                <p className="text-gray-500 text-sm">Redirecionando para o Dashboard...</p>
            </div>
        </div>
    );
}
