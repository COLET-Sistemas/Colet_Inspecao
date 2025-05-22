'use client';

import { useApiConfig } from '@/hooks/useApiConfig';
import { motion } from 'framer-motion';
import { AlertCircle, FileText, IdCard, Timer } from 'lucide-react';
import { useCallback, useState } from 'react';
import { FormModal } from '../FormModal';

// Interface para os dados do modal
export interface OperacaoDados {
    referencia: string;
    roteiro: string;
    processo: number;
    operacao: number;
    id?: number;
    descricao?: string;
    frequencia_minutos?: number;
}

// Interface para os dados do formulário
interface FormData {
    descricao: string;
    frequencia: string;
    operacao: string;
}

// Props do componente
interface OperacoesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    dados: OperacaoDados | null;
    modo?: 'cadastro' | 'edicao';
}

export function OperacoesModal({
    isOpen,
    onClose,
    dados,
    onSuccess,
    modo = 'cadastro'
}: OperacoesModalProps) {
    const [isFocused, setIsFocused] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { apiUrl, getAuthHeaders } = useApiConfig();

    // Renderiza mensagens de erro
    const renderFeedback = () => {
        if (formError) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                    <AlertCircle className="mr-2 h-4 w-4 text-red-500 flex-shrink-0" />
                    <span>{formError}</span>
                </motion.div>
            );
        }
        return null;
    };

    // Handler para submissão do formulário
    const handleSubmit = useCallback(
        async (formData: FormData) => {
            try {
                setFormError(null);
                setIsSubmitting(true);

                // Validação
                if (!formData.descricao?.trim()) {
                    setFormError("A descrição da operação é obrigatória");
                    setIsSubmitting(false);
                    return;
                }

                // Valida operação apenas em modo cadastro
                if (modo === 'cadastro') {
                    const operacao = parseInt(formData.operacao) || 0;
                    if (operacao <= 0) {
                        setFormError("O número da operação deve ser maior que zero");
                        setIsSubmitting(false);
                        return;
                    }
                }

                const frequencia = parseInt(formData.frequencia) || 0;
                if (frequencia <= 0) {
                    setFormError("A frequência deve ser maior que zero");
                    setIsSubmitting(false);
                    return;
                }

                if (!dados) {
                    setIsSubmitting(false);
                    return;
                }

                // Garantir que roteiro seja enviado como número
                const roteiroNum = typeof dados.roteiro === 'string' ? parseInt(dados.roteiro) : dados.roteiro;

                const endpoint = `${apiUrl}/inspecao/operacoes_processos`;
                const method = modo === 'edicao' ? 'PUT' : 'POST';

                // Payload diferente para edição e cadastro
                const payload = modo === 'edicao' ? {
                    id: dados.id,
                    descricao: formData.descricao,
                    frequencia_minutos: parseInt(formData.frequencia)
                } : {
                    referencia: dados.referencia,
                    roteiro: roteiroNum,
                    processo: dados.processo,
                    operacao: parseInt(formData.operacao),
                    descricao: formData.descricao,
                    frequencia_minutos: parseInt(formData.frequencia)
                };

                const response = await fetch(endpoint, {
                    method: method,
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    if (response.status === 409) {
                        throw new Error(errorData?.erro || 'Operação já existe para este processo');
                    }
                    throw new Error(errorData?.erro || errorData?.message || `Erro ao ${modo === 'edicao' ? 'atualizar' : 'cadastrar'}: ${response.status}`);
                }

                // Chama o callback onSuccess com a mensagem de sucesso
                onSuccess(modo === 'edicao'
                    ? "Operação atualizada com sucesso!"
                    : "Operação cadastrada com sucesso!");

                // Fechamento do modal após salvamento
                onClose();
            } catch (error) {
                console.error(`Erro ao ${modo === 'edicao' ? 'atualizar' : 'cadastrar'} operação:`, error);
                if (error instanceof Error) {
                    setFormError(error.message);
                } else {
                    setFormError(`Ocorreu um erro ao ${modo === 'edicao' ? 'atualizar' : 'cadastrar'} a operação. Tente novamente.`);
                }
            } finally {
                setIsSubmitting(false);
            }
        },
        [apiUrl, dados, getAuthHeaders, modo, onClose, onSuccess]
    );

    if (!isOpen || !dados) return null;

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={`${modo === 'edicao' ? 'Editar' : 'Nova'} Operação - Processo ${dados.processo}`}
            isEditing={modo === 'edicao'}
            onSubmit={handleSubmit}
            submitLabel={modo === 'edicao' ? 'Atualizar' : 'Salvar'}
            isSubmitting={isSubmitting}
            size="sm"
        >
            {/* Informações do contexto */}
            <div className="mb-5 bg-gray-50 p-3 rounded-md border border-gray-100">
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                        <span className="text-gray-500 block">Referência</span>
                        <span className="font-medium">{dados.referencia}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Roteiro</span>
                        <span className="font-medium">{dados.roteiro}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Processo</span>
                        <span className="font-medium">{dados.processo}</span>
                    </div>
                </div>
            </div>

            {/* Feedback de erro */}
            {renderFeedback()}            <div className="space-y-4">
                <div className="bg-white rounded-md">
                    {/* Campo de descrição */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="descricao" className="text-sm font-medium text-gray-700">
                                    Descrição <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>

                        <div className={`relative transition-all duration-200 ${isFocused === 'descricao' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <input
                                type="text"
                                id="descricao"
                                name="descricao"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Descreva a operação"
                                defaultValue={dados.descricao || ''}
                                onFocus={() => setIsFocused('descricao')}
                                onBlur={() => setIsFocused(null)}
                                required
                            />
                        </div>
                    </div>

                    {/* Campo de operação - mostrado apenas em modo cadastro */}
                    {modo === 'cadastro' && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <IdCard className="h-4 w-4 text-gray-500" />
                                    <label htmlFor="operacao" className="text-sm font-medium text-gray-700">
                                        Operação <span className="text-red-500">*</span>
                                    </label>
                                </div>
                            </div>

                            <div className={`relative transition-all duration-200 ${isFocused === 'operacao' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="number"
                                    id="operacao"
                                    name="operacao"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    placeholder="Número da operação"
                                    defaultValue={dados.operacao || ''}
                                    onFocus={() => setIsFocused('operacao')}
                                    onBlur={() => setIsFocused(null)}
                                    required={modo === 'cadastro'}
                                />
                            </div>
                        </div>
                    )}

                    {/* Campo de frequência */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <Timer className="h-4 w-4 text-gray-500" />
                                <label htmlFor="frequencia" className="text-sm font-medium text-gray-700">
                                    Frequência <span className="text-xs text-gray-500">(em minutos)</span> <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>

                        <div className={`relative transition-all duration-200 ${isFocused === 'frequencia' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <input
                                type="number"
                                id="frequencia"
                                name="frequencia"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Ex: 100"
                                min="1"
                                defaultValue={dados.frequencia_minutos}
                                required
                                onFocus={() => setIsFocused('frequencia')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Mensagem sobre campos obrigatórios */}
                    <div className="text-xs text-gray-500 mt-4">
                        <span className="text-red-500">*</span> Campos obrigatórios
                    </div>
                </div>
            </div>
        </FormModal>
    );
}
