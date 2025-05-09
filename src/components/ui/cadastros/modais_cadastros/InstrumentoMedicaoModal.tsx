"use client";

import { useApiConfig } from "@/hooks/useApiConfig";
import { InstrumentoMedicao } from "@/types/cadastros/instrumentoMedicao";
import { TipoInstrumentoMedicao } from "@/types/cadastros/tipoInstrumentoMedicao";
import { motion } from "framer-motion";
import { AlertCircle, FileText, Tag } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tiposInstrumentos, setTiposInstrumentos] = useState<TipoInstrumentoMedicao[]>([]);
    const [isLoadingTipos, setIsLoadingTipos] = useState(true);

    const codigoArtigoRef = useRef<HTMLInputElement>(null);

    // Carregar os tipos de instrumentos de medição quando o modal abrir
    useEffect(() => {
        if (isOpen) {
            const fetchTiposInstrumentos = async () => {
                setIsLoadingTipos(true);
                try {
                    const response = await fetch(`${apiUrl}/inspecao/tipos_instrumentos_medicao`, {
                        headers: getAuthHeaders(),
                        method: 'GET'
                    });

                    if (!response.ok) {
                        throw new Error(`Erro ao buscar tipos de instrumentos: ${response.status}`);
                    }

                    const data = await response.json();
                    setTiposInstrumentos(Array.isArray(data) ? data.map(item => ({
                        id: item.id !== undefined && item.id !== null ? Number(item.id) : 0,
                        nome_tipo_instrumento: item.nome_tipo_instrumento || '',
                        observacao: item.observacao || ''
                    })) : []);
                } catch (err) {
                    console.error("Erro ao buscar tipos de instrumentos de medição:", err);
                    setError("Não foi possível carregar os tipos de instrumentos de medição.");
                } finally {
                    setIsLoadingTipos(false);
                }
            };

            fetchTiposInstrumentos();
        }
    }, [isOpen, apiUrl, getAuthHeaders]);

    // Função para validar o código do artigo
    const validateArticleCode = async (codigoArtigo: string): Promise<boolean> => {
        if (!codigoArtigo || codigoArtigo.trim() === "") {
            return true;
        }

        try {
            const response = await fetch(`${apiUrl}/produtos?referencia=${encodeURIComponent(codigoArtigo)}`, {
                headers: getAuthHeaders(),
                method: 'GET'
            });

            // Status 200 significa válido
            return response.status === 200;
        } catch (error) {
            console.error("Erro ao validar código do artigo:", error);
            return false;
        }
    };

    const handleSubmit = useCallback(
        async (formData: any) => {
            try {
                setError(null);
                setIsSubmitting(true);

                // Validar campos obrigatórios
                if (!formData.nome_instrumento?.trim()) {
                    setError("O nome do instrumento é obrigatório");
                    setIsSubmitting(false);
                    return;
                }

                if (!formData.tag?.trim()) {
                    setError("A TAG do instrumento é obrigatória");
                    setIsSubmitting(false);
                    return;
                }

                // Validar o código do artigo se estiver preenchido
                const codigoArtigo = formData.codigo_artigo?.trim() || "";
                const isArticleCodeValid = await validateArticleCode(codigoArtigo);

                if (codigoArtigo && !isArticleCodeValid) {
                    setError("Código do artigo inválido. Por favor, verifique o código informado.");
                    setIsSubmitting(false);
                    return;
                }

                const payload: {
                    tag: string;
                    nome_instrumento: string;
                    codigo_artigo: string;
                    numero_patrimonio: string;
                    numero_serie: string;
                    situacao: "A" | "I";
                    data_validade: string;
                    data_ultima_calibracao: string;
                    frequencia_calibracao: string;
                    id_tipo_instrumento?: number;
                    id_instrumento?: number;
                } = {
                    tag: formData.tag.trim(),
                    nome_instrumento: formData.nome_instrumento.trim(),
                    codigo_artigo: codigoArtigo,
                    numero_patrimonio: formData.numero_patrimonio?.trim() || "",
                    numero_serie: formData.numero_serie?.trim() || "",
                    situacao: formData.situacao || "A",
                    data_validade: formData.data_validade || "",
                    data_ultima_calibracao: formData.data_ultima_calibracao || "",
                    frequencia_calibracao: formData.frequencia_calibracao || ""
                };

                // Adicionar ID se estiver editando
                if (instrumentoMedicao?.id_instrumento) {
                    payload.id_instrumento = instrumentoMedicao.id_instrumento;
                }

                // Adicionar id_tipo_instrumento com base na seleção do usuário
                if (formData.id_tipo_instrumento) {
                    payload.id_tipo_instrumento = Number(formData.id_tipo_instrumento);
                } else if (instrumentoMedicao?.id_tipo_instrumento) {
                    payload.id_tipo_instrumento = instrumentoMedicao.id_tipo_instrumento;
                } else {
                    // Se nenhum tipo foi selecionado, mostrar erro
                    setError("Selecione um tipo de instrumento de medição");
                    setIsSubmitting(false);
                    return;
                }

                let response;
                let url = `${apiUrl}/inspecao/instrumentos_medicao`;

                if (instrumentoMedicao?.id_instrumento) {
                    // Modo de edição - PUT
                    response = await fetch(`${url}?id=${instrumentoMedicao.id_instrumento}`, {
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
                        `Erro ao ${instrumentoMedicao?.id_instrumento ? "atualizar" : "criar"} instrumento de medição`
                    );
                }

                let responseData;
                try {
                    responseData = await response.json();
                } catch (err) {
                    // Se a API não retornou dados JSON válidos, construímos o objeto de resposta com os dados do formulário
                    responseData = {
                        id_instrumento: instrumentoMedicao?.id_instrumento || 0,
                        id_tipo_instrumento: instrumentoMedicao?.id_tipo_instrumento || 0,
                        ...payload
                    };
                }

                // Garantir que o objeto tenha a propriedade 'id' para compatibilidade com componentes
                responseData.id = responseData.id_instrumento;

                if (onSuccess) {
                    onSuccess(responseData as InstrumentoMedicao);
                }
                onClose();

            } catch (err: any) {
                console.error("Erro ao processar formulário:", err);
                setError(err.message || "Ocorreu um erro inesperado");
            } finally {
                setIsSubmitting(false);
            }
        },
        [apiUrl, onClose, onSuccess, instrumentoMedicao, getAuthHeaders, validateArticleCode]
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
                instrumentoMedicao?.id_instrumento
                    ? "Editar Instrumento de Medição"
                    : "Novo Instrumento de Medição"
            }
            isEditing={!!instrumentoMedicao?.id_instrumento}
            onSubmit={handleSubmit}
            submitLabel={instrumentoMedicao?.id_instrumento ? "Salvar alterações" : "Criar instrumento"}
            isSubmitting={isSubmitting}
            size="md"
        >
            {renderFeedback()}

            <div className="space-y-4">
                <div className="bg-white rounded-md">
                    {/* Linha 1: Nome (ocupando toda a linha no cadastro, compartilhando com Situação na edição) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Campo de nome */}
                        <div className={instrumentoMedicao?.id_instrumento ? "md:col-span-1" : "md:col-span-2"}>
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

                        {/* Campo de situação (status) - visível apenas na edição, ao lado do nome */}
                        {instrumentoMedicao?.id_instrumento && (
                            <div>
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
                        )}
                    </div>

                    {/* Linha 2: TAG e Código do artigo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Campo de TAG */}
                        <div>
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

                        {/* Campo de código do artigo - sem botão de validação */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <label htmlFor="codigo_artigo" className="text-sm font-medium text-gray-700">
                                        Código do Artigo
                                    </label>
                                </div>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'codigo_artigo' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="text"
                                    id="codigo_artigo"
                                    name="codigo_artigo"
                                    ref={codigoArtigoRef}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    placeholder="Código do artigo"
                                    defaultValue={instrumentoMedicao?.codigo_artigo || ""}
                                    onFocus={() => setIsFocused('codigo_artigo')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Linha 3: Número do patrimônio e Número de série */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Campo de número de patrimônio */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <label htmlFor="numero_patrimonio" className="text-sm font-medium text-gray-700">
                                        Número do Patrimônio
                                    </label>
                                </div>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'numero_patrimonio' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="text"
                                    id="numero_patrimonio"
                                    name="numero_patrimonio"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    placeholder="Número do patrimônio"
                                    defaultValue={instrumentoMedicao?.numero_patrimonio || ""}
                                    onFocus={() => setIsFocused('numero_patrimonio')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>

                        {/* Campo de número de série */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <label htmlFor="numero_serie" className="text-sm font-medium text-gray-700">
                                        Número de Série
                                    </label>
                                </div>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'numero_serie' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="text"
                                    id="numero_serie"
                                    name="numero_serie"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    placeholder="Número de série"
                                    defaultValue={instrumentoMedicao?.numero_serie || ""}
                                    onFocus={() => setIsFocused('numero_serie')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Linha 4: Data de validade e Data da última calibração */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Campo de data de validade */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <label htmlFor="data_validade" className="text-sm font-medium text-gray-700">
                                        Data de Validade
                                    </label>
                                </div>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'data_validade' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="date"
                                    id="data_validade"
                                    name="data_validade"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    defaultValue={instrumentoMedicao?.data_validade || ""}
                                    onFocus={() => setIsFocused('data_validade')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>

                        {/* Campo de data da última calibração */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <label htmlFor="data_ultima_calibracao" className="text-sm font-medium text-gray-700">
                                        Data da Última Calibração
                                    </label>
                                </div>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'data_ultima_calibracao' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="date"
                                    id="data_ultima_calibracao"
                                    name="data_ultima_calibracao"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    defaultValue={instrumentoMedicao?.data_ultima_calibracao || ""}
                                    onFocus={() => setIsFocused('data_ultima_calibracao')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Linha 5: Frequência de calibração */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="frequencia_calibracao" className="text-sm font-medium text-gray-700">
                                    Frequência de Calibração
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200 ${isFocused === 'frequencia_calibracao' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <input
                                type="text"
                                id="frequencia_calibracao"
                                name="frequencia_calibracao"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Frequência de calibração"
                                defaultValue={instrumentoMedicao?.frequencia_calibracao || ""}
                                onFocus={() => setIsFocused('frequencia_calibracao')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Linha 6: Tipo de instrumento */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="id_tipo_instrumento" className="text-sm font-medium text-gray-700">
                                    Tipo de Instrumento
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200 ${isFocused === 'id_tipo_instrumento' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <select
                                id="id_tipo_instrumento"
                                name="id_tipo_instrumento"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                defaultValue={instrumentoMedicao?.id_tipo_instrumento || ""}
                                onFocus={() => setIsFocused('id_tipo_instrumento')}
                                onBlur={() => setIsFocused(null)}
                            >
                                <option value="" disabled>
                                    {isLoadingTipos ? "Carregando tipos..." : "Selecione um tipo"}
                                </option>
                                {tiposInstrumentos.map(tipo => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.nome_tipo_instrumento}
                                    </option>
                                ))}
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