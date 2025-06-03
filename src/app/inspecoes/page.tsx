"use client";

import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    CheckCircle,
    Cog,
    FileText,
    RefreshCw,
    Users
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";


// Tipos para as abas
interface TabData {
    id: string;
    label: string;
    icon: React.ReactNode;
    count: number;
    description: string;
}

// Tipos para os dados das inspeções
interface InspectionItem {
    id: string;
    codigo: string;
    tipo: string;
    posto: string;
    responsavel: string;
    dataVencimento?: string;
    dataInicio?: string;
    dataConclusao?: string;
    dataAgendamento?: string;
    progresso?: number;
    status?: string;
}

// Dados mockados para exemplo
const mockInspections = {
    processo: [
        { id: "1", codigo: "PROC-001", tipo: "Processo Produtivo", posto: "Linha de Produção A", dataVencimento: "2025-05-30", responsavel: "João Silva" },
        { id: "2", codigo: "PROC-002", tipo: "Processo Logístico", posto: "Linha de Produção B", dataVencimento: "2025-06-01", responsavel: "Maria Santos" },
        { id: "3", codigo: "PROC-003", tipo: "Processo de Montagem", posto: "Linha de Montagem", dataVencimento: "2025-06-05", responsavel: "Carlos Lima" },
        { id: "11", codigo: "PROC-004", tipo: "Processo de Embalagem", posto: "Setor de Embalagem", dataVencimento: "2025-05-28", responsavel: "Ana Rodrigues" },
        { id: "12", codigo: "PROC-005", tipo: "Processo de Expedição", posto: "Doca de Carregamento", dataVencimento: "2025-06-03", responsavel: "Roberto Mendes" },
    ],
    qualidade: [
        { id: "4", codigo: "QUAL-001", tipo: "Controle de Qualidade", posto: "Laboratório A", dataInicio: "2025-05-25", responsavel: "Ana Costa", progresso: 65 },
        { id: "5", codigo: "QUAL-002", tipo: "Teste de Materiais", posto: "Laboratório B", dataInicio: "2025-05-26", responsavel: "Pedro Oliveira", progresso: 80 },
        { id: "13", codigo: "QUAL-003", tipo: "Análise Química", posto: "Laboratório C", dataInicio: "2025-05-24", responsavel: "Fernanda Silva", progresso: 95 },
        { id: "14", codigo: "QUAL-004", tipo: "Teste de Resistência", posto: "Laboratório de Testes", dataInicio: "2025-05-27", responsavel: "Lucas Ferreira", progresso: 30 },
    ],
    outras: [
        { id: "6", codigo: "OUT-001", tipo: "Calibração", posto: "Sala de Instrumentos", dataConclusao: "2025-05-20", responsavel: "Lucas Santos", status: "Aprovada" },
        { id: "7", codigo: "OUT-002", tipo: "Manutenção", posto: "Oficina Central", dataConclusao: "2025-05-18", responsavel: "Fernanda Lima", status: "Aprovada" },
        { id: "8", codigo: "OUT-003", tipo: "Preventiva", posto: "Estação de Trabalho", dataConclusao: "2025-05-15", responsavel: "Roberto Silva", status: "Pendente" },
        { id: "15", codigo: "OUT-004", tipo: "Limpeza", posto: "Área de Produção", dataConclusao: "2025-05-22", responsavel: "Mariana Costa", status: "Aprovada" },
        { id: "16", codigo: "OUT-005", tipo: "Verificação", posto: "Sala de Controle", dataConclusao: "2025-05-19", responsavel: "Paulo Henrique", status: "Pendente" },
    ],
    naoConformidade: [
        { id: "9", codigo: "NC-001", tipo: "Não Conformidade de Produto", posto: "Setor A", dataAgendamento: "2025-06-10", responsavel: "Juliana Costa", status: "Crítica" },
        { id: "10", codigo: "NC-002", tipo: "Não Conformidade de Processo", posto: "Setor B", dataAgendamento: "2025-06-15", responsavel: "Ricardo Oliveira", status: "Menor" },
        { id: "17", codigo: "NC-003", tipo: "Não Conformidade de Sistema", posto: "Setor C", dataAgendamento: "2025-06-08", responsavel: "Carla Pereira", status: "Crítica" },
        { id: "18", codigo: "NC-004", tipo: "Não Conformidade Ambiental", posto: "Área Externa", dataAgendamento: "2025-06-12", responsavel: "Eduardo Santos", status: "Menor" },
    ],
};

