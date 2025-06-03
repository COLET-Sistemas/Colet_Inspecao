import { useCallback, useEffect, useRef, useState } from 'react';

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

interface InspectionData {
    processo: InspectionItem[];
    qualidade: InspectionItem[];
    outras: InspectionItem[];
    naoConformidade: InspectionItem[];
}

interface UseInspectionsReturn {
    inspectionData: InspectionData;
    isRefreshing: boolean;
    lastRefresh: Date;
    refreshData: () => void;
    error: string | null;
}

interface UseInspectionsOptions {
    autoRefreshInterval?: number; // em milissegundos
    idleTime?: number; // em milissegundos
    enableAutoRefresh?: boolean;
}

// Dados mockados para fallback
const mockInspections: InspectionData = {
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

export function useInspections(options: UseInspectionsOptions = {}): UseInspectionsReturn {
    const {
        autoRefreshInterval = 120000, // 2 minuto
        idleTime = 60000, // 60 segundos
        enableAutoRefresh = true
    } = options;

    const [inspectionData, setInspectionData] = useState<InspectionData>(mockInspections);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [error, setError] = useState<string | null>(null);

    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef(Date.now());

    // Função para buscar dados da API
    const fetchInspectionData = useCallback(async () => {
        setIsRefreshing(true);
        setError(null);

        try {
            // Simula delay da API
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Aqui você substituirá pela chamada real da API
            // Exemplo:
            // const response = await fetch('/api/inspections');
            // if (!response.ok) throw new Error('Erro ao buscar dados');
            // const data = await response.json();
            // setInspectionData(data);

            // Por enquanto, usamos dados mockados com pequenas variações para simular mudanças
            const variationFactor = Math.random() * 0.1 + 0.95; // 95% a 105% dos valores originais
            const updatedData = {
                ...mockInspections,
                qualidade: mockInspections.qualidade.map(item => ({
                    ...item,
                    progresso: Math.min(100, Math.round((item.progresso || 0) * variationFactor))
                }))
            };

            setInspectionData(updatedData);
            setLastRefresh(new Date());

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(errorMessage);
            console.error('Erro ao atualizar dados das inspeções:', err);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Reset do timer de inatividade
    const resetIdleTimer = useCallback(() => {
        if (!enableAutoRefresh) return;

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
                autoRefreshTimerRef.current = setTimeout(startAutoRefresh, autoRefreshInterval);
            };
            startAutoRefresh();
        }, idleTime);
    }, [fetchInspectionData, autoRefreshInterval, idleTime, enableAutoRefresh]);

    // Função para refresh manual
    const refreshData = useCallback(() => {
        fetchInspectionData();
        resetIdleTimer();
    }, [fetchInspectionData, resetIdleTimer]);

    // Detecta atividade do usuário para auto-refresh
    useEffect(() => {
        if (!enableAutoRefresh) return;

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
    }, [resetIdleTimer, enableAutoRefresh]);

    return {
        inspectionData,
        isRefreshing,
        lastRefresh,
        refreshData,
        error
    };
}
