"use client";

import { useApiConfig } from "@/hooks/useApiConfig";
import { motion } from "framer-motion";
import { AlertCircle, Check, FileText, MessageSquare, ToggleLeft } from "lucide-react";
import { useCallback, useState } from "react";
import { FormModal } from "../FormModal";

interface TipoInstrumentoMedicao {
    id?: number;
    nome_tipo_instrumento: string;
    observacao?: string;
    status: "A" | "I";
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
    const [success, setSuccess] = useState<string | null>(null);
    const [isAtivo, setIsAtivo] = useState(!tipoInstrumentoMedicao || tipoInstrumentoMedicao.status === "A");
    const [isFocused, setIsFocused] = useState<string | null>(null);

    const handleSubmit = useCallback(
        async (formData: any) => {
            try {
                setError(null);
                setSuccess(null);

                // Validar campos obrigatórios
                if (!formData.nome_tipo_instrumento?.trim()) {
                    setError("O nome do tipo de instrumento é obrigatório");
                    return;
                }

                const payload = {
                    nome_tipo_instrumento: formData.nome_tipo_instrumento.trim(),
                    observacao: formData.observacao?.trim() || "",
                    status: formData.situacao === "on" ? "A" : "I",
                };

                let response;
                let url = `${apiUrl}/tipos_instrumentos_medicao`;

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
                    response = await fetch(url, {
                        method: "POST",
                        headers: getAuthHeaders(),
                        body: JSON.stringify(payload),
                    });
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(
                        errorData?.message ||
                        `Erro ao ${tipoInstrumentoMedicao?.id ? "atualizar" : "criar"} tipo de instrumento de medição`
                    );
                }

                const responseData = await response.json();

                setSuccess(
                    tipoInstrumentoMedicao?.id
                        ? "Tipo de instrumento de medição atualizado com sucesso!"
                        : "Tipo de instrumento de medição criado com sucesso!"
                );

                // Enviar dados para o callback de sucesso e fechar o modal após 1s
                if (onSuccess) {
                    onSuccess(responseData);
                }

                setTimeout(() => {
                    onClose();
                }, 1000);

            } catch (err: any) {
                console.error("Erro ao processar formulário:", err);
                setError(err.message || "Ocorreu um erro inesperado");
            }
        },
        [apiUrl, onClose, onSuccess, tipoInstrumentoMedicao, getAuthHeaders]
    );

    // Feedback visual para sucesso ou erro
    const renderFeedback = () => {
        if (error) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 sm:mb-4 flex items-center rounded-md border border-red-200 bg-red-50 p-2 sm:p-3 text-sm text-red-700"
                >
                    <AlertCircle className="mr-2 h-4 w-4 text-red-500 flex-shrink-0" />
                    <span>{error}</span>
                </motion.div>
            );
        }

        if (success) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 sm:mb-4 flex items-center rounded-md border border-green-200 bg-green-50 p-2 sm:p-3 text-sm text-green-700"
                >
                    <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{success}</span>
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

            <div className="space-y-3">
                <div className="bg-white p-2">
                    {/* ID (somente exibição no modo de edição) */}
                    {tipoInstrumentoMedicao?.id && (
                        <div className="mb-4 sm:mb-5">
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className="h-4 w-4 text-gray-500">#</span>
                                    <label className="text-sm font-medium text-gray-700">
                                        ID
                                    </label>
                                </div>
                            </div>
                            <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 sm:py-2.5 text-sm text-gray-500">
                                {tipoInstrumentoMedicao.id}
                            </div>
                        </div>
                    )}

                    {/* Campo de nome do tipo de instrumento */}
                    <div className="mb-4 sm:mb-5">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
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
                                className="w-full rounded-md border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Insira o nome do tipo de instrumento de medição"
                                defaultValue={tipoInstrumentoMedicao?.nome_tipo_instrumento || ""}
                                required
                                onFocus={() => setIsFocused('nome')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Campo de observação */}
                    <div className="mb-4 sm:mb-5">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
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
                                className="w-full rounded-md border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300 resize-none"
                                placeholder="Adicione observações relevantes sobre este tipo de instrumento (opcional)"
                                defaultValue={tipoInstrumentoMedicao?.observacao || ""}
                                onFocus={() => setIsFocused('observacao')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Campo de status */}
                    <div>
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <div className="flex items-center space-x-2">
                                <ToggleLeft className="h-4 w-4 text-gray-500" />
                                <label className="text-sm font-medium text-gray-700">
                                    Status
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-2 sm:p-3 bg-gray-50 rounded-md border border-gray-100">
                            <div className="flex-grow mb-2 sm:mb-0">
                                <p className="text-sm text-gray-700 font-medium">
                                    {isAtivo ? 'Ativo' : 'Inativo'}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                                    {isAtivo
                                        ? 'O tipo de instrumento estará disponível para uso.'
                                        : 'O tipo de instrumento não estará disponível para uso.'}
                                </p>
                            </div>

                            <label htmlFor="situacao" className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    id="situacao"
                                    name="situacao"
                                    className="peer sr-only"
                                    defaultChecked={!tipoInstrumentoMedicao || tipoInstrumentoMedicao.status === "A"}
                                    onChange={(e) => setIsAtivo(e.target.checked)}
                                />
                                <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-[#09A08D] peer-checked:after:translate-x-full peer-focus:ring-4 peer-focus:ring-[#09A08D]/30"></div>
                            </label>
                        </div>
                    </div>

                    {/* Mensagem sobre campos obrigatórios */}
                    <div className="text-xs text-gray-500 mt-3 sm:mt-4">
                        <span className="text-red-500">*</span> Campos obrigatórios
                    </div>
                </div>
            </div>
        </FormModal>
    );
}