'use client';

import { useApiConfig } from '@/hooks/useApiConfig';
import { motion } from 'framer-motion';
import { AlertCircle, FileText, Ruler } from 'lucide-react';
import { useCallback, useState } from 'react';
import { FormModal } from '../FormModal';

// Interface para os dados do modal
interface EspecificacaoDados {
    referencia: string;
    roteiro: string;
    processo: number;
    operacao: number;
    id?: number;
    especificacao_cota?: string;
    tipo_valor?: string;
    ordem?: number;
}

// Interface para os dados do formulário
interface FormData {
    especificacao: string;
    tipo_valor: string;
    valor_minimo?: string;
    valor_maximo?: string;
    unidade_medida?: string;
}

// Props do componente
interface EspecificacoesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    dados: EspecificacaoDados | null;
    modo?: 'cadastro' | 'edicao';
}

export function EspecificacoesModal({
    isOpen,
    onClose,
    dados,
    onSuccess,
    modo = 'cadastro'
}: EspecificacoesModalProps) {
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
                if (!formData.especificacao?.trim()) {
                    setFormError("A especificação é obrigatória");
                    setIsSubmitting(false);
                    return;
                }

                if (!formData.tipo_valor) {
                    setFormError("O tipo de valor é obrigatório");
                    setIsSubmitting(false);
                    return;
                }

                if (!dados) {
                    setIsSubmitting(false);
                    return;
                }

                // Garantir que roteiro seja enviado como número
                const roteiroNum = typeof dados.roteiro === 'string' ? parseInt(dados.roteiro) : dados.roteiro;

                const endpoint = modo === 'edicao'
                    ? `${apiUrl}/inspecao/especificacoes/${dados.id}`
                    : `${apiUrl}/inspecao/especificacoes`;

                const method = modo === 'edicao' ? 'PUT' : 'POST';

                const payload = {
                    referencia: dados.referencia,
                    roteiro: roteiroNum,
                    processo: dados.processo,
                    operacao: dados.operacao,
                    especificacao_cota: formData.especificacao,
                    tipo_valor: formData.tipo_valor,
                    valor_minimo: formData.valor_minimo,
                    valor_maximo: formData.valor_maximo,
                    unidade_medida: formData.unidade_medida
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
                    throw new Error(errorData?.message || `Erro ao ${modo === 'edicao' ? 'atualizar' : 'cadastrar'}: ${response.status}`);
                }

                onSuccess(modo === 'edicao'
                    ? "Especificação atualizada com sucesso!"
                    : "Especificação cadastrada com sucesso!");

                onClose();
            } catch (error: Error | unknown) {
                console.error(`Erro ao ${modo === 'edicao' ? 'atualizar' : 'cadastrar'} especificação:`, error);
                setFormError(`Ocorreu um erro ao ${modo === 'edicao' ? 'atualizar' : 'cadastrar'} a especificação. Tente novamente.`);
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
            title={`${modo === 'edicao' ? 'Editar' : 'Nova'} Especificação - Operação ${dados.operacao}`}
            isEditing={modo === 'edicao'}
            onSubmit={handleSubmit}
            submitLabel={modo === 'edicao' ? 'Atualizar' : 'Salvar'}
            isSubmitting={isSubmitting}
            size="md"
        >
            {/* Informações do contexto */}
            <div className="mb-5 bg-gray-50 p-3 rounded-md border border-gray-100">
                <div className="grid grid-cols-4 gap-2 text-xs">
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
                    <div>
                        <span className="text-gray-500 block">Operação</span>
                        <span className="font-medium">{dados.operacao}</span>
                    </div>
                </div>
            </div>

            {/* Feedback de erro */}
            {renderFeedback()}

            <div className="space-y-4">
                <div className="bg-white rounded-md">
                    {/* Campo de especificação */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <Ruler className="h-4 w-4 text-gray-500" />
                                <label htmlFor="especificacao" className="text-sm font-medium text-gray-700">
                                    Especificação <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>

                        <div className={`relative transition-all duration-200 ${isFocused === 'especificacao' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <input
                                type="text"
                                id="especificacao"
                                name="especificacao"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Descreva a especificação"
                                defaultValue={dados.especificacao_cota || ''}
                                required
                                onFocus={() => setIsFocused('especificacao')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Campo de tipo de valor */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="tipo_valor" className="text-sm font-medium text-gray-700">
                                    Tipo de Valor <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>

                        <div className={`relative transition-all duration-200 ${isFocused === 'tipo_valor' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <select
                                id="tipo_valor"
                                name="tipo_valor"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                defaultValue={dados.tipo_valor || ''}
                                required
                                onFocus={() => setIsFocused('tipo_valor')}
                                onBlur={() => setIsFocused(null)}
                            >
                                <option value="">Selecione o tipo de valor</option>
                                <option value="F">Faixa</option>
                                <option value="U">Único</option>
                                <option value="A">Aprovado/Reprovado</option>
                                <option value="C">Conforme/Não Conforme</option>
                                <option value="S">Sim/Não</option>
                                <option value="L">Liberado/Retido</option>
                            </select>
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
