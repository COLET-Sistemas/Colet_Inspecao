"use client";

import { useApiConfig } from "@/hooks/useApiConfig";
import { motion } from "framer-motion";
import { AlertCircle, Check, FileText, ToggleLeft } from "lucide-react";
import { useCallback, useState } from "react";
import { FormModal } from "../FormModal";

interface TipoInspecao {
    id?: number;
    codigo?: string;
    descricao: string;
    status: "A" | "I";
}

interface TipoInspecaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    tipoInspecao?: TipoInspecao;
    onSuccess?: (data: TipoInspecao) => void;
}

export function TipoInspecaoModal({
    isOpen,
    onClose,
    tipoInspecao,
    onSuccess,
}: TipoInspecaoModalProps) {
    const isEditing = !!tipoInspecao;
    const { apiUrl } = useApiConfig();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isAtivo, setIsAtivo] = useState(!tipoInspecao || tipoInspecao.status === "A");
    const [isFocused, setIsFocused] = useState<string | null>(null);

    const handleSubmit = useCallback(
        async (formData: any) => {
            try {
                setError(null);
                setSuccess(null);

                // Validar campos obrigatórios
                if (!formData.descricao_tipo_inspecao?.trim()) {
                    setError("A descrição do tipo de inspeção é obrigatória");
                    return;
                }

                // Obter o token exatamente como foi recebido no login
                const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

                if (!authToken) {
                    setError("Sessão expirada. Por favor, faça login novamente.");
                    return;
                }

                console.log('Token usado na requisição do modal:', authToken); // Log para debug

                const payload = {
                    descricao: formData.descricao_tipo_inspecao.trim(),
                    status: formData.situacao === "on" ? "A" : "I",
                };

                let response;
                let url = `${apiUrl}/tipos_inspecao`;

                if (isEditing && tipoInspecao) {
                    // Modo de edição - PUT
                    response = await fetch(`${url}/${tipoInspecao.id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Key": authToken // Usando API Key no cabeçalho
                        },
                        body: JSON.stringify({
                            ...payload,
                            id: tipoInspecao.id,
                            codigo: tipoInspecao.codigo,
                        }),
                    });
                } else {
                    // Modo de criação - POST
                    response = await fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Key": authToken // Usando API Key no cabeçalho
                        },
                        body: JSON.stringify(payload),
                    });
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(
                        errorData?.message ||
                        `Erro ao ${isEditing ? "atualizar" : "criar"} tipo de inspeção`
                    );
                }

                const responseData = await response.json();

                setSuccess(
                    isEditing
                        ? "Tipo de inspeção atualizado com sucesso!"
                        : "Tipo de inspeção criado com sucesso!"
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
        [apiUrl, isEditing, onClose, onSuccess, tipoInspecao]
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
                isEditing
                    ? "Editar Tipo de Inspeção"
                    : "Novo Tipo de Inspeção"
            }
            isEditing={isEditing}
            onSubmit={handleSubmit}
            submitLabel={isEditing ? "Salvar alterações" : "Criar tipo de inspeção"}
            size="sm"
        >
            {renderFeedback()}

            <div className="space-y-3">
                <div className="bg-white p-2">

                    {/* Campo de descrição */}
                    <div className="mb-4 sm:mb-5">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="descricao_tipo_inspecao" className="text-sm font-medium text-gray-700">
                                    Descrição <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200 ${isFocused === 'descricao' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <input
                                type="text"
                                id="descricao_tipo_inspecao"
                                name="descricao_tipo_inspecao"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Insira a descrição do tipo de inspeção"
                                defaultValue={tipoInspecao?.descricao || ""}
                                required
                                onFocus={() => setIsFocused('descricao')}
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
                                        ? 'O tipo de inspeção estará disponível para uso.'
                                        : 'O tipo de inspeção não estará disponível para uso.'}
                                </p>
                            </div>

                            <label htmlFor="situacao" className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    id="situacao"
                                    name="situacao"
                                    className="peer sr-only"
                                    defaultChecked={!tipoInspecao || tipoInspecao.status === "A"}
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