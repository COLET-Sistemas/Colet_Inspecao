"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    isEditing?: boolean;
    children: React.ReactNode;
    onSubmit?: (data: any) => Promise<void>;
    submitLabel?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

export function FormModal({
    isOpen,
    onClose,
    title,
    isEditing = false,
    children,
    onSubmit,
    submitLabel = isEditing ? "Salvar alterações" : "Criar",
    size = "md",
}: FormModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const modalSizes = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    };

    // Fechar modal ao pressionar Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // Manipular o click fora do modal
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    // Impedir scroll no background quando modal está aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    // Handler para submit do formulário
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            try {
                setIsSubmitting(true);
                const formData = new FormData(e.target as HTMLFormElement);
                const data = Object.fromEntries(formData.entries());
                await onSubmit(data);
                onClose();
            } catch (error) {
                console.error("Erro ao submeter formulário:", error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                >
                    <motion.div
                        ref={modalRef}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            duration: 0.2,
                        }}
                        className={cn(
                            "relative w-full rounded-lg bg-white shadow-xl",
                            modalSizes[size]
                        )}
                    >
                        {/* Modal header com título e indicador visual de criar/editar */}
                        <div className={cn(
                            "flex items-center justify-between rounded-t-lg p-4 border-b",
                            isEditing
                                ? "border-amber-200 bg-gradient-to-r from-amber-50 to-white"
                                : "border-teal-200 bg-gradient-to-r from-teal-50 to-white"
                        )}>
                            <div className="flex items-center space-x-3">
                                <div
                                    className={cn(
                                        "w-1.5 h-6 rounded-full",
                                        isEditing ? "bg-amber-400" : "bg-teal-500"
                                    )}
                                />
                                <h2 className="text-lg font-semibold text-gray-800">
                                    {title}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Fechar"
                                className="rounded-md p-1 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Corpo do modal com formulário */}
                        <form onSubmit={handleSubmit}>
                            <div className="p-6">
                                {children}
                            </div>

                            {/* Rodapé com ações */}
                            <div className="flex justify-end space-x-3 rounded-b-lg bg-gray-50 px-6 py-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </button>

                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={cn(
                                        "rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2",
                                        isEditing
                                            ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400/50"
                                            : "bg-[#09A08D] hover:bg-[#1ABC9E] focus:ring-[#09A08D]/50",
                                        isSubmitting && "opacity-70 cursor-not-allowed"
                                    )}
                                >
                                    {isSubmitting ? "Processando..." : submitLabel}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}