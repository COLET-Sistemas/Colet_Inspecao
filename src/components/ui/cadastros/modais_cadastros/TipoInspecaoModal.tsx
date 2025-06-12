"use client";

import { useApiConfig } from "@/hooks/useApiConfig";
import { fetchWithAuth } from "@/services/api/authInterceptor";
import { motion } from "framer-motion";
import { AlertCircle, FileText, ToggleLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FormModal } from "../FormModal";

interface TipoInspecao {
    id?: string;
    codigo?: string;
    descricao_tipo_inspecao: string;
    situacao: "A" | "I";
    exibe_faixa: "S" | "N";
    exibe_resultado: "S" | "N";
}

interface TipoInspecaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    tipoInspecao: TipoInspecao; // Removida a opcionalidade para exigir o objeto
    onSuccess?: (data: TipoInspecao) => void;
    onError?: (error: string) => void;
}

export function TipoInspecaoModal({
    isOpen,
    onClose,
    tipoInspecao,
    onSuccess,
    onError,
}: TipoInspecaoModalProps) {
    const { apiUrl } = useApiConfig(); const [error, setError] = useState<string | null>(null);
    const [isAtivo, setIsAtivo] = useState<boolean>(false);
    const [exibeFaixa, setExibeFaixa] = useState<boolean>(false);
    const [exibeResultado, setExibeResultado] = useState<boolean>(false);
    const [isFocused, setIsFocused] = useState<string | null>(null);    // Initialize isAtivo state based on tipoInspecao when component mounts or tipoInspecao changes
    useEffect(() => {
        setIsAtivo(tipoInspecao.situacao === "A");
        setExibeFaixa(tipoInspecao.exibe_faixa === "S");
        setExibeResultado(tipoInspecao.exibe_resultado === "S");
    }, [tipoInspecao]);

    const handleSubmit = useCallback(
        async (formData: Record<string, FormDataEntryValue>) => {
            try {
                setError(null);                // Validar campos obrigatórios
                const descricao = String(formData.descricao_tipo_inspecao || '').trim();
                const situacao = String(formData.situacao || '');
                const exibeFaixaValue = String(formData.exibe_faixa || '');
                const exibeResultadoValue = String(formData.exibe_resultado || '');
                if (!descricao) {
                    setError("A descrição do tipo de inspeção é obrigatória");
                    return;
                }

                const payload = {
                    descricao_tipo_inspecao: descricao,
                    situacao: situacao === "on" ? "A" : "I",
                    exibe_faixa: exibeFaixaValue === "on" ? "S" : "N",
                    exibe_resultado: exibeResultadoValue === "on" ? "S" : "N",
                };// Modo de edição - PUT
                const url = `${apiUrl}/inspecao/tipos_inspecao`;
                const response = await fetchWithAuth(`${url}?id=${tipoInspecao.id}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        ...payload,
                        id: Number(tipoInspecao.id),
                    }),
                });

                if (!response.ok || response.status === 299) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(
                        errorData?.message || errorData?.erro || "Erro ao atualizar tipo de inspeção"
                    );
                }

                const responseData = await response.json(); if (onSuccess) {
                    onSuccess({
                        ...responseData,
                        descricao_tipo_inspecao: responseData.descricao_tipo_inspecao || descricao,
                        situacao: responseData.situacao || payload.situacao,
                        exibe_faixa: responseData.exibe_faixa || payload.exibe_faixa,
                        exibe_resultado: responseData.exibe_resultado || payload.exibe_resultado
                    });
                }
                onClose();

            } catch (err: unknown) {
                console.error("Erro ao processar formulário:", err);
                let errorMessage = "Ocorreu um erro inesperado";
                if (err && typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
                    errorMessage = (err as { message: string }).message;
                }
                // Fechar o modal em caso de erro
                onClose();
                // Propagar o erro para o componente pai
                if (onError) {
                    onError(errorMessage);
                }
            }
        },
        [apiUrl, onClose, onSuccess, onError, tipoInspecao]
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
            title="Editar Tipo de Inspeção"
            isEditing={true}
            onSubmit={handleSubmit}
            submitLabel="Salvar alterações"
            size="sm"
        >
            {renderFeedback()}

            <div className="space-y-4">
                <div className="bg-white rounded-md">
                    {/* Campo de descrição */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
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
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Insira a descrição do tipo de inspeção"
                                defaultValue={tipoInspecao.descricao_tipo_inspecao}
                                required
                                onFocus={() => setIsFocused('descricao')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Campo de status */}
                    <div className="mb-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <ToggleLeft className="h-4 w-4 text-gray-500" />
                                <label className="text-sm font-medium text-gray-700">
                                    Status
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-3 bg-gray-50 rounded-md border border-gray-100">
                            <div className="flex-grow mb-2 sm:mb-0">
                                <p className="text-sm text-gray-700 font-medium">
                                    {isAtivo ? 'Ativo' : 'Inativo'}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isAtivo
                                        ? 'O tipo de inspeção estará disponível para uso.'
                                        : 'O tipo de inspeção não estará disponível para uso.'}
                                </p>
                            </div>                            <label htmlFor="situacao" className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    id="situacao"
                                    name="situacao"
                                    className="peer sr-only"
                                    defaultChecked={tipoInspecao.situacao === "A"}
                                    onChange={(e) => setIsAtivo(e.target.checked)}
                                />
                                <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-[#09A08D] peer-checked:after:translate-x-full peer-focus:ring-4 peer-focus:ring-[#09A08D]/30"></div>
                            </label>
                        </div>
                    </div>

                    {/* Campo de Exibe Faixa */}
                    <div className="mb-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <ToggleLeft className="h-4 w-4 text-gray-500" />
                                <label className="text-sm font-medium text-gray-700">
                                    Exibe Faixa
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-3 bg-gray-50 rounded-md border border-gray-100">
                            <div className="flex-grow mb-2 sm:mb-0">
                                <p className="text-sm text-gray-700 font-medium">
                                    {exibeFaixa ? 'Sim' : 'Não'}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {exibeFaixa
                                        ? 'A faixa será exibida nas inspeções.'
                                        : 'A faixa não será exibida nas inspeções.'}
                                </p>
                            </div>

                            <label htmlFor="exibe_faixa" className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    id="exibe_faixa"
                                    name="exibe_faixa"
                                    className="peer sr-only"
                                    defaultChecked={tipoInspecao.exibe_faixa === "S"}
                                    onChange={(e) => setExibeFaixa(e.target.checked)}
                                />
                                <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-[#09A08D] peer-checked:after:translate-x-full peer-focus:ring-4 peer-focus:ring-[#09A08D]/30"></div>
                            </label>
                        </div>
                    </div>

                    {/* Campo de Exibe Resultado */}
                    <div className="mb-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <ToggleLeft className="h-4 w-4 text-gray-500" />
                                <label className="text-sm font-medium text-gray-700">
                                    Exibe Resultado
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-3 bg-gray-50 rounded-md border border-gray-100">
                            <div className="flex-grow mb-2 sm:mb-0">
                                <p className="text-sm text-gray-700 font-medium">
                                    {exibeResultado ? 'Sim' : 'Não'}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {exibeResultado
                                        ? 'O resultado será exibido nas inspeções.'
                                        : 'O resultado não será exibido nas inspeções.'}
                                </p>
                            </div>

                            <label htmlFor="exibe_resultado" className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    id="exibe_resultado"
                                    name="exibe_resultado"
                                    className="peer sr-only"
                                    defaultChecked={tipoInspecao.exibe_resultado === "S"}
                                    onChange={(e) => setExibeResultado(e.target.checked)}
                                />
                                <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-[#09A08D] peer-checked:after:translate-x-full peer-focus:ring-4 peer-focus:ring-[#09A08D]/30"></div>
                            </label>
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