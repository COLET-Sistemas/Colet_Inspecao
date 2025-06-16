"use client";

import { LoadingSpinner } from "@/components/ui/Loading";
import inspecaoService, { InspectionSpecification } from "@/services/api/inspecaoService";
import { motion } from "framer-motion";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    CheckSquare,
    Eye,
    MessageSquare,
    RefreshCw,
    Ruler,
    Save,
    Send,
    StopCircle,
    XCircle
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import './especificacoes-styles.css';
import './layout-styles.css';
import './minimal-styles.css';
import './modern-styles.css';

export default function EspecificacoesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams?.get('id');
    const hasInitialized = useRef(false);
    const [specifications, setSpecifications] = useState<InspectionSpecification[]>([]);
    const [fichaDados, setFichaDados] = useState<{
        id_ficha_inspecao: number,
        qtde_produzida: number | null,
        exibe_faixa: string,
        exibe_resultado: string
    }>({
        id_ficha_inspecao: 0,
        qtde_produzida: null,
        exibe_faixa: 'S',
        exibe_resultado: 'S'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); const [editingValues, setEditingValues] = useState<{ [key: number]: { valor_encontrado: string; observacao: string; conforme?: boolean | null } }>({});
    const [expandedObservations, setExpandedObservations] = useState<Set<number>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    // Nova variável para expandir/retrair cards
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());    // UseEffect com proteção contra StrictMode e chamadas duplicadas
    useEffect(() => {
        // Proteção contra múltiplas execuções (React StrictMode)
        if (hasInitialized.current) {
            return;
        }

        if (!id) {
            setError("ID da ficha de inspeção não fornecido");
            setLoading(false);
            return;
        }

        hasInitialized.current = true;

        const loadSpecifications = async () => {
            console.log(`[SINGLE CALL] Carregando especificações para ID: ${id}`);
            setLoading(true);
            setError(null);

            try {
                const response = await inspecaoService.getInspectionSpecifications(parseInt(id));
                setSpecifications(response.specifications);
                setFichaDados(response.fichaDados);
            } catch (error) {
                console.error("Erro ao carregar especificações:", error);
                setError("Erro ao carregar especificações da inspeção");
                hasInitialized.current = false; // Reset em caso de erro para permitir retry
            } finally {
                setLoading(false);
            }
        };

        loadSpecifications();
    }, [id]); // Só depende do ID    // Função para refresh manual
    const handleRefresh = useCallback(async () => {
        if (!id) {
            setError("ID da ficha de inspeção não fornecido");
            setLoading(false);
            return;
        }

        console.log(`[REFRESH] Recarregando especificações para ID: ${id}`);
        setLoading(true);
        setError(null);

        try {
            const response = await inspecaoService.getInspectionSpecifications(parseInt(id));
            setSpecifications(response.specifications);
            setFichaDados(response.fichaDados);
        } catch (error) {
            console.error("Erro ao carregar especificações:", error);
            setError("Erro ao carregar especificações da inspeção");
        } finally {
            setLoading(false);
        }
    }, [id]); const handleBack = useCallback(() => {
        router.back();
    }, [router]); const handleValueChange = useCallback((specId: number, field: 'valor_encontrado' | 'observacao' | 'conforme', value: string | boolean | null) => {
        setEditingValues(prev => ({
            ...prev,
            [specId]: {
                ...prev[specId],
                [field]: value
            }
        }));
    }, []); const toggleObservationField = useCallback((specId: number) => {
        setExpandedObservations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(specId)) {
                newSet.delete(specId);
            } else {
                newSet.add(specId);
            }
            return newSet;
        });
    }, []);

    // Função para obter as opções de select baseadas no tipo_valor
    const getSelectOptions = useCallback((tipoValor: string) => {
        switch (tipoValor) {
            case 'A': return [
                { value: true, label: 'Aprovado' },
                { value: false, label: 'Reprovado' }
            ];
            case 'C': return [
                { value: true, label: 'Conforme' },
                { value: false, label: 'Não Conforme' }
            ];
            case 'S': return [
                { value: true, label: 'Sim' },
                { value: false, label: 'Não' }
            ];
            case 'L': return [
                { value: true, label: 'Liberdade' },
                { value: false, label: 'Retido' }
            ];
            default: return [];
        }
    }, []);

    // Função para verificar se o tipo_valor requer select
    const isSelectType = useCallback((tipoValor: string) => {
        return ['A', 'C', 'S', 'L'].includes(tipoValor);
    }, []);

    // Função para verificar se o tipo_valor requer input numérico
    const isNumericType = useCallback((tipoValor: string) => {
        return ['F', 'U'].includes(tipoValor);
    }, []); const calculateConforme = useCallback((valorEncontrado: number, valorMinimo: number | null, valorMaximo: number | null, tipoValor: string, conformeValue?: boolean | null): boolean | null => {
        // Para tipos de select (A, C, S, L), retorna o valor de conforme diretamente
        if (isSelectType(tipoValor)) {
            return conformeValue !== undefined ? conformeValue : null;
        }

        // Para tipos numéricos (F, U), calcula baseado nos limites
        if (isNumericType(tipoValor)) {
            if (valorMinimo !== null && valorMaximo !== null) {
                return valorEncontrado >= valorMinimo && valorEncontrado <= valorMaximo;
            } else if (valorMaximo !== null) {
                return valorEncontrado <= valorMaximo;
            } else if (valorMinimo !== null) {
                return valorEncontrado >= valorMinimo;
            }
        } return null;
    }, [isSelectType, isNumericType]);    // Global action handlers
    const handleSaveAllChanges = useCallback(async () => {
        setIsSaving(true);
        const errors: string[] = [];

        try {
            // Get all specifications that have pending changes
            const specsToSave = specifications.filter(spec =>
                editingValues[spec.id_especificacao] !== undefined
            );

            for (const spec of specsToSave) {
                try {
                    const editingData = editingValues[spec.id_especificacao];

                    if (isSelectType(spec.tipo_valor)) {
                        // Para tipos de select, salvamos apenas o valor conforme
                        if (editingData.conforme === undefined || editingData.conforme === null) continue;

                        const updateData = {
                            valor_encontrado: editingData.conforme === true ? 1 : 0,
                            conforme: editingData.conforme,
                            observacao: editingData.observacao || null
                        };

                        await inspecaoService.updateInspectionSpecification(spec.id_especificacao, updateData);

                    } else {
                        // Para tipos numéricos
                        const valorEncontrado = parseFloat(editingData.valor_encontrado);
                        if (isNaN(valorEncontrado)) continue;

                        const conforme = calculateConforme(valorEncontrado, spec.valor_minimo, spec.valor_maximo, spec.tipo_valor);

                        const updateData = {
                            valor_encontrado: valorEncontrado,
                            conforme: conforme,
                            observacao: editingData.observacao || null
                        };

                        await inspecaoService.updateInspectionSpecification(spec.id_especificacao, updateData);
                    }
                } catch (error) {
                    console.error(`Erro ao salvar especificação ${spec.id_especificacao}:`, error);
                    errors.push(`Especificação ${spec.ordem}: ${error}`);
                }
            }

            if (errors.length === 0) {
                // Reload specifications to get updated data
                await handleRefresh();
                // Clear all editing values
                setEditingValues({});
                // TODO: Show success notification
                console.log('Todas as alterações foram salvas com sucesso!');
            } else {
                // TODO: Show partial success notification with errors
                console.error('Algumas especificações não puderam ser salvas:', errors);
            }

        } catch (error) {
            console.error("Erro geral ao salvar alterações:", error);
            // TODO: Show error notification
        } finally {
            setIsSaving(false);
        }
    }, [specifications, editingValues, isSelectType, calculateConforme, handleRefresh]);

    const handleInterruptInspection = useCallback(async () => {
        if (!id) return;

        try {
            // TODO: Implement interrupt inspection API call
            console.log('Interrompendo inspeção ID:', id);
            // await inspecaoService.interruptInspection(parseInt(id));

            // TODO: Show success notification and redirect
            router.back();
        } catch (error) {
            console.error("Erro ao interromper inspeção:", error);
            // TODO: Show error notification
        }
    }, [id, router]);

    const handleFinalizeInspection = useCallback(async () => {
        if (!id) return;

        // Check if all specifications are completed
        const pendingSpecs = specifications.filter(s =>
            (isNumericType(s.tipo_valor) && s.valor_encontrado === null) ||
            (isSelectType(s.tipo_valor) && s.conforme === null)
        );

        if (pendingSpecs.length > 0) {
            // TODO: Show warning notification
            console.warn(`Ainda existem ${pendingSpecs.length} especificações pendentes`);
            return;
        }

        try {
            // TODO: Implement finalize inspection API call
            console.log('Finalizando inspeção ID:', id);
            // await inspecaoService.finalizeInspection(parseInt(id));

            // TODO: Show success notification and redirect
            router.back();
        } catch (error) {
            console.error("Erro ao finalizar inspeção:", error);
            // TODO: Show error notification
        }
    }, [id, specifications, isNumericType, isSelectType, router]);

    const handleForwardToCQ = useCallback(async () => {
        if (!id) return;

        try {
            // TODO: Implement forward to CQ API call
            console.log('Encaminhando para CQ, inspeção ID:', id);
            // await inspecaoService.forwardToCQ(parseInt(id));

            // TODO: Show success notification and redirect
            router.back();
        } catch (error) {
            console.error("Erro ao encaminhar para CQ:", error);
            // TODO: Show error notification
        }
    }, [id, router]);

    const getInstrumentIcon = (tipoInstrumento: string) => {
        if (tipoInstrumento?.toLowerCase() === 'visual') {
            return <Eye className="h-5 w-5" />;
        }
        return <Ruler className="h-5 w-5" />;
    };

    const getConformeStatus = (conforme: boolean | null | undefined, valorEncontrado: number | null | undefined) => {
        if (valorEncontrado === null || valorEncontrado === undefined) {
            return {
                icon: <AlertCircle className="h-4 w-4" />,
                text: "Não medido",
                className: "bg-gray-100 text-gray-700 border border-gray-200 shadow-sm"
            };
        }

        if (conforme === true) {
            return {
                icon: <CheckCircle className="h-4 w-4" />,
                text: "Conforme",
                className: "bg-green-100 text-green-800 border border-green-300 shadow-sm"
            };
        }

        if (conforme === false) {
            return {
                icon: <XCircle className="h-4 w-4" />,
                text: "Não Conforme",
                className: "bg-red-100 text-red-800 border border-red-300 shadow-sm"
            };
        } return {
            icon: <AlertCircle className="h-4 w-4" />,
            text: "Pendente",
            className: "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"
        };
    };

    if (loading) {
        return (
            <div className="w-full space-y-4 p-2 sm:p-3 md:p-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </button>                    <div>
                        <h1 className="text-xl font-medium text-gray-800">Especificações da Inspeção</h1>
                        <p className="text-sm text-gray-500">Ficha #{id}</p>
                    </div>
                </div>
                <div className="flex justify-center py-20">
                    <LoadingSpinner
                        size="large"
                        text="Carregando especificações..."
                        color="primary"
                        showText={true}
                    />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full space-y-4 p-2 sm:p-3 md:p-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </button>                    <div>
                        <h1 className="text-xl font-medium text-gray-800">Especificações da Inspeção</h1>
                        <p className="text-sm text-gray-500">Ficha #{id}</p>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                            Erro ao carregar especificações
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">{error}</p>
                        <button
                            onClick={handleRefresh}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1ABC9C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#16A085]"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Tentar novamente
                        </button>
                    </div>
                </div>
            </div>
        );
    } return (
        <div className="space-y-5 p-2 sm:p-4 md:p-6 mx-auto">
            <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 gap-4">
                <div className="flex items-center">
                    <button
                        onClick={handleBack}
                        className="mr-3 rounded-full hover:bg-gray-100 p-2 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-medium text-gray-800">Especificações da Inspeção</h1>
                        <p className="text-sm text-gray-500">{specifications.length} item(s) • Ficha #{fichaDados.id_ficha_inspecao}</p>
                    </div>
                </div>            {/* Botões de ação no cabeçalho */}
                {specifications.length > 0 && (
                    <div className="flex flex-row items-center space-x-2">
                        <button
                            onClick={handleFinalizeInspection}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#1ABC9C] px-4 py-2 text-sm font-medium text-white hover:bg-[#16A085] transition-colors shadow-sm"
                        >
                            <CheckSquare className="h-4 w-4" />
                            Iniciar
                        </button>
                        <button
                            onClick={handleForwardToCQ}
                            className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <Send className="h-4 w-4" />
                            Encaminhar CQ
                        </button>
                    </div>
                )}
            </div>

            {specifications.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-8 text-center sm:py-12 bg-white rounded-lg border border-dashed border-gray-300 shadow-sm"
                >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                        <Ruler className="h-7 w-7 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-base font-medium text-gray-800">
                        Nenhuma especificação encontrada
                    </h3>
                    <p className="mt-1 px-4 text-sm text-gray-500 max-w-md mx-auto">
                        Não há especificações cadastradas para esta ficha de inspeção.
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                >
                    {specifications
                        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                        .map((spec, index) => {
                            const statusInfo = getConformeStatus(spec.conforme, spec.valor_encontrado);
                            const isExpanded = expandedCards.has(spec.id_especificacao);

                            return (
                                <motion.div
                                    key={spec.id_especificacao}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className={`spec-card group relative bg-white rounded-lg border ${statusInfo.text === 'Conforme' ? 'border-green-200' :
                                        statusInfo.text === 'Não Conforme' ? 'border-red-200' :
                                            'border-gray-200'
                                        } overflow-hidden hover:shadow-md transition-all duration-200`}
                                >
                                    {/* Status Indicator - Thin stripe on top instead of left border */}
                                    <div className={`absolute top-0 left-0 right-0 h-1 ${statusInfo.text === 'Conforme' ? 'bg-green-500' :
                                        statusInfo.text === 'Não Conforme' ? 'bg-red-500' :
                                            statusInfo.text === 'Não medido' ? 'bg-gray-300' : 'bg-amber-500'
                                        }`}></div>

                                    {/* Card Header - Always visible */}
                                    <div
                                        className="p-3 cursor-pointer"
                                        onClick={() => setExpandedCards(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(spec.id_especificacao)) {
                                                newSet.delete(spec.id_especificacao);
                                            } else {
                                                newSet.add(spec.id_especificacao);
                                            }
                                            return newSet;
                                        })}
                                    >
                                        <div className="flex items-center justify-between">
                                            {/* Left: Order badge and title */}
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                {/* Simple order number */}
                                                <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-gray-50 border border-gray-200">
                                                    <span className="font-medium text-gray-700">{spec.ordem}</span>
                                                </div>

                                                {/* Title - Keep it simple */}
                                                <div className="min-w-0">
                                                    <h3 className="text-base font-medium text-gray-800 truncate">
                                                        {spec.descricao_cota}
                                                        {spec.complemento_cota && (
                                                            <span className="text-gray-400 text-sm ml-1">
                                                                ({spec.complemento_cota})
                                                            </span>
                                                        )}
                                                    </h3>
                                                </div>


                                            </div>

                                            {/* Right: Status badge and expand/collapse */}
                                            <div className="flex items-center gap-3">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${statusInfo.text === 'Conforme' ? 'bg-green-50 text-green-700' :
                                                    statusInfo.text === 'Não Conforme' ? 'bg-red-50 text-red-700' :
                                                        'bg-gray-50 text-gray-600'
                                                    }`}>
                                                    <span className="w-3 h-3 flex-shrink-0">
                                                        {statusInfo.icon}
                                                    </span>
                                                    {statusInfo.text}
                                                </span>

                                                {/* Expand/collapse icon */}
                                                <button className="p-1 rounded-md hover:bg-gray-100">
                                                    {isExpanded ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                                            <polyline points="18 15 12 9 6 15"></polyline>
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>                                        {/* Short description - always visible with instrument and tolerance */}
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 ml-11">
                                            {/* Instrument info */}
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-400">{getInstrumentIcon(spec.tipo_instrumento || '')}</span>
                                                <span className="truncate">{spec.tipo_instrumento || '-'}</span>
                                            </div>

                                            {/* Divider */}
                                            <span>•</span>                                            {/* Tolerance info */}
                                            <div className="truncate">
                                                {isNumericType(spec.tipo_valor) ? (
                                                    <>
                                                        {spec.valor_minimo !== null && spec.valor_maximo !== null ? (
                                                            <>{spec.valor_minimo} - {spec.valor_maximo} {spec.unidade_medida ? spec.unidade_medida : ''}</>
                                                        ) : spec.valor_minimo !== null ? (
                                                            <>Min: {spec.valor_minimo} {spec.unidade_medida ? spec.unidade_medida : ''}</>
                                                        ) : spec.valor_maximo !== null ? (
                                                            <>Max: {spec.valor_maximo} {spec.unidade_medida ? spec.unidade_medida : ''}</>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </>
                                                ) : isSelectType(spec.tipo_valor) ? (
                                                    <>
                                                        {getSelectOptions(spec.tipo_valor).map(opt => opt.label).join(' / ')}
                                                    </>
                                                ) : (
                                                    '-'
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable content */}
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="border-t border-gray-100 bg-gray-50/50 p-3"
                                        >                                            {/* Compact info grid - removed Local info */}

                                            {/* Input Field - Simplified */}
                                            <div className="bg-white rounded-md border border-gray-200 p-3 shadow-sm">
                                                {isSelectType(spec.tipo_valor) ? (
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-2">Selecione uma opção:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {getSelectOptions(spec.tipo_valor).map((option) => (
                                                                <button
                                                                    key={String(option.value)}
                                                                    onClick={() => handleValueChange(spec.id_especificacao, 'conforme', option.value)}
                                                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${(editingValues[spec.id_especificacao]?.conforme === option.value || (!editingValues[spec.id_especificacao] && spec.conforme === option.value))
                                                                        ? (option.value ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200')
                                                                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                                                        }`}
                                                                >
                                                                    {option.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-2">
                                                            Valor encontrado:
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editingValues[spec.id_especificacao]?.valor_encontrado !== undefined
                                                                ? editingValues[spec.id_especificacao].valor_encontrado
                                                                : spec.valor_encontrado || ''}
                                                            onChange={(e) => handleValueChange(spec.id_especificacao, 'valor_encontrado', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Digite o valor..."
                                                        />
                                                    </div>
                                                )}

                                                {/* Compact observations button */}
                                                <div className="mt-3 flex justify-end">
                                                    <button
                                                        onClick={() => toggleObservationField(spec.id_especificacao)}
                                                        className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                                                    >
                                                        <MessageSquare className="h-3 w-3" />
                                                        {expandedObservations.has(spec.id_especificacao) ? 'Ocultar observação' : 'Adicionar observação'}
                                                    </button>
                                                </div>

                                                {/* Expandable observation field */}
                                                {expandedObservations.has(spec.id_especificacao) && (
                                                    <div className="mt-2 animate-in fade-in duration-200">
                                                        <textarea
                                                            placeholder="Digite sua observação..."
                                                            value={editingValues[spec.id_especificacao]?.observacao || spec.observacao || ''}
                                                            onChange={(e) => handleValueChange(spec.id_especificacao, 'observacao', e.target.value)}
                                                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                                            rows={2}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                </motion.div>
            )}        {/* Global Action Buttons - Simplified */}
            {specifications.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="sticky bottom-4 z-10 mt-4"
                >
                    <div className="bg-white rounded-lg border border-gray-200 shadow-md p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                        {/* Status counters */}
                        <div className="flex items-center gap-3 text-xs text-gray-600 overflow-x-auto pb-1 w-full sm:w-auto">
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {specifications.filter(s => s.conforme === true).length} Conformes
                            </span>
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                {specifications.filter(s => s.conforme === false).length} Não conformes
                            </span>
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                {specifications.filter(s =>
                                    (isNumericType(s.tipo_valor) && s.valor_encontrado === null) ||
                                    (isSelectType(s.tipo_valor) && s.conforme === null)
                                ).length} Pendentes
                            </span>
                            {Object.keys(editingValues).length > 0 && (
                                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    {Object.keys(editingValues).length} Alterações
                                </span>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            {Object.keys(editingValues).length > 0 && (
                                <button
                                    onClick={handleSaveAllChanges}
                                    disabled={isSaving}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1ABC9C] text-white rounded-md text-sm font-medium hover:bg-[#16A085] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-3.5 w-3.5" />
                                            Salvar alterações
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={handleInterruptInspection}
                                disabled={isSaving}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                <StopCircle className="h-3.5 w-3.5" />
                                Interromper
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}