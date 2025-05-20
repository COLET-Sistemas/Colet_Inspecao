'use client';

import { useApiConfig } from '@/hooks/useApiConfig';
import { motion } from 'framer-motion';
import { AlertCircle, FileText, Ruler } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { FormModal } from '../FormModal';
import { Option, SelectWithSvg } from '../SelectWithSvg';

// Interface para os dados do modal
interface EspecificacaoDados {
    referencia: string;
    roteiro: string;
    processo: number;
    operacao: number;
    id?: number;
    especificacao_cota?: string;
    tipo_valor?: string;
    ordem?: number;
    id_cota?: number;
    complemento_cota?: string;
    id_caracteristica_especial?: number;
    caracteristica_especial?: string;
    id_tipo_instrumento?: number;
    valor_minimo?: number;
    valor_maximo?: number;
    unidade_medida?: string;
    uso_inspecao_setup?: string;
    uso_inspecao_processo?: string;
    uso_inspecao_qualidade?: string;
}

// Interface para os dados do formulário
interface FormData {
    especificacao: string;
    tipo_valor: string;
    valor_minimo?: string;
    valor_maximo?: string;
    unidade_medida?: string;
    id_cota?: number;
    complemento_cota?: string;
    id_caracteristica_especial?: number;
    caracteristica_especial?: string;
    id_tipo_instrumento?: number;
    ordem?: number;
    uso_inspecao_setup: boolean;
    uso_inspecao_processo: boolean;
    uso_inspecao_qualidade: boolean;
}

// Props do componente
interface EspecificacoesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    dados: EspecificacaoDados | null;
    modo?: 'cadastro' | 'edicao';
}

