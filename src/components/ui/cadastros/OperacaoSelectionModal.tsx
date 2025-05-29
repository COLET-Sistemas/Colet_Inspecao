'use client';

import { OperacaoProcesso } from '@/types/cadastros/processo';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, X } from 'lucide-react';

interface OperacaoSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    operacoes: OperacaoProcesso[];
    onSelectOperacao: (operacao: OperacaoProcesso) => void;
}

export function OperacaoSelectionModal({
    isOpen,
    onClose,
    operacoes,
    onSelectOperacao
}: OperacaoSelectionModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 w-full h-full bg-slate-900/60 backdrop-blur-lg backdrop-saturate-150">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md mx-auto overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Selecionar Operação
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Escolha a operação para cadastrar especificação
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-2">
                            {operacoes.map((operacao, index) => (
                                <motion.button
                                    key={operacao.id_operacao}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => onSelectOperacao(operacao)}
                                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium">
                                                {operacao.operacao}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                                                    {operacao.descricao_operacao}
                                                </p>
                                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Frequência: {operacao.frequencia_minutos} min
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                                {operacao.especificacoes_inspecao?.length || 0} especif.
                                            </span>
                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
