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
import { useCallback, useEffect, useRef, useState } from "react";

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
            case '*': return 'Ambos';
            default: return local;
        }
    };

    const getLocalInspecaoColor = (local: string) => {
        switch (local) {
            case 'P': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Q': return 'bg-green-50 text-green-700 border-green-200';
            case '*': return 'bg-purple-50 text-purple-700 border-purple-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    }; const getConformeStatus = (conforme: boolean | null | undefined, valorEncontrado: number | null | undefined) => {
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
    }

    return (
        <div className="w-full space-y-5 p-2 sm:p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
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
                    </p>
                </motion.div>
            ) : (
                <div className="rounded-2xl bg-gradient-to-br from-gray-50/80 to-white/80 backdrop-blur-sm border border-gray-100/50 p-4 sm:p-5 shadow-sm">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >                        {specifications
                        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                        .map((spec, index) => {
                            const statusInfo = getConformeStatus(spec.conforme, spec.valor_encontrado);

                            return (
                                <motion.div
                                    key={spec.id_especificacao}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white/60 backdrop-blur-sm p-5 transition-all duration-300 hover:border-gray-200 hover:bg-white hover:shadow-md hover:shadow-gray-100/50"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#1ABC9C] to-[#16A085] text-white text-sm font-semibold shadow-sm">
                                                {spec.ordem}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-900">
                                                    {spec.descricao_caracteristica}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {spec.descricao_cota} {spec.complemento_cota && `(${spec.complemento_cota})`}
                                                </p>
                                            </div>
                                        </div>                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${statusInfo.className}`}>
                                                {statusInfo.icon}
                                                {statusInfo.text}
                                            </span>
                                            {spec.valor_encontrado !== null && (
                                                <span className="text-xs text-gray-500">
                                                    {spec.valor_encontrado} {spec.unidade_medida}
                                                </span>
                                            )}
                                        </div>
                                    </div>                                    {/* Informações em Grid */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Instrumento</p>
                                            <div className="flex items-center gap-2">
                                                {getInstrumentIcon(spec.tipo_instrumento)}
                                                <p className="text-sm font-medium text-gray-900">{spec.tipo_instrumento}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Local</p>
                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border ${getLocalInspecaoColor(spec.local_inspecao)}`}>
                                                {getLocalInspecaoLabel(spec.local_inspecao)}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tolerância</p>
                                            <p className="text-sm font-medium text-gray-900">
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

                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Unidade</p>
                                            <p className="text-sm font-medium text-gray-900">{spec.unidade_medida}</p>
                                        </div>
                                    </div>                                    {/* Campos Editáveis - Mostrar apenas se não foi medido ou está sendo editado */}
                                    {(spec.valor_encontrado === null || editingValues[spec.id_especificacao]) && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                        Valor Encontrado *
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder={`Valor em ${spec.unidade_medida}`} value={editingValues[spec.id_especificacao]?.valor_encontrado ||
                                                                (spec.valor_encontrado !== null && spec.valor_encontrado !== undefined ? spec.valor_encontrado.toString() : '')}
                                                            onChange={(e) => handleValueChange(spec.id_especificacao, 'valor_encontrado', e.target.value)}
                                                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1ABC9C] focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]/20"
                                                        />
                                                        <span className="text-sm text-gray-500 min-w-fit">{spec.unidade_medida}</span>
                                                    </div>
                                                    {editingValues[spec.id_especificacao]?.valor_encontrado && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            {(() => {
                                                                const valor = parseFloat(editingValues[spec.id_especificacao].valor_encontrado);
                                                                if (isNaN(valor)) return null;
                                                                const conforme = calculateConforme(valor, spec.valor_minimo, spec.valor_maximo);

                                                                if (conforme === true) {
                                                                    return (
                                                                        <span className="flex items-center gap-1 text-green-600">
                                                                            <CheckCircle className="h-3 w-3" />
                                                                            Conforme
                                                                        </span>
                                                                    );
                                                                } else if (conforme === false) {
                                                                    return (
                                                                        <span className="flex items-center gap-1 text-red-600">
                                                                            <XCircle className="h-3 w-3" />
                                                                            Não Conforme
                                                                        </span>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                        Observação (Opcional)
                                                    </label>
                                                    <textarea
                                                        placeholder="Adicione uma observação..."
                                                        value={editingValues[spec.id_especificacao]?.observacao || spec.observacao || ''}
                                                        onChange={(e) => handleValueChange(spec.id_especificacao, 'observacao', e.target.value)}
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1ABC9C] focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]/20 resize-none"
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>                                            {/* Botão de Salvar */}
                                            {editingValues[spec.id_especificacao]?.valor_encontrado && (
                                                <div className="mt-4 flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingValues(prev => {
                                                                const updated = { ...prev };
                                                                delete updated[spec.id_especificacao];
                                                                return updated;
                                                            });
                                                        }}
                                                        className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={() => handleSaveSpecification(spec)}
                                                        disabled={!editingValues[spec.id_especificacao]?.valor_encontrado ||
                                                            isNaN(parseFloat(editingValues[spec.id_especificacao].valor_encontrado))}
                                                        className="inline-flex items-center gap-2 rounded-lg bg-[#1ABC9C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#16A085] disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                        Salvar Medição
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Mostrar observação se já foi medido e não está sendo editado */}
                                    {spec.valor_encontrado !== null && !editingValues[spec.id_especificacao] && spec.observacao && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Observação</p>
                                                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{spec.observacao}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Botão para editar medição já salva */}
                                    {spec.valor_encontrado !== null && !editingValues[spec.id_especificacao] && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <button
                                                onClick={() => setEditingValues(prev => ({
                                                    ...prev,
                                                    [spec.id_especificacao]: {
                                                        valor_encontrado: spec.valor_encontrado?.toString() || '',
                                                        observacao: spec.observacao || ''
                                                    }
                                                }))}
                                                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                Editar Medição
                                            </button>
                                        </div>
                                    )}                                    {/* SVG Display */}
                                    {(spec.svg_caracteristica || spec.svg_cota) && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {spec.svg_caracteristica && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Característica</p>
                                                        <div className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-center min-h-[100px]">
                                                            <div
                                                                className="w-20 h-20 flex items-center justify-center"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.12))">${spec.svg_caracteristica}</svg>`
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {spec.svg_cota && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cota</p>
                                                        <div className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-center min-h-[100px]">
                                                            <div
                                                                className="w-20 h-20 flex items-center justify-center"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.12))">${spec.svg_cota}</svg>`
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1ABC9C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            )}
        </div>
    );
}