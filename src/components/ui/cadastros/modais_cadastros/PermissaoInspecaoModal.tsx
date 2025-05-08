"use client";

import { useApiConfig } from "@/hooks/useApiConfig";
import { updatePermissaoInspecao } from "@/services/api/permissaoInspecaoService";
import { getTiposInspecao } from "@/services/api/tipoInspecaoService";
import { PermissaoInspecao } from "@/types/cadastros/permissaoInspecao";
import { TipoInspecao } from "@/types/cadastros/tipoInspecao";
import { motion } from "framer-motion";
import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FormModal } from "../FormModal";

interface PermissaoInspecaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    permissaoInspecao: PermissaoInspecao; // Object is required
    onSuccess?: (data: PermissaoInspecao) => void;
    onError?: (error: string) => void;
}

export function PermissaoInspecaoModal({
    isOpen,
    onClose,
    permissaoInspecao,
    onSuccess,
    onError,
}: PermissaoInspecaoModalProps) {
    const { getAuthHeaders } = useApiConfig();
    const [error, setError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState<string | null>(null);
    const [tiposInspecao, setTiposInspecao] = useState<TipoInspecao[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInspecoes, setSelectedInspecoes] = useState<string[]>([]);

    // Fetch inspection types when modal is opened
    useEffect(() => {
        if (isOpen) {
            const fetchTiposInspecao = async () => {
                try {
                    setLoading(true);
                    const headers = await getAuthHeaders();
                    const data = await getTiposInspecao(headers);
                    setTiposInspecao(data.filter(item => item.situacao === 'A'));

                    // Parse current selected inspections from the string
                    const currentInspecoes = permissaoInspecao.inspecoes || '';
                    const selectedIds = Array.from(currentInspecoes).map(char => char);
                    setSelectedInspecoes(selectedIds);
                } catch (err) {
                    console.error('Erro ao buscar tipos de inspeção:', err);
                    setError('Não foi possível carregar os tipos de inspeção');
                } finally {
                    setLoading(false);
                }
            };

            fetchTiposInspecao();
        }
    }, [isOpen, getAuthHeaders, permissaoInspecao.inspecoes]);

    // Handle checkbox change
    const handleCheckboxChange = (id: string) => {
        setSelectedInspecoes(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleSubmit = useCallback(
        async (formData: any) => {
            try {
                setError(null);

                if (selectedInspecoes.length === 0) {
                    setError("Selecione pelo menos um tipo de inspeção");
                    return;
                }

                // Sort inspection IDs numerically and join them without separators
                const sortedInspecoes = [...selectedInspecoes].sort((a, b) => parseInt(a) - parseInt(b)).join('');

                const payload: PermissaoInspecao = {
                    operador: permissaoInspecao.operador,
                    nome_operador: permissaoInspecao.nome_operador,
                    situacao: permissaoInspecao.situacao, // Maintain the original status
                    inspecoes: sortedInspecoes,
                };

                try {
                    const headers = await getAuthHeaders();
                    const responseData = await updatePermissaoInspecao(payload, headers);

                    if (onSuccess) {
                        onSuccess({
                            ...responseData,
                            operador: responseData.operador || payload.operador,
                            nome_operador: responseData.nome_operador || payload.nome_operador,
                            situacao: responseData.situacao || payload.situacao,
                            inspecoes: responseData.inspecoes || payload.inspecoes
                        });
                    }
                    onClose();
                } catch (error: any) {
                    throw new Error(error.message || "Erro ao atualizar permissão de inspeção");
                }

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
        [permissaoInspecao, onClose, onSuccess, onError, getAuthHeaders, selectedInspecoes]
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
            title="Editar Permissão de Inspeção"
            isEditing={true}
            onSubmit={handleSubmit}
            submitLabel="Salvar alterações"
            size="md"
        >
            {renderFeedback()}

            <div className="space-y-4">
                <div className="bg-white rounded-md">
                    {/* Informações do Operador (não editáveis) */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <div className="mb-2">
                            <h3 className="text-sm font-medium text-gray-700">Informações do Operador</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Código</p>
                                <p className="text-sm text-gray-900">{permissaoInspecao.operador}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500">Nome</p>
                                <p className="text-sm text-gray-900">{permissaoInspecao.nome_operador}</p>
                            </div>
                        </div>
                    </div>

                    {/* Campo de permissões */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label className="text-sm font-medium text-gray-700">
                                    Tipos de Inspeção <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
                                <span className="ml-2 text-sm text-gray-600">Carregando tipos de inspeção...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 rounded-md border border-gray-200 p-3">
                                {tiposInspecao.length > 0 ? (
                                    tiposInspecao.map((tipo) => (
                                        <div key={tipo.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`tipo-${tipo.id}`}
                                                className="rounded border-gray-300 text-[#09A08D] focus:ring-[#09A08D] h-4 w-4 cursor-pointer"
                                                checked={selectedInspecoes.includes(tipo.id)}
                                                onChange={() => handleCheckboxChange(tipo.id)}
                                            />
                                            <label
                                                htmlFor={`tipo-${tipo.id}`}
                                                className="ml-2 text-sm text-gray-700 cursor-pointer flex-1"
                                            >
                                                <span className="font-medium">{tipo.id}</span> - {tipo.descricao_tipo_inspecao}
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500 text-center py-2">
                                        Nenhum tipo de inspeção disponível
                                    </div>
                                )}
                            </div>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Selecione os tipos de inspeção que o operador poderá acessar
                        </p>

                        {/* Hidden input field to store the selected values */}
                        <input
                            type="hidden"
                            id="inspecoes"
                            name="inspecoes"
                            value={selectedInspecoes.sort((a, b) => parseInt(a) - parseInt(b)).join('')}
                        />
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