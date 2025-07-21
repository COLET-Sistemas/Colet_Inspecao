"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { LoadingSpinner } from "@/components/ui/Loading";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { ColaboradorLoginModal } from "@/components/ui/inspecoes/ColaboradorLoginModal";
import QuantidadeInputModal from "@/components/ui/inspecoes/QuantidadeInputModal";
import inspecaoService, { InspectionItem } from "@/services/api/inspecaoService";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    Box,
    Calendar,
    CheckCircle,
    CheckSquare,
    Clock,
    Cog,
    FileText,
    Layers,
    MapPin,
    Package,
    Pencil,
    RefreshCw,
    Tag,
    User,
    Users
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

const IDLE_TIME = 1800000;
const AUTO_REFRESH_INTERVAL = 1800000;

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

    const getInitialTab = () => {
        try {
            const savedTab = localStorage.getItem('activeInspectionTab');
            if (savedTab) return savedTab;

            const userDataStr = localStorage.getItem('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                if (userData?.perfil_inspecao) {
                    const perfil = userData.perfil_inspecao;
                    const hasQ = (typeof perfil === 'string' && perfil.includes('Q')) ||
                        (Array.isArray(perfil) && perfil.includes('Q'));
                    if (hasQ) return "qualidade";
                }
            }
            return "processo";
        } catch {
            return "processo";
        }
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());
    const [inspectionData, setInspectionData] = useState<Record<string, InspectionItem[]>>({});
    const [loadingTabs, setLoadingTabs] = useState<Record<string, boolean>>({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInspection, setSelectedInspection] = useState<InspectionItem | null>(null);
    const [isNaoConformidadeContext, setIsNaoConformidadeContext] = useState(false);
    const [isQuantidadeModalOpen, setIsQuantidadeModalOpen] = useState(false);
    const [selectedQuantidadeInspection, setSelectedQuantidadeInspection] = useState<InspectionItem | null>(null);
    const [isQuantidadeContext, setIsQuantidadeContext] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | "warning" | "info">("error");
    const [isCompactLayout, setIsCompactLayout] = useState(false);
    const [isPortrait, setIsPortrait] = useState(false);
    const [postosText, setPostosText] = useState<string>("");

    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef(Date.now());
    const initialLoadRef = useRef(false);

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
    }, []);

    const shouldUseCompactLayout = useCallback(() => {
        return typeof window !== 'undefined' &&
            window.innerWidth >= 640 &&
            window.innerWidth < 1024;
    }, []);

    const isInPortraitMode = useCallback(() => {
        return typeof window !== 'undefined' &&
            window.innerHeight > window.innerWidth;
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsCompactLayout(shouldUseCompactLayout());
            setIsPortrait(isInPortraitMode());
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        let orientationHintTimer: NodeJS.Timeout | null = null;
        if (shouldUseCompactLayout() && isInPortraitMode() && !sessionStorage.getItem('orientation-hint')) {
            orientationHintTimer = setTimeout(() => {
                sessionStorage.setItem('orientation-hint', 'true');
            }, 2000);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            if (orientationHintTimer) {
                clearTimeout(orientationHintTimer);
            }
        };
    }, [shouldUseCompactLayout, isInPortraitMode]);

    const checkColaboradorData = useCallback((): boolean => {
        try {
            const colaboradorData = localStorage.getItem('colaborador');
            const userDataStr = localStorage.getItem('userData') || sessionStorage.getItem('userData');

            if (colaboradorData) {
                const parsed = JSON.parse(colaboradorData);
                if (parsed?.codigo_pessoa?.length > 0) return true;
            }

            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                if (userData?.codigo_pessoa?.length > 0) return true;
            }

            return false;
        } catch {
            return false;
        }
    }, []);

    const canRegisterNaoConformidade = useCallback((item?: InspectionItem): boolean => {
        try {
            if (activeTab !== "processo" || !item || item.id_tipo_inspecao !== 4 || item.origem === "Não Conformidade") {
                return false;
            }

            const userDataStr = localStorage.getItem('userData');
            if (!userDataStr) return false;

            const userData = JSON.parse(userDataStr);
            if (!userData?.perfil_inspecao) return false;

            const perfil = userData.perfil_inspecao;
            return (typeof perfil === 'string' && perfil.includes('O')) ||
                (Array.isArray(perfil) && perfil.includes('O'));
        } catch {
            return false;
        }
    }, [activeTab]);

    const canRegisterQuantidade = useCallback((item?: InspectionItem): boolean => {
        try {
            if (!["processo", "naoConformidade"].includes(activeTab) ||
                !item ||
                item.id_tipo_inspecao !== 9) {
                return false;
            }
            return !!localStorage.getItem('userData');
        } catch {
            return false;
        }
    }, [activeTab]);

    const handleNaoConformidadeClick = useCallback((e: React.MouseEvent, item: InspectionItem) => {
        e.stopPropagation();
        setIsQuantidadeContext(false);
        setIsNaoConformidadeContext(true);

        const userDataStr = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (!userDataStr) {
            setSelectedInspection(item);
            setIsModalOpen(true);
            return;
        }

        try {
            const userData = JSON.parse(userDataStr);
            if (!userData?.perfil_inspecao) {
                setSelectedInspection(item);
                setIsNaoConformidadeContext(true);
                setIsModalOpen(true);
                return;
            }

            const perfil = userData.perfil_inspecao;
            const hasPerfilO = (typeof perfil === 'string' && perfil.includes('O')) ||
                (Array.isArray(perfil) && perfil.includes('O'));

            if (hasPerfilO) {
                setSelectedInspection(item);
                setIsNaoConformidadeContext(true);
                setIsModalOpen(true);
                return;
            }

            if (!userData?.encaminhar_ficha) {
                setSelectedInspection(item);
                setIsNaoConformidadeContext(true);
                setIsModalOpen(true);
                return;
            }

        } catch {
            setSelectedInspection(item);
            setIsNaoConformidadeContext(true);
            setIsModalOpen(true);
        }
    }, []);

    const formatDateTime = useCallback((dateString: string) => {
        if (!dateString) return 'N/A';
        if (dateString.includes('/')) return dateString;

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
            if (Array.isArray(parsedData)) return parsedData;
            if (Array.isArray(parsedData?.selectedPostos)) return parsedData.selectedPostos;
            return [];
        } catch {
            return [];
        }
    }, []);

    const formatPostosSubtitle = useCallback((): string => {
        try {
            const userDataStr = localStorage.getItem('userData');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;
            const perfil = userData?.perfil_inspecao;

            const hasQ = (typeof perfil === 'string' && perfil.includes('Q')) ||
                (Array.isArray(perfil) && perfil.includes('Q'));

            if (hasQ) return "Todos os postos CQ";

            const postos = getPostosFromLocalStorage();
            if (postos.length === 0) return "Postos: Nenhum posto selecionado";

            const limite = 8;
            const exibidos = postos.slice(0, limite);
            const restante = postos.length - limite;
            const label = `Postos: ${exibidos.join(', ')}`;
            return restante > 0 ? `${label} +${restante}` : label;
        } catch {
            return "Postos: -";
        }
    }, [getPostosFromLocalStorage]);


    const fetchTabData = useCallback(async (tabId: string) => {
        const postos = getPostosFromLocalStorage();

        let hasPerfilQ = false;
        try {
            const userDataStr = localStorage.getItem('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                const perfil = userData?.perfil_inspecao;
                hasPerfilQ = (typeof perfil === 'string' && perfil.includes('Q')) ||
                    (Array.isArray(perfil) && perfil.includes('Q'));
            }
        } catch {
            // Silent error handling
        }

        if (postos.length === 0 && !hasPerfilQ) {
            setAlertMessage("Nenhum posto de trabalho encontrado. Por favor, selecione pelo menos um posto.");
            setAlertType("info");
            return [];
        }

        setLoadingTabs(prev => ({ ...prev, [tabId]: true }));

        try {
            const abaApi = TAB_API_MAP[tabId as keyof typeof TAB_API_MAP];
            if (!abaApi) return [];

            const allData = await inspecaoService.getFichasInspecaoPorAba(postos, abaApi);
            setInspectionData(prev => ({ ...prev, [tabId]: allData }));
            return allData;
        } catch {
            setInspectionData(prev => ({ ...prev, [tabId]: [] }));
            return [];
        } finally {
            setLoadingTabs(prev => ({ ...prev, [tabId]: false }));
        }
    }, [getPostosFromLocalStorage]);

    useEffect(() => {
        const clearStoredTabTimeout = setTimeout(() => {
            localStorage.removeItem('activeInspectionTab');
        }, 500);

        return () => clearTimeout(clearStoredTabTimeout);
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!initialLoadRef.current) {
                initialLoadRef.current = true;
                await fetchTabData(activeTab);

                const subtitleText = formatPostosSubtitle();
                setPostosText(subtitleText);
            }
        };
        loadInitialData();
    }, [fetchTabData, formatPostosSubtitle, activeTab]);

    const refreshActiveTab = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await fetchTabData(activeTab);
            setLastRefresh(new Date());
            const subtitleText = formatPostosSubtitle();
            setPostosText(subtitleText);
        } catch {
            // Silent error handling
        } finally {
            setIsRefreshing(false);
        }
    }, [activeTab, fetchTabData, formatPostosSubtitle]);

    const resetIdleTimer = useCallback(() => {
        lastActivityRef.current = Date.now();

        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (autoRefreshTimerRef.current) clearTimeout(autoRefreshTimerRef.current);

        idleTimerRef.current = setTimeout(() => {
            const startAutoRefresh = () => {
                refreshActiveTab();
                autoRefreshTimerRef.current = setTimeout(startAutoRefresh, AUTO_REFRESH_INTERVAL);
            };
            startAutoRefresh();
        }, IDLE_TIME);
    }, [refreshActiveTab]);

    const handleManualRefresh = useCallback(() => {
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

        if (isQuantidadeContext) {
            setIsQuantidadeContext(false);
            setSelectedQuantidadeInspection(data.inspection);
            setIsQuantidadeModalOpen(true);
            return;
        }

        localStorage.setItem('activeInspectionTab', activeTab);
        router.push(`/inspecoes/especificacoes?id=${data.inspection.id_ficha_inspecao}`);
    }, [router, activeTab, isQuantidadeContext]);

    const handleNaoConformidadeSuccess = useCallback((quantidade: number, inspection: InspectionItem) => {
        setAlertMessage(`${quantidade} não conformidade(s) registrada(s) com sucesso para a inspeção ${inspection.referencia}`);
        setAlertType("success");
        setIsNaoConformidadeContext(false);
        setSelectedInspection(null);
        refreshActiveTab();
    }, [refreshActiveTab]);

    const handleRegistrarQuantidadeClick = useCallback((e: React.MouseEvent, item: InspectionItem) => {
        e.stopPropagation();

        const userDataStr = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (!userDataStr) {
            setSelectedInspection(item);
            setIsNaoConformidadeContext(false);
            setIsQuantidadeContext(true);
            setIsModalOpen(true);
            return;
        }

        try {
            const userData = JSON.parse(userDataStr);

            if (!userData?.perfil_inspecao) {
                setSelectedInspection(item);
                setIsNaoConformidadeContext(false);
                setIsQuantidadeContext(true);
                setIsModalOpen(true);
                return;
            }

            const perfil = userData.perfil_inspecao;
            const hasPerfilO = (typeof perfil === 'string' && perfil.includes('O')) ||
                (Array.isArray(perfil) && perfil.includes('O'));

            if (hasPerfilO) {
                setSelectedInspection(item);
                setIsNaoConformidadeContext(false);
                setIsQuantidadeContext(true);
                setIsModalOpen(true);
                return;
            }

            if (userData?.codigo_pessoa) {
                setSelectedQuantidadeInspection(item);
                setIsQuantidadeModalOpen(true);
                return;
            }

            setSelectedInspection(item);
            setIsNaoConformidadeContext(false);
            setIsQuantidadeContext(true);
            setIsModalOpen(true);
        } catch {
            setSelectedInspection(item);
            setIsNaoConformidadeContext(false);
            setIsQuantidadeContext(true);
            setIsModalOpen(true);
        }
    }, []);

    const handleInspectionClick = useCallback((item: InspectionItem) => {
        localStorage.setItem('activeInspectionTab', activeTab);
        const hasData = checkColaboradorData();

        const userDataStr = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        let hasPerfilO = false;

        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                const perfil = userData?.perfil_inspecao;
                hasPerfilO = (typeof perfil === 'string' && perfil.includes('O')) ||
                    (Array.isArray(perfil) && perfil.includes('O'));
            } catch {
                // Silent error handling
            }
        }

        if (hasPerfilO) {
            setSelectedInspection(item);
            setIsNaoConformidadeContext(false);
            setIsModalOpen(true);
            return;
        }

        if (hasData) {
            router.push(`/inspecoes/especificacoes?id=${item.id_ficha_inspecao}`);
        } else {
            setSelectedInspection(item);
            setIsNaoConformidadeContext(false);
            setIsModalOpen(true);
        }
    }, [router, checkColaboradorData, activeTab]);

    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setIsNaoConformidadeContext(false);
        setIsQuantidadeContext(false);
        setSelectedInspection(null);
    }, []);

    const handleQuantidadeModalClose = useCallback(() => {
        setIsQuantidadeModalOpen(false);
        setSelectedQuantidadeInspection(null);
    }, []);

    const handleQuantidadeSuccess = useCallback((quantidade: number, quantidadeInspecionada?: number) => {
        if (selectedQuantidadeInspection) {
            const message = quantidadeInspecionada !== undefined
                ? `Quantidade ${quantidade} produzida e ${quantidadeInspecionada} inspecionada registrada com sucesso`
                : `Quantidade ${quantidade} registrada com sucesso para a inspeção ${selectedQuantidadeInspection.referencia}`;
            setAlertMessage(message);
            setAlertType("success");
        }
        setIsQuantidadeModalOpen(false);
        setSelectedQuantidadeInspection(null);
        refreshActiveTab();
    }, [refreshActiveTab, selectedQuantidadeInspection]);

    const showAlert = useCallback((message: string, type: "success" | "error" | "warning" | "info" = "error") => {
        setAlertMessage(message);
        setAlertType(type);
    }, []);

    const handleAlertDismiss = useCallback(() => {
        setAlertMessage(null);
    }, []);

    const getSituacaoIcon = useCallback((situacao: string) => {
        switch (situacao) {
            case '1': return <Clock className="h-3.5 w-3.5 text-amber-500" />;
            case '2': case '3': return <Box className="h-3.5 w-3.5 text-purple-500" />;
            case '4': return <User className="h-3.5 w-3.5 text-blue-500" />;
            case '5': case '6': return <Clock className="h-3.5 w-3.5 text-gray-400" />;
            case '7': return <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />;
            case '8': return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
            case '9': return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
            default: return <Clock className="h-3.5 w-3.5 text-gray-400" />;
        }
    }, []);

    useEffect(() => {
        const handleActivity = () => resetIdleTimer();

        USER_ACTIVITY_EVENTS.forEach((event) => {
            document.addEventListener(event, handleActivity, true);
        });

        resetIdleTimer();

        return () => {
            USER_ACTIVITY_EVENTS.forEach((event) => {
                document.removeEventListener(event, handleActivity, true);
            });

            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (autoRefreshTimerRef.current) clearTimeout(autoRefreshTimerRef.current);
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
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="relative">
                        <LoadingSpinner
                            color="primary" size="medium" text="Carregando inspeções..."
                        />
                    </div>
                </div>
            );
        }

        if (!currentData || currentData.length === 0) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-12 text-center sm:py-16"
                >
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm sm:h-24 sm:w-24">
                        <FileText className="h-8 w-8 text-gray-400 sm:h-10 sm:w-10" />
                    </div>
                    <h3 className="mt-6 text-lg font-semibold text-gray-900 sm:text-xl">
                        Nenhuma inspeção encontrada
                    </h3>
                    <p className="mt-2 px-4 text-sm text-gray-500 sm:text-base max-w-md mx-auto">
                        Não existem inspeções cadastradas para esta categoria no momento
                    </p>
                    <button
                        onClick={handleManualRefresh}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-[#1ABC9C] hover:border-[#1ABC9C]/30 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]/20"
                    >
                        <RefreshCw className="h-4 w-4 transition-transform duration-300 hover:rotate-180" />
                        Verificar novamente
                    </button>
                </motion.div>
            );
        }

        return (
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="space-y-3 overflow-hidden"
            >
                {currentData.map((item: InspectionItem, index: number) => {
                    let bgColorClass = "border-gray-200 bg-white/60 hover:border-gray-300 hover:bg-white";
                    let dateTextColorClass = "text-gray-600 font-medium";

                    if (item.data_hora_prevista) {
                        try {
                            let dataPrevista: Date;

                            if (item.data_hora_prevista.includes('/')) {
                                const parts = item.data_hora_prevista.split(' ');
                                const dateParts = parts[0].split('/');
                                const timeParts = parts[1].split(':');

                                dataPrevista = new Date(
                                    parseInt(dateParts[2]),
                                    parseInt(dateParts[1]) - 1,
                                    parseInt(dateParts[0]),
                                    parseInt(timeParts[0]),
                                    parseInt(timeParts[1]),
                                    parseInt(timeParts[2] || '0')
                                );
                            } else {
                                dataPrevista = new Date(item.data_hora_prevista);
                            }

                            const agora = new Date();
                            const diffMs = dataPrevista.getTime() - agora.getTime();
                            const diffMinutes = diffMs / (1000 * 60);

                            if (diffMs < 0) {
                                bgColorClass = "border-red-200 bg-red-50/80 hover:border-red-300 hover:bg-red-50";
                                dateTextColorClass = "text-red-600 font-bold !text-red-600";
                            }
                            else if (diffMinutes <= 60) {
                                bgColorClass = "border-amber-200 bg-amber-50/80 hover:border-amber-300 hover:bg-amber-50";
                                dateTextColorClass = "text-amber-600 font-bold !text-amber-600";
                            }
                        } catch {
                        }
                    }

                    if (isCompactLayout || isPortrait) {
                        return (
                            <motion.div
                                key={item.id_ficha_inspecao}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03, duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                                onClick={() => handleInspectionClick(item)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleInspectionClick(item);
                                    }
                                }}
                                tabIndex={0}
                                role="button"
                                aria-label={`Abrir inspeção ${item.tipo_inspecao} - OF: ${item.numero_ordem}`}
                                className={`group relative w-full overflow-hidden rounded-lg border ${bgColorClass} backdrop-blur-sm p-3 pr-0 transition-all duration-300 hover:shadow-md hover:shadow-gray-100/50 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#1ABC9C] focus:ring-offset-2`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1ABC9C] to-[#16A085] text-white text-xs font-semibold shadow-sm">
                                            {item.id_ficha_inspecao.toString().padStart(2, '0')}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#1ABC9C] transition-colors truncate">
                                                {item.tipo_inspecao}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 leading-tight">
                                                <span className="truncate inline-flex items-center">
                                                    #{item.numero_ordem}
                                                </span>
                                                <span className="truncate inline-flex items-center">
                                                    • <MapPin className="h-2.5 w-2.5 text-gray-400 mx-1 hidden sm:inline" />
                                                    {item.codigo_posto}
                                                </span>
                                                <span className="truncate inline-flex items-center">
                                                    • <Tag className="h-2.5 w-2.5 text-gray-400 mx-1 hidden sm:inline" />
                                                    {item.origem}
                                                </span>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Status badge - melhorado com ícone */}
                                    <div className="flex flex-col items-end min-w-fit gap-1">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium
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
                                            {(isCompactLayout || !isPortrait) && getSituacaoIcon(item.situacao)}
                                            <span className="whitespace-nowrap">
                                                {getSituacao(item.situacao)}
                                                {item.data_hora_situacao && <span className="ml-1">
                                                    {isCompactLayout || isPortrait
                                                        ? formatDateTime(item.data_hora_situacao).replace(/:\d{2}$/, '')
                                                        : formatDateTime(item.data_hora_situacao)}
                                                </span>}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center mt-3 gap-2 pr-0">
                                    <div className="flex flex-wrap gap-2 text-xs flex-1 pr-0">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md">
                                                <Layers className="h-3 w-3 text-gray-500 mr-1" />
                                                <span className="text-gray-700">{item.processo}-{item.tipo_acao}</span>
                                            </span>
                                            <span className="flex items-center text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md">
                                                <Package className="h-3 w-3 text-gray-500 mr-1" />
                                                <span className="text-gray-700">Prod: {item.qtde_produzida || 0}</span>
                                            </span>
                                            <span className="flex items-center text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md">
                                                <CheckSquare className="h-3 w-3 text-gray-500 mr-1" />
                                                <span className="text-gray-700">Insp: {item.qtde_inspecionada || 0}</span>
                                            </span>
                                            <span className="flex items-center text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md">
                                                <Calendar className="h-3 w-3 text-gray-500 mr-1" />
                                                <span className="text-gray-700">{item.data_hora_prevista ? (
                                                    <span className={`font-medium ${dateTextColorClass}`}>
                                                        {isCompactLayout || isPortrait
                                                            ? formatDateTime(item.data_hora_prevista).replace(/:\d{2}$/, '')
                                                            : formatDateTime(item.data_hora_prevista)}
                                                    </span>
                                                ) : (
                                                    <span className={`text-gray-700 ${isCompactLayout || isPortrait ? 'mr-1' : ''}`}>Não definida</span>
                                                )}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex gap-2 ml-auto pr-0 mr-1">
                                            {canRegisterNaoConformidade(item) && (
                                                <span>
                                                    <button
                                                        onClick={(e) => handleNaoConformidadeClick(e, item)}
                                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-[10px] font-medium transition-colors duration-200 shadow-sm flex items-center gap-1 cursor-pointer mr-0"
                                                    >
                                                        <AlertTriangle className="h-3 w-3" />
                                                        <span className="hidden sm:inline">Registrar NC</span>
                                                    </button>
                                                </span>
                                            )}
                                            {canRegisterQuantidade(item) && (
                                                <span>
                                                    <button
                                                        onClick={(e) => handleRegistrarQuantidadeClick(e, item)}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-medium transition-colors duration-200 shadow-sm flex items-center gap-1 cursor-pointer mr-0"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                        <span className="hidden sm:inline">Quantidade</span>
                                                    </button>
                                                </span>
                                            )}
                                        </div>

                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1ABC9C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            </motion.div>
                        );
                    }

                    return (
                        <motion.div
                            key={item.id_ficha_inspecao}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03, duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                            onClick={() => handleInspectionClick(item)}
                            className={`group relative w-full overflow-hidden rounded-lg border ${bgColorClass} backdrop-blur-sm p-4 pr-0 transition-all duration-300 hover:shadow-md hover:shadow-gray-200/50 cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#1ABC9C]`}
                        >
                            {/* Cabeçalho do Card */}
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#1ABC9C] to-[#16A085] text-white text-sm font-semibold shadow-sm">
                                        {item.id_ficha_inspecao.toString().padStart(2, '0')}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#1ABC9C] transition-colors truncate">
                                            {item.tipo_inspecao}
                                        </h3>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-sm text-gray-600">
                                            <span className="flex items-center font-medium truncate">
                                                <Tag className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                                <span>OF:</span>
                                                <span className="ml-1 font-semibold">{isPortrait ? item.numero_ordem : `#${item.numero_ordem}`}</span>
                                            </span>
                                            <span className="hidden sm:block text-gray-300">|</span>
                                            <span className="flex items-center">
                                                <span className="truncate">{item.referencia}{item.produto && ` - ${item.produto}`}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status badges e informações temporais */}
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <span className={`
                                        flex items-center gap-1.5 rounded-full pl-2.5 pr-3 py-1 text-xs font-medium
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
                                        {getSituacaoIcon(item.situacao)}
                                        <span className="whitespace-nowrap">
                                            {getSituacao(item.situacao)}
                                            {item.data_hora_situacao && <span className="ml-1">{formatDateTime(item.data_hora_situacao)}</span>}
                                        </span>
                                    </span>

                                    {/* Data prevista como badge separada com ícone */}
                                    <div className="flex gap-2 ml-auto pr-0 mr-1">
                                        {canRegisterNaoConformidade(item) && (
                                            <div>
                                                <button
                                                    onClick={(e) => handleNaoConformidadeClick(e, item)}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors duration-200 shadow-sm flex items-center gap-2 cursor-pointer mr-0"
                                                >
                                                    <AlertTriangle className="h-3.5 w-3.5" />
                                                    <span>
                                                        {isCompactLayout || isPortrait ? 'Registrar NC' : 'Registrar Não Conformidade'}
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                        {canRegisterQuantidade(item) && (
                                            <div>
                                                <button
                                                    onClick={(e) => handleRegistrarQuantidadeClick(e, item)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors duration-200 shadow-sm flex items-center gap-2 cursor-pointer mr-0"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    <span>
                                                        {isCompactLayout || isPortrait ? 'Quantidade' : 'Quantidade'}
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Grid de informações detalhadas */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2 mt-2 pt-3 border-t border-gray-200 pr-0">
                                <div className="lg:col-span-1">
                                    <div className="flex items-center">
                                        <Layers className="h-4 w-4 text-gray-500 mr-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase mr-1.5">Proc:</p>
                                        <p className="text-xs font-semibold text-gray-900">{item.processo}-{item.tipo_acao}</p>
                                    </div>
                                </div>

                                <div className="lg:col-span-1">
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase mr-1.5">Posto:</p>
                                        <p className="text-xs font-semibold text-gray-900">{item.codigo_posto}</p>
                                    </div>
                                </div>

                                <div className="lg:col-span-1">
                                    <div className="flex items-center">
                                        <Tag className="h-4 w-4 text-gray-500 mr-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase mr-1.5">Origem:</p>
                                        <p className="text-xs font-semibold text-gray-900">{item.origem}</p>
                                    </div>
                                </div>

                                <div className="lg:col-span-1 lg:pr-10">
                                    <div className="flex items-center">
                                        <Package className="h-4 w-4 text-gray-500 mr-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase mr-1.5">Qtde Prod / Insp:</p>
                                        <p className="text-xs font-semibold text-gray-900">{item.qtde_produzida || 0} / {item.qtde_inspecionada || 0}</p>
                                    </div>
                                </div>

                                <div className="lg:col-span-1">
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                                        <p className="text-xs font-medium text-gray-500 uppercase mr-1.5">Previsão:</p>
                                        <p className="text-xs font-semibold text-gray-900">{item.data_hora_prevista ? (
                                            <span className={`font-medium ${dateTextColorClass}`}>
                                                {isCompactLayout || isPortrait
                                                    ? formatDateTime(item.data_hora_prevista).replace(/:\d{2}$/, '')
                                                    : formatDateTime(item.data_hora_prevista)}
                                            </span>
                                        ) : (
                                            <span className={`font-medium text-gray-400 ${isCompactLayout || isPortrait ? 'mr-1' : ''}`}>Não definida</span>
                                        )}</p>
                                    </div>
                                </div>



                                <div className="col-span-2 sm:col-span-3 flex items-center mt-1 sm:mt-0">
                                    {item.obs_criacao && item.obs_criacao.trim() !== "" && (
                                        <div className="flex items-center max-w-full">
                                            <FileText className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                                            <p className="text-xs font-medium text-gray-500 uppercase mr-1.5">Obs:</p>
                                            <p className="text-xs font-semibold text-gray-900 line-clamp-1">
                                                {item.obs_criacao}
                                            </p>
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
        );
    };

    return (
        <div className="space-y-5 p-2 sm:p-4 md:p-6 mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-0 py-0 gap-3">
                <PageHeader
                    title="Listas de Inspeções"
                    subtitle={postosText}
                    showButton={false}
                />
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <span className="mr-1.5">Última atualização:</span>
                        <span className="font-medium text-gray-700">{lastRefresh.toLocaleTimeString('pt-BR')}</span>
                    </div>
                    <button
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        className={`
        hidden sm:flex relative items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm
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
                        <span>
                            {isRefreshing ? "Atualizando..." : "Atualizar"}
                        </span>
                    </button>

                </div>
            </div>

            {selectedInspection && (
                <ColaboradorLoginModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                    inspection={selectedInspection}
                    isNaoConformidadeContext={isNaoConformidadeContext}
                    isQuantidadeContext={isQuantidadeContext}
                    onNaoConformidadeSuccess={handleNaoConformidadeSuccess}
                    onShowAlert={showAlert}
                />
            )}
            {selectedQuantidadeInspection && (
                <QuantidadeInputModal
                    isOpen={isQuantidadeModalOpen}
                    onClose={handleQuantidadeModalClose}
                    onConfirm={handleQuantidadeSuccess}
                    title="Registrar Quantidade"
                    tipoInspecao={9}
                    numeroOrdem={selectedQuantidadeInspection.numero_ordem}
                    referencia={selectedQuantidadeInspection.referencia}
                    roteiro={selectedQuantidadeInspection.roteiro}
                    processo={selectedQuantidadeInspection.processo}
                    codigoPostо={selectedQuantidadeInspection.codigo_posto}
                    operacao={selectedQuantidadeInspection.operacao}
                    id_ficha_inspecao={selectedQuantidadeInspection.id_ficha_inspecao}
                    initialQtdeProduzida={selectedQuantidadeInspection.qtde_produzida || undefined}
                    initialQtdeInspecionada={selectedQuantidadeInspection.qtde_inspecionada || undefined}
                />
            )}

            <AlertMessage
                message={alertMessage}
                type={alertType}
                onDismiss={handleAlertDismiss}
                autoDismiss={true}
                dismissDuration={5000}
            />

            <div className="mt-1 sm:mt-2">
                <div className="border-b border-gray-100">
                    <nav className="-mb-px flex space-x-2 sm:space-x-4 lg:space-x-6 overflow-x-auto scrollbar-hide pb-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    group relative flex items-center gap-2 whitespace-nowrap px-1.5 py-2.5 text-sm font-medium transition-all duration-200
                                    ${activeTab === tab.id
                                        ? "text-[#1ABC9C] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-[#1ABC9C]"
                                        : "text-gray-500 hover:text-gray-800"
                                    }
                                `}
                            >
                                <div className={`
                                    flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200
                                    ${activeTab === tab.id
                                        ? "bg-[#1ABC9C]/10 text-[#1ABC9C]"
                                        : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"
                                    }
                                `}>
                                    {tab.icon}
                                </div>
                                <span className="hidden sm:inline">{isCompactLayout ? tab.tabletLabel || tab.label : tab.label}</span>
                                <span className="sm:hidden">{tab.mobileLabel || tab.label}</span>
                                {tab.count > 0 && (
                                    <span className={`
                                        inline-flex h-5 min-w-[1.25rem] items-end justify-center rounded-full px-1 text-xs font-semibold leading-none pb-0.5
                                        ${activeTab === tab.id
                                            ? "bg-[#1ABC9C] text-white"
                                            : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                                        }
                                    `}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="rounded-lg bg-gradient-to-br from-gray-50/80 to-white/80 backdrop-blur-sm border border-gray-100/50 p-2 sm:p-3 shadow-sm">
                <div className="w-full">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
}
