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
    const [nextOrder, setNextOrder] = useState<number | null>(null);
    const [formState, setFormState] = useState<{
        especificacao?: string,
        tipo_valor: string,
        valor_minimo?: string,
        valor_maximo?: string,
        unidade_medida?: string,
        complemento_cota?: string,
        id_tipo_instrumento?: string,
        ordem?: string,
        uso_inspecao_setup: boolean,
        uso_inspecao_processo: boolean,
        uso_inspecao_qualidade: boolean,
    }>({
        tipo_valor: dados?.tipo_valor || '',
        valor_minimo: dados?.valor_minimo?.toString() || '',
        valor_maximo: dados?.valor_maximo?.toString() || '',
        unidade_medida: dados?.unidade_medida || '',
        complemento_cota: dados?.complemento_cota || '',
        id_tipo_instrumento: dados?.id_tipo_instrumento?.toString() || '',
        ordem: dados?.ordem?.toString() || '',
        uso_inspecao_setup: dados?.uso_inspecao_setup === 'S',
        uso_inspecao_processo: dados?.uso_inspecao_processo === 'S',
        uso_inspecao_qualidade: dados?.uso_inspecao_qualidade === 'S',
    });

    const { apiUrl, getAuthHeaders } = useApiConfig();    // Função para buscar o próximo valor de ordem
    const fetchNextOrder = useCallback(async () => {
        if (!isOpen || !dados || modo !== 'cadastro') return;

        try {
            // Buscar especificações existentes para determinar o próximo valor de ordem
            const response = await fetch(
                `${apiUrl}/inspecao/especificacoes_inspecao_ft?referencia=${encodeURIComponent(dados.referencia)}&roteiro=${encodeURIComponent(dados.roteiro)}&processo=${dados.processo}`,
                { headers: getAuthHeaders() }
            );
            if (response.ok) {
                const processoData = await response.json();

                // Verificar se o processo tem operações
                if (processoData && Array.isArray(processoData.operacoes)) {
                    // Encontrar a operação correta pelo número da operação
                    const operacao = processoData.operacoes.find((op: { operacao: number }) => op.operacao === dados.operacao);

                    if (operacao && Array.isArray(operacao.especificacoes_inspecao) && operacao.especificacoes_inspecao.length > 0) {
                        // Encontra a maior ordem nas especificações dessa operação e adiciona 1
                        const maxOrder = Math.max(...operacao.especificacoes_inspecao.map((esp: { ordem?: number }) => esp.ordem || 0));
                        setNextOrder(maxOrder + 1);
                    } else {
                        // Se não houver especificações para essa operação, começa com ordem 1
                        setNextOrder(1);
                    }
                } else {
                    // Se não houver operações, começa com ordem 1
                    setNextOrder(1);
                }
            }
        } catch (error) {
            console.error("Erro ao buscar próxima ordem:", error);
            // Em caso de erro, definimos ordem 1 como padrão
            setNextOrder(1);
        }
    }, [apiUrl, getAuthHeaders, isOpen, dados, modo]);

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
            // Buscar tipos de instrumentos de medição
            const instrumentsResponse = await fetch(`${apiUrl}/inspecao/tipos_instrumentos_medicao`, {
                headers: getAuthHeaders()
            });
            const instrumentsData = await instrumentsResponse.json();
            setInstrumentOptions(Array.isArray(instrumentsData) ? instrumentsData.map(item => ({
                id: item.id,
                label: item.nome_tipo_instrumento
            })) : []);

            // Buscar próximo valor de ordem
            await fetchNextOrder();
        } catch (error) {
            console.error("Erro ao carregar opções:", error);
            setFormError("Erro ao carregar as opções de cotas e instrumentos.");
        } finally {
            setIsLoadingOptions(false);
        }
    }, [apiUrl, getAuthHeaders, isOpen, fetchNextOrder]);

    // Carregar opções quando o modal abrir
    useEffect(() => {
        if (isOpen) {
            fetchOptions();
        }
    }, [isOpen, fetchOptions, modo]);    // Efeito para inicializar as seleções quando os dados são carregados
    useEffect(() => {
        if (dados && cotasOptions.length > 0 && caracteristicasOptions.length > 0) {
            // Log completo dos dados recebidos no modo de edição
            if (modo === 'edicao') {
                console.log('EspecificacoesModal - Modo de edição ativado');
                console.log('EspecificacoesModal - Dados completos recebidos:', dados);
                console.log('EspecificacoesModal - Campos específicos recebidos:', {
                    id: dados.id,
                    especificacao_cota: dados.especificacao_cota,
                    tipo_valor: dados.tipo_valor,
                    valor_minimo: dados.valor_minimo,
                    valor_maximo: dados.valor_maximo,
                    unidade_medida: dados.unidade_medida,
                    id_cota: dados.id_cota,
                    complemento_cota: dados.complemento_cota,
                    id_caracteristica_especial: dados.id_caracteristica_especial,
                    caracteristica_especial: dados.caracteristica_especial,
                    id_tipo_instrumento: dados.id_tipo_instrumento,
                    ordem: dados.ordem,
                    uso_inspecao_setup: dados.uso_inspecao_setup,
                    uso_inspecao_processo: dados.uso_inspecao_processo,
                    uso_inspecao_qualidade: dados.uso_inspecao_qualidade
                });
            }

            const cota = cotasOptions.find(c => c.id === dados.id_cota);
            if (cota) setSelectedCota(cota);

            if (modo === 'edicao') {
                // No modo de edição, usar a característica dos dados
                const caracteristica = caracteristicasOptions.find(c => c.id === dados.id_caracteristica_especial);
                if (caracteristica) setSelectedCaracteristica(caracteristica);
            } else {
                // No modo de cadastro, definir ID 0 como padrão se não há seleção
                if (!selectedCaracteristica) {
                    const caracteristicaPadrao = caracteristicasOptions.find(c => c.id === 0);
                    if (caracteristicaPadrao) setSelectedCaracteristica(caracteristicaPadrao);
                }
            }

            // Atualizar o formState com os dados atuais
            setFormState({
                especificacao: dados.especificacao_cota || '',
                tipo_valor: dados.tipo_valor || '',
                valor_minimo: dados.valor_minimo?.toString() || '',
                valor_maximo: dados.valor_maximo?.toString() || '',
                unidade_medida: dados.unidade_medida || '',
                complemento_cota: dados.complemento_cota || '',
                id_tipo_instrumento: dados.id_tipo_instrumento?.toString() || '',
                ordem: dados.ordem?.toString() || '',
                uso_inspecao_setup: dados.uso_inspecao_setup === 'S',
                uso_inspecao_processo: dados.uso_inspecao_processo === 'S',
                uso_inspecao_qualidade: dados.uso_inspecao_qualidade === 'S',
            });

            // Atualizar o selectedTipoValor
            setSelectedTipoValor(dados.tipo_valor || '');
        }
    }, [dados, cotasOptions, caracteristicasOptions, instrumentOptions, modo, selectedCaracteristica]);

    // Efeito para definir característica padrão (ID 0) quando não há dados (modo cadastro)
    useEffect(() => {
        if (modo === 'cadastro' && caracteristicasOptions.length > 0 && !selectedCaracteristica && !dados?.id_caracteristica_especial) {
            const caracteristicaPadrao = caracteristicasOptions.find(c => c.id === 0);
            if (caracteristicaPadrao) {
                setSelectedCaracteristica(caracteristicaPadrao);
            }
        }
    }, [caracteristicasOptions, selectedCaracteristica, modo, dados?.id_caracteristica_especial]);// Handler para mudanças nos inputs do formulário
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : false;

        // Atualizar também o selectedTipoValor se for o campo tipo_valor
        if (name === 'tipo_valor') {
            setSelectedTipoValor(value);

            // Limpar unidade de medida se o tipo não for 'F' ou 'U'
            if (value !== 'F' && value !== 'U') {
                setFormState(prev => ({
                    ...prev,
                    [name]: value,
                    unidade_medida: ''
                }));
            } else {
                setFormState(prev => ({
                    ...prev,
                    [name]: value
                }));
            }
        } else {
            setFormState(prev => ({
                ...prev,
                [name]: isCheckbox ? checked : value
            }));
        }
    };// Efeito para atualizar o valor do campo de ordem quando nextOrder for definido
    useEffect(() => {
        if (isOpen && modo === 'cadastro' && nextOrder !== null) {
            setFormState(prev => ({
                ...prev,
                ordem: nextOrder.toString()
            }));
        }
    }, [nextOrder, isOpen, modo]);

    // Resetar campos ao salvar nova especificação
    // Adicionar efeito para resetar campos ao fechar ou ao cadastrar
    useEffect(() => {
        if (!isOpen && modo === 'cadastro') {
            setFormState({
                tipo_valor: '',
                valor_minimo: '',
                valor_maximo: '',
                unidade_medida: '',
                complemento_cota: '',
                id_tipo_instrumento: '',
                ordem: '',
                uso_inspecao_setup: false,
                uso_inspecao_processo: false,
                uso_inspecao_qualidade: false,
            });
            setSelectedTipoValor('');
            setSelectedCota(null);
            setSelectedCaracteristica(null);
        }
    }, [isOpen, modo]);

    // Resetar campos após salvar nova especificação
    useEffect(() => {
        if (!isSubmitting && !isOpen && modo === 'cadastro') {
            setFormState({
                tipo_valor: '',
                valor_minimo: '',
                valor_maximo: '',
                unidade_medida: '',
                complemento_cota: '',
                id_tipo_instrumento: '',
                ordem: '',
                uso_inspecao_setup: false,
                uso_inspecao_processo: false,
                uso_inspecao_qualidade: false,
            });
            setSelectedTipoValor('');
            setSelectedCota(null);
            setSelectedCaracteristica(null);
        }
    }, [isSubmitting, isOpen, modo]);

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
    };    // Handler para submissão do formulário
    const handleSubmit = useCallback(
        async () => {
            try {
                setFormError(null);
                setIsSubmitting(true);
                // Validação
                if (!formState.tipo_valor) {
                    setFormError("O tipo de valor é obrigatório");
                    setIsSubmitting(false);
                    return;
                }

                if (!selectedCaracteristica) {
                    setFormError("A característica especial é obrigatória");
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

                if (formState.tipo_valor === 'F') {
                    valorMinimo = formState.valor_minimo ? parseFloat(formState.valor_minimo) : null;
                    valorMaximo = formState.valor_maximo ? parseFloat(formState.valor_maximo) : null;
                } else if (formState.tipo_valor === 'U') {
                    valorMaximo = formState.valor_maximo ? parseFloat(formState.valor_maximo) : null;
                }

                const endpoint = `${apiUrl}/inspecao/especificacoes_inspecao_ft`;
                const method = modo === 'edicao' ? 'PUT' : 'POST'; const payload = {
                    id: dados.id,
                    referencia: dados.referencia,
                    roteiro: roteiroNum,
                    processo: dados.processo,
                    operacao: dados.operacao,
                    tipo_valor: formState.tipo_valor,
                    valor_minimo: valorMinimo,
                    valor_maximo: valorMaximo,
                    unidade_medida: (formState.tipo_valor === 'F' || formState.tipo_valor === 'U') ? formState.unidade_medida : null,
                    id_cota: selectedCota?.id,
                    complemento_cota: formState.complemento_cota,
                    id_caracteristica_especial: selectedCaracteristica?.id || null,
                    caracteristica_especial: selectedCaracteristica?.descricao || null,
                    id_tipo_instrumento: formState.id_tipo_instrumento ? parseInt(formState.id_tipo_instrumento) : null,
                    ordem: formState.ordem ? parseInt(formState.ordem) : null,
                    uso_inspecao_setup: formState.uso_inspecao_setup ? 'S' : 'N',
                    uso_inspecao_processo: formState.uso_inspecao_processo ? 'S' : 'N',
                    uso_inspecao_qualidade: formState.uso_inspecao_qualidade ? 'S' : 'N',
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
        [apiUrl, dados, getAuthHeaders, modo, onClose, onSuccess, selectedCaracteristica, selectedCota, formState]
    );

    if (!isOpen || !dados) return null;

    // Ajustar título do modal conforme modo
    const modalTitle = modo === 'edicao'
        ? `Editar Especificação - Operação ${dados.ordem}`
        : 'Nova Especificação';

    return (<FormModal
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
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
        {renderFeedback()}        <div className="space-y-4">
            <div className="bg-white rounded-md">
                {/* Primeira linha: Ordem (20%), Tipo Cota (40%), Complemento da Cota (40%) */}
                <div className="grid grid-cols-5 gap-4 mb-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="ordem" className="text-sm font-medium text-gray-700">
                                    Ordem <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200 ${isFocused === 'ordem' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <input
                                type="number"
                                id="ordem"
                                name="ordem"
                                required
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300"
                                placeholder="Digite a ordem"
                                value={formState.ordem || ''}
                                onChange={handleInputChange}
                                onFocus={() => setIsFocused('ordem')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>
                    <div className="col-span-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="id_cota" className="text-sm font-medium text-gray-700">
                                    Tipo Cota <span className="text-red-500">*</span>
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

                                    // Atualizar formState quando a cota é selecionada
                                    setFormState(prev => ({
                                        ...prev,
                                        unidade_medida: option.unidade_medida || prev.unidade_medida
                                    }));
                                }}
                                placeholder="Selecione uma cota"
                                isLoading={isLoadingOptions}
                                required={true}
                            />
                        </div>
                    </div>
                    <div className="col-span-2">
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
                                value={formState.complemento_cota || ''}
                                onChange={handleInputChange}
                                onFocus={() => setIsFocused('complemento_cota')}
                                onBlur={() => setIsFocused(null)}
                            />
                        </div>
                    </div>
                </div>
                <div className="mb-4">
                    {selectedTipoValor === 'F' ? (
                        <div className="grid grid-cols-4 gap-4">
                            <div>
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
                                        value={formState.tipo_valor || ''}
                                        required
                                        onChange={handleInputChange}
                                        onFocus={() => setIsFocused('tipo_valor')}
                                        onBlur={() => setIsFocused(null)}
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
                                        value={formState.valor_minimo || ''}
                                        onChange={handleInputChange}
                                        onFocus={() => setIsFocused('valor_minimo')}
                                        onBlur={() => setIsFocused(null)}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <Ruler className="h-4 w-4 text-gray-500" />
                                        <label htmlFor="valor_maximo" className="text-sm font-medium text-gray-700">
                                            Valor Máximo
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
                                        placeholder="Digite o valor máximo"
                                        value={formState.valor_maximo || ''}
                                        onChange={handleInputChange}
                                        onFocus={() => setIsFocused('valor_maximo')}
                                        onBlur={() => setIsFocused(null)}
                                    />
                                </div>
                            </div>
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
                                        placeholder="Ex: mm, cm, etc"
                                        value={formState.unidade_medida || ''}
                                        onChange={handleInputChange}
                                        onFocus={() => setIsFocused('unidade_medida')}
                                        onBlur={() => setIsFocused(null)}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : selectedTipoValor === 'U' ? (
                        // Layout para Único: Tipo de Valor (33%), Valor (33%), Unidade de Medida (33%)
                        <div className="grid grid-cols-3 gap-4">
                            <div>
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
                                        value={formState.tipo_valor || ''}
                                        required
                                        onChange={handleInputChange}
                                        onFocus={() => setIsFocused('tipo_valor')}
                                        onBlur={() => setIsFocused(null)}
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
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <Ruler className="h-4 w-4 text-gray-500" />
                                        <label htmlFor="valor_maximo" className="text-sm font-medium text-gray-700">
                                            Valor
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
                                        placeholder="Digite o valor"
                                        value={formState.valor_maximo || ''}
                                        onChange={handleInputChange}
                                        onFocus={() => setIsFocused('valor_maximo')}
                                        onBlur={() => setIsFocused(null)}
                                    />
                                </div>
                            </div>
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
                                        placeholder="Ex: mm, cm, etc"
                                        value={formState.unidade_medida || ''}
                                        onChange={handleInputChange}
                                        onFocus={() => setIsFocused('unidade_medida')}
                                        onBlur={() => setIsFocused(null)}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Layout para outros tipos: Apenas Tipo de Valor (100%)
                        <div className="grid grid-cols-1 gap-4">
                            <div>
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
                                        value={formState.tipo_valor || ''}
                                        required
                                        onChange={handleInputChange}
                                        onFocus={() => setIsFocused('tipo_valor')}
                                        onBlur={() => setIsFocused(null)}
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
                        </div>
                    )}
                </div>

                {/* Terceira linha: Instrumento de Medição e Característica Especial */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="id_tipo_instrumento" className="text-sm font-medium text-gray-700">
                                    Instrumento de Medição <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>
                        <div className={`relative transition-all duration-200 ${isFocused === 'id_tipo_instrumento' ? 'ring-2 ring-[#09A08D]/30 rounded-md' : ''}`}>
                            <select
                                id="id_tipo_instrumento"
                                name="id_tipo_instrumento"
                                required
                                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#09A08D] focus:outline-none focus:shadow-sm transition-all duration-300 text-gray-900"
                                value={formState.id_tipo_instrumento || ''}
                                onChange={handleInputChange}
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
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label className="text-sm font-medium text-gray-700">
                                    Característica Especial <span className="text-red-500">*</span>
                                </label>
                            </div>
                        </div>
                        <SelectWithSvg
                            options={caracteristicasOptions}
                            value={selectedCaracteristica}
                            onChange={(option) => {
                                setSelectedCaracteristica(option);
                            }}
                            placeholder="Selecione uma característica especial"
                            isLoading={isLoadingOptions}
                            required
                        />
                    </div>
                </div>{/* Campos de Uso de Inspeção */}
                <div className="mb-4 space-y-3">
                    <div className="flex items-center space-x-4">                            <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="uso_inspecao_setup"
                            checked={formState.uso_inspecao_setup}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-[#09A08D] focus:ring-[#09A08D]"
                        />
                        <span className="text-sm text-gray-700">Uso Inspeção Setup</span>
                    </label>
                    </div>

                    <div className="flex items-center space-x-4">                            <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="uso_inspecao_qualidade"
                            checked={formState.uso_inspecao_qualidade}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-[#09A08D] focus:ring-[#09A08D]"
                        />
                        <span className="text-sm text-gray-700">Uso Inspeção Qualidade</span>
                    </label>
                    </div>
                    <div className="flex items-center space-x-4">                            <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="uso_inspecao_processo"
                            checked={formState.uso_inspecao_processo}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-[#09A08D] focus:ring-[#09A08D]"
                        />
                        <span className="text-sm text-gray-700">Uso Inspeção Processo</span>
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
