import { motion } from "framer-motion";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isDeleting?: boolean;
    itemName?: string; // Nome do item a ser excluído para destacar
}

export function ConfirmDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isDeleting = false,
    itemName,
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
            if (event.key === "Escape" && isOpen && !isDeleting) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleEsc);

        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [isOpen, onClose, isDeleting]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 w-full h-full bg-slate-900/60 backdrop-blur-lg backdrop-saturate-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <motion.div
                className="absolute inset-0"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={overlayVariants}
                onClick={!isDeleting ? onClose : undefined}
            />

            <motion.div
                className="relative w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
                role="alertdialog"
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={modalVariants}
            >
                {/* Cabeçalho */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                            <div className="p-2 rounded-full bg-red-50">
                                <Trash2 className="h-5 w-5 text-red-500" />
                            </div>
                        </div>
                        <h2
                            id="modal-title"
                            className="text-lg font-medium text-gray-900"
                        >
                            {title}
                        </h2>
                    </div>
                    {!isDeleting && (
                        <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md"
                            onClick={onClose}
                            aria-label="Fechar"
                            tabIndex={0}
                        >
                            <X size={20} />
                        </button>
                    )}
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
                                className="text-sm text-gray-700"
                            >
                                {message}
                            </p>

                            {itemName && (
                                <p className="mt-2 font-medium text-gray-900 text-sm">
                                    &quot;{itemName}&quot;
                                </p>
                            )}

                            <p className="mt-3 text-xs text-gray-500">
                                Esta ação não pode ser desfeita.
                            </p>
                        </div>
                    </div>

                    {/* Estado de processamento */}
                    {isDeleting && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-100">
                            <div className="flex items-center space-x-3">
                                <Loader2 className="h-5 w-5 text-red-500 animate-spin" />
                                <p className="text-sm text-gray-600">
                                    Excluindo item, por favor aguarde...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Botões */}
                    <div className="mt-6 flex justify-end space-x-3">
                        {!isDeleting && (
                            <button
                                type="button"
                                ref={cancelButtonRef}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                                onClick={onClose}
                                tabIndex={0}
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-150 flex items-center ${isDeleting
                                ? "bg-red-300 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700"
                                }`}
                            onClick={!isDeleting ? onConfirm : undefined}
                            disabled={isDeleting}
                            aria-busy={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-1.5" />
                                    Confirmar Exclusão
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}