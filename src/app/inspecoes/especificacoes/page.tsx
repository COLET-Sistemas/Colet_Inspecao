"use client";

import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { LoadingSpinner } from "@/components/ui/Loading";
import inspecaoService, { InspectionSpecification } from "@/services/api/inspecaoService";
import { motion } from "framer-motion";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    CheckSquare,
    Eye,
    MapPin,
    MessageSquare,
    RefreshCw,
    Ruler,
    Save,
    Send,
    StopCircle,
    Target,
    XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import './especificacoes-styles.css';
import './layout-styles.css';

export default function EspecificacoesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams?.get('id');
    const hasInitialized = useRef(false); const [specifications, setSpecifications] = useState<InspectionSpecification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); const [editingValues, setEditingValues] = useState<{ [key: number]: { valor_encontrado: string; observacao: string; conforme?: boolean | null } }>({});
    const [expandedObservations, setExpandedObservations] = useState<Set<number>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // UseEffect com proteção contra StrictMode e chamadas duplicadas
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
                const data = await inspecaoService.getInspectionSpecifications(parseInt(id));
                setSpecifications(data);
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
            const data = await inspecaoService.getInspectionSpecifications(parseInt(id));
            setSpecifications(data);
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

    const getLocalInspecaoLabel = (local: string) => {
        switch (local) {
            case 'P': return 'Processo';
            case 'Q': return 'Qualidade';
            case '*': return 'Ambos'; default: return local;
        }
    };

    const getConformeStatus = (conforme: boolean | null | undefined, valorEncontrado: number | null | undefined) => {
        if (valorEncontrado === null || valorEncontrado === undefined) {
            return {
                icon: <AlertCircle className="h-4 w-4" />,
                text: "Não medido",
                className: "bg-gray-50 text-gray-700 border-gray-200"
            };
        }

        if (conforme === true) {
            return {
                icon: <CheckCircle className="h-4 w-4" />,
                text: "Conforme",
                className: "bg-green-50 text-green-700 border-green-200"
            };
        }

        if (conforme === false) {
            return {
                icon: <XCircle className="h-4 w-4" />,
                text: "Não Conforme",
                className: "bg-red-50 text-red-700 border-red-200"
            };
        }

        return {
            icon: <AlertCircle className="h-4 w-4" />,
            text: "Pendente",
            className: "bg-yellow-50 text-yellow-700 border-yellow-200"
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
                    </button>
                    <PageHeader
                        title="Especificações da Inspeção"
                        subtitle={`Ficha ID: ${id}`}
                        showButton={false}
                    />
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
                    </button>
                    <PageHeader
                        title="Especificações da Inspeção"
                        subtitle={`Ficha ID: ${id}`}
                        showButton={false}
                    />
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
    } return (<div className="w-full space-y-4 sm:space-y-5 p-2 sm:p-4 md:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 gap-4">
            <div className="flex items-center">
                <button
                    onClick={handleBack}
                    className="mr-2 sm:mr-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                </button>
                <PageHeader
                    title="Especificações da Inspeção"
                    subtitle={`Ficha de Inspeção ID: ${id} - ${specifications.length} especifica${specifications.length !== 1 ? 'ções' : 'ção'}`}
                    showButton={false}
                />
            </div>
            {/* Totalizadores Minimalistas */}
            {specifications.length > 0 && (
                <div className="minimal-counters">
                    <div className="counter-item">
                        <div className="counter-dot bg-green-500"></div>
                        <span className="counter-label">Conformes:</span>
                        <span className="counter-value text-green-700">
                            {specifications.filter(s => s.conforme === true).length}
                        </span>
                    </div>
                    <div className="counter-item">
                        <div className="counter-dot bg-red-500"></div>
                        <span className="counter-label">Não conformes:</span>
                        <span className="counter-value text-red-700">
                            {specifications.filter(s => s.conforme === false).length}
                        </span>
                    </div>                    <div className="counter-item">
                        <div className="counter-dot bg-gray-500"></div>
                        <span className="counter-label">Pendentes:</span>
                        <span className="counter-value text-gray-700">
                            {specifications.filter(s =>
                                (isNumericType(s.tipo_valor) && s.valor_encontrado === null) ||
                                (isSelectType(s.tipo_valor) && s.conforme === null)
                            ).length}
                        </span>
                    </div>
                </div>
            )}
        </div>

        {specifications.length === 0 ? (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12 text-center sm:py-16"
            >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 shadow-sm sm:h-24 sm:w-24">
                    <Ruler className="h-8 w-8 text-gray-400 sm:h-10 sm:w-10" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900 sm:text-xl">
                    Nenhuma especificação encontrada
                </h3>
                <p className="mt-2 px-4 text-sm text-gray-500 sm:text-base max-w-md mx-auto">
                    Não há especificações cadastradas para esta ficha de inspeção.
                </p>                </motion.div>) : (<motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                >{specifications
                    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                    .map((spec, index) => {
                        const statusInfo = getConformeStatus(spec.conforme, spec.valor_encontrado); return (<motion.div
                            key={spec.id_especificacao}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="spec-card spec-card-compact group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300"
                        >
                            {/* Status Bar */}
                            <div className={`status-bar h-1 w-full ${statusInfo.text === 'Conforme' ? 'bg-green-500' :
                                statusInfo.text === 'Não Conforme' ? 'bg-red-500' :
                                    statusInfo.text === 'Não medido' ? 'bg-gray-400' : 'bg-amber-500'
                                }`} />                        {/* Layout Principal: 80% esquerda (valores) + 20% direita (campos edição) */}
                            <div className="flex flex-col lg:flex-row h-full min-h-[140px]">
                                {/* Área de Valores - 80% desktop, 100% mobile */}
                                <div className="flex-grow w-full lg:w-4/5 p-3 sm:p-4 border-b lg:border-b-0 lg:border-r border-gray-100">                                {/* Header Section */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3 flex-1">
                                            {/* Left Side Icons Container */}
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center gap-2">                                                {/* Order Number */}
                                                    <div className="order-badge w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#1ABC9C] to-[#16A085] rounded-lg flex items-center justify-center shadow-md hover:scale-105 transition-transform duration-200">
                                                        <span className="text-white font-bold text-xs">{spec.ordem}</span>
                                                    </div>
                                                    {/* SVG Cota Icon with Border */}
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 svg-icon-container bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center hover:border-[#1ABC9C] hover:bg-[#1ABC9C]/5 transition-all duration-200 group/svg shadow-sm">
                                                        {spec.svg_cota ? (<div
                                                            className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center transition-transform duration-200 group-hover/svg:scale-110"
                                                            dangerouslySetInnerHTML={{
                                                                __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full svg-icon" style="fill: #1ABC9C;">${spec.svg_cota}</svg>`
                                                            }}
                                                        />
                                                        ) : (
                                                            <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                                                                <div className="w-3 h-3 sm:w-4 sm:h-4 svg-placeholder rounded-full border-2 border-dashed border-gray-300"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Title Section */}                                        <div className="min-w-0 flex-1">
                                                <h3 className="spec-title-compact text-sm sm:text-base font-bold text-gray-900 mb-1 leading-tight line-clamp-1">
                                                    {spec.descricao_cota}
                                                </h3>
                                                <p className="spec-subtitle-compact text-gray-600 text-xs sm:text-sm mb-2 line-clamp-1">
                                                    {spec.complemento_cota}
                                                </p>
                                            </div>

                                            {/* Right Side Icon Container - hidden on small screens */}
                                            <div className="hidden sm:flex flex-shrink-0">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 svg-icon-container bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center hover:border-[#1ABC9C] hover:bg-[#1ABC9C]/5 transition-all duration-200 group/svg shadow-sm">
                                                    {spec.svg_caracteristica ? (<div
                                                        className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center transition-transform duration-200 group-hover/svg:scale-110"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full svg-icon" style="fill: #1ABC9C;">${spec.svg_caracteristica}</svg>`
                                                        }}
                                                    />
                                                    ) : (
                                                        <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                                                            <div className="w-3 h-3 sm:w-4 sm:h-4 svg-placeholder rounded-full border-2 border-dashed border-gray-300"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>                                    {/* Status Badge */}
                                        <div className="flex-shrink-0 sm:ml-3">
                                            <div className="flex items-center gap-1.5">
                                                {/* Indicador de observação */}
                                                {spec.observacao && (
                                                    <div className="flex items-center justify-center w-5 h-5 bg-blue-100 border border-blue-200 rounded-full group-hover:bg-blue-200 transition-colors">
                                                        <MessageSquare className="h-2.5 w-2.5 text-blue-600" />
                                                    </div>
                                                )}
                                                <span className={`status-badge-modern inline-flex items-center gap-1 rounded-lg px-2 sm:px-3 py-1 text-xs font-semibold border transition-all duration-200 hover:scale-105 ${statusInfo.className}`}>
                                                    <span className="w-3 h-3 flex items-center justify-center">
                                                        {statusInfo.icon}
                                                    </span>
                                                    <span className="hidden xs:inline">{statusInfo.text}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>                                {/* Info Cards Compactas - Design mais profissional */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">                                        {/* Location Card - Redesenhado */}
                                        <div className="info-card-compact group relative bg-white border border-gray-200 rounded-lg p-2.5 hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden">
                                            {/* Subtle gradient background */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

                                            <div className="relative flex items-center gap-2.5">
                                                <div className="icon-wrapper flex-shrink-0 w-7 h-7 bg-blue-100 border border-blue-200 rounded-md flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                                                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Local</span>
                                                        <div className="divider-dot w-1 h-1 bg-blue-300 rounded-full"></div>
                                                    </div>
                                                    <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                                                        {getLocalInspecaoLabel(spec.local_inspecao)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Instrument Card - Redesenhado */}
                                        <div className="info-card-compact group relative bg-white border border-gray-200 rounded-lg p-2.5 hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden">
                                            {/* Subtle gradient background */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

                                            <div className="relative flex items-center gap-2.5">
                                                <div className="icon-wrapper flex-shrink-0 w-7 h-7 bg-blue-100 border border-blue-200 rounded-md flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                                                    <span className="text-blue-600 flex items-center justify-center text-xs font-bold">
                                                        {getInstrumentIcon(spec.tipo_instrumento)}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Instrumento</span>
                                                        <div className="divider-dot w-1 h-1 bg-blue-300 rounded-full"></div>
                                                    </div>
                                                    <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{spec.tipo_instrumento}</p>
                                                </div>
                                            </div>
                                        </div>                                        {/* Tolerance Card - Redesenhado */}
                                        <div className="info-card-compact group relative bg-white border border-gray-200 rounded-lg p-2.5 hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden">
                                            {/* Subtle gradient background */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

                                            <div className="relative flex items-center gap-2.5">
                                                <div className="icon-wrapper flex-shrink-0 w-7 h-7 bg-blue-100 border border-blue-200 rounded-md flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                                                    <Target className="h-3.5 w-3.5 text-blue-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Tolerância</span>
                                                        <div className="divider-dot w-1 h-1 bg-blue-300 rounded-full"></div>
                                                    </div>
                                                    <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                                                        {spec.valor_minimo !== null && spec.valor_maximo !== null
                                                            ? `${spec.valor_minimo} - ${spec.valor_maximo} ${spec.unidade_medida}`
                                                            : spec.valor_maximo !== null
                                                                ? `≤ ${spec.valor_maximo} ${spec.unidade_medida}`
                                                                : spec.valor_minimo !== null
                                                                    ? `≥ ${spec.valor_minimo} ${spec.unidade_medida}`
                                                                    : 'Não definida'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>{/* Measurement Result */}
                                    {(spec.valor_encontrado !== null || (isSelectType(spec.tipo_valor) && spec.conforme !== null)) && (
                                        <div className="mb-3">
                                            <div className={`p-3 rounded-lg border ${spec.conforme === true ? 'bg-green-50 border-green-200' :
                                                spec.conforme === false ? 'bg-red-50 border-red-200' :
                                                    'bg-gray-50 border-gray-200'
                                                }`}>
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                                            {isSelectType(spec.tipo_valor) ? 'Resultado da Avaliação' : 'Valor Medido'}
                                                        </p>
                                                        {isSelectType(spec.tipo_valor) ? (
                                                            <p className="text-lg font-bold text-gray-900">
                                                                {spec.conforme !== null ? (
                                                                    getSelectOptions(spec.tipo_valor).find(opt => opt.value === spec.conforme)?.label || 'N/A'
                                                                ) : 'Não avaliado'}
                                                            </p>
                                                        ) : (
                                                            <p className="text-lg font-bold text-gray-900">
                                                                {spec.valor_encontrado} <span className="text-sm text-gray-600">{spec.unidade_medida}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className={`p-1.5 rounded-full self-start sm:self-auto ${spec.conforme === true ? 'bg-green-500' :
                                                        spec.conforme === false ? 'bg-red-500' :
                                                            'bg-gray-500'
                                                        }`}>
                                                        {statusInfo.icon && React.cloneElement(statusInfo.icon, { className: 'h-4 w-4 text-white' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}                                    {/* Observação existente com botão para expandir/recolher */}
                                    {(spec.valor_encontrado !== null || (isSelectType(spec.tipo_valor) && spec.conforme !== null)) &&
                                        !editingValues[spec.id_especificacao] && spec.observacao && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-semibold text-blue-800">Observação da Medição</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleObservationField(spec.id_especificacao)}
                                                        className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors rounded-md hover:bg-blue-100"
                                                    >
                                                        <MessageSquare className="h-3 w-3" />
                                                        {expandedObservations.has(spec.id_especificacao) ? 'Ocultar' : 'Mostrar'}
                                                    </button>
                                                </div>

                                                {expandedObservations.has(spec.id_especificacao) && (
                                                    <div className="animate-in slide-in-from-top-2 duration-200 bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                                                        <p className="text-xs text-blue-700">{spec.observacao}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    {/* Botão para editar medição existente */}
                                    {(spec.valor_encontrado !== null || (isSelectType(spec.tipo_valor) && spec.conforme !== null)) &&
                                        !editingValues[spec.id_especificacao] && (
                                            <div className="flex justify-center mt-3">                                        <button
                                                onClick={() => setEditingValues(prev => ({
                                                    ...prev,
                                                    [spec.id_especificacao]: {
                                                        valor_encontrado: spec.valor_encontrado?.toString() || '',
                                                        observacao: spec.observacao || '',
                                                        conforme: spec.conforme
                                                    }
                                                }))}
                                                className="compact-button inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 rounded-lg font-medium hover:from-amber-200 hover:to-amber-300 transition-all border border-amber-300 text-xs"
                                            >
                                                <RefreshCw className="h-3.5 w-3.5" />
                                                Reeditar
                                            </button>
                                            </div>
                                        )}</div>                            {/* Área de Edição - 20% desktop, 100% mobile */}
                                <div className={`w-full lg:w-1/5 bg-gray-50 p-3 flex flex-col justify-center min-h-[100px] lg:min-h-[140px] ${((spec.valor_encontrado === null && isNumericType(spec.tipo_valor)) ||
                                    (spec.conforme === null && isSelectType(spec.tipo_valor)) ||
                                    editingValues[spec.id_especificacao]) ? 'measuring' :
                                    spec.conforme === true ? 'completed' :
                                        spec.conforme === false ? 'non-compliant' : ''
                                    }`}>                                    {((spec.valor_encontrado === null && isNumericType(spec.tipo_valor)) ||
                                        (spec.conforme === null && isSelectType(spec.tipo_valor)) ||
                                        editingValues[spec.id_especificacao]) ? (
                                        <div className="space-y-2.5">                                            {/* Título da seção de medição com status */}
                                            <div className="measurement-header flex items-center justify-between pb-2 border-b border-gray-200 px-2 py-1.5 rounded-md mb-3">
                                                <h4 className="text-sm font-bold text-gray-800">Medição</h4>
                                                <div className="flex items-center">                                                    {(() => {
                                                    const valorAtual = editingValues[spec.id_especificacao]?.valor_encontrado;
                                                    const conformeAtual = editingValues[spec.id_especificacao]?.conforme;

                                                    // Para tipos de select (A, C, S, L)
                                                    if (isSelectType(spec.tipo_valor)) {
                                                        if (conformeAtual === null || conformeAtual === undefined) {
                                                            return (
                                                                <div className="flex items-center gap-1">
                                                                    <AlertCircle className="measurement-status-icon h-4 w-4 text-gray-500" />
                                                                    <span className="text-xs font-medium text-gray-600">Pendente</span>
                                                                </div>
                                                            );
                                                        }

                                                        if (conformeAtual === true) {
                                                            return (
                                                                <div className="flex items-center gap-1">
                                                                    <CheckCircle className="measurement-status-icon h-4 w-4 text-green-500" />
                                                                    <span className="text-xs font-medium text-green-600">Conforme</span>
                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <div className="flex items-center gap-1">
                                                                    <XCircle className="measurement-status-icon h-4 w-4 text-red-500" />
                                                                    <span className="text-xs font-medium text-red-600">Não Conforme</span>
                                                                </div>
                                                            );
                                                        }
                                                    }

                                                    // Para tipos numéricos (F, U)
                                                    if (!valorAtual) {
                                                        return (
                                                            <div className="flex items-center gap-1">
                                                                <AlertCircle className="measurement-status-icon h-4 w-4 text-gray-500" />
                                                                <span className="text-xs font-medium text-gray-600">Pendente</span>
                                                            </div>
                                                        );
                                                    }

                                                    const valor = parseFloat(valorAtual);
                                                    if (isNaN(valor)) {
                                                        return (
                                                            <div className="flex items-center gap-1">
                                                                <AlertCircle className="measurement-status-icon h-4 w-4 text-gray-500" />
                                                                <span className="text-xs font-medium text-gray-600">Pendente</span>
                                                            </div>
                                                        );
                                                    }

                                                    const conforme = calculateConforme(valor, spec.valor_minimo, spec.valor_maximo, spec.tipo_valor);

                                                    if (conforme === true) {
                                                        return (
                                                            <div className="flex items-center gap-1">
                                                                <CheckCircle className="measurement-status-icon h-4 w-4 text-green-500" />
                                                                <span className="text-xs font-medium text-green-600">Conforme</span>
                                                            </div>
                                                        );
                                                    } else if (conforme === false) {
                                                        return (
                                                            <div className="flex items-center gap-1">
                                                                <XCircle className="measurement-status-icon h-4 w-4 text-red-500" />
                                                                <span className="text-xs font-medium text-red-600">Não Conforme</span>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div className="flex items-center gap-1">
                                                            <AlertCircle className="measurement-status-icon h-4 w-4 text-gray-500" />
                                                            <span className="text-xs font-medium text-gray-600">Pendente</span>
                                                        </div>
                                                    );
                                                })()}
                                                </div>
                                            </div>                                            {/* Campo Valor - Condicional baseado em tipo_valor */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-700">
                                                    {isSelectType(spec.tipo_valor) ? 'Resultado' : 'Valor'}
                                                </label>
                                                <div className="relative">
                                                    {isSelectType(spec.tipo_valor) ? (
                                                        <select
                                                            value={editingValues[spec.id_especificacao]?.conforme?.toString() || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? null : e.target.value === 'true';
                                                                handleValueChange(spec.id_especificacao, 'conforme', value);
                                                            }}
                                                            className="compact-input w-full px-2.5 py-1.5 text-xs font-semibold border-2 border-gray-300 rounded-lg focus:border-[#1ABC9C] focus:outline-none transition-all bg-white"
                                                        >
                                                            <option value="">Selecione...</option>
                                                            {getSelectOptions(spec.tipo_valor).map((option) => (
                                                                <option key={option.value.toString()} value={option.value.toString()}>
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder={`0.00 ${spec.unidade_medida}`}
                                                            value={editingValues[spec.id_especificacao]?.valor_encontrado ||
                                                                (spec.valor_encontrado !== null && spec.valor_encontrado !== undefined ? spec.valor_encontrado.toString() : '')}
                                                            onChange={(e) => handleValueChange(spec.id_especificacao, 'valor_encontrado', e.target.value)}
                                                            className="compact-input w-full px-2.5 py-1.5 text-xs font-semibold border-2 border-gray-300 rounded-lg focus:border-[#1ABC9C] focus:outline-none transition-all"
                                                        />
                                                    )}
                                                </div>
                                            </div>{/* Campo Observação */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-semibold text-gray-700">
                                                        Observação
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleObservationField(spec.id_especificacao)}
                                                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-[#1ABC9C] transition-colors rounded-md hover:bg-gray-100"
                                                    >
                                                        <MessageSquare className="h-3 w-3" />
                                                        {expandedObservations.has(spec.id_especificacao) ? 'Ocultar' : 'Adicionar'}
                                                    </button>
                                                </div>

                                                {/* Campo de observação expansível */}
                                                {expandedObservations.has(spec.id_especificacao) && (
                                                    <div className="animate-in slide-in-from-top-2 duration-200">                                                        <textarea
                                                        placeholder="Digite sua observação..."
                                                        value={editingValues[spec.id_especificacao]?.observacao || spec.observacao || ''}
                                                        onChange={(e) => handleValueChange(spec.id_especificacao, 'observacao', e.target.value)}
                                                        className="compact-input w-full px-2.5 py-1.5 text-xs border-2 border-gray-300 rounded-lg focus:border-[#1ABC9C] focus:outline-none resize-none transition-all"
                                                        rows={2}
                                                    />
                                                    </div>)}
                                            </div>
                                        </div>) : (
                                        <div className="text-center text-gray-500">
                                            <div className="mb-1.5">
                                                <CheckCircle className="h-5 w-5 mx-auto text-green-500" />
                                            </div>
                                            <p className="text-xs font-medium">Medição Concluída</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1ABC9C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </motion.div>
                        );
                    })}                </motion.div>
        )}        {/* Global Action Buttons */}
        {specifications.length > 0 && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="sticky bottom-4 z-10 mt-6"
            >
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Status Summary - Left Side */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <strong className="text-gray-800">{Object.keys(editingValues).length}</strong> alterações pendentes
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <strong className="text-green-700">{specifications.filter(s => s.conforme === true).length}</strong> conformes
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <strong className="text-red-700">{specifications.filter(s => s.conforme === false).length}</strong> não conformes
                            </span>                            <span className="text-gray-400">•</span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                <strong className="text-gray-700">
                                    {specifications.filter(s =>
                                        (isNumericType(s.tipo_valor) && s.valor_encontrado === null) ||
                                        (isSelectType(s.tipo_valor) && s.conforme === null)
                                    ).length}
                                </strong> pendentes
                            </span>
                        </div>

                        {/* Action Buttons - Right Side */}
                        <div className="flex flex-wrap gap-2 justify-center lg:justify-end">
                            {/* Save All Changes Button */}
                            <button
                                onClick={handleSaveAllChanges}
                                disabled={isSaving || Object.keys(editingValues).length === 0}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-[#1ABC9C] text-white rounded-lg font-semibold hover:bg-[#16A085] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm min-w-[120px]"
                            >
                                {isSaving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Salvar ({Object.keys(editingValues).length})
                                    </>
                                )}
                            </button>

                            {/* Interrupt Inspection Button */}
                            <button
                                onClick={handleInterruptInspection}
                                disabled={isSaving}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm min-w-[120px]"
                            >
                                <StopCircle className="h-4 w-4" />
                                Interromper
                            </button>

                            {/* Finalize Inspection Button */}
                            <button
                                onClick={handleFinalizeInspection}
                                disabled={isSaving || specifications.some(s =>
                                    (isNumericType(s.tipo_valor) && s.valor_encontrado === null) ||
                                    (isSelectType(s.tipo_valor) && s.conforme === null)
                                )}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm min-w-[120px]"
                            >
                                <CheckSquare className="h-4 w-4" />
                                Finalizar
                            </button>

                            {/* Forward to CQ Button */}
                            <button
                                onClick={handleForwardToCQ}
                                disabled={isSaving}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm min-w-[120px]"
                            >
                                <Send className="h-4 w-4" />
                                Encaminhar CQ
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
    </div>
    );
}