'use client';

import { AlertMessage } from '@/components/ui/AlertMessage';
import { OperacoesModal } from '@/components/ui/cadastros/modais_cadastros/OperacoesModal';
import { PageHeader } from '@/components/ui/cadastros/PageHeader';
import { RestrictedAccess } from "@/components/ui/RestrictedAccess";
import { getProcessosFT } from '@/services/api/processosFTService';
import {
    AlertState,
    DadosReferencia,
    Especificacao,
    ModalOperacoesState,
    Operacao,
    Roteiro
} from '@/types/cadastros/especificacao';
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronDown, ChevronRight, Clock, FileText, Logs, PlusCircle, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from 'react';

// Constante de animação
const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const OperacaoItem = ({ operacao }: { operacao: Operacao }) => {
    return (
        <div className="px-3 py-2 border-b border-gray-100 last:border-b-0">
            <div className="flex justify-between items-center">
                <div className="flex items-center">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-medium mr-2">
                        {operacao.operacao}
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-700">{operacao.descricao}</p>
                    </div>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Frequência: {operacao.frequencia} min</span>
                </div>
            </div>
        </div>
    );
};

const ProcessoRow = ({
    processo,
    referencia,
    roteiro,
    onClickVerProcessos,
    onCadastrarOperacoes
}: {
    processo: Especificacao;
    referencia: string;
    roteiro: string;
    onClickVerProcessos: (referencia: string, roteiro: string, processo: number) => void;
    onCadastrarOperacoes: (referencia: string, roteiro: string, processo: number, tipo_acao?: string) => void;
}) => {
    const [showOperacoes, setShowOperacoes] = useState(false);

    const hasOperacoes = processo.operacoes && processo.operacoes.length > 0;
    const operacoesCount = processo.operacoes?.length || 0;

    // Return an array of <tr> elements to avoid whitespace text nodes between <tr>
    if (showOperacoes && hasOperacoes) {
        return [
            <motion.tr
                key="main"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="hover:bg-gray-50 transition-colors"            >
                <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                    {processo.processo}
                </td>
                <td className="px-3 sm:px-4 lg:px-6 py-3 text-xs sm:text-sm text-gray-700">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
                        {processo.tipo_acao}
                    </span>
                </td>
                <td className="px-3 sm:px-4 lg:px-6 py-3 text-xs sm:text-sm text-gray-700 max-w-xs truncate" title={processo.recurso}>
                    {processo.recurso}
                </td>
                <td className="px-3 sm:px-4 lg:px-6 py-3 text-xs sm:text-sm text-gray-700">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-50 text-gray-700 font-medium">
                        {processo.setor}
                    </span>
                </td>                <td className="px-3 sm:px-4 lg:px-6 py-3 text-xs sm:text-sm text-gray-700">
                    <div className="flex gap-2">
                        {/* Botão de operações */}
                        <button
                            onClick={() => setShowOperacoes(!showOperacoes)}
                            className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors text-xs font-medium"
                        >
                            <FileText className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Operações</span>
                            <span className="sm:hidden">Op.</span>
                            <span className="ml-1">({operacoesCount})</span>
                            <ChevronDown
                                className={`w-3 h-3 ml-1 transition-transform ${showOperacoes ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {/* Botão de adicionar operações - sempre visível */}
                        <button
                            onClick={() =>
                                processo.processo != null && onCadastrarOperacoes(referencia, roteiro, processo.processo, processo.tipo_acao)
                            }
                            className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors text-xs font-medium"
                        >
                            <PlusCircle className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Adicionar</span>
                            <span className="sm:hidden">Add</span>
                        </button>                    </div>
                </td>
            </motion.tr>, <motion.tr
                key="dropdown"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}            >
                <td colSpan={5} className="bg-gray-50 px-3 sm:px-4 lg:px-6 py-3">
                    <div className="border border-gray-200 rounded-md bg-white overflow-hidden shadow-sm">
                        <div className="py-2 px-3 sm:px-4 bg-indigo-50 border-b border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="text-xs sm:text-sm font-medium text-indigo-700">
                                Operações do processo {processo.processo}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() =>
                                        processo.processo != null && onClickVerProcessos(referencia, roteiro, processo.processo)
                                    }
                                    className="inline-flex items-center px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors text-xs font-medium"
                                >
                                    <Logs className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Ver detalhes dos Processos</span>
                                    <span className="sm:hidden">Detalhes</span>
                                </button>
                            </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {processo.operacoes?.map((op) => (
                                <OperacaoItem key={op.id_operacao} operacao={op} />
                            ))}
                        </div>
                    </div>
                </td>
            </motion.tr>
        ];
    }
    // Only main row
    return [
        <motion.tr
            key="main"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="hover:bg-gray-50 transition-colors"        >
            <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                {processo.processo}
            </td>
            <td className="px-3 sm:px-4 lg:px-6 py-3 text-xs sm:text-sm text-gray-700">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
                    {processo.tipo_acao}
                </span>
            </td>
            <td className="px-3 sm:px-4 lg:px-6 py-3 text-xs sm:text-sm text-gray-700 max-w-xs truncate" title={processo.recurso}>
                {processo.recurso}
            </td>
            <td className="px-3 sm:px-4 lg:px-6 py-3 text-xs sm:text-sm text-gray-700">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-50 text-gray-700 font-medium">
                    {processo.setor}
                </span>
            </td>            <td className="px-3 sm:px-4 lg:px-6 py-3 text-xs sm:text-sm text-gray-700">
                <div className="flex gap-2">
                    {/* Botão de operações */}
                    {hasOperacoes ? (
                        <button
                            onClick={() => setShowOperacoes(!showOperacoes)}
                            className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors text-xs font-medium"
                        >
                            <FileText className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Operações</span>
                            <span className="sm:hidden">Op.</span>
                            <span className="ml-1">({operacoesCount})</span>
                            <ChevronDown
                                className={`w-3 h-3 ml-1 transition-transform ${showOperacoes ? 'rotate-180' : ''}`}
                            />
                        </button>
                    ) : (
                        <button
                            className="inline-flex items-center px-2 py-1 rounded bg-gray-50 text-gray-400 cursor-default text-xs font-medium"
                            disabled
                        >
                            <FileText className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Sem Operações</span>
                            <span className="sm:hidden">Vazio</span>
                        </button>
                    )}
                    {/* Botão de adicionar operações - sempre visível */}
                    <button
                        onClick={() =>
                            processo.processo != null && onCadastrarOperacoes(referencia, roteiro, processo.processo, processo.tipo_acao)
                        }
                        className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors text-xs font-medium"
                    >
                        <PlusCircle className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Adicionar</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
            </td>
        </motion.tr>
    ];
};

// Componente memoizado para o roteiro
const RoteiroAccordion = ({
    roteiro,
    isExpanded,
    onToggle,
    referencia,
    onClickVerProcessos,
    onCadastrarOperacoes
}: {
    roteiro: Roteiro;
    isExpanded: boolean;
    onToggle: (roteiroId: string) => void;
    referencia: string; onClickVerProcessos: (referencia: string, roteiro: string, processo: number) => void;
    onCadastrarOperacoes: (referencia: string, roteiro: string, processo: number, tipo_acao?: string) => void;
}) => {
    return (
        <motion.div
            key={roteiro.roteiro}
            className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow duration-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            layout
        >
            <motion.div
                className="flex justify-between items-center px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onToggle(roteiro.roteiro)}
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                whileTap={{ scale: 0.99 }}
            >
                <div className="font-medium flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md bg-[#1ABC9C]/10 text-[#1ABC9C] mr-3">
                        <span className="font-bold">{roteiro.roteiro}</span>
                    </div>
                    <span className="text-gray-800">{roteiro.nome_roteiro}</span>
                </div>
                <div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2, type: "tween" }}
                    >
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                    </motion.div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className="overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >                        <div className="p-3 sm:p-4 lg:p-5 border-t border-gray-200">
                            <div className="overflow-x-auto rounded-lg border border-gray-100">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Processo
                                            </th>
                                            <th scope="col" className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Tipo Ação
                                            </th>
                                            <th scope="col" className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Recurso
                                            </th>
                                            <th scope="col" className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Setor
                                            </th>
                                            <th scope="col" className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48 lg:w-56 xl:w-64">
                                                Ações
                                            </th>
                                        </tr>
                                    </thead>                                    <tbody className="bg-white divide-y divide-gray-100">
                                        <AnimatePresence>
                                            {roteiro.processos.map((processo) => (<ProcessoRow
                                                key={processo.processo}
                                                processo={processo}
                                                referencia={referencia}
                                                roteiro={roteiro.roteiro}
                                                onClickVerProcessos={onClickVerProcessos}
                                                onCadastrarOperacoes={onCadastrarOperacoes}
                                            />)).flat()}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Modal de operações foi movido para '@/components/ui/cadastros/modais_cadastros/OperacoesModal'

export default function Especificacoes() {
    // Restrição de acesso para Gestor
    const authLoading = false; // Ajuste se necessário para loading real
    const hasPermission = (permission: string) => {
        try {
            const userDataStr = localStorage.getItem("userData") || sessionStorage.getItem("userData");
            if (!userDataStr) return false;
            const userData = JSON.parse(userDataStr);
            if (!userData || !userData.perfil_inspecao) return false;
            return userData.perfil_inspecao.includes(permission);
        } catch {
            return false;
        }
    };

    const router = useRouter();
    const searchParams = useSearchParams(); const urlReferencia = searchParams?.get('referencia') || '';

    const [codigoReferencia, setCodigoReferencia] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState<AlertState>({ message: null, type: "success" });
    const [dadosReferencia, setDadosReferencia] = useState<DadosReferencia | null>(null);
    const [expandedRoteiros, setExpandedRoteiros] = useState<Record<string, boolean>>({});
    const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [modalOperacoes, setModalOperacoes] = useState<ModalOperacoesState>({
        isOpen: false,
        dados: null
    });

    // Função para limpar alertas
    const clearAlert = useCallback(() => {
        setAlert({ message: null, type: "success" });
    }, []);

    // Toggle para expandir/colapsar roteiros
    const toggleRoteiro = useCallback((roteiroId: string) => {
        setExpandedRoteiros(prev => ({
            ...prev,
            [roteiroId]: !prev[roteiroId]
        }));
    }, []);

    // Expandir/colapsar todos os roteiros
    const toggleAllRoteiros = useCallback((expandAll: boolean) => {
        if (!dadosReferencia?.roteiros) return;

        const newState: Record<string, boolean> = {};
        dadosReferencia.roteiros.forEach(roteiro => {
            newState[roteiro.roteiro] = expandAll;
        });

        setExpandedRoteiros(newState);
    }, [dadosReferencia]);    // Função para transformar input em maiúsculas
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setCodigoReferencia(e.target.value.toUpperCase());
    }, []);


    const handleSearch = useCallback(async () => {
        if (!codigoReferencia.trim()) {
            setAlert({
                message: "Por favor, digite uma referência",
                type: "warning"
            });
            return;
        }

        setIsLoading(true);
        setLoadingState('loading');
        setDadosReferencia(null);

        try {
            // Nova chamada centralizada no service
            const data = await getProcessosFT(codigoReferencia);
            setDadosReferencia(data);
            setLoadingState('success');

            // Inicializa o estado expandido para os roteiros
            const inicialExpandidos: Record<string, boolean> = {};
            if (data.roteiros) {
                data.roteiros.forEach((roteiro: Roteiro) => {
                    inicialExpandidos[roteiro.roteiro] = false; // Inicialmente colapsados
                });
            }
            setExpandedRoteiros(inicialExpandidos);

            // Se não houver roteiros, mostra um alerta
            if (!data.roteiros || data.roteiros.length === 0) {
                setAlert({
                    message: `Nenhuma informação encontrada para a referência: ${codigoReferencia}`,
                    type: "info"
                });
            }
        } catch (error) {
            setLoadingState('error');
            setAlert({
                message: error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados',
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    }, [codigoReferencia]);


    // Efeito para inicializar o código de referência da URL e auto-pesquisar se necessário
    useEffect(() => {
        if (urlReferencia) {
            setCodigoReferencia(urlReferencia);

            // Sempre executamos a pesquisa quando existe uma referência na URL
            // Adicionamos um pequeno delay para garantir que o estado foi atualizado
            const timer = setTimeout(async () => {
                await handleSearch();

                // Após a pesquisa concluir, limpa a URL removendo o parâmetro referência
                router.replace('/cadastros/especificacoes', {
                    scroll: false
                });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [urlReferencia, handleSearch, router]);

    // Funções para manipulação do modal de operações
    const handleCloseModalOperacoes = useCallback(() => {
        setModalOperacoes({ isOpen: false, dados: null });
    }, []);
    const handleOpenModalOperacoes = useCallback((referencia: string, roteiro: string, processo: number, tipo_acao?: string) => {
        setModalOperacoes({
            isOpen: true,
            dados: { referencia, roteiro, processo, tipo_acao, operacao: 0 }
        });
    }, []);

    // Função para navegar para a página de especificações de processo
    const handleNavigateToProcesso = useCallback((referencia: string, roteiro: string, processo: number) => {
        // Navega para a página de processos com os parâmetros
        router.push(`/cadastros/especificacoes/processos?referencia=${encodeURIComponent(referencia)}&roteiro=${encodeURIComponent(roteiro)}&processo=${processo}`);
    }, [router]);

    if (!hasPermission('G')) {
        return (
            <RestrictedAccess
                hasPermission={hasPermission('G')}
                isLoading={authLoading}
                customMessage="Esta página está disponível apenas para usuários com permissão de Gestor."
                redirectTo="/dashboard"
                redirectDelay={2000}
            />
        );
    } return (
        <div className="space-y-5 p-2 sm:p-4 md:p-6 mx-auto">
            {/* Alerta para mensagens */}
            <AlertMessage
                message={alert.message}
                type={alert.type}
                onDismiss={clearAlert}
                autoDismiss={true}
                dismissDuration={5000}
            />

            {/* Cabeçalho da página com campo de pesquisa */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div className="flex-shrink-0">
                    <PageHeader
                        title="Especificações"
                        subtitle="Pesquise pelo código da referência"
                        showButton={false}
                    />
                </div>

                {/* Campo de pesquisa */}
                <motion.div
                    className="flex flex-col sm:flex-row items-center gap-2 lg:w-1/2 xl:w-2/5 2xl:w-1/3"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                ><div className="relative flex-grow w-full">
                        <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-100 flex items-center focus-within:border-[#1ABC9C] transition-colors duration-300">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>                            <input
                                type="text"
                                placeholder="DIGITE A REFERÊNCIA DESEJADA"
                                value={codigoReferencia}
                                onChange={handleInputChange}
                                className="block w-full rounded-md bg-gray-50 pl-8 py-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-300 border-0"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                                disabled={isLoading}
                                aria-label="Referência"
                                autoFocus
                            />
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                disabled={isLoading}
                                onClick={handleSearch}
                                className="ml-1 hidden sm:inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md text-white bg-[#1ABC9C] hover:bg-[#16A085] shadow-md shadow-[#1ABC9C]/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1ABC9C] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                aria-label="Pesquisar referência"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin mr-1"></div>
                                        <span>Buscando...</span>
                                    </>
                                ) : (
                                    <span>Pesquisar</span>
                                )}
                            </motion.button>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={isLoading}
                        onClick={handleSearch}
                        className="w-full sm:hidden inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-md text-white bg-[#1ABC9C] hover:bg-[#16A085] shadow-md shadow-[#1ABC9C]/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1ABC9C] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        aria-label="Pesquisar referência"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin mr-1"></div>
                                <span>Buscando...</span>
                            </>
                        ) : (
                            <span>Pesquisar</span>
                        )}
                    </motion.button>
                </motion.div>
            </div>

            {/* Exibição dos dados */}
            <AnimatePresence mode="wait">
                {dadosReferencia && (
                    <motion.div
                        key="dados-referencia"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white rounded-xl shadow-lg p-4 sm:p-5 lg:p-6 xl:p-8 border border-gray-100"
                    >
                        <div className="mb-4 sm:mb-5 lg:mb-6">
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-3 flex items-center">
                                <span className="h-5 w-1.5 bg-[#1ABC9C] rounded-full mr-2 inline-block"></span>
                                Informações da Referência
                            </h2>
                            <div className="bg-gray-50 p-3 sm:p-4 lg:p-5 rounded-lg">
                                <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    <div className="lg:col-span-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Referência</p>
                                        <p className="font-medium text-sm lg:text-base">{dadosReferencia.referencia}</p>
                                    </div>
                                    <div className="lg:col-span-3 xl:col-span-4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Descrição</p>
                                        <p className="font-medium text-sm lg:text-base" title={dadosReferencia.descricao}>{dadosReferencia.descricao}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Roteiros */}
                        {dadosReferencia.roteiros?.length > 0 && (
                            <motion.div
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 flex items-center">
                                        <span className="h-5 w-1.5 bg-[#1ABC9C] rounded-full mr-2 inline-block"></span>
                                        Roteiros
                                    </h3>

                                    <div className="flex flex-wrap space-x-2">
                                        <button
                                            onClick={() => toggleAllRoteiros(true)}
                                            className="text-xs px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors whitespace-nowrap"
                                        >
                                            Expandir todos
                                        </button>
                                        <button
                                            onClick={() => toggleAllRoteiros(false)}
                                            className="text-xs px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors whitespace-nowrap"
                                        >
                                            Recolher todos
                                        </button>
                                    </div>
                                </div>

                                {/* {totalEspecificacoes > 0 && (
                                    <div className="mb-3 flex items-center justify-end">
                                        <div className="bg-green-50 border border-green-100 rounded-lg px-2.5 py-1 flex items-center text-xs text-green-800">
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                            <span>Total de especificações: <b>{totalEspecificacoes}</b></span>
                                        </div>
                                    </div>
                                )} */}

                                <div className="space-y-3">
                                    {dadosReferencia.roteiros.map((roteiro) => (<RoteiroAccordion
                                        key={roteiro.roteiro}
                                        roteiro={roteiro}
                                        isExpanded={expandedRoteiros[roteiro.roteiro]}
                                        onToggle={toggleRoteiro}
                                        referencia={dadosReferencia.referencia}
                                        onClickVerProcessos={handleNavigateToProcesso}
                                        onCadastrarOperacoes={handleOpenModalOperacoes}
                                    />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Estado vazio caso não tenha roteiros */}
                        {(!dadosReferencia.roteiros || dadosReferencia.roteiros.length === 0) && (
                            <div className="py-6 flex flex-col items-center justify-center text-center">
                                <div className="rounded-full bg-gray-100 p-2.5 mb-3">
                                    <AlertCircle className="h-6 w-6 text-gray-400" />
                                </div>
                                <h3 className="text-base font-medium text-gray-900 mb-1">Nenhum roteiro encontrado</h3>
                                <p className="text-gray-500 text-sm">Não existem roteiros disponíveis para esta referência.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Estado vazio inicial */}
                {!isLoading && !dadosReferencia && loadingState === 'idle' && (
                    <motion.div
                        key="estado-inicial"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8 mt-4 flex flex-col items-center justify-center text-center"
                    >
                        <div className="rounded-full bg-[#1ABC9C]/10 p-3 mb-3">
                            <Search className="h-6 w-6 text-[#1ABC9C]" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Pesquise por uma referência</h3>
                        <p className="text-gray-500 text-xs sm:text-sm max-w-md">Digite a referência no campo acima para visualizar seus roteiros e processos.</p>
                    </motion.div>
                )}

                {/* Loading state */}
                {isLoading && !dadosReferencia && (
                    <motion.div
                        key="estado-carregando"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8 mt-4 flex flex-col items-center justify-center text-center"
                    >
                        <motion.div
                            className="rounded-full bg-[#1ABC9C]/10 p-3 mb-3"
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: [1, 0.8, 1]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <div className="w-6 h-6 rounded-full border-2 border-[#1ABC9C]/80 border-t-transparent animate-spin"></div>
                        </motion.div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Buscando dados...</h3>
                        <p className="text-gray-500 text-xs sm:text-sm">Aguarde enquanto buscamos as informações da referência.</p>
                    </motion.div>
                )}

                {/* Error state quando não está carregando mas teve erro */}
                {!isLoading && !dadosReferencia && loadingState === 'error' && (
                    <motion.div
                        key="estado-erro"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white rounded-xl shadow-lg border border-red-100 p-6 sm:p-8 mt-4 flex flex-col items-center justify-center text-center"
                    >
                        <div className="rounded-full bg-red-100 p-3 mb-3">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Erro ao buscar dados</h3>
                        <p className="text-gray-500 text-xs sm:text-sm max-w-md">Tente novamente ou contate o administrador se o problema persistir.</p>
                        <button
                            onClick={handleSearch}
                            className="mt-3 px-3 py-1.5 bg-[#1ABC9C] text-white rounded-md hover:bg-[#16A085] transition-colors text-xs"
                        >
                            Tentar novamente
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>            {/* Modal de operações */}
            <OperacoesModal
                isOpen={modalOperacoes.isOpen}
                onClose={handleCloseModalOperacoes}
                dados={modalOperacoes.dados}
                onSuccess={(message) => {
                    setAlert({
                        message,
                        type: "success"
                    });
                    handleSearch();
                }}
            />
        </div>
    );
}