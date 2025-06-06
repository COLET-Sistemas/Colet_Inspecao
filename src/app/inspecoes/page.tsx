"use client";

import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { LoadingSpinner } from "@/components/ui/Loading";
import inspecaoService, { InspectionItem } from "@/services/api/inspecaoService";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    CheckCircle,
    Cog,
    FileText,
    RefreshCw,
    Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface TabData {
    id: string;
    label: string;
    tabletLabel?: string;
    mobileLabel?: string;
    icon: React.ReactNode;
    count: number;
    description: string;
}

const TAB_API_MAP = {
    processo: "processo",
    qualidade: "qualidade",
    outras: "outras",
    naoConformidade: "nc",
} as const;

const IDLE_TIME = 15000;
const AUTO_REFRESH_INTERVAL = 180000;

const USER_ACTIVITY_EVENTS = [
    "mousedown",
    "mousemove",
    "keypress",
    "scroll",
    "touchstart",
    "click",
];

export default function InspecoesPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("processo");
    const [inspectionData, setInspectionData] = useState<Record<string, InspectionItem[]>>({});
    const [loadingTabs, setLoadingTabs] = useState<Record<string, boolean>>({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef(Date.now()); const initialLoadRef = useRef(false);

    // Helper functions to compute display values
    const getTipoFicha = useCallback((aba: string) => {
        switch (aba) {
            case 'processo': return 'Inspeção de Processo';
            case 'qualidade': return 'Inspeção de Qualidade';
            case 'outras': return 'Outras Inspeções';
            case 'naoConformidade': return 'Não Conformidade';
            default: return 'Inspeção';
        }
    }, []); const getSituacao = useCallback((situacao: string) => {
        switch (situacao) {
            case '1': return 'Pendente desde';
            case '2': return 'Peça enviada ao CQ em';
            case '3': return 'Peça recebida no CQ em';
            case '4': return 'Em andamento desde';
            case '5': return 'Aguardando definições desde';
            case '6': return '';
            case '7': return 'Interrompida em';
            case '8': return 'Finalizada em';
            case '9': return 'Cancelada em';
            default: return 'Desconhecida';
        }
    }, []);

    const formatDateTime = useCallback((dateString: string) => {
        if (!dateString) return 'N/A';

        // Se a data já vem no formato brasileiro (DD/MM/YYYY HH:mm:ss)
        if (dateString.includes('/')) {
            return dateString;
        }

        // Caso contrário, tenta fazer o parse e formatar
        try {
            const date = new Date(dateString);
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return dateString; // Retorna o valor original se houver erro
        }
    }, []);

    const getPostosFromLocalStorage = useCallback((): string[] => {
        try {
            const postosData = localStorage.getItem("postos-vinculados");
            if (!postosData) return [];

            const parsedData = JSON.parse(postosData);
            if (Array.isArray(parsedData)) {
                return parsedData;
            }
            if (parsedData.selectedPostos && Array.isArray(parsedData.selectedPostos)) {
                return parsedData.selectedPostos;
            }
            return [];
        } catch (error) {
            console.error("Erro ao obter postos do localStorage:", error);
            return [];
        }
    }, []);

    const fetchTabData = useCallback(async (tabId: string) => {
        const postos = getPostosFromLocalStorage();
        if (postos.length === 0) {
            console.warn("Nenhum posto encontrado no localStorage");
            return [];
        } setLoadingTabs(prev => ({ ...prev, [tabId]: true }));

        try {
            const abaApi = TAB_API_MAP[tabId as keyof typeof TAB_API_MAP];
            if (!abaApi) {
                console.error(`Aba não mapeada: ${tabId}`);
                return [];
            }

            const allData = await inspecaoService.getFichasInspecaoPorAba(postos, abaApi);

            setInspectionData(prev => ({ ...prev, [tabId]: allData }));
            return allData;
        } catch (error) {
            console.error(`Erro ao carregar dados da aba ${tabId}:`, error);
            setInspectionData(prev => ({ ...prev, [tabId]: [] }));
            return [];
        } finally {
            setLoadingTabs(prev => ({ ...prev, [tabId]: false }));
        }
    }, [getPostosFromLocalStorage]);

    const refreshActiveTab = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await fetchTabData(activeTab);
            setLastRefresh(new Date());
        } catch (error) {
            console.error("Erro ao atualizar dados:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, [activeTab, fetchTabData]);

    const resetIdleTimer = useCallback(() => {
        lastActivityRef.current = Date.now();

        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }

        if (autoRefreshTimerRef.current) {
            clearTimeout(autoRefreshTimerRef.current);
        }

        idleTimerRef.current = setTimeout(() => {
            const startAutoRefresh = () => {
                refreshActiveTab();
                autoRefreshTimerRef.current = setTimeout(
                    startAutoRefresh,
                    AUTO_REFRESH_INTERVAL
                );
            };
            startAutoRefresh();
        }, IDLE_TIME);
    }, [refreshActiveTab]);

    const handleManualRefresh = useCallback(() => {
        refreshActiveTab(); resetIdleTimer();
    }, [refreshActiveTab, resetIdleTimer]); const handleTabChange = useCallback(async (tabId: string) => {
        setActiveTab(tabId);

        if (!inspectionData[tabId]) {
            await fetchTabData(tabId);
        }
    }, [inspectionData, fetchTabData]);

    const handleInspectionClick = useCallback((item: InspectionItem) => {
        router.push(`/inspecoes/especificacoes?id=${item.id_ficha_inspecao}`);
    }, [router]);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!initialLoadRef.current) {
                initialLoadRef.current = true;
                const initialTab = "processo";
                await fetchTabData(initialTab);
            }
        };
        loadInitialData();
    }, [fetchTabData]);

    useEffect(() => {
        const handleActivity = () => {
            resetIdleTimer();
        }; USER_ACTIVITY_EVENTS.forEach((event) => {
            document.addEventListener(event, handleActivity, true);
        });

        resetIdleTimer();

        return () => {
            USER_ACTIVITY_EVENTS.forEach((event) => {
                document.removeEventListener(event, handleActivity, true);
            });

            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }

            if (autoRefreshTimerRef.current) {
                clearTimeout(autoRefreshTimerRef.current);
            }
        };
    }, [resetIdleTimer]);

    const tabs: TabData[] = [
        {
            id: "processo",
            label: "Inspeções de Processo",
            tabletLabel: "Inspeções Processo",
            mobileLabel: "Processo",
            icon: <Cog className="h-4 w-4" />,
            count: inspectionData.processo?.length || 0,
            description: "Inspeções relacionadas aos processos produtivos",
        },
        {
            id: "qualidade",
            label: "Inspeções de Qualidade",
            tabletLabel: "Inspeções Qualidade",
            mobileLabel: "Qualidade",
            icon: <CheckCircle className="h-4 w-4" />,
            count: inspectionData.qualidade?.length || 0,
            description: "Inspeções de controle de qualidade",
        },
        {
            id: "outras",
            label: "Outras Inspeções",
            tabletLabel: "Outras Inspeções",
            mobileLabel: "Outras Inspeções",
            icon: <Users className="h-4 w-4" />,
            count: inspectionData.outras?.length || 0,
            description: "Outras inspeções diversas",
        },
        {
            id: "naoConformidade",
            label: "Não Conformidade",
            tabletLabel: "Não Conform.",
            mobileLabel: "N. Conform.",
            icon: <AlertTriangle className="h-4 w-4" />,
            count: inspectionData.naoConformidade?.length || 0,
            description: "Registros de não conformidades identificadas",
        },
    ];

    const renderTabContent = () => {
        const currentData = inspectionData[activeTab];
        const isLoading = loadingTabs[activeTab];

        if (isLoading) {
            return (
                <LoadingSpinner
                    size="large"
                    text="Carregando inspeções..."
                    color="primary"
                    showText={true}
                />
            );
        }

        if (!currentData || currentData.length === 0) {
            return (<motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12 text-center sm:py-16"
            >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 shadow-sm sm:h-24 sm:w-24">
                    <FileText className="h-8 w-8 text-gray-400 sm:h-10 sm:w-10" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900 sm:text-xl">
                    Nenhuma inspeção encontrada
                </h3>
                <p className="mt-2 px-4 text-sm text-gray-500 sm:text-base max-w-md mx-auto">
                    Não há {" "}
                    {tabs.find((t) => t.id === activeTab)?.label.toLowerCase()} no
                    momento.
                </p>
            </motion.div>
            );
        }

        return (
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
            >
                {currentData.map((item: InspectionItem, index: number) => (
                    <motion.button
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleInspectionClick(item)}
                        className="group relative w-full overflow-hidden rounded-xl border border-gray-100 bg-white/60 backdrop-blur-sm p-5 transition-all duration-300 hover:border-gray-200 hover:bg-white hover:shadow-md hover:shadow-gray-100/50 cursor-pointer text-left"
                    >
                        {/* Header Principal */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#1ABC9C] to-[#16A085] text-white text-sm font-semibold shadow-sm">
                                    {item.id_ficha_inspecao.toString().padStart(2, '0')}
                                </div>                                <div>                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#1ABC9C] transition-colors">
                                    {getTipoFicha(activeTab)}
                                </h3>
                                    <p className="text-sm text-gray-500">
                                        Posto: {item.codigo_posto}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`
                                    inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium
                                    ${item.situacao === '8' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : item.situacao === '9' ? 'bg-red-50 text-red-700 border border-red-200'
                                            : item.situacao === '7' ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                                : item.situacao === '4' ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : 'bg-gray-50 text-gray-700 border border-gray-200'}
                                `}>
                                    <div className={`
                                        h-1.5 w-1.5 rounded-full
                                        ${item.situacao === '8' ? 'bg-emerald-500'
                                            : item.situacao === '9' ? 'bg-red-500'
                                                : item.situacao === '7' ? 'bg-orange-500'
                                                    : item.situacao === '4' ? 'bg-blue-500'
                                                        : 'bg-gray-400'}
                                    `} />
                                    <span className="whitespace-nowrap">
                                        {getSituacao(item.situacao)} {item.data_hora_situacao ? formatDateTime(item.data_hora_situacao) : ''}
                                    </span>
                                </span>
                            </div>
                        </div>                        {/* Informações em Grid */}
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ordem</p>
                                <p className="text-sm font-medium text-gray-900">#{item.numero_ordem}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Referência</p>
                                <p className="text-sm font-medium text-gray-900">{item.referencia}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Roteiro</p>
                                <p className="text-sm font-medium text-gray-900">{item.roteiro}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Lote</p>
                                <p className="text-sm font-medium text-gray-900">{item.numero_lote}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Origem</p>
                                <p className="text-sm font-medium text-gray-900">{item.origem}</p>
                            </div>

                            {item.data_hora_prevista && (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Prevista</p>
                                    <p className="text-sm font-medium text-gray-900">{formatDateTime(item.data_hora_prevista)}</p>
                                </div>
                            )}                </div>                {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1ABC9C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </motion.button>
                ))}
            </motion.div>
        );
    };

    return (
        <div className="w-full space-y-4 p-2 sm:p-3 md:p-4">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Inspeções"
                    subtitle="Gerencie todas as inspeções do sistema"
                    showButton={false}
                />
                <div className="flex items-center gap-3">
                    <div className=" sm:block text-xs text-gray-500">
                        Última atualização:{" "}
                        {lastRefresh.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>                    <button
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        className={`
                            relative flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm
                            ${isRefreshing
                                ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                                : "border-gray-200 bg-white text-gray-700 hover:border-[#1ABC9C] hover:bg-[#1ABC9C] hover:text-white hover:shadow-md"
                            }
                        `}
                        title="Atualizar dados"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                        />
                        <span className="hidden sm:inline">
                            {isRefreshing ? "Atualizando..." : "Atualizar"}
                        </span>
                    </button></div>
            </div>            <div className="mb-6 mt-8 sm:mb-8 sm:mt-10">
                <div className="border-b border-gray-100">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide sm:space-x-8 lg:space-x-10">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    relative flex min-w-0 flex-shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-all duration-300 sm:gap-3 sm:px-2 sm:py-5 sm:text-base
                                    ${activeTab === tab.id
                                        ? "border-[#1ABC9C] text-[#1ABC9C]"
                                        : "border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-700"
                                    }
                                `}
                            >
                                <span className={`
                                    flex-shrink-0 transition-all duration-300
                                    ${activeTab === tab.id ? 'scale-110' : ''}
                                `}>
                                    {tab.icon}
                                </span>
                                <span className="hidden lg:inline">
                                    {tab.label}
                                </span>
                                <span className="hidden sm:inline lg:hidden">
                                    {tab.tabletLabel || tab.label}
                                </span>
                                <span className="text-sm font-normal sm:hidden">
                                    {tab.mobileLabel || tab.label.split(" ")[0]}
                                </span>
                                <span
                                    className={`
                                        ml-1 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold transition-all duration-300 sm:ml-2 sm:px-2.5 sm:py-1
                                        ${activeTab === tab.id
                                            ? "bg-[#1ABC9C] text-white shadow-sm"
                                            : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                                        }
                                    `}
                                >
                                    {tab.count}
                                </span>

                                {/* Active indicator */}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-[#1ABC9C] rounded-full"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 px-1 sm:mt-6"
                >
                    <p className="text-sm text-gray-600 sm:text-base">
                        {tabs.find((tab) => tab.id === activeTab)?.description}
                    </p>
                </motion.div>            </div><div className="rounded-2xl bg-gradient-to-br from-gray-50/80 to-white/80 backdrop-blur-sm border border-gray-100/50 p-4 sm:p-5 shadow-sm">
                {renderTabContent()}
            </div>
        </div>
    );
}