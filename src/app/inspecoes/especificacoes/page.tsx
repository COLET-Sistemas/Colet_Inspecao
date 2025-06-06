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
import './layout-styles.css';

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
                        const statusInfo = getConformeStatus(spec.conforme, spec.valor_encontrado); return (<motion.div
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

                            {/* Layout Principal: 80% esquerda (valores) + 20% direita (campos edição) */}
                            <div className="flex h-full min-h-[200px]">
                                {/* Área de Valores - 80% */}
                                <div className="flex-grow w-4/5 p-6 border-r border-gray-100">
                                    {/* Header Section */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            {/* Left Side Icons Container */}
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center gap-3">
                                                    {/* Order Number */}
                                                    <div className="w-12 h-12 bg-gradient-to-br from-[#1ABC9C] to-[#16A085] rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-200">
                                                        <span className="text-white font-bold text-sm">{spec.ordem}</span>
                                                    </div>
                                                    {/* SVG Cota Icon with Border */}
                                                    <div className="w-12 h-12 svg-icon-container bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-[#1ABC9C] hover:bg-[#1ABC9C]/5 transition-all duration-200 group/svg shadow-sm">
                                                        {spec.svg_cota ? (
                                                            <div
                                                                className="w-9 h-9 flex items-center justify-center transition-transform duration-200 group-hover/svg:scale-110"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full svg-icon" style="fill: #1ABC9C;">${spec.svg_cota}</svg>`
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-9 h-9 flex items-center justify-center">
                                                                <div className="w-5 h-5 svg-placeholder rounded-full border-2 border-dashed border-gray-300"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Title Section */}
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight">
                                                    {spec.descricao_cota}
                                                </h3>
                                                <p className="text-gray-600 text-sm mb-2">
                                                    {spec.complemento_cota}
                                                </p>
                                            </div>

                                            {/* Right Side Icon Container */}
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 svg-icon-container bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-[#1ABC9C] hover:bg-[#1ABC9C]/5 transition-all duration-200 group/svg shadow-sm">
                                                    {spec.svg_caracteristica ? (
                                                        <div
                                                            className="w-9 h-9 flex items-center justify-center transition-transform duration-200 group-hover/svg:scale-110"
                                                            dangerouslySetInnerHTML={{
                                                                __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full svg-icon" style="fill: #1ABC9C;">${spec.svg_caracteristica}</svg>`
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 flex items-center justify-center">
                                                            <div className="w-5 h-5 svg-placeholder rounded-full border-2 border-dashed border-gray-300"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex-shrink-0 ml-4">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border-2 transition-all duration-200 hover:scale-105 ${statusInfo.className}`}>
                                                <span className="w-3 h-3 flex items-center justify-center">
                                                    {statusInfo.icon}
                                                </span>
                                                {statusInfo.text}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info Cards Compactas */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {/* Location Card */}
                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-white border border-purple-200 rounded-lg flex items-center justify-center">
                                                    <Eye className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Local</p>
                                                    <p className="text-xs font-semibold text-purple-800 truncate">
                                                        {getLocalInspecaoLabel(spec.local_inspecao)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Instrument Card */}
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-white border border-blue-200 rounded-lg flex items-center justify-center">
                                                    <span className="text-blue-600 flex items-center justify-center">
                                                        {getInstrumentIcon(spec.tipo_instrumento)}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Instrumento</p>
                                                    <p className="text-xs font-semibold text-blue-800 truncate">{spec.tipo_instrumento}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tolerance Card */}
                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200 hover:shadow-md transition-all duration-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-white border border-orange-200 rounded-lg flex items-center justify-center">
                                                    <Ruler className="h-4 w-4 text-orange-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Tolerância</p>
                                                    <p className="text-xs font-semibold text-orange-800 truncate">
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
                                    </div>

                                    {/* Measurement Result */}
                                    {spec.valor_encontrado !== null && (
                                        <div className="mb-4">
                                            <div className={`p-4 rounded-lg border-2 ${spec.conforme === true ? 'bg-green-50 border-green-200' :
                                                spec.conforme === false ? 'bg-red-50 border-red-200' :
                                                    'bg-gray-50 border-gray-200'
                                                }`}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                                            Valor Medido
                                                        </p>
                                                        <p className="text-xl font-bold text-gray-900">
                                                            {spec.valor_encontrado} <span className="text-base text-gray-600">{spec.unidade_medida}</span>
                                                        </p>
                                                    </div>
                                                    <div className={`p-2 rounded-full ${spec.conforme === true ? 'bg-green-500' :
                                                        spec.conforme === false ? 'bg-red-500' :
                                                            'bg-gray-500'
                                                        }`}>
                                                        {statusInfo.icon && React.cloneElement(statusInfo.icon, { className: 'h-5 w-5 text-white' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Observação existente */}
                                    {spec.valor_encontrado !== null && !editingValues[spec.id_especificacao] && spec.observacao && (
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                            <p className="text-xs font-semibold text-blue-800 mb-1">Observação da Medição</p>
                                            <p className="text-xs text-blue-700">{spec.observacao}</p>
                                        </div>
                                    )}

                                    {/* Botão para editar medição existente */}
                                    {spec.valor_encontrado !== null && !editingValues[spec.id_especificacao] && (
                                        <div className="flex justify-center mt-4">
                                            <button
                                                onClick={() => setEditingValues(prev => ({
                                                    ...prev,
                                                    [spec.id_especificacao]: {
                                                        valor_encontrado: spec.valor_encontrado?.toString() || '',
                                                        observacao: spec.observacao || ''
                                                    }
                                                }))}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 rounded-lg font-medium hover:from-amber-200 hover:to-amber-300 transition-all border border-amber-300 text-sm"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                Reeditar
                                            </button>
                                        </div>
                                    )}
                                </div>                                {/* Área de Edição - 20% */}
                                <div className={`w-1/5 bg-gray-50 p-4 flex flex-col justify-center ${(spec.valor_encontrado === null || editingValues[spec.id_especificacao]) ? 'measuring' :
                                    spec.conforme === true ? 'completed' :
                                        spec.conforme === false ? 'non-compliant' : ''
                                    }`}>
                                    {(spec.valor_encontrado === null || editingValues[spec.id_especificacao]) ? (
                                        <div className="space-y-4">
                                            {/* Campo Valor */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-gray-700">
                                                    Valor
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder={`0.00 ${spec.unidade_medida}`}
                                                        value={editingValues[spec.id_especificacao]?.valor_encontrado ||
                                                            (spec.valor_encontrado !== null && spec.valor_encontrado !== undefined ? spec.valor_encontrado.toString() : '')}
                                                        onChange={(e) => handleValueChange(spec.id_especificacao, 'valor_encontrado', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm font-semibold border-2 border-gray-300 rounded-lg focus:border-[#1ABC9C] focus:outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Campo Observação */}
                                            <div className="space-y-2 mt-2">
                                                <label className="text-xs font-semibold text-gray-700">
                                                    Observação
                                                </label>
                                                <textarea
                                                    placeholder="Opcional..."
                                                    value={editingValues[spec.id_especificacao]?.observacao || spec.observacao || ''}
                                                    onChange={(e) => handleValueChange(spec.id_especificacao, 'observacao', e.target.value)}
                                                    className="w-full px-3 py-2 text-xs border-2 border-gray-300 rounded-lg focus:border-[#1ABC9C] focus:outline-none resize-none transition-all"
                                                    rows={2}
                                                />
                                            </div>

                                            {/* Status Preview */}
                                            {editingValues[spec.id_especificacao]?.valor_encontrado && (
                                                <div className="mt-4">
                                                    {(() => {
                                                        const valor = parseFloat(editingValues[spec.id_especificacao].valor_encontrado);
                                                        if (isNaN(valor)) return null;
                                                        const conforme = calculateConforme(valor, spec.valor_minimo, spec.valor_maximo);

                                                        if (conforme === true) {
                                                            return (
                                                                <div className="flex items-center gap-1 text-green-600 text-xs">
                                                                    <CheckCircle className="h-3 w-3" />
                                                                    <span className="font-semibold">Conforme</span>
                                                                </div>
                                                            );
                                                        } else if (conforme === false) {
                                                            return (
                                                                <div className="flex items-center gap-1 text-red-600 text-xs">
                                                                    <XCircle className="h-3 w-3" />
                                                                    <span className="font-semibold">Não Conforme</span>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>)}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500">
                                            <div className="mb-2">
                                                <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
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
                    })}
                </motion.div>
            )}
        </div>
    );
}