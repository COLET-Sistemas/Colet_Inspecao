"use client";

import { useApiConfig } from "@/hooks/useApiConfig";
import { motion } from "framer-motion";
import { AlertCircle, CalendarClock, FileText, MessageSquare, Ruler, Tag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FormModal } from "../FormModal";

interface TipoInstrumentoMedicao {
    id: number;
    nome_tipo_instrumento: string;
}

interface InstrumentoMedicao {
    id?: number;
    id_tipo_instrumento_medicao?: number;
    nome?: string;
    codigo?: string;
    descricao?: string;
    data_calibracao_inicial?: string;
    data_calibracao_vencimento?: string;
}

interface InstrumentoMedicaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    instrumentoMedicao?: InstrumentoMedicao;
    tiposInstrumentosMedicao?: TipoInstrumentoMedicao[];
    onSuccess?: (data: InstrumentoMedicao) => void;
}

export function InstrumentoMedicaoModal({
    isOpen,
    onClose,
    instrumentoMedicao,
    tiposInstrumentosMedicao = [],
    onSuccess,
}: InstrumentoMedicaoModalProps) {
    const { apiUrl, getAuthHeaders } = useApiConfig();
    const [error, setError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState<string | null>(null);
    const [dataCalibracaoInicial, setDataCalibracaoInicial] = useState<string>("");
    const [dataCalibracaoVencimento, setDataCalibracaoVencimento] = useState<string>("");

    // Inicializar as datas quando o componente montar ou o instrumentoMedicao mudar
    useEffect(() => {
        if (instrumentoMedicao?.data_calibracao_inicial) {
            const formattedDate = formatDateForInput(instrumentoMedicao.data_calibracao_inicial);
            setDataCalibracaoInicial(formattedDate);
        }

        if (instrumentoMedicao?.data_calibracao_vencimento) {
            const formattedDate = formatDateForInput(instrumentoMedicao.data_calibracao_vencimento);
            setDataCalibracaoVencimento(formattedDate);
        }
    }, [instrumentoMedicao]);

    // Função para formatar datas para input do tipo date (YYYY-MM-DD)
    const formatDateForInput = (dateString: string): string => {
        // Se a data já estiver no formato YYYY-MM-DD, retorna como está
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error("Erro ao formatar data:", error);
            return "";
        }
    };

    const handleSubmit = useCallback(
        async (formData: any) => {
            try {
                setError(null);

                // Validar campos obrigatórios
                if (!formData.nome?.trim()) {
                    setError("O nome do instrumento é obrigatório");
                    return;
                }

                if (!formData.id_tipo_instrumento_medicao) {
                    setError("O tipo de instrumento é obrigatório");
                    return;
                }

                const payload: {
                    id_tipo_instrumento_medicao: number;
                    nome: string;
                    codigo?: string;
                    descricao?: string;
                    data_calibracao_inicial?: string;
                    data_calibracao_vencimento?: string;
                    id?: number;
                } = {
                    id_tipo_instrumento_medicao: Number(formData.id_tipo_instrumento_medicao),
                    nome: formData.nome.trim(),
                    codigo: formData.codigo?.trim() || "",
                    descricao: formData.descricao?.trim() || "",
                };

                // Adicionar datas apenas se preenchidas
                if (formData.data_calibracao_inicial) {
                    payload.data_calibracao_inicial = formData.data_calibracao_inicial;
                }

                if (formData.data_calibracao_vencimento) {
                    payload.data_calibracao_vencimento = formData.data_calibracao_vencimento;
                }

                let response;
                let url = `${apiUrl}/inspecao/instrumentos_medicao`;

                if (instrumentoMedicao?.id) {
                    // Modo de edição - PUT
                    response = await fetch(`${url}?id=${instrumentoMedicao.id}`, {
                        method: "PUT",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            ...payload,
                            id: Number(instrumentoMedicao.id),
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

                if (!response.ok || response.status === 299) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(
                        errorData?.message ||
                        `Erro ao ${instrumentoMedicao?.id ? "atualizar" : "criar"} instrumento de medição`
                    );
                }

                let responseData;
                try {
                    responseData = await response.json();
                } catch (err) {
                    // Se a API não retornou dados JSON válidos, construímos o objeto de resposta com os dados do formulário
                    responseData = {
                        id: instrumentoMedicao?.id || undefined,
                        ...payload
                    };
                }

                if (onSuccess) {
                    onSuccess(responseData);
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
                instrumentoMedicao?.id
                    ? "Editar Instrumento de Medição"
                    : "Novo Instrumento de Medição"
            }
            isEditing={!!instrumentoMedicao?.id}
            onSubmit={handleSubmit}
            submitLabel={instrumentoMedicao?.id ? "Salvar alterações" : "Criar instrumento"}
            size="md"
        >
            {renderFeedback()}

            <div className="space-y-4">
                <div className="bg-white rounded-md">
                    {/* Select de tipo de instrumento */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <Ruler className="h-4 w-4 text-gray-500" />
                                <label htmlFor="id_tipo_instrumento_medicao" className="text-sm font-medium text-gray-700">
                                    Tipo de Instrumento <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200 ${isFocused === 'tipo' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <select
                                id="id_tipo_instrumento_medicao"
                                name="id_tipo_instrumento_medicao"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                defaultValue={instrumentoMedicao?.id_tipo_instrumento_medicao || ""}
                                required
                                onFocus={() => setIsFocused('tipo')}
                                onBlur={() => setIsFocused(null)}
                            >
                                <option value="" disabled>
                                    Selecione o tipo de instrumento
                                </option>
                                {tiposInstrumentosMedicao.map((tipo) => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.nome_tipo_instrumento}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Campo de nome */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="nome" className="text-sm font-medium text-gray-700">
                                    Nome <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200 ${isFocused === 'nome' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <input
                                type="text"
                                id="nome"
                                name="nome"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Insira o nome do instrumento"
                                defaultValue={instrumentoMedicao?.nome || ""}
                                required
                                onFocus={() => setIsFocused('nome')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Campo de código */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <Tag className="h-4 w-4 text-gray-500" />
                                <label htmlFor="codigo" className="text-sm font-medium text-gray-700">
                                    Código
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200 ${isFocused === 'codigo' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <input
                                type="text"
                                id="codigo"
                                name="codigo"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Código do instrumento (opcional)"
                                defaultValue={instrumentoMedicao?.codigo || ""}
                                onFocus={() => setIsFocused('codigo')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Campo de descrição */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <MessageSquare className="h-4 w-4 text-gray-500" />
                                <label htmlFor="descricao" className="text-sm font-medium text-gray-700">
                                    Descrição
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200 ${isFocused === 'descricao' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <textarea
                                id="descricao"
                                name="descricao"
                                rows={2}
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300 resize-none"
                                placeholder="Descrição do instrumento (opcional)"
                                defaultValue={instrumentoMedicao?.descricao || ""}
                                onFocus={() => setIsFocused('descricao')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Grupo de campos de calibração */}
                    <div className="mb-4 pt-1.5 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                            Informações de Calibração
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Data de calibração inicial */}
                            <div>
                                <div className="flex items-center space-x-2 mb-2">
                                    <CalendarClock className="h-4 w-4 text-gray-500" />
                                    <label htmlFor="data_calibracao_inicial" className="text-sm font-medium text-gray-700">
                                        Data Inicial
                                    </label>
                                </div>
                                <div className={`relative transition-all duration-200 ${isFocused === 'data_inicial' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                    <input
                                        type="date"
                                        id="data_calibracao_inicial"
                                        name="data_calibracao_inicial"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                        value={dataCalibracaoInicial}
                                        onChange={(e) => setDataCalibracaoInicial(e.target.value)}
                                        onFocus={() => setIsFocused('data_inicial')}
                                        onBlur={() => setIsFocused(null)}
                                    />
                                </div>
                            </div>

                            {/* Data de vencimento da calibração */}
                            <div>
                                <div className="flex items-center space-x-2 mb-2">
                                    <CalendarClock className="h-4 w-4 text-gray-500" />
                                    <label htmlFor="data_calibracao_vencimento" className="text-sm font-medium text-gray-700">
                                        Data de Vencimento
                                    </label>
                                </div>
                                <div className={`relative transition-all duration-200 ${isFocused === 'data_vencimento' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                    <input
                                        type="date"
                                        id="data_calibracao_vencimento"
                                        name="data_calibracao_vencimento"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                        value={dataCalibracaoVencimento}
                                        onChange={(e) => setDataCalibracaoVencimento(e.target.value)}
                                        onFocus={() => setIsFocused('data_vencimento')}
                                        onBlur={() => setIsFocused(null)}
                                    />
                                </div>
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