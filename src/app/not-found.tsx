"use client";

//import { Button } from "@/components/ui/Button";
//import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function NotFound() {
    const router = useRouter();


    const handleGoBack = useCallback(() => {
        router.back();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-4 py-8">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <div className="inline-block bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        {/* //  <Logo className="scale-75" /> */}
                    </div>
                </div>

                <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
                    Página não encontrada
                </h2>

                <p className="text-gray-600 dark:text-gray-300 mb-8 text-base">
                    A página que você está procurando não existe ou foi movida para outro endereço.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {/* <Button
                        onClick={handleGoBack}
                        className="!bg-[#09A08D] hover:!bg-[#078275] text-white px-6"
                    >
                        Voltar
                    </Button> */}

                    <Link href="/dashboard">
                        {/* <Button
                            variant="outline"
                            className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 px-6"
                        >
                            Dashboard
                        </Button> */}
                    </Link>
                </div>

                <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
                    © {new Date().getFullYear()} Colet Sistemas
                </div>
            </div>
        </div>
    );
}
