"use client";

import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { LoadingSpinner } from "@/components/ui/Loading";
import inspecaoService, { InspectionSpecification } from "@/services/api/inspecaoService";
import { motion } from "framer-motion";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Eye,
    RefreshCw,
    Ruler,
    XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import './especificacoes-styles.css';

export default function EspecificacoesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams?.get('id');
    const hasInitialized = useRef(false); const [specifications, setSpecifications] = useState<InspectionSpecification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingValues, setEditingValues] = useState<{ [key: number]: { valor_encontrado: string; observacao: string } }>({});

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
    }, [router]);

    const handleValueChange = useCallback((specId: number, field: 'valor_encontrado' | 'observacao', value: string) => {
        setEditingValues(prev => ({
            ...prev,
            [specId]: {
                ...prev[specId],
                [field]: value
            }
        }));
    }, []);

    const calculateConforme = useCallback((valorEncontrado: number, valorMinimo: number | null, valorMaximo: number | null): boolean | null => {
        if (valorMinimo !== null && valorMaximo !== null) {
            return valorEncontrado >= valorMinimo && valorEncontrado <= valorMaximo;
        } else if (valorMaximo !== null) {
            return valorEncontrado <= valorMaximo;
        } else if (valorMinimo !== null) {
            return valorEncontrado >= valorMinimo;
        }
        return null;
    }, []);

    const handleSaveSpecification = useCallback(async (spec: InspectionSpecification) => {
        const editedValues = editingValues[spec.id_especificacao];
        if (!editedValues) return;

        const valorEncontrado = parseFloat(editedValues.valor_encontrado);
        if (isNaN(valorEncontrado)) return;

        const conforme = calculateConforme(valorEncontrado, spec.valor_minimo, spec.valor_maximo);
        try {
            // Chamar API para salvar a especificação
            await inspecaoService.updateInspectionSpecification(spec.id_especificacao, {
                valor_encontrado: valorEncontrado,
                conforme,
                observacao: editedValues.observacao || null
            });

            // Atualizar o estado local
            setSpecifications(prev => prev.map(s =>
                s.id_especificacao === spec.id_especificacao
                    ? {
                        ...s,
                        valor_encontrado: valorEncontrado,
                        conforme,
                        observacao: editedValues.observacao || null
                    }
                    : s
            ));

            // Limpar valores de edição
            setEditingValues(prev => {
                const updated = { ...prev };
                delete updated[spec.id_especificacao];
                return updated;
            });

        } catch (error) {
            console.error('Erro ao salvar especificação:', error);
            setError('Erro ao salvar especificação');
        }
    }, [editingValues, calculateConforme]);

    const getInstrumentIcon = (tipoInstrumento: string) => {
        if (tipoInstrumento?.toLowerCase() === 'visual') {
            return <Eye className="h-4 w-4" />;
        }
        return <Ruler className="h-4 w-4" />;
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
    } return (
        <div className="w-full space-y-5 p-2 sm:p-4 md:p-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div className="flex items-center">
                    <button
                        onClick={handleBack}
                        className="mr-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <PageHeader
                        title="Especificações da Inspeção"
                        subtitle={`Ficha ID: ${id} - ${specifications.length} especificação${specifications.length !== 1 ? 'ões' : ''}`}
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
                        </div>
                        <div className="counter-item">
                            <div className="counter-dot bg-amber-500"></div>
                            <span className="counter-label">Pendentes:</span>
                            <span className="counter-value text-amber-700">
                                {specifications.filter(s => s.valor_encontrado === null).length}
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
                    </p>                </motion.div>) : (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                >{specifications
                    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                    .map((spec, index) => {
                        const statusInfo = getConformeStatus(spec.conforme, spec.valor_encontrado);

                        return (<motion.div
                            key={spec.id_especificacao}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="spec-card group relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300"
                        >
                            {/* Status Bar */}
                            <div className={`status-bar h-1 w-full ${statusInfo.text === 'Conforme' ? 'bg-green-500' :
                                statusInfo.text === 'Não Conforme' ? 'bg-red-500' :
                                    statusInfo.text === 'Não medido' ? 'bg-gray-400' : 'bg-amber-500'
                                }`} />

                            <div className="p-6">
                                {/* Header Section */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-start gap-4">                                        {/* Order Badge */}
                                        <div className="flex-shrink-0">
                                            <div className="flex items-center gap-3">
                                                {/* Order Number */}
                                                <div className="w-12 h-12 bg-gradient-to-br from-[#1ABC9C] to-[#16A085] rounded-xl flex items-center justify-center shadow-lg">
                                                    <span className="text-white font-bold text-lg">{spec.ordem}</span>
                                                </div>
                                                {/* SVG Cota Icon */}
                                                {spec.svg_cota && (
                                                    <div className="w-12 h-12 flex items-center justify-center">
                                                        <div
                                                            className="w-full h-full"
                                                            dangerouslySetInnerHTML={{
                                                                __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.12)); fill: #1ABC9C;">${spec.svg_cota}</svg>`
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                            </div>
                                        </div>

                                        {/* Title Section */}
                                        <div className="min-w-0 flex-8">
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                {spec.descricao_cota}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-2">
                                                {spec.complemento_cota}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <div className="flex items-center gap-3">
                                                {/* SVG Caracteristica Icon */}
                                                {spec.svg_caracteristica && (
                                                    <div className="w-12 h-12 flex items-center justify-center">
                                                        <div
                                                            className="w-full h-full"
                                                            dangerouslySetInnerHTML={{
                                                                __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.12)); fill: #1ABC9C;">${spec.svg_cota}</svg>`
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="flex-shrink-0">
                                        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border-2 ${statusInfo.className}`}>
                                            {statusInfo.icon}
                                            {statusInfo.text}
                                        </span>
                                    </div>
                                </div>

                                {/* Info Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">


                                    {/* Location Card */}
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-500 rounded-lg">
                                                <Eye className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Local</p>
                                                <p className="text-sm font-semibold text-purple-800">
                                                    {getLocalInspecaoLabel(spec.local_inspecao)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Instrument Card */}
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500 rounded-lg">
                                                {getInstrumentIcon(spec.tipo_instrumento)}
                                            </div>
                                            <div>
                                                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Instrumento</p>
                                                <p className="text-sm font-semibold text-blue-800">{spec.tipo_instrumento}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tolerance Card */}
                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-500 rounded-lg">
                                                <Ruler className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Tolerância</p>
                                                <p className="text-sm font-semibold text-orange-800 truncate">
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
                                </div>                                        {/* Measurement Result */}
                                {spec.valor_encontrado !== null && (
                                    <div className="mb-6">
                                        <div className={`p-4 rounded-xl border-2 ${spec.conforme === true ? 'bg-green-50 border-green-200' :
                                            spec.conforme === false ? 'bg-red-50 border-red-200' :
                                                'bg-gray-50 border-gray-200'
                                            }`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                                        Valor Medido
                                                    </p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {spec.valor_encontrado} <span className="text-lg text-gray-600">{spec.unidade_medida}</span>
                                                    </p>
                                                </div>
                                                <div className={`p-3 rounded-full ${spec.conforme === true ? 'bg-green-500' :
                                                    spec.conforme === false ? 'bg-red-500' :
                                                        'bg-gray-500'
                                                    }`}>
                                                    {statusInfo.icon && React.cloneElement(statusInfo.icon, { className: 'h-6 w-6 text-white' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Campos Editáveis - Redesign moderno */}
                                {(spec.valor_encontrado === null || editingValues[spec.id_especificacao]) && (
                                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border-2 border-dashed border-gray-300">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Ruler className="h-5 w-5 text-[#1ABC9C]" />
                                            Realizar Medição
                                        </h4>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                    Valor Encontrado
                                                </label>                                                        <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder={`Insira o valor medido`}
                                                        value={editingValues[spec.id_especificacao]?.valor_encontrado ||
                                                            (spec.valor_encontrado !== null && spec.valor_encontrado !== undefined ? spec.valor_encontrado.toString() : '')}
                                                        onChange={(e) => handleValueChange(spec.id_especificacao, 'valor_encontrado', e.target.value)}
                                                        className="modern-input w-full pl-4 pr-16 py-3 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:border-[#1ABC9C] focus:outline-none focus:ring-4 focus:ring-[#1ABC9C]/20 transition-all"
                                                    />
                                                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                        {spec.unidade_medida}
                                                    </span>
                                                </div>

                                                {/* Status Preview */}
                                                {editingValues[spec.id_especificacao]?.valor_encontrado && (
                                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-white border">
                                                        {(() => {
                                                            const valor = parseFloat(editingValues[spec.id_especificacao].valor_encontrado);
                                                            if (isNaN(valor)) return null;
                                                            const conforme = calculateConforme(valor, spec.valor_minimo, spec.valor_maximo);

                                                            if (conforme === true) {
                                                                return (
                                                                    <div className="flex items-center gap-2 text-green-600">
                                                                        <CheckCircle className="h-5 w-5" />
                                                                        <span className="font-semibold">Valor Conforme</span>
                                                                    </div>
                                                                );
                                                            } else if (conforme === false) {
                                                                return (
                                                                    <div className="flex items-center gap-2 text-red-600">
                                                                        <XCircle className="h-5 w-5" />
                                                                        <span className="font-semibold">Valor Não Conforme</span>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-sm font-semibold text-gray-700">
                                                    Observação (Opcional)
                                                </label>
                                                <textarea
                                                    placeholder="Adicione comentários sobre a medição..."
                                                    value={editingValues[spec.id_especificacao]?.observacao || spec.observacao || ''}
                                                    onChange={(e) => handleValueChange(spec.id_especificacao, 'observacao', e.target.value)}
                                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#1ABC9C] focus:outline-none focus:ring-4 focus:ring-[#1ABC9C]/20 resize-none transition-all"
                                                    rows={4}
                                                />
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        {editingValues[spec.id_especificacao]?.valor_encontrado && (<div className="mt-6 flex justify-end gap-3">
                                            <button
                                                onClick={() => {
                                                    setEditingValues(prev => {
                                                        const updated = { ...prev };
                                                        delete updated[spec.id_especificacao];
                                                        return updated;
                                                    });
                                                }}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                                            >
                                                <XCircle className="h-5 w-5" />
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => handleSaveSpecification(spec)}
                                                disabled={!editingValues[spec.id_especificacao]?.valor_encontrado ||
                                                    isNaN(parseFloat(editingValues[spec.id_especificacao].valor_encontrado))}
                                                className="pulse-button inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#1ABC9C] to-[#16A085] text-white rounded-xl font-semibold hover:from-[#16A085] hover:to-[#148F77] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                                            >
                                                <CheckCircle className="h-5 w-5" />
                                                Salvar Medição
                                            </button>
                                        </div>
                                        )}
                                    </div>
                                )}

                                {/* Observação existente */}
                                {spec.valor_encontrado !== null && !editingValues[spec.id_especificacao] && spec.observacao && (
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                        <p className="text-sm font-semibold text-blue-800 mb-2">Observação da Medição</p>
                                        <p className="text-sm text-blue-700">{spec.observacao}</p>
                                    </div>
                                )}

                                {/* Botão para editar medição existente */}
                                {spec.valor_encontrado !== null && !editingValues[spec.id_especificacao] && (
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => setEditingValues(prev => ({
                                                ...prev,
                                                [spec.id_especificacao]: {
                                                    valor_encontrado: spec.valor_encontrado?.toString() || '',
                                                    observacao: spec.observacao || ''
                                                }
                                            }))}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 rounded-xl font-semibold hover:from-amber-200 hover:to-amber-300 transition-all border border-amber-300"
                                        >
                                            <RefreshCw className="h-5 w-5" />
                                            Reeditar Medição
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1ABC9C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}