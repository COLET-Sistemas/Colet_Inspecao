"use client";

import { useApiConfig } from "@/hooks/useApiConfig";
import { motion } from "framer-motion";
import { AlertCircle, CalendarDays, Check, FileText, Hash, ListOrdered, Tag, ToggleLeft } from "lucide-react";
import { useCallback, useState } from "react";
import { FormModal } from "../FormModal";

interface InstrumentoMedicao {
    id?: number;
    tag: string;
    nome_instrumento: string;
    numero_serie: number;
    numero_patrimonio: string;
    codigo_artigo: string;
    situacao: "A" | "I";
    data_validade: string;
    data_ultima_calibracao: string;
    frequencia_calibracao: number;
}

interface InstrumentoMedicaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    instrumento?: InstrumentoMedicao;
    onSuccess?: (data: InstrumentoMedicao) => void;
}

export function InstrumentoMedicaoModal({
    isOpen,
    onClose,
    instrumento,
    onSuccess,
}: InstrumentoMedicaoModalProps) {
    const isEditing = !!instrumento;
    const { apiUrl } = useApiConfig();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isAtivo, setIsAtivo] = useState(!instrumento || instrumento.situacao === "A");
    const [isFocused, setIsFocused] = useState<string | null>(null);

    // Formatar data para o formato do input date
    const formatDateForInput = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const handleSubmit = useCallback(
        async (formData: any) => {
            try {
                setError(null);
                setSuccess(null);

                // Validar campos obrigatórios
                if (!formData.tag?.trim()) {
                    setError("A tag do instrumento é obrigatória");
                    return;
                }

                if (!formData.nome_instrumento?.trim()) {
                    setError("O nome do instrumento é obrigatório");
                    return;
                }

                // Verificar se o número de série é um número válido
                if (isNaN(Number(formData.numero_serie))) {
                    setError("O número de série deve ser um número válido");
                    return;
                }

                // Verificar se a frequência de calibração é um número válido
                if (isNaN(Number(formData.frequencia_calibracao))) {
                    setError("A frequência de calibração deve ser um número válido");
                    return;
                }

                const payload = {
                    tag: formData.tag.trim(),
                    nome_instrumento: formData.nome_instrumento.trim(),
                    numero_serie: Number(formData.numero_serie),
                    numero_patrimonio: formData.numero_patrimonio.trim(),
                    codigo_artigo: formData.codigo_artigo.trim(),
                    situacao: formData.situacao === "on" ? "A" : "I",
                    data_validade: formData.data_validade,
                    data_ultima_calibracao: formData.data_ultima_calibracao,
                    frequencia_calibracao: Number(formData.frequencia_calibracao)
                };

                let response;
                let url = `${apiUrl}/instrumentos_medicao`;

                if (isEditing && instrumento?.id) {
                    // Modo de edição - PUT
                    response = await fetch(`${url}/${instrumento.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ...payload,
                            id: instrumento.id
                        }),
                    });
                } else {
                    // Modo de criação - POST
                    response = await fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(
                        errorData?.message ||
                        `Erro ao ${isEditing ? "atualizar" : "criar"} instrumento de medição`
                    );
                }

                const responseData = await response.json();

                setSuccess(
                    isEditing
                        ? "Instrumento de medição atualizado com sucesso!"
                        : "Instrumento de medição criado com sucesso!"
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
        [apiUrl, isEditing, onClose, onSuccess, instrumento]
    );

    // Feedback visual para sucesso ou erro
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

        if (success) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700"
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
                    ? "Editar Instrumento de Medição"
                    : "Novo Instrumento de Medição"
            }
            isEditing={isEditing}
            onSubmit={handleSubmit}
            submitLabel={isEditing ? "Salvar alterações" : "Criar instrumento"}
            size="lg"
        >
            {renderFeedback()}

            <div className="space-y-3 sm:space-y-4">
                <div className="bg-white p-2">
                    {/* Informações básicas do instrumento */}
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-3 sm:mb-4">
                        {/* Campo Tag */}
                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <Tag className="h-4 w-4 text-gray-500" />
                                <label htmlFor="tag" className="text-sm font-medium text-gray-700">
                                    Tag <span className="text-red-500">*</span>
                                </label>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'tag' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="text"
                                    id="tag"
                                    name="tag"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    placeholder="Insira a tag do instrumento"
                                    defaultValue={instrumento?.tag || ""}
                                    required
                                    onFocus={() => setIsFocused('tag')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>

                        {/* Campo Nome do Instrumento */}
                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="nome_instrumento" className="text-sm font-medium text-gray-700">
                                    Nome do Instrumento <span className="text-red-500">*</span>
                                </label>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'nome_instrumento' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="text"
                                    id="nome_instrumento"
                                    name="nome_instrumento"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    placeholder="Insira o nome do instrumento"
                                    defaultValue={instrumento?.nome_instrumento || ""}
                                    required
                                    onFocus={() => setIsFocused('nome_instrumento')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Grupo de Número de Série, Número de Patrimônio e Código do Artigo em uma linha */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                        {/* Campo Número de Série */}
                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <Hash className="h-4 w-4 text-gray-500" />
                                <label htmlFor="numero_serie" className="text-sm font-medium text-gray-700">
                                    Número de Série <span className="text-red-500">*</span>
                                </label>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'numero_serie' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="number"
                                    id="numero_serie"
                                    name="numero_serie"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    placeholder="Insira o número de série"
                                    defaultValue={instrumento?.numero_serie || ""}
                                    required
                                    onFocus={() => setIsFocused('numero_serie')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>

                        {/* Campo Número de Patrimônio */}
                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <Hash className="h-4 w-4 text-gray-500" />
                                <label htmlFor="numero_patrimonio" className="text-sm font-medium text-gray-700">
                                    Número de Patrimônio
                                </label>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'numero_patrimonio' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="text"
                                    id="numero_patrimonio"
                                    name="numero_patrimonio"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    placeholder="Insira o número de patrimônio"
                                    defaultValue={instrumento?.numero_patrimonio || ""}
                                    onFocus={() => setIsFocused('numero_patrimonio')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>

                        {/* Campo Código do Artigo */}
                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="codigo_artigo" className="text-sm font-medium text-gray-700">
                                    Código do Artigo
                                </label>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'codigo_artigo' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="text"
                                    id="codigo_artigo"
                                    name="codigo_artigo"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    placeholder="Insira o cód. do artigo"
                                    defaultValue={instrumento?.codigo_artigo || ""}
                                    onFocus={() => setIsFocused('codigo_artigo')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Grupo de Data de Validade, Data da Última Calibração e Frequência de Calibração em uma linha */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                        {/* Campo Data de Validade */}
                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <CalendarDays className="h-4 w-4 text-gray-500" />
                                <label htmlFor="data_validade" className="text-sm font-medium text-gray-700">
                                    Data de Validade
                                </label>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'data_validade' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="date"
                                    id="data_validade"
                                    name="data_validade"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    defaultValue={formatDateForInput(instrumento?.data_validade || "")}
                                    onFocus={() => setIsFocused('data_validade')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>

                        {/* Campo Data da Última Calibração */}
                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <CalendarDays className="h-4 w-4 text-gray-500" />
                                <label htmlFor="data_ultima_calibracao" className="text-sm font-medium text-gray-700">
                                    Data Última Calibração
                                </label>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'data_ultima_calibracao' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="date"
                                    id="data_ultima_calibracao"
                                    name="data_ultima_calibracao"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    defaultValue={formatDateForInput(instrumento?.data_ultima_calibracao || "")}
                                    onFocus={() => setIsFocused('data_ultima_calibracao')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>

                        {/* Campo Frequência de Calibração */}
                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <ListOrdered className="h-4 w-4 text-gray-500" />
                                <label htmlFor="frequencia_calibracao" className="text-sm font-medium text-gray-700">
                                    Frequência Calibração
                                </label>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'frequencia_calibracao' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="number"
                                    id="frequencia_calibracao"
                                    name="frequencia_calibracao"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    placeholder="Ex: 180 (em dias)"
                                    defaultValue={instrumento?.frequencia_calibracao || ""}
                                    min="1"
                                    onFocus={() => setIsFocused('frequencia_calibracao')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Campo de status */}
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                            <ToggleLeft className="h-4 w-4 text-gray-500" />
                            <label className="text-sm font-medium text-gray-700">
                                Status
                            </label>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center p-2 sm:p-3 bg-gray-50 rounded-md border border-gray-100">
                            <div className="flex-grow mb-2 sm:mb-0">
                                <p className="text-sm text-gray-700 font-medium">
                                    {isAtivo ? 'Ativo' : 'Inativo'}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isAtivo
                                        ? 'O instrumento de medição está disponível para uso.'
                                        : 'O instrumento de medição não está disponível para uso.'}
                                </p>
                            </div>

                            <label htmlFor="situacao" className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    id="situacao"
                                    name="situacao"
                                    className="peer sr-only"
                                    defaultChecked={!instrumento || instrumento.situacao === "A"}
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