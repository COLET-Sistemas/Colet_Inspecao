'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Package, X } from 'lucide-react';
import React, { useState } from 'react';

interface QuantidadeInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (quantidade: number) => void;
    title?: string;
}

const QuantidadeInputModal: React.FC<QuantidadeInputModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Quantidade de Não Conformidade"
}) => {
    const [quantidade, setQuantidade] = useState<number>(1);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!quantidade || quantidade <= 0) {
            setError('A quantidade deve ser maior que zero');
            return;
        }

        setError('');
        onConfirm(quantidade);
        setQuantidade(1);
    };

    const handleClose = () => {
        setError('');
        setQuantidade(1);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 w-full h-full bg-slate-900/60 backdrop-blur-lg backdrop-saturate-150"
                        onClick={handleClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {title}
                            </h2>
                            <button
                                onClick={handleClose}
                                className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                aria-label="Fechar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-600">
                                A quantidade produzida desde a última inspeção ?
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Package size={18} />
                                    </div>
                                    <input
                                        type="number"
                                        id="quantidade"
                                        placeholder="Quantidade"
                                        value={quantidade}
                                        onChange={(e) => setQuantidade(Number(e.target.value))}
                                        min="1"
                                        step="1"
                                        className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm placeholder-gray-400 transition-colors focus:border-[#1ABC9C] focus:bg-white focus:outline-none"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="rounded-lg bg-red-50 p-3">
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}

                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 rounded-lg px-4 py-3 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 rounded-lg px-4 py-3 font-medium bg-[#1ABC9C] text-white hover:bg-[#16A085] transition-colors"
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        </form>                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default QuantidadeInputModal;
