'use client';

import { fetchWithAuth } from '@/services/api/authInterceptor';
import { AnimatePresence, motion } from 'framer-motion';
import { Package, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface InspecaoData {
    tipo_inspecao: number;
    codigo_pessoa: string;
    numero_ordem: number;
    referencia: string;
    roteiro: string;
    processo: number;
    codigo_posto: string;
    origem: string;
    operacao: number;
    observacao: null | string;
    qtde_produzida: number;
    qtde_inspecionada: number;
    ficha_origem: null | number;
}

interface QuantidadeInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (quantidade: number) => void;
    title?: string;
    onCancel?: () => void;
    // Dados necessários para o POST
    tipoInspecao?: number;
    numeroOrdem?: number;
    referencia?: string;
    roteiro?: string;
    processo?: number;
    codigoPostо?: string;
    operacao?: number;
}

const QuantidadeInputModal: React.FC<QuantidadeInputModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Quantidade de Não Conformidade",
    onCancel,
    tipoInspecao = 4, // Default tipo_inspecao
    numeroOrdem,
    referencia,
    roteiro,
    processo,
    codigoPostо,
    operacao
}) => {
    const [quantidade, setQuantidade] = useState<string>(''); // Produzida
    const [quantidadeInspecionada, setQuantidadeInspecionada] = useState<string>(''); // Novo estado
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Refs para elementos focáveis
    const inputRef = useRef<HTMLInputElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Focar no input quando o modal abrir
    useEffect(() => {
        if (isOpen && inputRef.current) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100); // Pequeno delay para garantir que a animação termine

            return () => clearTimeout(timer);
        }
    }, [isOpen]);    // Define handleClose before using it in useEffect
    const handleClose = useCallback(() => {
        setError('');
        setQuantidade('');
        setQuantidadeInspecionada('');
        onClose();
        if (onCancel) {
            onCancel();
        }
    }, [onClose, onCancel]);

    // Trap de foco dentro do modal
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
                return;
            }

            if (e.key === 'Tab') {
                const focusableElements = [
                    inputRef.current,
                    cancelButtonRef.current,
                    confirmButtonRef.current,
                    closeButtonRef.current
                ].filter(Boolean) as HTMLElement[];

                const currentIndex = focusableElements.findIndex(
                    element => element === document.activeElement
                );

                if (e.shiftKey) {
                    e.preventDefault();
                    const previousIndex = currentIndex <= 0
                        ? focusableElements.length - 1
                        : currentIndex - 1;
                    focusableElements[previousIndex]?.focus();
                } else {

                    e.preventDefault();
                    const nextIndex = currentIndex >= focusableElements.length - 1
                        ? 0
                        : currentIndex + 1;
                    focusableElements[nextIndex]?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose]); // Quando quantidade produzida muda, copiar para inspecionada se inspecionada está vazia ou igual ao valor anterior
    useEffect(() => {
        if (
            quantidade !== '' &&
            (quantidadeInspecionada === '' || quantidadeInspecionada === quantidade)
        ) {
            setQuantidadeInspecionada(quantidade);
        }
    }, [quantidade, quantidadeInspecionada]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const quantidadeNumber = Number(quantidade);
        const quantidadeInspecionadaNumber = Number(quantidadeInspecionada);
        if (!quantidade || quantidadeNumber <= 0) {
            setError('A quantidade produzida deve ser maior que zero');
            return;
        }
        if (!quantidadeInspecionada || quantidadeInspecionadaNumber <= 0) {
            setError('A quantidade inspecionada deve ser maior que zero');
            return;
        }
        try {
            setIsLoading(true);

            // Obter o código da pessoa do localStorage
            let codigoPessoa = localStorage.getItem('codigo_pessoa');

            // Se não encontrar o código no código_pessoa, buscar no objeto colaborador
            if (!codigoPessoa) {
                try {
                    const colaboradorData = localStorage.getItem('colaborador');
                    if (colaboradorData) {
                        const colaborador = JSON.parse(colaboradorData);
                        codigoPessoa = colaborador.codigo_pessoa;
                    }
                } catch (e) {
                    console.error('Erro ao buscar código do colaborador:', e);
                }
            }

            // Se ainda não encontrou, buscar em userData
            if (!codigoPessoa) {
                try {
                    const userDataStr = localStorage.getItem('userData');
                    if (userDataStr) {
                        const userData = JSON.parse(userDataStr);
                        codigoPessoa = userData.codigo_pessoa;
                    }
                } catch (e) {
                    console.error('Erro ao buscar código do usuário em userData:', e);
                }
            }

            if (!codigoPessoa) {
                setError('Usuário não está logado corretamente');
                setIsLoading(false);
                return;
            }

            // Obter a URL da API do localStorage
            const apiUrl = localStorage.getItem('apiUrl');
            if (!apiUrl) {
                setError('URL da API não está configurada');
                setIsLoading(false);
                return;
            }

            // Preparar os dados para o POST
            const inspecaoData: InspecaoData = {
                tipo_inspecao: tipoInspecao,
                codigo_pessoa: codigoPessoa,
                numero_ordem: numeroOrdem ?? 0,
                referencia: referencia ?? '',
                roteiro: roteiro ?? '',
                processo: processo ?? 0,
                codigo_posto: codigoPostо ?? '',
                origem: 'Não Conformidade',
                operacao: operacao ?? 0,
                observacao: null,
                qtde_produzida: quantidadeNumber,
                qtde_inspecionada: quantidadeInspecionadaNumber, // Novo campo
                ficha_origem: null
            };

            // Enviar o POST para o endpoint
            const response = await fetchWithAuth(`${apiUrl}/inspecao/fichas_inspecao`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(inspecaoData)
            });

            setIsLoading(false);

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Erro HTTP: ${response.status}`);
            }

            // Se tudo deu certo, executar o onConfirm e fechar o modal
            setError('');
            onConfirm(quantidadeNumber);
            setQuantidade('');
            setQuantidadeInspecionada('');
        } catch (error) {
            console.error('Erro ao enviar dados da inspeção:', error);
            setError(error instanceof Error ? error.message : 'Erro ao registrar a inspeção');
        }
    }; const handleCancel = useCallback(() => {
        setError('');
        setQuantidade('');
        setQuantidadeInspecionada('');
        onClose();
        if (onCancel) {
            onCancel();
        }
    }, [onClose, onCancel]); return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto">
                    <motion.div
                        key="quantidade-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 w-full h-full bg-slate-900/60 backdrop-blur-lg backdrop-saturate-150"
                        onClick={handleClose}
                    />

                    <motion.div
                        key="quantidade-modal-content"
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                                {title}
                            </h2>
                            <button
                                ref={closeButtonRef}
                                onClick={handleClose}
                                className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C] focus:ring-offset-2"
                                aria-label="Fechar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-600">
                                As quantidades desde a última inspeção:
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Package size={18} />
                                    </div>
                                    <input
                                        ref={inputRef}
                                        type="number"
                                        id="quantidade"
                                        placeholder="Quantidade produzida"
                                        value={quantidade}
                                        onChange={(e) => setQuantidade(e.target.value)}
                                        min="1"
                                        step="1"
                                        className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm placeholder-gray-400 transition-colors focus:border-[#1ABC9C] focus:bg-white focus:outline-none"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Package size={18} />
                                    </div>
                                    <input
                                        type="number"
                                        id="quantidade-inspecionada"
                                        placeholder="Quantidade inspecionada"
                                        value={quantidadeInspecionada}
                                        onChange={(e) => setQuantidadeInspecionada(e.target.value)}
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
                                        ref={cancelButtonRef}
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex-1 rounded-lg px-4 py-3 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                                    >
                                        Cancelar
                                    </button>                                    <button
                                        ref={confirmButtonRef}
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 rounded-lg px-4 py-3 font-medium bg-[#1ABC9C] text-white hover:bg-[#16A085] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1ABC9C] focus:ring-offset-2 disabled:opacity-70"
                                    >
                                        {isLoading ? 'Enviando...' : 'Confirmar'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default QuantidadeInputModal;
