"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MouseEvent, ReactNode, useCallback } from "react";

// Local Button component with TypeScript types
interface ButtonProps {
    children: ReactNode;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    className?: string;
    variant?: 'default' | 'outline';
}

const Button = ({
    children,
    onClick,
    className = "",
    variant = "default"
}: ButtonProps) => {
    const baseClasses = "px-4 py-2 rounded-md font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variantClasses = variant === "outline"
        ? "bg-transparent border border-current"
        : "bg-[#09A08D] hover:bg-[#078275] text-white focus:ring-[#09A08D]";

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${variantClasses} ${className}`}>
            {children}
        </button>
    );
};

export default function NotFound() {
    const router = useRouter();

    const handleGoBack = useCallback(() => {
        router.back();
    }, [router]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900 px-4 py-8">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <div className="inline-block bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <Image
                            src="/images/logoColet.png"
                            alt="Colet Logo"
                            width={120}
                            height={40}
                            priority
                            onError={(e) => {
                                e.currentTarget.src = "/next.svg";
                            }}
                        />
                    </div>
                </div>

                <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
                    Página não encontrada
                </h2>

                <p className="text-gray-600 dark:text-gray-300 mb-8 text-sm sm:text-base">
                    A página que você está procurando não existe ou foi movida para outro endereço.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
                    <Button
                        onClick={handleGoBack}
                        className="!bg-[#09A08D] hover:!bg-[#078275] text-white px-6 w-full sm:w-auto"
                    >
                        Voltar
                    </Button>

                    <Link href="/dashboard" className="w-full sm:w-auto">
                        <Button
                            variant="outline"
                            className="border border-[#09A08D] text-[#09A08D] hover:bg-[#f0f9f8] dark:hover:bg-[#062e2b] px-6 w-full"
                        >
                            Dashboard
                        </Button>
                    </Link>
                </div>

                <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
                    © {new Date().getFullYear()} Colet Sistemas
                </div>
            </div>
        </div>
    );
}
