import { motion } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { LoadingSpinner } from "./Loading";

interface DataListContainerProps {
    isLoading: boolean;
    isEmpty: boolean;
    emptyState: ReactNode;
    children: ReactNode;
    totalItems: number;
    totalFilteredItems: number;
    activeFilters: number;
    onResetFilters: () => void;
}

export function DataListContainer({
    isLoading,
    isEmpty,
    emptyState,
    children,
    totalItems,
    totalFilteredItems,
    activeFilters,
    onResetFilters,
}: DataListContainerProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-lg shadow overflow-hidden"
        >
            {isLoading ? (
                <div className="flex items-center justify-center min-h-[300px] w-full">
                    <LoadingSpinner
                        size="medium"
                        text="Carregando dados..."
                        color="primary"
                    />
                </div>
            ) : isEmpty ? (
                emptyState
            ) : (
                <>
                    {children}

                    {/* Statistics and filters summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="border-t border-gray-200 px-4 py-3 bg-gray-50 text-sm text-gray-500"
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <p>
                                Mostrando <span className="font-medium text-gray-700">{totalFilteredItems}</span> de{" "}
                                <span className="font-medium text-gray-700">{totalItems}</span> itens
                            </p>
                            {activeFilters > 0 && (
                                <button
                                    onClick={onResetFilters}
                                    className="text-[#1ABC9C] hover:text-[#16A085] text-sm font-medium flex items-center transition-colors"
                                >
                                    <X size={14} className="mr-1" />
                                    Limpar {activeFilters} filtro{activeFilters > 1 ? 's' : ''}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}
