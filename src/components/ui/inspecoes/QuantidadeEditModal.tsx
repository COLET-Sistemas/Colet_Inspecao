import { fetchWithAuth } from '@/services/api/authInterceptor';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckSquare, Package, RefreshCw, X } from 'lucide-react';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

interface QuantidadeEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (qtdeProduzida: number | null, qtdeInspecionada: number | null, message: string) => void;
    onError: (message: string) => void;
    initialQtdeProduzida: number | null;
    initialQtdeInspecionada: number | null;
    fichaId: number | string;
    title?: string;
}

const QuantidadeEditModal: FC<QuantidadeEditModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    onError,
    initialQtdeProduzida,
    initialQtdeInspecionada,
    fichaId,
    title = "Editar Quantidades"
}) => {
    const [tempQtdeProduzida, setTempQtdeProduzida] = useState<string>(initialQtdeProduzida?.toString() || '');
    const [tempQtdeInspecionada, setTempQtdeInspecionada] = useState<string>(initialQtdeInspecionada?.toString() || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const inputProduzidaRef = useRef<HTMLInputElement>(null);
    const inputInspecionadaRef = useRef<HTMLInputElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (isOpen) {
            setTempQtdeProduzida(initialQtdeProduzida?.toString() || '');
            setTempQtdeInspecionada(initialQtdeInspecionada?.toString() || '');
            setError('');

            const timer = setTimeout(() => {
                if (inputInspecionadaRef.current) {
                    inputInspecionadaRef.current.focus();
                    inputInspecionadaRef.current.select();
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [isOpen, initialQtdeProduzida, initialQtdeInspecionada]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            if (e.key === 'Tab') {
                const focusableElements = [
                    inputProduzidaRef.current,
                    inputInspecionadaRef.current,
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
    }, [isOpen, onClose]);

    const handleClose = useCallback(() => {
        setError('');
        setTempQtdeProduzida('');
        setTempQtdeInspecionada('');
        onClose();
    }, [onClose]);

    const handleQuantitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const quantidadeNumber = Number(tempQtdeProduzida);
        const quantidadeInspecionadaNumber = Number(tempQtdeInspecionada);

        if (!tempQtdeProduzida || quantidadeNumber <= 0) {
            setError('A quantidade produzida deve ser maior que zero');
            onError('A quantidade produzida deve ser maior que zero');
            return;
        }

        if (!tempQtdeInspecionada || quantidadeInspecionadaNumber <= 0) {
            setError('A quantidade inspecionada deve ser maior que zero');
            onError('A quantidade inspecionada deve ser maior que zero');
            return;
        }

        if (!fichaId) {
            setError("ID da ficha de inspeção não encontrado");
            onError("ID da ficha de inspeção não encontrado");
            return;
        }

        try {
            setIsSaving(true);

            let codigoPessoa = localStorage.getItem('codigo_pessoa');

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
                onError('Usuário não está logado corretamente');
                return;
            }

            const apiUrl = localStorage.getItem('apiUrl');
            if (!apiUrl) {
                setError('URL da API não está configurada');
                onError('URL da API não está configurada');
                return;
            }

            const idFichaInspecao = typeof fichaId === 'string' ? parseInt(fichaId) : fichaId;
            const requestData = {
                id_ficha_inspecao: idFichaInspecao,
                codigo_pessoa: codigoPessoa,
                qtde_produzida: quantidadeNumber,
                qtde_inspecionada: quantidadeInspecionadaNumber
            };

            const response = await fetchWithAuth(`${apiUrl}/inspecao/fichas_inspecao`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Erro HTTP: ${response.status}`);
            }

            const result = await response.json();

            onSuccess(
                quantidadeNumber,
                quantidadeInspecionadaNumber,
                result.message || "Quantidades atualizadas com sucesso"
            );
            handleClose();
        } catch (error) {
            console.error("Erro ao atualizar quantidades:", error);
            setError(error instanceof Error ? error.message : "Erro ao atualizar quantidades");
            onError(error instanceof Error ? error.message : "Erro ao atualizar quantidades");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto">
                    <motion.div
                        key="quantidade-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 w-full h-full bg-slate-900/60 backdrop-blur-lg backdrop-saturate-150"
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
                        <div className="flex items-center justify-between mb-1">
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

                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Informe as quantidades produzidas e inspecionadas:
                            </p>
                        </div>

                        <form onSubmit={handleQuantitySubmit}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="qtdeProduzida" className="block text-sm font-medium text-gray-700">
                                        Quantidade Produzida
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Package size={18} />
                                        </div>
                                        <input
                                            ref={inputProduzidaRef}
                                            type="number"
                                            id="qtdeProduzida"
                                            placeholder="Quantidade produzida"
                                            value={tempQtdeProduzida}
                                            onChange={(e) => setTempQtdeProduzida(e.target.value)}
                                            min="1"
                                            step="1"
                                            className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm placeholder-gray-400 transition-colors focus:border-[#1ABC9C] focus:bg-white focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="qtdeInspecionada" className="block text-sm font-medium text-gray-700">
                                        Quantidade Inspecionada
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <CheckSquare size={18} />
                                        </div>
                                        <input
                                            ref={inputInspecionadaRef}
                                            type="number"
                                            id="qtdeInspecionada"
                                            placeholder="Quantidade inspecionada"
                                            value={tempQtdeInspecionada}
                                            onChange={(e) => setTempQtdeInspecionada(e.target.value)}
                                            min="1"
                                            step="1"
                                            className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm placeholder-gray-400 transition-colors focus:border-[#1ABC9C] focus:bg-white focus:outline-none"
                                            required
                                        />
                                    </div>
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
                                        onClick={handleClose}
                                        className="flex-1 rounded-lg px-4 py-3 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                                        disabled={isSaving}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        ref={confirmButtonRef}
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 rounded-lg px-4 py-3 font-medium bg-[#1ABC9C] text-white hover:bg-[#16A085] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1ABC9C] focus:ring-offset-2 disabled:opacity-70"
                                    >
                                        {isSaving ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin mr-2 inline" />
                                                Salvando...
                                            </>
                                        ) : (
                                            'Salvar'
                                        )}
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

export default QuantidadeEditModal;
