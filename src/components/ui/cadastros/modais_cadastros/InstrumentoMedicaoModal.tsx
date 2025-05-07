"use client";

import { useApiConfig } from "@/hooks/useApiConfig";
import { InstrumentoMedicao } from "@/types/cadastros/instrumentoMedicao";
import { motion } from "framer-motion";
import { AlertCircle, FileText, Tag } from "lucide-react";
import { useCallback, useState } from "react";
import { FormModal } from "../FormModal";

interface InstrumentoMedicaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    instrumentoMedicao?: InstrumentoMedicao;
    onSuccess?: (data: InstrumentoMedicao) => void;
}

export function InstrumentoMedicaoModal({
    isOpen,
    onClose,
    instrumentoMedicao,
    onSuccess,
}: InstrumentoMedicaoModalProps) {
    const { apiUrl, getAuthHeaders } = useApiConfig();
    const [error, setError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState<string | null>(null);

    const handleSubmit = useCallback(
        async (formData: any) => {
            try {
                setError(null);

                // Validar campos obrigatórios
                if (!formData.nome_instrumento?.trim()) {
                    setError("O nome do instrumento é obrigatório");
                    return;
                }

                if (!formData.tag?.trim()) {
                    setError("A TAG do instrumento é obrigatória");
                    return;
                }

                const payload: {
                    tag: string;
                    nome_instrumento: string;
                    situacao: "A" | "I";
                    id_tipo_instrumento?: number;
                } = {
                    tag: formData.tag.trim(),
                    nome_instrumento: formData.nome_instrumento.trim(),
                    situacao: formData.situacao || "A",
                };

                // Adicionar ID se estiver editando
                if (instrumentoMedicao?.id_tipo_instrumento) {
                    payload.id_tipo_instrumento = instrumentoMedicao.id_tipo_instrumento;
                }

                let response;
                let url = `${apiUrl}/inspecao/instrumentos_medicao`;

                if (instrumentoMedicao?.id_tipo_instrumento) {
                    // Modo de edição - PUT
                    response = await fetch(`${url}?id=${instrumentoMedicao.id_tipo_instrumento}`, {
                        method: "PUT",
                        headers: {
                            ...getAuthHeaders(),
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });
                } else {
                    // Modo de criação - POST
                    response = await fetch(url, {
                        method: "POST",
                        headers: {
                            ...getAuthHeaders(),
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(
                        errorData?.message ||
                        `Erro ao ${instrumentoMedicao?.id_tipo_instrumento ? "atualizar" : "criar"} instrumento de medição`
                    );
                }

                let responseData;
                try {
                    responseData = await response.json();
                } catch (err) {
                    // Se a API não retornou dados JSON válidos, construímos o objeto de resposta com os dados do formulário
                    responseData = {
                        id_tipo_instrumento: instrumentoMedicao?.id_tipo_instrumento || 0,
                        ...payload
                    };
                }

                // Garantir que o objeto tenha a propriedade 'id' para compatibilidade com componentes
                responseData.id = responseData.id_tipo_instrumento;

                if (onSuccess) {
                    onSuccess(responseData as InstrumentoMedicao);
                }
                onClose();

            } catch (err: any) {
                console.error("Erro ao processar formulário:", err);
                setError(err.message || "Ocorreu um erro inesperado");
            }
        },
        [apiUrl, onClose, onSuccess, instrumentoMedicao, getAuthHeaders]
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
                instrumentoMedicao?.id_tipo_instrumento
                    ? "Editar Instrumento de Medição"
                    : "Novo Instrumento de Medição"
            }
            isEditing={!!instrumentoMedicao?.id_tipo_instrumento}
            onSubmit={handleSubmit}
            submitLabel={instrumentoMedicao?.id_tipo_instrumento ? "Salvar alterações" : "Criar instrumento"}
            size="md"
        >
            {renderFeedback()}

            <div className="space-y-4">
                <div className="bg-white rounded-md">
                    {/* Campo de TAG */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <Tag className="h-4 w-4 text-gray-500" />
                                <label htmlFor="tag" className="text-sm font-medium text-gray-700">
                                    TAG <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200 ${isFocused === 'tag' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <input
                                type="text"
                                id="tag"
                                name="tag"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Ex: CAL-001"
                                defaultValue={instrumentoMedicao?.tag || ""}
                                required
                                onFocus={() => setIsFocused('tag')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Campo de nome */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="nome_instrumento" className="text-sm font-medium text-gray-700">
                                    Nome <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200 ${isFocused === 'nome' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <input
                                type="text"
                                id="nome_instrumento"
                                name="nome_instrumento"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Nome do instrumento"
                                defaultValue={instrumentoMedicao?.nome_instrumento || ""}
                                required
                                onFocus={() => setIsFocused('nome')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Campo de situação (status) */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="situacao" className="text-sm font-medium text-gray-700">
                                    Situação <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200 ${isFocused === 'situacao' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <select
                                id="situacao"
                                name="situacao"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                defaultValue={instrumentoMedicao?.situacao || "A"}
                                required
                                onFocus={() => setIsFocused('situacao')}
                                onBlur={() => setIsFocused(null)}
                            >
                                <option value="A">Ativo</option>
                                <option value="I">Inativo</option>
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