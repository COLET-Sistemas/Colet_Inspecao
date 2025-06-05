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
    }, [refreshActiveTab, resetIdleTimer]);

    const handleTabChange = useCallback(async (tabId: string) => {
        setActiveTab(tabId);

        if (!inspectionData[tabId]) {
            await fetchTabData(tabId);
        }
    }, [inspectionData, fetchTabData]);

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
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-8 text-center sm:py-12"
                >
                    <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300 sm:mb-4 sm:h-16 sm:w-16" />
                    <h3 className="mb-2 text-base font-semibold text-gray-600 sm:text-lg">
                        Nenhuma inspeção encontrada
                    </h3>
                    <p className="px-4 text-sm text-gray-500 sm:text-base">
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
                className="space-y-2"
            >
                {currentData.map((item: InspectionItem, index: number) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow duration-200 hover:shadow-sm"
                    >
                        <div className="flex items-center justify-between">                            <div className="flex min-w-0 flex-1 items-center gap-4">                                <span className="text-sm font-medium text-gray-900">
                            ID: {item.id_ficha_inspecao}
                        </span>
                            <span className="truncate text-sm text-gray-600">
                                {getTipoFicha(activeTab)}
                            </span>
                        </div><div className="flex flex-shrink-0 items-center gap-3">                                <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-600">
                            {getSituacao(item.situacao)} {item.data_hora_situacao ? formatDateTime(item.data_hora_situacao) : ''}
                        </span>
                            </div>
                        </div>                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <span>Ordem: {item.numero_ordem}</span>
                            <span>Ref: {item.referencia}</span>
                            <span>Roteiro: {item.roteiro}</span>
                            <span>Lote: {item.numero_lote}</span>
                            <span>Posto: {item.codigo_posto}</span>
                            <span>Origem: {item.origem || 'N/A'}</span>
                            {item.data_hora_prevista && (
                                <span>Prevista: {formatDateTime(item.data_hora_prevista)}</span>
                            )}
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        );
    }; return (
        <div className="w-full space-y-5 p-2 sm:p-4 md:p-6">
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
                    </div>

                    <button
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        className={`
                            flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200
                            ${isRefreshing
                                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
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
                    </button>                </div>
            </div>

            <div className="mb-4 mt-6 sm:mb-6 sm:mt-8">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto scrollbar-hide sm:space-x-6 lg:space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    flex min-w-0 flex-shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-1 py-3 text-xs font-medium transition-colors duration-200 sm:gap-2 sm:px-2 sm:py-4 sm:text-sm
                                    ${activeTab === tab.id
                                        ? "border-[#1ABC9C] text-[#1ABC9C]"
                                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                    }
                                `}
                            >
                                <span className="flex-shrink-0">{tab.icon}</span>
                                <span className="hidden lg:inline">
                                    {tab.label}
                                </span>
                                <span className="hidden sm:inline lg:hidden">
                                    {tab.tabletLabel || tab.label}
                                </span>
                                <span className="text-xs font-normal sm:hidden">
                                    {tab.mobileLabel || tab.label.split(" ")[0]}
                                </span>
                                <span
                                    className={`
                                        ml-1 flex-shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium sm:ml-2 sm:px-2
                                        ${activeTab === tab.id
                                            ? "bg-[#1ABC9C] text-white"
                                            : "bg-gray-100 text-gray-900"
                                        }
                                    `}                            >
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                <motion.p
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 px-1 text-xs text-gray-600 sm:mt-4 sm:text-sm"
                >
                    {tabs.find((tab) => tab.id === activeTab)?.description}
                </motion.p>
            </div>

            <div className="rounded-lg bg-gray-50 p-3 sm:p-4 md:p-6">
                {renderTabContent()}
            </div>
        </div>
    );
}