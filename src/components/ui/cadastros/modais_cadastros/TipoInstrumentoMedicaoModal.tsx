"use client";

import { useApiConfig } from "@/hooks/useApiConfig";
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
}

export function TipoInstrumentoMedicaoModal({
    isOpen,
    onClose,
    tipoInstrumentoMedicao,
    onSuccess,
}: TipoInstrumentoMedicaoModalProps) {
    const { apiUrl, getAuthHeaders } = useApiConfig();
    const [error, setError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState<string | null>(null);

    const handleSubmit = useCallback(
        async (formData: any) => {
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

                let response;
                let url = `${apiUrl}/inspecao/tipos_instrumentos_medicao`;

                if (tipoInstrumentoMedicao?.id) {
                    // Modo de edição - PUT
                    response = await fetch(`${url}?id=${tipoInstrumentoMedicao.id}`, {
                        method: "PUT",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            ...payload,
                            id: Number(tipoInstrumentoMedicao.id),
                        }),
                    });
                } else {
                    // Modo de criação - POST
                    console.log("Enviando POST para criar novo item:", payload);
                    response = await fetch(url, {
                        method: "POST",
                        headers: getAuthHeaders(),
                        body: JSON.stringify(payload),
                    });
                    console.log("Status da resposta:", response.status);

                    // Se a resposta for 204 No Content, precisamos fazer uma nova requisição para obter o item criado
                    if (response.status === 204) {
                        console.log("Resposta sem conteúdo (204). Buscando item recém-criado...");

                        try {
                            // Esperar um curto período para dar tempo à API de processar
                            await new Promise(resolve => setTimeout(resolve, 300));

                            // Buscar todos os itens para encontrar o que acabamos de criar
                            const getAllResponse = await fetch(url, {
                                method: 'GET',
                                headers: getAuthHeaders()
                            });

                            if (getAllResponse.ok) {
                                const allItems = await getAllResponse.json();
                                // Tentar encontrar o item pelo nome que acabamos de criar
                                const createdItem = Array.isArray(allItems)
                                    ? allItems.find(item =>
                                        item.nome_tipo_instrumento === payload.nome_tipo_instrumento &&
                                        item.observacao === payload.observacao
                                    )
                                    : null;

                                if (createdItem && createdItem.id) {
                                    console.log("Item recém-criado encontrado:", createdItem);
                                    // Usar este item como resposta
                                    response = new Response(JSON.stringify(createdItem), {
                                        status: 200,
                                        headers: { 'Content-Type': 'application/json' }
                                    });
                                }
                            }
                        } catch (err) {
                            console.error("Erro ao tentar buscar o item recém-criado:", err);
                            // Continuamos com o fluxo normal mesmo se falhar
                        }
                    }
                }

                // Verificar se a resposta da API foi bem-sucedida
                if (!response.ok || response.status === 299) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(
                        errorData?.message ||
                        `Erro ao ${tipoInstrumentoMedicao?.id ? "atualizar" : "criar"} tipo de instrumento de medição`
                    );
                }

                // Construir objeto de resposta
                let responseData;
                try {
                    // Tentar obter os dados da resposta
                    responseData = await response.json();
                    console.log("Resposta da API ao criar/editar:", responseData);

                    // Verificar se a API retornou um ID válido
                    if (responseData && (responseData.id === undefined || responseData.id === null)) {
                        console.warn("API não retornou um ID válido. Usando um ID temporário.");

                        // Se a API não retornou um ID na resposta, mas estamos em modo de edição,
                        // mantemos o ID original
                        if (tipoInstrumentoMedicao?.id) {
                            responseData.id = tipoInstrumentoMedicao.id;
                        } else {
                            // Para um novo item, usamos um ID temporário apenas para exibição
                            responseData.id = Math.floor(Math.random() * 10000) + 1;
                            console.log("ID temporário gerado:", responseData.id);
                        }
                    }
                } catch (err) {
                    console.error("Erro ao parsear resposta da API:", err);

                    // Se não conseguir parsear a resposta, criar um objeto com os dados do formulário
                    responseData = {
                        id: tipoInstrumentoMedicao?.id || Math.floor(Math.random() * 10000) + 1, // ID temporário para novo item
                        nome_tipo_instrumento: formData.nome_tipo_instrumento.trim(),
                        observacao: formData.observacao?.trim() || "",
                    };
                    console.log("Usando dados do formulário com ID temporário:", responseData);
                }

                if (onSuccess) {
                    // Garantir que todos os campos necessários estejam presentes
                    const successData = {
                        ...responseData,
                        id: responseData.id, // Usar o ID da resposta ou o ID temporário já definido
                        nome_tipo_instrumento: responseData.nome_tipo_instrumento || formData.nome_tipo_instrumento.trim(),
                        observacao: responseData.observacao !== undefined ? responseData.observacao : formData.observacao?.trim() || "",
                    };
                    console.log("Dados enviados ao componente pai:", successData);
                    onSuccess(successData);
                }

                onClose();

            } catch (err: any) {
                console.error("Erro ao processar formulário:", err);
                setError(err.message || "Ocorreu um erro inesperado");
            }
        },
        [apiUrl, onClose, onSuccess, tipoInstrumentoMedicao, getAuthHeaders]
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
            submitLabel={tipoInstrumentoMedicao?.id ? "Salvar alterações" : "Criar tipo de instrumento"}
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
                        <div className={`relative transition-all duration-200 ${isFocused === 'observacao' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <textarea
                                id="observacao"
                                name="observacao"
                                rows={3}
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300 resize-none"
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