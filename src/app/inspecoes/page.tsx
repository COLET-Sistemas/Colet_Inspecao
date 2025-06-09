"use client";

import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { ColaboradorLoginModal } from "@/components/ui/inspecoes/ColaboradorLoginModal";
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
}

const TAB_API_MAP = {
    processo: "processo",
    qualidade: "qualidade",
    outras: "outras",
    naoConformidade: "nc",
} as const;

const IDLE_TIME = 60000;
const AUTO_REFRESH_INTERVAL = 80000;

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInspection, setSelectedInspection] = useState<InspectionItem | null>(null);
    const [hasColaboradorData, setHasColaboradorData] = useState(false);

    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef(Date.now());
    const initialLoadRef = useRef(false);

    // Helper functions to compute display values
    const getSituacao = useCallback((situacao: string) => {
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
    }, []);    // Função para definir se deve mostrar o layout compacto para tablets
    const shouldUseCompactLayout = useCallback(() => {
        // Verifica se a largura da tela está entre 640px e 1024px (tamanho de tablet)
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 640 && window.innerWidth < 1024;
        }
        return false;
    }, []);

    // Função para verificar se o dispositivo está em orientação vertical (portrait)
    const isInPortraitMode = useCallback(() => {
        if (typeof window !== 'undefined') {
            return window.innerHeight > window.innerWidth;
        }
        return false;
    }, []);

    // Estados para controlar o layout
    const [isCompactLayout, setIsCompactLayout] = useState(false);
    const [isPortrait, setIsPortrait] = useState(false);

    // Atualiza o estado do layout quando a tela for redimensionada
    useEffect(() => {
        const handleResize = () => {
            setIsCompactLayout(shouldUseCompactLayout());
            setIsPortrait(isInPortraitMode());
        };

        // Configuração inicial
        handleResize();

        // Adiciona listener para redimensionamento e mudança de orientação
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, [shouldUseCompactLayout, isInPortraitMode]);

    const checkColaboradorData = useCallback((): boolean => {
        try {
            // Check for codigo_pessoa in colaborador or userData
            const colaboradorData = localStorage.getItem('colaborador');
            const userDataStr = localStorage.getItem('userData') || sessionStorage.getItem('userData');

            // First check colaborador data
            if (colaboradorData) {
                const parsed = JSON.parse(colaboradorData);
                if (!!parsed && typeof parsed.codigo_pessoa === 'string' && parsed.codigo_pessoa.length > 0) {
                    return true;
                }
            }

            // Then check userData
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                if (!!userData && typeof userData.codigo_pessoa === 'string' && userData.codigo_pessoa.length > 0) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Erro ao verificar dados do colaborador:', error);
            return false;
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
            return dateString;
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
        const postos = getPostosFromLocalStorage(); if (postos.length === 0) {
            console.warn("Nenhum posto encontrado no localStorage");
            return [];
        }

        setLoadingTabs(prev => ({ ...prev, [tabId]: true }));

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
    }, [refreshActiveTab]); const handleManualRefresh = useCallback(() => {
        refreshActiveTab();
        resetIdleTimer();
    }, [refreshActiveTab, resetIdleTimer]);

    const handleTabChange = useCallback(async (tabId: string) => {
        setActiveTab(tabId);

        if (!inspectionData[tabId]) {
            await fetchTabData(tabId);
        }
    }, [inspectionData, fetchTabData]);

    const handleModalSuccess = useCallback((data: {
        codigo_pessoa: string;
        nome: string;
        setor: string;
        funcao: string;
        registrar_ficha: boolean;
        encaminhar_ficha: boolean;
        inspection: InspectionItem;
    }) => {
        setIsModalOpen(false);
        setHasColaboradorData(true);

        // Construct URL with all necessary parameters
        const queryParams = new URLSearchParams({
            id: String(data.inspection.id_ficha_inspecao),
            nome: data.nome,
            setor: data.setor,
            funcao: data.funcao,
            registrar_ficha: String(data.registrar_ficha),
            encaminhar_ficha: String(data.encaminhar_ficha)
        });        // Redirect to inspection details page with all required data
        router.push(`/inspecoes/especificacoes?${queryParams.toString()}`);
    }, [router]);

    const handleInspectionClick = useCallback((item: InspectionItem) => {
        // Verificar se o usuário tem código_pessoa no localStorage
        const hasData = checkColaboradorData();
        console.log('Verificação de dados do colaborador:', {
            hasData,
            colaborador: localStorage.getItem('colaborador'),
            userData: localStorage.getItem('userData')
        });

        if (hasData) {
            // Se tiver, redireciona direto para a página de detalhes
            router.push(`/inspecoes/especificacoes?id=${item.id_ficha_inspecao}`);
        } else {
            // Se não tiver, exibe o modal de autenticação
            setSelectedInspection(item); setIsModalOpen(true);
        }
    }, [router, checkColaboradorData]);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!initialLoadRef.current) {
                initialLoadRef.current = true;
                const initialTab = "processo";
                await fetchTabData(initialTab);

                // Verificar se há dados do colaborador no localStorage
                const hasData = checkColaboradorData();
                console.log('Verificação inicial de dados do colaborador:', {
                    hasData,
                    colaborador: localStorage.getItem('colaborador'),
                    userData: localStorage.getItem('userData')
                });

                setHasColaboradorData(hasData);
            }
        };
        loadInitialData();
    }, [fetchTabData, checkColaboradorData]);

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
    }, [resetIdleTimer]); const tabs: TabData[] = [
        {
            id: "processo",
            label: "Inspeções de Processo",
            tabletLabel: "Inspeções Processo",
            mobileLabel: "Processo",
            icon: <Cog className="h-4 w-4" />,
            count: inspectionData.processo?.length || 0,
        },
        {
            id: "qualidade",
            label: "Inspeções de Qualidade",
            tabletLabel: "Inspeções Qualidade",
            mobileLabel: "Qualidade",
            icon: <CheckCircle className="h-4 w-4" />,
            count: inspectionData.qualidade?.length || 0,
        },
        {
            id: "outras",
            label: "Outras Inspeções",
            tabletLabel: "Outras Inspeções",
            mobileLabel: "Outras Inspeções",
            icon: <Users className="h-4 w-4" />,
            count: inspectionData.outras?.length || 0,
        },
        {
            id: "naoConformidade",
            label: "Não Conformidade",
            tabletLabel: "Não Conform.",
            mobileLabel: "N. Conform.",
            icon: <AlertTriangle className="h-4 w-4" />,
            count: inspectionData.naoConformidade?.length || 0,
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
                    className="py-12 text-center sm:py-16"
                >
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 shadow-sm sm:h-24 sm:w-24">
                        <FileText className="h-8 w-8 text-gray-400 sm:h-10 sm:w-10" />
                    </div>
                    <h3 className="mt-6 text-lg font-semibold text-gray-900 sm:text-xl">
                        Nenhuma inspeção encontrada
                    </h3>
                    <p className="mt-2 px-4 text-sm text-gray-500 sm:text-base max-w-md mx-auto">
                        Nenhum registro encontrado
                    </p>
                </motion.div>
            );
        }

        return (<motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
        >
            {currentData.map((item: InspectionItem, index: number) => {
                // Verificar se a data prevista está expirada ou prestes a expirar
                let bgColorClass = "border-gray-100 bg-white/60 hover:border-gray-200 hover:bg-white";
                let dateTextColorClass = "text-gray-600 font-medium";

                if (item.data_hora_prevista) {
                    try {
                        // Parse da data prevista
                        let dataPrevista: Date;

                        // Se a data já vem no formato brasileiro (DD/MM/YYYY HH:mm:ss)
                        if (item.data_hora_prevista.includes('/')) {
                            const parts = item.data_hora_prevista.split(' ');
                            const dateParts = parts[0].split('/');
                            const timeParts = parts[1].split(':');

                            dataPrevista = new Date(
                                parseInt(dateParts[2]), // ano
                                parseInt(dateParts[1]) - 1, // mês (0-11)
                                parseInt(dateParts[0]), // dia
                                parseInt(timeParts[0]), // hora
                                parseInt(timeParts[1]), // minuto
                                parseInt(timeParts[2] || '0') // segundo (opcional)
                            );
                        } else {
                            dataPrevista = new Date(item.data_hora_prevista);
                        } const agora = new Date();
                        const diffMs = dataPrevista.getTime() - agora.getTime();
                        const diffMinutes = diffMs / (1000 * 60);

                        if (diffMs < 0) {
                            bgColorClass = "border-red-200 bg-red-50/80 hover:border-red-300 hover:bg-red-50";
                            dateTextColorClass = "text-red-600 font-bold !text-red-600"; // Usando !important via tailwind
                        }
                        else if (diffMinutes <= 5) {
                            bgColorClass = "border-amber-200 bg-amber-50/80 hover:border-amber-300 hover:bg-amber-50";
                            dateTextColorClass = "text-amber-600 font-bold !text-amber-600"; // Usando !important via tailwind
                        }
                    } catch (error) {
                        console.error("Erro ao processar data prevista:", error);
                    }
                }                // Renderizar layout compacto para tablets ou quando em modo retrato
                if (isCompactLayout || isPortrait) {
                    return (<motion.button
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleInspectionClick(item)}
                        className={`group relative w-full overflow-hidden rounded-lg border ${bgColorClass} backdrop-blur-sm p-2 transition-all duration-300 hover:shadow-md hover:shadow-gray-100/50 cursor-pointer text-left`}
                    >
                        <div className="flex items-center justify-between">
                            {/* Seção esquerda com informações principais */}
                            <div className="flex items-center gap-2 flex-grow">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1ABC9C] to-[#16A085] text-white text-xs font-semibold shadow-sm">
                                    {item.id_ficha_inspecao.toString().padStart(2, '0')}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#1ABC9C] transition-colors truncate">
                                        {item.tipo_inspecao} (OF: #{item.numero_ordem})
                                    </h3>                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-gray-500">
                                        <p className="truncate">
                                            Posto: {item.codigo_posto}
                                        </p>
                                        <div className="hidden sm:inline-block mx-2">•</div>
                                        <p className="truncate">
                                            Proc: {item.processo} - {item.tipo_acao}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Seção direita com status e data prevista */}                            <div className="flex flex-col items-end min-w-fit">
                                <span className={`
                                            inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium
                                            ${item.situacao === '1' ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : item.situacao === '2' ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                            : item.situacao === '3' ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                : item.situacao === '4' ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : item.situacao === '5' ? 'bg-gray-50 text-gray-700 border border-gray-200'
                                                        : item.situacao === '6' ? 'bg-gray-50 text-gray-700 border border-gray-200'
                                                            : item.situacao === '7' ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                                                : item.situacao === '8' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : item.situacao === '9' ? 'bg-red-50 text-red-700 border border-red-200'
                                                                        : 'bg-gray-50 text-gray-700 border border-gray-200'}
                                        `}>
                                    <div className={`
                                                h-1.5 w-1.5 rounded-full
                                                ${item.situacao === '1' ? 'bg-amber-500'
                                            : item.situacao === '2' ? 'bg-purple-500'
                                                : item.situacao === '3' ? 'bg-purple-500'
                                                    : item.situacao === '4' ? 'bg-blue-500'
                                                        : item.situacao === '5' ? 'bg-gray-400'
                                                            : item.situacao === '6' ? 'bg-gray-400'
                                                                : item.situacao === '7' ? 'bg-orange-500'
                                                                    : item.situacao === '8' ? 'bg-emerald-500'
                                                                        : item.situacao === '9' ? 'bg-red-500'
                                                                            : 'bg-gray-400'}
                                            `} />
                                    <span className="whitespace-nowrap">
                                        {getSituacao(item.situacao)}
                                        <span className="hidden sm:inline">{item.data_hora_situacao ? formatDateTime(item.data_hora_situacao) : ''}</span>
                                        <span className="sm:hidden ml-1">{item.data_hora_situacao ? formatDateTime(item.data_hora_situacao) : ''}</span>
                                    </span>
                                </span>                                        {item.data_hora_prevista && (
                                    <p className="mt-1 text-xs">
                                        Previsto: <span className={dateTextColorClass}>
                                            <span className="hidden sm:inline">{formatDateTime(item.data_hora_prevista)}</span>
                                            <span className="sm:hidden">{formatDateTime(item.data_hora_prevista)}</span>
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Observação (se houver) */}
                        {item.obs_criacao && (
                            <div className="bg-gray-50/70 px-2 py-1 rounded-md border border-gray-100">
                                <p className="text-xs text-gray-600 line-clamp-1">
                                    <span className="font-medium">Obs:</span> {item.obs_criacao}
                                </p>
                            </div>
                        )}

                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1ABC9C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </motion.button>
                    );
                }

                // Layout original para desktop e mobile
                return (<motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleInspectionClick(item)}
                    className={`group relative w-full overflow-hidden rounded-lg border ${bgColorClass} backdrop-blur-sm p-3 transition-all duration-300 hover:shadow-md hover:shadow-gray-100/50 cursor-pointer text-left`}
                >
                    {/* Header Principal */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#1ABC9C] to-[#16A085] text-white text-sm font-semibold shadow-sm">
                                {item.id_ficha_inspecao.toString().padStart(2, '0')}
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#1ABC9C] transition-colors">
                                    {item.tipo_inspecao} (OF: #{item.numero_ordem})
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Produto: {item.referencia} - {item.produto}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`
                                        inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium
                                        ${item.situacao === '1' ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : item.situacao === '2' ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                        : item.situacao === '3' ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                            : item.situacao === '4' ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                : item.situacao === '5' ? 'bg-gray-50 text-gray-700 border border-gray-200'
                                                    : item.situacao === '6' ? 'bg-gray-50 text-gray-700 border border-gray-200'
                                                        : item.situacao === '7' ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                                            : item.situacao === '8' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : item.situacao === '9' ? 'bg-red-50 text-red-700 border border-red-200'
                                                                    : 'bg-gray-50 text-gray-700 border border-gray-200'}
                                    `}>
                                <div className={`
                                            h-1.5 w-1.5 rounded-full
                                            ${item.situacao === '1' ? 'bg-amber-500'
                                        : item.situacao === '2' ? 'bg-purple-500'
                                            : item.situacao === '3' ? 'bg-purple-500'
                                                : item.situacao === '4' ? 'bg-blue-500'
                                                    : item.situacao === '5' ? 'bg-gray-400'
                                                        : item.situacao === '6' ? 'bg-gray-400'
                                                            : item.situacao === '7' ? 'bg-orange-500'
                                                                : item.situacao === '8' ? 'bg-emerald-500'
                                                                    : item.situacao === '9' ? 'bg-red-500'
                                                                        : 'bg-gray-400'}
                                        `} />
                                <span className="whitespace-nowrap">
                                    {getSituacao(item.situacao)}
                                    <span className="hidden sm:inline">{item.data_hora_situacao ? formatDateTime(item.data_hora_situacao) : ''}</span>
                                    <span className="sm:hidden ml-1">{item.data_hora_situacao ? formatDateTime(item.data_hora_situacao) : ''}</span>
                                </span>
                            </span>
                        </div>
                    </div>
                    {/* Informações em Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">                                <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Processo</p>
                        <p className="text-sm font-medium text-gray-900">{item.processo} - {item.tipo_acao}</p>
                    </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Posto</p>
                            <p className="text-sm font-medium text-gray-900">{item.codigo_posto}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Origem</p>
                            <p className="text-sm font-medium text-gray-900">{item.origem}</p>                                </div>
                        {/* Data prevista - sempre exibida */}                                <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Prevista</p>
                            <p className="text-sm font-medium text-gray-900">
                                {item.data_hora_prevista ?
                                    <span className={dateTextColorClass}>
                                        <span className="hidden sm:inline">{formatDateTime(item.data_hora_prevista)}</span>
                                        <span className="sm:hidden">{formatDateTime(item.data_hora_prevista)}</span>
                                    </span> :
                                    'Não definida'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Observação</p>
                            <p className="text-sm font-medium text-gray-900">{item.obs_criacao}</p>
                        </div>


                    </div>
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1ABC9C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </motion.button>
                );
            })}
        </motion.div>
        );
    };

    return (
        <div className="w-full space-y-3 p-1 sm:p-2 md:p-2">
            {/* Debug info (hidden) */}
            <div className="hidden">
                Authentication status: {hasColaboradorData ? 'Authenticated' : 'Not authenticated'}
            </div>
            <div className="flex items-center justify-between mb-0 py-0">
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
                    </button>
                </div>
            </div>

            {/* Colaborador Login Modal */}
            {selectedInspection && (
                <ColaboradorLoginModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleModalSuccess}
                    inspection={selectedInspection}
                />
            )}            <div className="mt-1 sm:mt-2">
                <div className="border-b border-gray-100">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto scrollbar-hide sm:space-x-6 lg:space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    relative flex min-w-0 flex-shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-all duration-300 sm:gap-3 sm:px-2 sm:py-4 sm:text-base
                                    ${activeTab === tab.id
                                        ? "border-[#1ABC9C] text-[#1ABC9C]"
                                        : "border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-700"
                                    }
                                `}
                            >                                <span className={`
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
                                    {tab.id in inspectionData ? tab.count : (loadingTabs[tab.id] ? '...' : '?')}
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
                    </nav>                </div>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-gray-50/80 to-white/80 backdrop-blur-sm border border-gray-100/50 p-2 sm:p-3 shadow-sm">
                {renderTabContent()}
            </div>
        </div>
    );
}