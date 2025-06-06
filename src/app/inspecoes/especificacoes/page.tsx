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
    const hasInitialized = useRef(false);

    const [specifications, setSpecifications] = useState<InspectionSpecification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
    }, [id]);

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

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
        <div className="w-full space-y-4 p-2 sm:p-3 md:p-4">
            <div className="flex items-center justify-between">
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
                        subtitle={`Ficha ID: ${id} - ${specifications.length} especificação${specifications.length !== 1 ? 'ões' : ''}`}
                        showButton={false}
                    />                </div>
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
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${statusInfo.className}`}>
                                                {statusInfo.icon}
                                                {statusInfo.text}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Informações em Grid */}
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
                                                {spec.valor_minimo} - {spec.valor_maximo} {spec.unidade_medida}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Valor Encontrado</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {spec.valor_encontrado !== null
                                                    ? `${spec.valor_encontrado} ${spec.unidade_medida}`
                                                    : 'Não medido'
                                                }
                                            </p>
                                        </div>

                                        {spec.observacao && (
                                            <div className="space-y-1 col-span-2 sm:col-span-3 lg:col-span-5">
                                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Observação</p>
                                                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2">{spec.observacao}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* SVG Display */}
                                    {(spec.svg_caracteristica || spec.svg_cota) && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {spec.svg_caracteristica && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Característica</p>
                                                        <div
                                                            className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-center min-h-[100px]"
                                                            dangerouslySetInnerHTML={{ __html: spec.svg_caracteristica }}
                                                        />
                                                    </div>
                                                )}
                                                {spec.svg_cota && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cota</p>
                                                        <div
                                                            className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-center min-h-[100px]"
                                                            dangerouslySetInnerHTML={{ __html: spec.svg_cota }}
                                                        />
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