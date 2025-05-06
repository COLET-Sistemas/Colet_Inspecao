"use client";

import { useApiConfig } from "@/hooks/useApiConfig";
import { createCotaCaracteristica, updateCotaCaracteristica } from "@/services/api/cotasCaracteristicasService";
import { CotaCaracteristica } from "@/types/cadastros/cotaCaracteristica";
import { motion } from "framer-motion";
import { AlertCircle, CircleCheck, Code, FileText, Info, Ruler } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FormModal } from "../FormModal";

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
    const { getAuthHeaders } = useApiConfig();
    const [error, setError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState<string | null>(null);
    const [svgPreview, setSvgPreview] = useState<string>(cotaCaracteristica?.simbolo_path_svg || '');

    // Atualizar a prévia quando o modal é aberto com um item existente
    useEffect(() => {
        if (isOpen) {
            setSvgPreview(cotaCaracteristica?.simbolo_path_svg || '');
        }
    }, [isOpen, cotaCaracteristica]);

    // Função para atualizar a prévia do SVG
    const handleSvgChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const svgContent = e.target.value.trim();
        setSvgPreview(svgContent);
    };

    const handleSubmit = useCallback(
        async (formData: any) => {
            try {
                setError(null);

                // Validar campos obrigatórios
                if (!formData.descricao?.trim()) {
                    setError("A descrição é obrigatória");
                    return;
                }

                if (!formData.tipo?.trim()) {
                    setError("O tipo é obrigatório");
                    return;
                }

                if (!formData.unidade_medida?.trim()) {
                    setError("A unidade de medida é obrigatória");
                    return;
                }

                // Processar o valor do SVG - remover tags <svg></svg> se estiverem presentes
                let svgContent = formData.simbolo_path_svg?.trim() || "";
                // Remover as tags <svg> e </svg> se existirem, preservando apenas o conteúdo interno
                svgContent = svgContent.replace(/<svg[^>]*>|<\/svg>/gi, '').trim();

                const payload: {
                    descricao: string;
                    tipo: string;
                    simbolo_path_svg: string;
                    unidade_medida: string;
                    id?: number;
                } = {
                    descricao: formData.descricao.trim(),
                    tipo: formData.tipo.trim(),
                    simbolo_path_svg: svgContent,
                    unidade_medida: formData.unidade_medida?.trim() || "",
                };

                let responseData;

                if (cotaCaracteristica?.id) {
                    // Modo de edição - PUT
                    try {
                        responseData = await updateCotaCaracteristica(
                            {
                                id: Number(cotaCaracteristica.id),
                                descricao: payload.descricao,
                                tipo: payload.tipo,
                                simbolo_path_svg: payload.simbolo_path_svg,
                                unidade_medida: payload.unidade_medida
                            },
                            getAuthHeaders()
                        );
                    } catch (error: any) {
                        throw new Error(error.message || error.erro || "Erro ao atualizar cota/característica");
                    }
                } else {
                    // Modo de criação - POST
                    try {
                        responseData = await createCotaCaracteristica(
                            {
                                descricao: payload.descricao,
                                tipo: payload.tipo,
                                simbolo_path_svg: payload.simbolo_path_svg,
                                unidade_medida: payload.unidade_medida
                            },
                            getAuthHeaders()
                        );
                    } catch (error: any) {
                        throw new Error(error.message || error.erro || "Erro ao criar cota/característica");
                    }
                }

                // Se não temos um ID na resposta, pode ser necessário usar um ID temporário
                if (!responseData || responseData.id === undefined) {
                    console.warn("API não retornou um ID válido. Usando um ID temporário.");
                    responseData = {
                        ...payload,
                        id: cotaCaracteristica?.id || Math.floor(Math.random() * 10000) + 1 // Usa o ID existente ou cria um temporário
                    };
                }

                if (onSuccess) {
                    // Garantir que todos os campos necessários estejam presentes
                    const successData = {
                        ...responseData,
                        id: responseData.id,
                        descricao: responseData.descricao || formData.descricao.trim(),
                        tipo: responseData.tipo || formData.tipo.trim(),
                        simbolo_path_svg: responseData.simbolo_path_svg || formData.simbolo_path_svg?.trim() || "",
                        unidade_medida: responseData.unidade_medida || formData.unidade_medida?.trim() || "",
                    };
                    onSuccess(successData);
                }

                onClose();

            } catch (err: any) {
                console.error("Erro ao processar formulário:", err);
                const errorMessage = err.message || "Ocorreu um erro inesperado";
                // Fechar o modal em caso de erro
                onClose();
                // Propagar o erro para o componente pai
                if (onError) {
                    onError(errorMessage);
                }
            }
        },
        [cotaCaracteristica, onClose, onSuccess, onError, getAuthHeaders]
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

    const getTipoLabel = (tipo: string) => {
        switch (tipo) {
            case 'O': return 'Cota';
            case 'A': return 'Característica';
            default: return 'Outro';
        }
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
                                placeholder="Insira a descrição da cota/característica"
                                defaultValue={cotaCaracteristica?.descricao || ""}
                                required
                                onFocus={() => setIsFocused('descricao')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Campos de tipo e unidade de medida na mesma linha */}
                    <div className="mb-4 grid grid-cols-2 gap-4">
                        {/* Campo de tipo (select) */}
                        <div>
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
                                    defaultValue={cotaCaracteristica?.tipo || ""}
                                    onFocus={() => setIsFocused('tipo')}
                                    onBlur={() => setIsFocused(null)}
                                >
                                    <option value="" disabled>Selecione o tipo</option>
                                    <option value="O">Cota</option>
                                    <option value="A">Característica</option>
                                </select>
                            </div>
                        </div>

                        {/* Campo de unidade de medida */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <Ruler className="h-4 w-4 text-gray-500" />
                                    <label htmlFor="unidade_medida" className="text-sm font-medium text-gray-700">
                                        Unidade de Medida <span className="text-red-500">*</span>
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
                                    required
                                    onFocus={() => setIsFocused('unidade_medida')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Campo para símbolo SVG com prévia */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <Code className="h-4 w-4 text-gray-500" />
                                <label htmlFor="simbolo_path_svg" className="text-sm font-medium text-gray-700">
                                    Símbolo SVG
                                </label>
                            </div>
                        </div>

                        {/* Layout em grid com textarea à esquerda e visualização à direita */}
                        <div className="grid grid-cols-1 md:grid-cols-2  gap-3">
                            {/* Textarea para código SVG à esquerda */}
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

                            {/* Área de visualização do SVG à direita */}
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

                    {/* Mensagem sobre campos obrigatórios */}
                    <div className="text-xs text-gray-500 mt-4">
                        <span className="text-red-500">*</span> Campos obrigatórios
                    </div>
                </div>
            </div>
        </FormModal>
    );
}