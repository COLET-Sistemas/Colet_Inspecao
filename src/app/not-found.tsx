"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MouseEvent, ReactNode, useCallback } from "react";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900 px-4 py-6 overflow-auto">
            <div className="max-w-md w-full text-center px-4 sm:px-6 my-8 sm:my-0">
                <div className="mb-6 sm:mb-8">
                    <div className="inline-block bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow-sm">
                        <Image
                            src="/images/logoColet.png"
                            alt="Colet Logo"
                            width={100}
                            height={35}
                            className="w-[90px] h-auto sm:w-[120px]"
                            priority
                            onError={(e) => {
                                e.currentTarget.src = "/next.svg";
                            }}
                        />
                    </div>
                </div>

                <h1 className="text-4xl xs:text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">404</h1>
                <h2 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6">
                    Página não encontrada
                </h2>

                <p className="text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 text-xs xs:text-sm sm:text-base max-w-xs mx-auto">
                    A página que você está procurando não existe ou foi movida para outro endereço.
                </p>

                <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 justify-center w-full">
                    <Button
                        onClick={handleGoBack}
                        className="!bg-[#09A08D] hover:!bg-[#078275] text-white px-4 sm:px-6 text-xs sm:text-sm w-full xs:w-auto"
                    >
                        Voltar
                    </Button>

                    <Link href="/dashboard" className="w-full xs:w-auto">
                        <Button
                            variant="outline"
                            className="border border-[#09A08D] text-[#09A08D] hover:bg-[#f0f9f8] dark:hover:bg-[#062e2b] px-4 sm:px-6 text-xs sm:text-sm w-full"
                        >
                            Dashboard
                        </Button>
                    </Link>
                </div>

                <div className="mt-8 sm:mt-12 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    © {new Date().getFullYear()} Colet Sistemas
                </div>
            </div>
        </div>
    );
}