export default function InspecoesPage() {
    const [activeTab, setActiveTab] = useState("processo");
    const [inspectionData, setInspectionData] = useState(mockInspections);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    // Configurações do refresh automático
    const IDLE_TIME = 30000; // 30 segundos de inatividade
    const AUTO_REFRESH_INTERVAL = 60000; // 60 segundos entre atualizações automáticas

    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef(Date.now());

    // Função para simular carregamento de dados (substitua pela sua API)
    const fetchInspectionData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            // Simula delay da API
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Aqui você faria a chamada real para sua API
            // const response = await api.getInspections();
            // setInspectionData(response.data);

            // Por enquanto, mantemos os dados mockados
            setInspectionData(mockInspections);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Reset do timer de inatividade
    const resetIdleTimer = useCallback(() => {
        lastActivityRef.current = Date.now();

        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }

        if (autoRefreshTimerRef.current) {
            clearTimeout(autoRefreshTimerRef.current);
        }

        // Define timer para detectar inatividade
        idleTimerRef.current = setTimeout(() => {
            // Usuário ficou inativo, inicia refresh automático
            const startAutoRefresh = () => {
                fetchInspectionData();
                autoRefreshTimerRef.current = setTimeout(startAutoRefresh, AUTO_REFRESH_INTERVAL);
            };
            startAutoRefresh();
        }, IDLE_TIME);
    }, [fetchInspectionData]);

    // Função para refresh manual
    const handleManualRefresh = useCallback(() => {
        fetchInspectionData();
        resetIdleTimer();
    }, [fetchInspectionData, resetIdleTimer]);

    // Detecta atividade do usuário
    useEffect(() => {
        const handleActivity = () => {
            resetIdleTimer();
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });

        // Inicia o timer de inatividade
        resetIdleTimer();

        return () => {
            events.forEach(event => {
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

    // Configuração das abas (atualizada para usar dados dinâmicos)
    const tabs: TabData[] = [
        {
            id: "processo",
            label: "Inspeções de Processo",
            icon: <Cog className="w-4 h-4" />,
            count: inspectionData.processo.length,
            description: "Inspeções relacionadas aos processos produtivos"
        },
        {
            id: "qualidade",
            label: "Inspeções de Qualidade",
            icon: <CheckCircle className="w-4 h-4" />,
            count: inspectionData.qualidade.length,
            description: "Inspeções de controle de qualidade"
        },
        {
            id: "outras",
            label: "Outras Inspeções",
            icon: <Users className="w-4 h-4" />,
            count: inspectionData.outras.length,
            description: "Outras inspeções diversas"
        },
        {
            id: "naoConformidade",
            label: "Não Conformidade",
            icon: <AlertTriangle className="w-4 h-4" />,
            count: inspectionData.naoConformidade.length,
            description: "Registros de não conformidades identificadas"
        },
    ];    // Função para renderizar o conteúdo de cada aba
    const renderTabContent = () => {
        const currentData = inspectionData[activeTab as keyof typeof inspectionData];

        if (!currentData || currentData.length === 0) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8 sm:py-12"
                >
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                        Nenhuma inspeção encontrada
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500 px-4">
                        Não há inspeções {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} no momento.
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
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow duration-200"
                    >
                        <div className="flex items-center justify-between">
                            {/* Informações principais */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <span className="font-medium text-gray-900 text-sm">
                                    {item.codigo}
                                </span>
                                <span className="text-gray-600 text-sm truncate">
                                    {item.posto}
                                </span>
                                <span className="text-gray-500 text-sm truncate">
                                    {item.responsavel}
                                </span>
                            </div>

                            {/* Informação específica por aba (minimalista) */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {activeTab === "processo" && (
                                    <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs">
                                        {item.dataVencimento}
                                    </span>
                                )}
                                {activeTab === "qualidade" && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full ${item.progresso! >= 80 ? 'bg-green-500' :
                                                    item.progresso! >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${item.progresso}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-gray-600 min-w-fit">{item.progresso}%</span>
                                    </div>
                                )}
                                {activeTab === "outras" && (
                                    <span className={`text-xs px-2 py-1 rounded-full ${item.status === "Aprovada"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-yellow-100 text-yellow-700"
                                        }`}>
                                        {item.status}
                                    </span>
                                )}
                                {activeTab === "naoConformidade" && (
                                    <span className={`text-xs px-2 py-1 rounded-full ${item.status === "Crítica"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-yellow-100 text-yellow-700"
                                        }`}>
                                        {item.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        );
    }; return (
        <div className="w-full space-y-5 p-2 sm:p-4 md:p-6">            <div className="flex items-center justify-between">            <PageHeader
            title="Inspeções"
            subtitle="Gerencie todas as inspeções do sistema"
            showButton={false}
        />

            {/* Área de refresh e status */}
            <div className="flex items-center gap-3">
                {/* Indicador de última atualização */}
                <div className="text-xs text-gray-500 hidden sm:block">
                    Última atualização: {lastRefresh.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>

                {/* Botão de refresh manual */}
                <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className={`
                            flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                            ${isRefreshing
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }
                        `}
                    title="Atualizar dados"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">
                        {isRefreshing ? 'Atualizando...' : 'Atualizar'}
                    </span>
                </button>
            </div>
        </div>

            {/* Abas de Navegação */}
            <div className="mt-6 sm:mt-8 mb-4 sm:mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 sm:space-x-6 lg:space-x-8 overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    whitespace-nowrap py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 transition-colors duration-200 min-w-0 flex-shrink-0
                                    ${activeTab === tab.id
                                        ? "border-[#1ABC9C] text-[#1ABC9C]"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }
                                `}
                            >
                                <span className="flex-shrink-0">{tab.icon}</span>
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden text-xs font-normal">{tab.label.split(' ')[0]}</span>
                                <span className={`
                                    ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs font-medium flex-shrink-0
                                    ${activeTab === tab.id
                                        ? "bg-[#1ABC9C] text-white"
                                        : "bg-gray-100 text-gray-900"
                                    }
                                `}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Descrição da aba ativa */}
                <motion.p
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 px-1"
                >
                    {tabs.find(tab => tab.id === activeTab)?.description}
                </motion.p>
            </div>

            {/* Conteúdo da Aba */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 md:p-6">
                {renderTabContent()}
            </div>
        </div>
    );
}