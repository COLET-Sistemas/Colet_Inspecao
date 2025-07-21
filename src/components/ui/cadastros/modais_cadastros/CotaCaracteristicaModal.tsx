"use client";

import { createCotaCaracteristica, updateCotaCaracteristica } from "@/services/api/cotasCaracteristicasService";
import { CotaCaracteristica } from "@/types/cadastros/cotaCaracteristica";
import { motion } from "framer-motion";
import { AlertCircle, CircleCheck, Code, FileText, Info, Ruler } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FormModal } from "../FormModal";

interface CotaCaracteristicaFormData {
    descricao: string;
    tipo: string;
    unidade_medida: string;
    simbolo_path_svg?: string;
    rejeita_menor: string;
    rejeita_maior: string;
    local_inspecao?: string;
}

interface ApiError {
    message?: string;
    erro?: string;
}

interface CotaCaracteristicaModalProps {
    isOpen: boolean;
    onClose: () => void;
    cotaCaracteristica?: CotaCaracteristica;
    onSuccess?: (data: CotaCaracteristica) => void;
    onError?: (error: string) => void;
}

export function CotaCaracteristicaModal({
    isOpen,
    onClose,
    cotaCaracteristica,
    onSuccess,
    onError,
}: CotaCaracteristicaModalProps) {
    const [error, setError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState<string | null>(null);
    const [svgPreview, setSvgPreview] = useState<string>(cotaCaracteristica?.simbolo_path_svg || '');
    const [selectedTipo, setSelectedTipo] = useState<string>(cotaCaracteristica?.tipo || '');

    useEffect(() => {
        if (isOpen) {
            setSvgPreview(cotaCaracteristica?.simbolo_path_svg || '');

            if (cotaCaracteristica?.tipo) {
                setSelectedTipo(cotaCaracteristica.tipo);
            } else {
                setSelectedTipo('');
            }

            setError(null);
        }
    }, [isOpen, cotaCaracteristica]);

    const handleSvgChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const svgContent = e.target.value.trim();
        setSvgPreview(svgContent);
    };

    const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTipo = e.target.value;
        setSelectedTipo(newTipo);

        if (newTipo === "A") {
            setTimeout(() => {
                const unidadeMedidaField = document.getElementById('unidade_medida') as HTMLInputElement;
                const rejeitaMenorField = document.getElementById('rejeita_menor') as HTMLSelectElement;
                const rejeitaMaiorField = document.getElementById('rejeita_maior') as HTMLSelectElement;
                const localInspecaoField = document.getElementById('local_inspecao') as HTMLSelectElement;

                if (unidadeMedidaField) unidadeMedidaField.value = '';
                if (rejeitaMenorField) rejeitaMenorField.value = 'false';
                if (rejeitaMaiorField) rejeitaMaiorField.value = 'false';
                if (localInspecaoField) localInspecaoField.value = '*';
            }, 0);
        }
    };

    const handleSubmit = useCallback(
        async (data: Record<string, FormDataEntryValue>) => {
            const formData: CotaCaracteristicaFormData = {
                descricao: String(data.descricao || ""),
                tipo: String(data.tipo || ""),
                unidade_medida: String(data.unidade_medida || ""),
                simbolo_path_svg: data.simbolo_path_svg ? String(data.simbolo_path_svg) : undefined,
                rejeita_menor: String(data.rejeita_menor || "false"),
                rejeita_maior: String(data.rejeita_maior || "false"),
                local_inspecao: data.local_inspecao ? String(data.local_inspecao) : undefined,
            };

            try {
                setError(null);

                if (!formData.descricao?.trim()) {
                    setError("A descrição é obrigatória");
                    return;
                }

                if (!formData.tipo?.trim()) {
                    setError("O tipo é obrigatório");
                    return;
                }

                let svgContent = formData.simbolo_path_svg?.trim() || "";
                svgContent = svgContent.replace(/<svg[^>]*>|<\/svg>/gi, '').trim(); const payload: {
                    descricao: string;
                    tipo: string;
                    simbolo_path_svg: string;
                    unidade_medida: string | null;
                    rejeita_menor: string | null;
                    rejeita_maior: string | null;
                    local_inspecao: 'P' | 'Q' | '*' | null;
                    id?: number;
                } = {
                    descricao: formData.descricao.trim(),
                    tipo: formData.tipo.trim(),
                    simbolo_path_svg: svgContent,
                    unidade_medida: formData.tipo.trim() === "O" ? (formData.unidade_medida?.trim() || "") : null,
                    rejeita_menor: formData.tipo.trim() === "O" ? (formData.rejeita_menor === "true" || formData.rejeita_menor === "sim" ? "s" : "n") : null,
                    rejeita_maior: formData.tipo.trim() === "O" ? (formData.rejeita_maior === "true" || formData.rejeita_maior === "sim" ? "s" : "n") : null,
                    local_inspecao: formData.tipo.trim() === "O" ? (formData.local_inspecao as 'P' | 'Q' | '*') || null : null
                };

                let responseData: CotaCaracteristica;

                if (cotaCaracteristica?.id) {
                    try {
                        responseData = await updateCotaCaracteristica({
                            id: Number(cotaCaracteristica.id),
                            descricao: payload.descricao,
                            tipo: payload.tipo,
                            simbolo_path_svg: payload.simbolo_path_svg,
                            unidade_medida: payload.unidade_medida,
                            rejeita_menor: payload.rejeita_menor,
                            rejeita_maior: payload.rejeita_maior,
                            local_inspecao: payload.local_inspecao
                        });
                    } catch (error: unknown) {
                        const apiError = error as ApiError;
                        throw new Error(apiError.message || apiError.erro || "Erro ao atualizar cota/característica");
                    }
                } else {
                    try {
                        responseData = await createCotaCaracteristica({
                            descricao: payload.descricao,
                            tipo: payload.tipo,
                            simbolo_path_svg: payload.simbolo_path_svg,
                            unidade_medida: payload.unidade_medida,
                            rejeita_menor: payload.rejeita_menor,
                            rejeita_maior: payload.rejeita_maior,
                            local_inspecao: payload.local_inspecao
                        });
                    } catch (error: unknown) {
                        const apiError = error as ApiError;
                        throw new Error(apiError.message || apiError.erro || "Erro ao criar cota/característica");
                    }
                }

                if (!responseData || responseData.id === undefined) {
                    console.warn("API não retornou um ID válido. Usando um ID temporário.");
                    responseData = {
                        ...payload,
                        id: cotaCaracteristica?.id || Math.floor(Math.random() * 10000) + 1
                    };
                }

                if (onSuccess) {
                    const successData = {
                        ...responseData,
                        id: responseData.id,
                        descricao: responseData.descricao || formData.descricao.trim(),
                        tipo: responseData.tipo || formData.tipo.trim(),
                        simbolo_path_svg: responseData.simbolo_path_svg || formData.simbolo_path_svg?.trim() || "",
                        unidade_medida: formData.tipo === "O" ? (responseData.unidade_medida || formData.unidade_medida?.trim() || "") : null,
                        rejeita_menor: formData.tipo === "O" ? (responseData.rejeita_menor || (formData.rejeita_menor === "true" ? "s" : "n")) : null,
                        rejeita_maior: formData.tipo === "O" ? (responseData.rejeita_maior || (formData.rejeita_maior === "true" ? "s" : "n")) : null,
                        local_inspecao: formData.tipo === "O" ? (responseData.local_inspecao || (formData.local_inspecao as 'P' | 'Q' | '*') || null) : null
                    };
                    onSuccess(successData);
                }

                onClose();

            } catch (err: unknown) {
                console.error("Erro ao processar formulário:", err);
                const apiError = err as ApiError;
                const errorMessage = apiError.message || "Ocorreu um erro inesperado";
                onClose();
                if (onError) {
                    onError(errorMessage);
                }
            }
        },
        [cotaCaracteristica, onClose, onSuccess, onError]
    );

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
                cotaCaracteristica?.id
                    ? "Editar Cota/Característica"
                    : "Nova Cota/Característica"
            }
            isEditing={!!cotaCaracteristica?.id}
            onSubmit={handleSubmit}
            submitLabel={cotaCaracteristica?.id ? "Salvar alterações" : "Criar cota/característica"}
            size="lg"
        >
            {renderFeedback()}

            <div className="space-y-4">
                <div className="bg-white rounded-md">
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
                                placeholder="Insira a descrição da cota/característica"
                                defaultValue={cotaCaracteristica?.descricao || ""}
                                required
                                onFocus={() => setIsFocused('descricao')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className={`grid gap-4 ${selectedTipo === "O" ? "grid-cols-10" : "grid-cols-1"}`} key="tipo-layout">
                            <div className={selectedTipo === "O" ? "col-span-4" : "col-span-1"}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <CircleCheck className="h-4 w-4 text-gray-500" />
                                        <label htmlFor="tipo" className="text-sm font-medium text-gray-700">
                                            Tipo <span className="text-red-500">*</span>
                                        </label>
                                    </div>
                                </div>
                                <div className={`relative transition-all duration-200 ${isFocused === 'tipo' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                    <select
                                        id="tipo"
                                        name="tipo"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                        required
                                        value={selectedTipo}
                                        onChange={handleTipoChange}
                                        onFocus={() => setIsFocused('tipo')}
                                        onBlur={() => setIsFocused(null)}
                                    >
                                        <option value="">Selecione o tipo</option>
                                        <option value="O">Cota</option>
                                        <option value="A">Característica Especial</option>
                                    </select>
                                </div>
                            </div>

                            <div className={`col-span-3 ${selectedTipo !== "O" ? "hidden" : ""}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <CircleCheck className="h-4 w-4 text-gray-500" />
                                        <label htmlFor="rejeita_menor" className="text-sm font-medium text-gray-700">
                                            Rejeita Menor
                                        </label>
                                    </div>
                                </div>
                                <div className={`relative transition-all duration-200 ${isFocused === 'rejeita_menor' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                    <select
                                        id="rejeita_menor"
                                        name="rejeita_menor"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                        defaultValue={
                                            cotaCaracteristica?.rejeita_menor === true ||
                                                cotaCaracteristica?.rejeita_menor === "s" ||
                                                cotaCaracteristica?.rejeita_menor === "S"
                                                ? "true"
                                                : "false"
                                        }
                                        onFocus={() => setIsFocused('rejeita_menor')}
                                        onBlur={() => setIsFocused(null)}
                                        disabled={selectedTipo !== "O"}
                                    >
                                        <option value="true">Sim</option>
                                        <option value="false">Não</option>
                                    </select>
                                </div>
                            </div>

                            <div className={`col-span-3 ${selectedTipo !== "O" ? "hidden" : ""}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <CircleCheck className="h-4 w-4 text-gray-500" />
                                        <label htmlFor="rejeita_maior" className="text-sm font-medium text-gray-700">
                                            Rejeita Maior
                                        </label>
                                    </div>
                                </div>
                                <div className={`relative transition-all duration-200 ${isFocused === 'rejeita_maior' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                    <select
                                        id="rejeita_maior"
                                        name="rejeita_maior"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                        defaultValue={
                                            cotaCaracteristica?.rejeita_maior === true ||
                                                cotaCaracteristica?.rejeita_maior === "s" ||
                                                cotaCaracteristica?.rejeita_maior === "S"
                                                ? "true"
                                                : "false"
                                        }
                                        onFocus={() => setIsFocused('rejeita_maior')}
                                        onBlur={() => setIsFocused(null)}
                                        disabled={selectedTipo !== "O"}
                                    >
                                        <option value="true">Sim</option>
                                        <option value="false">Não</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {selectedTipo && (
                            <div className="mt-1 text-xs text-gray-500">
                                {selectedTipo === "O"
                                    ? "Campos de unidade de medida e local de inspeção na linha abaixo"
                                    : "Apenas descrição e símbolo são necessários"
                                }
                            </div>
                        )}
                    </div>

                    {selectedTipo === "O" && (
                        <>
                            <div className="mb-4 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <Ruler className="h-4 w-4 text-gray-500" />
                                            <label htmlFor="unidade_medida" className="text-sm font-medium text-gray-700">
                                                Unidade de Medida
                                            </label>
                                        </div>
                                    </div>
                                    <div className={`relative transition-all duration-200 ${isFocused === 'unidade_medida' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                        <input
                                            type="text"
                                            id="unidade_medida"
                                            name="unidade_medida"
                                            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                            placeholder="Ex: mm, kg, cm"
                                            defaultValue={cotaCaracteristica?.unidade_medida || ""}
                                            onFocus={() => setIsFocused('unidade_medida')}
                                            onBlur={() => setIsFocused(null)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <CircleCheck className="h-4 w-4 text-gray-500" />
                                            <label htmlFor="local_inspecao" className="text-sm font-medium text-gray-700">
                                                Local de Inspeção
                                            </label>
                                        </div>
                                    </div>
                                    <div className={`relative transition-all duration-200 ${isFocused === 'local_inspecao' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                        <select
                                            id="local_inspecao"
                                            name="local_inspecao"
                                            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                            defaultValue={cotaCaracteristica?.local_inspecao || "*"}
                                            onFocus={() => setIsFocused('local_inspecao')}
                                            onBlur={() => setIsFocused(null)}
                                        >
                                            <option value="P">Produção</option>
                                            <option value="Q">Qualidade</option>
                                            <option value="*">Ambos</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <Code className="h-4 w-4 text-gray-500" />
                                <label htmlFor="simbolo_path_svg" className="text-sm font-medium text-gray-700">
                                    Símbolo SVG
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2  gap-3">
                            <div className={`relative transition-all duration-200 border border-gray-200 p-2 ${isFocused === 'simbolo_path_svg' ? 'ring-2 ring-[#09A08D]/30  rounded-md' : ''}`}>
                                <textarea
                                    id="simbolo_path_svg"
                                    name="simbolo_path_svg"
                                    rows={6}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300 font-mono"
                                    placeholder="<circle cx='50' cy='50' r='35' stroke='black' stroke-width='4' fill='none'/>"
                                    defaultValue={cotaCaracteristica?.simbolo_path_svg || ""}
                                    onChange={handleSvgChange}
                                    onFocus={() => setIsFocused('simbolo_path_svg')}
                                    onBlur={() => setIsFocused(null)}
                                />
                                <div className="mt-1 flex items-start">
                                    <Info className="h-3.5 w-3.5 text-gray-400 mr-1 flex-shrink-0" />
                                    <p className="text-xs text-gray-500">
                                        Sem as tags &lt;svg&gt; e &lt;/svg&gt;
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-md p-3">
                                <div className="bg-white shadow-sm rounded-md p-2 w-full h-full max-h-32 flex items-center justify-center">
                                    <svg
                                        viewBox="0 0 100 100"
                                        width="100%"
                                        height="100%"
                                        className="overflow-visible"
                                        dangerouslySetInnerHTML={{ __html: svgPreview }}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-500 text-center">
                                    Visualização do símbolo
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-4">
                        <span className="text-red-500">*</span> Campos obrigatórios
                    </div>
                </div>
            </div>
        </FormModal>
    );
}