export function EspecificacoesModal({
    isOpen,
    onClose,
    dados,
    onSuccess,
    modo = 'cadastro'
}: EspecificacoesModalProps) {
    const [isFocused, setIsFocused] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTipoValor, setSelectedTipoValor] = useState(dados?.tipo_valor || '');
    const [selectedCota, setSelectedCota] = useState<Option | null>(null);
    const [selectedCaracteristica, setSelectedCaracteristica] = useState<Option | null>(null);

    const [cotasOptions, setCotasOptions] = useState<Option[]>([]);
    const [caracteristicasOptions, setCaracteristicasOptions] = useState<Option[]>([]);
    const [instrumentOptions, setInstrumentOptions] = useState<{ id: number, label: string }[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);

    const { apiUrl, getAuthHeaders } = useApiConfig();

    // Função para buscar as opções de cotas, características e instrumentos
    const fetchOptions = useCallback(async () => {
        if (!isOpen) return;

        setIsLoadingOptions(true);
        try {
            // Buscar cotas
            const cotasResponse = await fetch(`${apiUrl}/inspecao/cotas_caracteristicas?tipo=cotas`, {
                headers: getAuthHeaders()
            });
            const cotasData = await cotasResponse.json();
            setCotasOptions(cotasData);

            // Buscar características especiais
            const caracteristicasResponse = await fetch(`${apiUrl}/inspecao/cotas_caracteristicas?tipo=caracteristicas`, {
                headers: getAuthHeaders()
            });
            const caracteristicasData = await caracteristicasResponse.json();
            setCaracteristicasOptions(caracteristicasData);

            // Buscar instrumentos de medição
            const instrumentsResponse = await fetch(`${apiUrl}/inspecao/instrumentos_medicao`, {
                headers: getAuthHeaders()
            });
            const instrumentsData = await instrumentsResponse.json();
            setInstrumentOptions(Array.isArray(instrumentsData) ? instrumentsData.map(item => ({
                id: item.id_instrumento,
                label: `${item.tag} - ${item.nome_instrumento}`
            })) : []);
        } catch (error) {
            console.error("Erro ao carregar opções:", error);
            setFormError("Erro ao carregar as opções de cotas e instrumentos.");
        } finally {
            setIsLoadingOptions(false);
        }
    }, [apiUrl, getAuthHeaders, isOpen]);

    // Carregar opções quando o modal abrir
    useEffect(() => {
        if (isOpen) {
            fetchOptions();
        }
    }, [isOpen, fetchOptions]);

    // Efeito para inicializar as seleções quando os dados são carregados
    useEffect(() => {
        if (dados && cotasOptions.length > 0 && caracteristicasOptions.length > 0) {
            const cota = cotasOptions.find(c => c.id === dados.id_cota);
            if (cota) setSelectedCota(cota);

            const caracteristica = caracteristicasOptions.find(c => c.id === dados.id_caracteristica_especial);
            if (caracteristica) setSelectedCaracteristica(caracteristica);
        }
    }, [dados, cotasOptions, caracteristicasOptions, instrumentOptions]);

    // Renderiza mensagens de erro
    const renderFeedback = () => {
        if (formError) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                    <AlertCircle className="mr-2 h-4 w-4 text-red-500 flex-shrink-0" />
                    <span>{formError}</span>
                </motion.div>
            );
        }
        return null;
    };

    // Handler para submissão do formulário
    const handleSubmit = useCallback(
        async (formData: FormData) => {
            try {
                setFormError(null);
                setIsSubmitting(true);

                // Validação
                if (!formData.especificacao?.trim()) {
                    setFormError("A especificação é obrigatória");
                    setIsSubmitting(false);
                    return;
                }

                if (!formData.tipo_valor) {
                    setFormError("O tipo de valor é obrigatório");
                    setIsSubmitting(false);
                    return;
                }

                if (!dados) {
                    setIsSubmitting(false);
                    return;
                }

                // Garantir que roteiro seja enviado como número
                const roteiroNum = typeof dados.roteiro === 'string' ? parseInt(dados.roteiro) : dados.roteiro;

                // Determinar os valores mínimo e máximo com base no tipo de valor
                let valorMinimo = null;
                let valorMaximo = null;

                if (formData.tipo_valor === 'F') {
                    valorMinimo = formData.valor_minimo ? parseFloat(formData.valor_minimo) : null;
                    valorMaximo = formData.valor_maximo ? parseFloat(formData.valor_maximo) : null;
                } else if (formData.tipo_valor === 'U') {
                    valorMaximo = formData.valor_maximo ? parseFloat(formData.valor_maximo) : null;
                }

                const endpoint = modo === 'edicao'
                    ? `${apiUrl}/inspecao/especificacoes/${dados.id}`
                    : `${apiUrl}/inspecao/especificacoes`;

                const method = modo === 'edicao' ? 'PUT' : 'POST';

                const payload = {
                    referencia: dados.referencia,
                    roteiro: roteiroNum,
                    processo: dados.processo,
                    operacao: dados.operacao,
                    especificacao_cota: formData.especificacao,
                    tipo_valor: formData.tipo_valor,
                    valor_minimo: valorMinimo,
                    valor_maximo: valorMaximo,
                    unidade_medida: formData.unidade_medida,
                    id_cota: formData.id_cota,
                    complemento_cota: formData.complemento_cota, id_caracteristica_especial: selectedCaracteristica?.id || null,
                    caracteristica_especial: selectedCaracteristica?.descricao || null,
                    id_tipo_instrumento: formData.id_tipo_instrumento,
                    ordem: formData.ordem,
                    uso_inspecao_setup: formData.uso_inspecao_setup ? 'S' : 'N',
                    uso_inspecao_processo: formData.uso_inspecao_processo ? 'S' : 'N',
                    uso_inspecao_qualidade: formData.uso_inspecao_qualidade ? 'S' : 'N',
                };

                const response = await fetch(endpoint, {
                    method: method,
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.message || `Erro ao ${modo === 'edicao' ? 'atualizar' : 'cadastrar'}: ${response.status}`);
                }

                onSuccess(modo === 'edicao'
                    ? "Especificação atualizada com sucesso!"
                    : "Especificação cadastrada com sucesso!");

                onClose();
            } catch (error: Error | unknown) {
                console.error(`Erro ao ${modo === 'edicao' ? 'atualizar' : 'cadastrar'} especificação:`, error);
                setFormError(`Ocorreu um erro ao ${modo === 'edicao' ? 'atualizar' : 'cadastrar'} a especificação. Tente novamente.`);
            } finally {
                setIsSubmitting(false);
            }
        },
        [apiUrl, dados, getAuthHeaders, modo, onClose, onSuccess, selectedCaracteristica]
    );

    if (!isOpen || !dados) return null;

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={`${modo === 'edicao' ? 'Editar' : 'Nova'} Especificação - Operação ${dados.operacao}`}
            isEditing={modo === 'edicao'}
            onSubmit={handleSubmit}
            submitLabel={modo === 'edicao' ? 'Atualizar' : 'Salvar'}
            isSubmitting={isSubmitting}
            size="xl"
        >
            {/* Informações do contexto */}
            <div className="mb-5 bg-gray-50 p-3 rounded-md border border-gray-100">
                <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                        <span className="text-gray-500 block">Referência</span>
                        <span className="font-medium">{dados.referencia}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Roteiro</span>
                        <span className="font-medium">{dados.roteiro}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Processo</span>
                        <span className="font-medium">{dados.processo}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Operação</span>
                        <span className="font-medium">{dados.operacao}</span>
                    </div>
                </div>
            </div>

            {/* Feedback de erro */}
            {renderFeedback()}

            <div className="space-y-4">
                <div className="bg-white rounded-md">
                    {/* Primeira linha: Cota e Complemento da Cota */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <label htmlFor="id_cota" className="text-sm font-medium text-gray-700">
                                        Cota <span className="text-red-500">*</span>
                                    </label>
                                </div>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'id_cota' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <SelectWithSvg
                                    id="id_cota"
                                    options={cotasOptions}
                                    value={selectedCota}
                                    onChange={(option) => {
                                        setSelectedCota(option);
                                        const form = document.querySelector('form') as HTMLFormElement;
                                        if (form) {
                                            let input = form.querySelector('input[name="id_cota"]') as HTMLInputElement;
                                            if (!input) {
                                                input = document.createElement('input');
                                                input.type = 'hidden';
                                                input.name = 'id_cota';
                                                form.appendChild(input);
                                            }
                                            input.value = option.id.toString();
                                        }
                                    }}
                                    placeholder="Selecione uma cota"
                                    isLoading={isLoadingOptions}
                                    required={true}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <label htmlFor="complemento_cota" className="text-sm font-medium text-gray-700">
                                        Complemento da Cota
                                    </label>
                                </div>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'complemento_cota' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <input
                                    type="text"
                                    id="complemento_cota"
                                    name="complemento_cota"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                    placeholder="Digite o complemento da cota"
                                    defaultValue={dados.complemento_cota || ''}
                                    onFocus={() => setIsFocused('complemento_cota')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Segunda linha: Característica Especial e Instrumento de Medição */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <label className="text-sm font-medium text-gray-700">
                                        Característica Especial
                                    </label>
                                </div>
                            </div>
                            <SelectWithSvg
                                options={caracteristicasOptions}
                                value={selectedCaracteristica}
                                onChange={setSelectedCaracteristica}
                                placeholder="Selecione uma característica especial"
                                isLoading={isLoadingOptions}
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <label htmlFor="id_tipo_instrumento" className="text-sm font-medium text-gray-700">
                                        Instrumento de Medição
                                    </label>
                                </div>
                            </div>
                            <div className={`relative transition-all duration-200 ${isFocused === 'id_tipo_instrumento' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                <select
                                    id="id_tipo_instrumento"
                                    name="id_tipo_instrumento"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300 text-gray-900"
                                    defaultValue={dados.id_tipo_instrumento || ''}
                                    onFocus={() => setIsFocused('id_tipo_instrumento')}
                                    onBlur={() => setIsFocused(null)}
                                >
                                    <option value="" className="text-gray-500">Selecione um instrumento de medição</option>
                                    {!isLoadingOptions && instrumentOptions.map(option => (
                                        <option key={option.id} value={option.id} className="text-gray-900">
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Campo de especificação */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <Ruler className="h-4 w-4 text-gray-500" />
                                <label htmlFor="especificacao" className="text-sm font-medium text-gray-700">
                                    Especificação <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>

                        <div className={`relative transition-all duration-200 ${isFocused === 'especificacao' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <input
                                type="text"
                                id="especificacao"
                                name="especificacao"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Descreva a especificação"
                                defaultValue={dados.especificacao_cota || ''}
                                required
                                onFocus={() => setIsFocused('especificacao')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Campo de tipo de valor */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="tipo_valor" className="text-sm font-medium text-gray-700">
                                    Tipo de Valor <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>

                        <div className={`relative transition-all duration-200 ${isFocused === 'tipo_valor' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <select
                                id="tipo_valor"
                                name="tipo_valor"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                defaultValue={dados.tipo_valor || ''}
                                required
                                onFocus={() => setIsFocused('tipo_valor')}
                                onBlur={() => setIsFocused(null)}
                                onChange={(e) => setSelectedTipoValor(e.target.value)}
                            >
                                <option value="">Selecione o tipo de valor</option>
                                <option value="F">Faixa</option>
                                <option value="U">Único</option>
                                <option value="A">Aprovado/Reprovado</option>
                                <option value="C">Conforme/Não Conforme</option>
                                <option value="S">Sim/Não</option>
                                <option value="L">Liberado/Retido</option>
                            </select>
                        </div>
                    </div>

                    {/* Campo de Valores Mínimo e Máximo */}
                    {(selectedTipoValor === 'F' || selectedTipoValor === 'U') && (
                        <div className="mb-4 grid grid-cols-2 gap-4">
                            {selectedTipoValor === 'F' && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <Ruler className="h-4 w-4 text-gray-500" />
                                            <label htmlFor="valor_minimo" className="text-sm font-medium text-gray-700">
                                                Valor Mínimo
                                            </label>
                                        </div>
                                    </div>
                                    <div className={`relative transition-all duration-200 ${isFocused === 'valor_minimo' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                        <input
                                            type="number"
                                            step="0.01"
                                            id="valor_minimo"
                                            name="valor_minimo"
                                            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                            placeholder="Digite o valor mínimo"
                                            defaultValue={dados.valor_minimo || ''}
                                            onFocus={() => setIsFocused('valor_minimo')}
                                            onBlur={() => setIsFocused(null)}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className={selectedTipoValor === 'U' ? 'col-span-2' : ''}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <Ruler className="h-4 w-4 text-gray-500" />
                                        <label htmlFor="valor_maximo" className="text-sm font-medium text-gray-700">
                                            {selectedTipoValor === 'U' ? 'Valor' : 'Valor Máximo'}
                                        </label>
                                    </div>
                                </div>
                                <div className={`relative transition-all duration-200 ${isFocused === 'valor_maximo' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                                    <input
                                        type="number"
                                        step="0.01"
                                        id="valor_maximo"
                                        name="valor_maximo"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                        placeholder={selectedTipoValor === 'U' ? 'Digite o valor' : 'Digite o valor máximo'}
                                        defaultValue={dados.valor_maximo || ''}
                                        onFocus={() => setIsFocused('valor_maximo')}
                                        onBlur={() => setIsFocused(null)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Campo de Unidade de Medida */}
                    <div className="mb-4">
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
                                placeholder="Ex: mm, cm, etc"
                                defaultValue={dados.unidade_medida || ''}
                                onFocus={() => setIsFocused('unidade_medida')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Campos de Uso de Inspeção */}
                    <div className="mb-4 space-y-3">
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="uso_inspecao_setup"
                                    defaultChecked={dados.uso_inspecao_setup === 'S'}
                                    className="rounded border-gray-300 text-[#09A08D] focus:ring-[#09A08D]"
                                />
                                <span className="text-sm text-gray-700">Uso Inspeção Setup</span>
                            </label>
                        </div>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="uso_inspecao_processo"
                                    defaultChecked={dados.uso_inspecao_processo === 'S'}
                                    className="rounded border-gray-300 text-[#09A08D] focus:ring-[#09A08D]"
                                />
                                <span className="text-sm text-gray-700">Uso Inspeção Processo</span>
                            </label>
                        </div>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="uso_inspecao_qualidade"
                                    defaultChecked={dados.uso_inspecao_qualidade === 'S'}
                                    className="rounded border-gray-300 text-[#09A08D] focus:ring-[#09A08D]"
                                />
                                <span className="text-sm text-gray-700">Uso Inspeção Qualidade</span>
                            </label>
                        </div>
                    </div>

                    {/* Campo de Ordem */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="ordem" className="text-sm font-medium text-gray-700">
                                    Ordem
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200 ${isFocused === 'ordem' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <input
                                type="number"
                                id="ordem"
                                name="ordem"
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Digite a ordem"
                                defaultValue={dados.ordem || ''}
                                onFocus={() => setIsFocused('ordem')}
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
