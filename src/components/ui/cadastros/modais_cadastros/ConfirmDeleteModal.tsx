import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isDeleting?: boolean;
}

export function ConfirmDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isDeleting = false,
}: ConfirmDeleteModalProps) {
    // Ref para o botão de cancelar para foco automático
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    // Animar entrada/saída
    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    };

    const modalVariants = {
        hidden: { y: 50, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 500 } },
    };

    // Gerenciar o foco quando o modal abre
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                cancelButtonRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Fechar no ESC
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleEsc);

        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <motion.div
                className="absolute inset-0 bg-black/50"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={overlayVariants}
                onClick={onClose}
            />

            <motion.div
                className="relative w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden"
                role="alertdialog"
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={modalVariants}
            >
                {/* Cabeçalho */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2
                        id="modal-title"
                        className="text-lg font-medium text-gray-900"
                    >
                        {title}
                    </h2>
                    <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onClick={onClose}
                        aria-label="Fechar"
                        tabIndex={0}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Corpo */}
                <div className="p-6">
                    <div className="flex items-start mb-4">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <p
                                id="modal-description"
                                className="text-sm text-gray-500"
                            >
                                {message}
                            </p>
                        </div>
                    </div>

                    {/* Botões */}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            ref={cancelButtonRef}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={onClose}
                            tabIndex={0}
                            disabled={isDeleting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${isDeleting
                                    ? "bg-red-300 cursor-not-allowed"
                                    : "bg-red-600 hover:bg-red-700"
                                }`}
                            onClick={onConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Excluindo..." : "Excluir"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}