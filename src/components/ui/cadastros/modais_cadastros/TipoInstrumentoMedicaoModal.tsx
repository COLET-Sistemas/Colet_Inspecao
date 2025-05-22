"use client";

import { useApiConfig } from "@/hooks/useApiConfig";
import { createTipoInstrumentoMedicao, updateTipoInstrumentoMedicao } from "@/services/api/tipoInstrumentoMedicaoService";
import { TipoInstrumentoMedicao as TipoInstrumentoMedicaoType } from "@/types/cadastros/tipoInstrumentoMedicao";
import { motion } from "framer-motion";
import { AlertCircle, FileText, MessageSquare } from "lucide-react";
import { useCallback, useState } from "react";
import { FormModal } from "../FormModal";

interface TipoInstrumentoMedicao {
    id?: number;
    nome_tipo_instrumento: string;
    observacao?: string;
}

interface TipoInstrumentoMedicaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    tipoInstrumentoMedicao?: TipoInstrumentoMedicao;
    onSuccess?: (data: TipoInstrumentoMedicao) => void;
    onError?: (error: string) => void;
}

export function TipoInstrumentoMedicaoModal({
    isOpen,
    onClose,
    tipoInstrumentoMedicao,
    onSuccess,
    onError,
}: TipoInstrumentoMedicaoModalProps) {
    const { getAuthHeaders } = useApiConfig();
    const [error, setError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState<string | null>(null);

    const handleSubmit = useCallback(
        async (formData: { nome_tipo_instrumento?: string; observacao?: string }) => {
            try {
                setError(null);

                // Validar campos obrigatórios
                if (!formData.nome_tipo_instrumento?.trim()) {
                    setError("O nome do tipo de instrumento é obrigatório");
                    return;
                }

                const payload: {
                    nome_tipo_instrumento: string;
                    observacao: string;
                    id?: number;
                } = {
                    nome_tipo_instrumento: formData.nome_tipo_instrumento.trim(),
                    observacao: formData.observacao?.trim() || "",
                };

                let responseData;

                if (tipoInstrumentoMedicao?.id) {
                    // Modo de edição - PUT
                    try {
                        responseData = await updateTipoInstrumentoMedicao(
                            {
                                id: Number(tipoInstrumentoMedicao.id),
                                nome_tipo_instrumento: payload.nome_tipo_instrumento,
                                observacao: payload.observacao
                            },
                            getAuthHeaders()
                        );
                        console.log("Resposta da API ao editar:", responseData);
                    } catch (error: unknown) {
                        const errMsg = error instanceof Error
                            ? error.message
                            : typeof error === "object" && error !== null && "erro" in error && typeof (error as { erro?: string }).erro === "string"
                                ? (error as { erro?: string }).erro!
                                : "Erro ao atualizar tipo de instrumento de medição";
                        throw new Error(errMsg);
                    }
                } else {
                    // Modo de criação - POST
                    console.log("Enviando POST para criar novo item:", payload);
                    try {
                        responseData = await createTipoInstrumentoMedicao(
                            {
                                nome_tipo_instrumento: payload.nome_tipo_instrumento,
                                observacao: payload.observacao
                            },
                            getAuthHeaders()
                        );
                        console.log("Resposta da API ao criar:", responseData);
                    } catch (error: unknown) {
                        const errMsg = error instanceof Error
                            ? error.message
                            : typeof error === "object" && error !== null && "erro" in error && typeof (error as { erro?: string }).erro === "string"
                                ? (error as { erro?: string }).erro!
                                : "Erro ao criar tipo de instrumento de medição";
                        throw new Error(errMsg);
                    }
                }

                // Se não temos um ID na resposta, pode ser necessário usar um ID temporário
                if (!responseData || responseData.id === undefined) {
                    console.warn("API não retornou um ID válido. Usando um ID temporário.");
                    responseData = {
                        ...payload,
                        id: tipoInstrumentoMedicao?.id || Math.floor(Math.random() * 10000) + 1 // Usa o ID existente ou cria um temporário
                    };
                }

                if (onSuccess) {
                    // Garantir que todos os campos necessários estejam presentes
                    const successData: TipoInstrumentoMedicaoType = {
                        ...responseData,
                        id: responseData.id, // Usar o ID da resposta ou o ID temporário já definido
                        nome_tipo_instrumento: responseData.nome_tipo_instrumento || formData.nome_tipo_instrumento?.trim() || "",
                        observacao: responseData.observacao !== undefined ? responseData.observacao : formData.observacao?.trim() || "",
                    };
                    console.log("Dados enviados ao componente pai:", successData);
                    onSuccess(successData);
                }

                onClose();

            } catch (err: unknown) {
                console.error("Erro ao processar formulário:", err);
                const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro inesperado";
                // Fechar o modal em caso de erro
                onClose();
                // Propagar o erro para o componente pai
                if (onError) {
                    onError(errorMessage);
                }
            }
        },
        [onClose, onSuccess, onError, tipoInstrumentoMedicao, getAuthHeaders]
    );

    // Feedback visual para erros
    const renderFeedback = () => {
        if (error) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                    <AlertCircle className="mr-2 h-4 w-4 text-red-500 flex-shrink-0" />
                    <span>{error}</span>
                </motion.div>
            );
        }

        return null;
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                tipoInstrumentoMedicao?.id
                    ? "Editar Tipo de Instrumento de Medição"
                    : "Novo Tipo de Instrumento de Medição"
            }
            isEditing={!!tipoInstrumentoMedicao?.id}
            onSubmit={handleSubmit}
            submitLabel={tipoInstrumentoMedicao?.id ? "Salvar alterações" : "Criar tipo de instrumento"
            }
            size="sm"
        >
            {renderFeedback()}

            <div className="space-y-4">
                <div className="bg-white rounded-md">
                    {/* Campo de nome do tipo de instrumento */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="nome_tipo_instrumento" className="text-sm font-medium text-gray-700">
                                    Nome do Tipo <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200 ${isFocused === 'nome' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <input
                                type="text"
                                id="nome_tipo_instrumento"
                                name="nome_tipo_instrumento"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Insira o nome do tipo de instrumento"
                                defaultValue={tipoInstrumentoMedicao?.nome_tipo_instrumento || ""}
                                required
                                onFocus={() => setIsFocused('nome')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Campo de observação */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <MessageSquare className="h-4 w-4 text-gray-500" />
                                <label htmlFor="observacao" className="text-sm font-medium text-gray-700">
                                    Observação
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200`}>
                            <textarea
                                id="observacao"
                                name="observacao"
                                rows={3}
                                className={`w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300 resize-none ${isFocused === 'observacao' ? 'ring-2 ring-[#09A08D]/30' : ''}`}
                                placeholder="Informações adicionais sobre o tipo de instrumento (opcional)"
                                defaultValue={tipoInstrumentoMedicao?.observacao || ""}
                                onFocus={() => setIsFocused('observacao')}
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