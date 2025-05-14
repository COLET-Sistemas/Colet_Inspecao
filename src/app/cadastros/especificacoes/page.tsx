'use client';

import { AlertMessage } from '@/components/ui/AlertMessage';
import { PageHeader } from '@/components/ui/cadastros/PageHeader';
import { useApiConfig } from '@/hooks/useApiConfig';
import {
    AlertState,
    DadosReferencia,
    Especificacao,
    ModalOperacoesState,
    Operacao,
    Roteiro
} from '@/types/cadastros/especificacao';
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Clock, FileText, Pencil, PlusCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from 'react';

// Constantes de animação
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

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
                        <p className="text-xs font-medium text-gray-700">{operacao.descricao} - ({operacao.id_operacao})</p>
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
    onCadastrarOperacoes: (referencia: string, roteiro: string, processo: number) => void;
}) => {
    const [showOperacoes, setShowOperacoes] = useState(false);

    const hasOperacoes = processo.operacoes && processo.operacoes.length > 0;
    const operacoesCount = processo.operacoes?.length || 0;

    return (
        <>
            <motion.tr
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="hover:bg-gray-50 transition-colors"
            >
                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">{processo.processo}</td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">{processo.tipo_acao}</td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">{processo.recurso}</td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">{processo.setor}</td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                    {processo.especificacoes_inspecao > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {processo.especificacoes_inspecao}
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            0
                        </span>
                    )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 flex gap-2">                    {/* Botão de operações - desabilitado quando não tem operações */}
                    {hasOperacoes ? (
                        <button
                            onClick={() => setShowOperacoes(!showOperacoes)}
                            className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors text-xs"
                        >
                            <FileText className="w-3 h-3 mr-1" />
                            <span>Operações ({operacoesCount})</span>
                            <ChevronDown
                                className={`w-3 h-3 ml-1 transition-transform ${showOperacoes ? 'rotate-180' : ''}`}
                            />
                        </button>
                    ) : (
                        <button
                            className="inline-flex items-center px-2 py-1 rounded bg-gray-50 text-gray-400 cursor-default text-xs"
                            disabled
                        >
                            <FileText className="w-3 h-3 mr-1" />
                            <span>Sem Operações</span>
                        </button>
                    )}                    {/* Botão de editar ou cadastrar operações */}
                    {hasOperacoes ? (
                        <button
                            onClick={() => onClickVerProcessos(referencia, roteiro, processo.processo)}
                            className="inline-flex items-center px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors text-xs"
                        >
                            <Pencil className="w-3 h-3 mr-1" />
                            <span>Editar</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => onClickVerProcessos(referencia, roteiro, processo.processo)}
                            className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors text-xs"
                        >
                            <PlusCircle className="w-3 h-3 mr-1" />
                            <span>Adicionar</span>
                        </button>
                    )}
                </td>
            </motion.tr>

            {/* Operações dropdown */}
            {showOperacoes && hasOperacoes && (
                <motion.tr
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <td colSpan={6} className="bg-gray-50 px-4 py-2">
                        <div className="border border-gray-200 rounded-md bg-white overflow-hidden shadow-sm">                            <div className="py-1.5 px-3 bg-indigo-50 border-b border-indigo-100">
                            <div className="text-xs font-medium text-indigo-700">Operações do processo {processo.processo}</div>
                        </div>
                            {processo.operacoes?.map((op) => (
                                <OperacaoItem key={op.id_operacao} operacao={op} />
                            ))}
                        </div>
                    </td>
                </motion.tr>
            )}
        </>
    );
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
    referencia: string;
    onClickVerProcessos: (referencia: string, roteiro: string, processo: number) => void;
    onCadastrarOperacoes: (referencia: string, roteiro: string, processo: number) => void;
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
                    >
                        <div className="p-3 border-t border-gray-200">
                            <div className="overflow-x-auto rounded-lg border border-gray-100">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Processo</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo Ação</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recurso</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Setor</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Especif.</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        <AnimatePresence>
                                            {roteiro.processos.map((processo) => (
                                                <ProcessoRow
                                                    key={processo.processo}
                                                    processo={processo}
                                                    referencia={referencia}
                                                    roteiro={roteiro.roteiro}
                                                    onClickVerProcessos={onClickVerProcessos}
                                                    onCadastrarOperacoes={onCadastrarOperacoes}
                                                />
                                            ))}
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

// Modal para cadastro de operações
const OperacoesModal = ({
    isOpen,
    onClose,
    dados
}: {
    isOpen: boolean;
    onClose: () => void;
    dados: {
        referencia: string;
        roteiro: string;
        processo: number;
    } | null;
}) => {
    const [formData, setFormData] = useState({
        descricao: '',
        frequencia: 100
    });
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const { apiUrl, getAuthHeaders } = useApiConfig();    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                descricao: '',
                frequencia: 100
            });
            setFormError(null);
        }
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'frequencia') {
            const numValue = parseInt(value) || 0;
            setFormData(prev => ({
                ...prev,
                [name]: numValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validação
        if (!formData.descricao.trim()) {
            setFormError("A descrição da operação é obrigatória");
            return;
        }

        if (formData.frequencia <= 0) {
            setFormError("A frequência deve ser maior que zero");
            return;
        }

        if (!dados) return;

        setIsSaving(true);
        setFormError(null);

        try {            // TODO: Implementar chamada à API para salvar a operação
            // Aqui seria feita uma chamada POST para a API salvando a nova operação

            try {
                console.log("Simulando cadastro de operação:", {
                    referencia: dados.referencia,
                    roteiro: dados.roteiro,
                    processo: dados.processo,
                    descricao: formData.descricao,
                    frequencia: formData.frequencia
                });

                // Exemplo (quando a API estiver implementada):
                /*
                const response = await fetch(`${apiUrl}/inspecao/operacoes`, {
                    method: 'POST',
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        referencia: dados.referencia,
                        roteiro: dados.roteiro,
                        processo: dados.processo,
                        descricao: formData.descricao,
                        frequencia: formData.frequencia
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.message || `Erro ao cadastrar: ${response.status}`);
                }
                
                // A resposta da API seria algo como:
                // const data = await response.json();
                */

                // Simulação de tempo de processamento
                await new Promise(resolve => setTimeout(resolve, 600));

                // Mostrar alerta de sucesso e fechar o modal
                //setAlert({
                //    message: "Operação cadastrada com sucesso!",
                //    type: "success"
                //});

                // Fechamento do modal após salvamento
                onClose();

                // Aqui seria feita uma chamada para atualizar os dados
                // window.location.reload(); // Recarregar a página como solução temporária
                // Ou idealmente
                // await handleSearch();
            } catch (apiError) {
                console.error("Erro na API:", apiError);
                throw new Error("Erro ao processar a requisição na API");
            }
        } catch (error) {
            console.error('Erro ao salvar operação:', error);
            setFormError('Ocorreu um erro ao salvar a operação. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !dados) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 bg-[#1ABC9C]/10 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-800">
                        Operações do Processo {dados.processo}
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div className="p-4">
                    <div className="mb-4 bg-blue-50 p-3 rounded-md">
                        <div className="text-xs font-medium">
                            <span className="text-blue-800">Referência:</span> {dados.referencia}
                        </div>
                        <div className="text-xs font-medium">
                            <span className="text-blue-800">Roteiro:</span> {dados.roteiro}
                        </div>
                        <div className="text-xs font-medium">
                            <span className="text-blue-800">Processo:</span> {dados.processo}
                        </div>
                    </div>

                    {formError && (
                        <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded-md text-xs text-red-600">
                            <div className="flex items-center">
                                <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                                {formError}
                            </div>
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="border rounded-md p-3 space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs font-semibold text-gray-700">Nova Operação</h4>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Sequência: 1</span>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    name="descricao"
                                    value={formData.descricao}
                                    onChange={handleInputChange}
                                    className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1ABC9C]"
                                    placeholder="Descreva a operação"
                                    disabled={isSaving}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Frequência</label>
                                <input
                                    type="number"
                                    name="frequencia"
                                    value={formData.frequencia}
                                    onChange={handleInputChange}
                                    min="1"
                                    className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1ABC9C]"
                                    placeholder="Ex: 100"
                                    disabled={isSaving}
                                />
                            </div>
                        </div>

                        <div className="px-0 py-3 flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 disabled:opacity-70"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-[#1ABC9C] hover:bg-[#16A085] rounded-md disabled:opacity-70 flex items-center"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin mr-1.5"></div>
                                        <span>Salvando...</span>
                                    </>
                                ) : (
                                    <span>Salvar</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default function Especificacoes() {
    const router = useRouter();
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

    // Obter headers de autenticação para chamadas à API
    const { apiUrl, getAuthHeaders } = useApiConfig();

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
    }, [dadosReferencia]);

    // Função para transformar input em maiúsculas
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
            if (!apiUrl) {
                throw new Error("URL da API não configurada");
            }

            const response = await fetch(
                `${apiUrl}/inspecao/processos_ft?referencia=${encodeURIComponent(codigoReferencia.trim())}`,
                {
                    method: 'GET',
                    headers: getAuthHeaders()
                }
            );

            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
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
            console.error('Erro ao buscar dados:', error);
            setLoadingState('error');
            setAlert({
                message: error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados',
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    }, [codigoReferencia, apiUrl, getAuthHeaders]);

    // Memoização para evitar re-renderizações desnecessárias
    const totalEspecificacoes = useMemo(() => {
        if (!dadosReferencia?.roteiros) return 0;

        return dadosReferencia.roteiros.reduce((total, roteiro) => {
            return total + roteiro.processos.reduce((processoTotal, processo) => {
                return processoTotal + processo.especificacoes_inspecao;
            }, 0);
        }, 0);
    }, [dadosReferencia]);

    // Funções para manipulação do modal de operações
    const handleCloseModalOperacoes = useCallback(() => {
        setModalOperacoes({ isOpen: false, dados: null });
    }, []);    // Função para navegar para a página de especificações de processo
    const handleNavigateToProcesso = useCallback((referencia: string, roteiro: string, processo: number) => {
        // Navega para a página de processos com os parâmetros
        router.push(`/cadastros/especificacoes/processos?referencia=${encodeURIComponent(referencia)}&roteiro=${encodeURIComponent(roteiro)}&processo=${processo}`);
    }, [router]);

    return (
        <div className="space-y-5 p-2 sm:p-4 md:p-5 mx-auto max-w-7xl text-sm">
            {/* Alerta para mensagens */}
            <AlertMessage
                message={alert.message}
                type={alert.type}
                onDismiss={clearAlert}
                autoDismiss={true}
                dismissDuration={5000}
            />

            {/* Cabeçalho da página com campo de pesquisa */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <PageHeader
                    title="Especificações"
                    subtitle="Pesquise pela referência"
                    showButton={false}
                />

                {/* Campo de pesquisa */}
                <motion.div
                    className="flex flex-col sm:flex-row items-center gap-2 md:w-1/2 lg:w-2/5"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="relative flex-grow w-full">
                        <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-100 flex items-center">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="DIGITE A REFERÊNCIA DESEJADA"
                                value={codigoReferencia}
                                onChange={handleInputChange}
                                className="block w-full rounded-md bg-gray-50 border-0 pl-8 py-3 text-xs text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#1ABC9C]/50 transition-all duration-300"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                                disabled={isLoading}
                                aria-label="Referência"
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
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white rounded-xl shadow-lg p-3 sm:p-5 border border-gray-100"
                    >
                        <div className="mb-3 sm:mb-3">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 flex items-center">
                                <span className="h-5 w-1.5 bg-[#1ABC9C] rounded-full mr-2 inline-block"></span>
                                Informações da Referência
                            </h2>
                            <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                                <div className="flex flex-col md:flex-row">
                                    <div className="md:w-1/4 mb-3 md:mb-0">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Referência</p>
                                        <p className="font-medium text-xs sm:text-sm">{dadosReferencia.referencia}</p>
                                    </div>
                                    <div className="md:w-3/4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Descrição</p>
                                        <p className="font-medium text-xs sm:text-sm" title={dadosReferencia.descricao}>{dadosReferencia.descricao}</p>
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
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                                        <span className="h-5 w-1.5 bg-[#1ABC9C] rounded-full mr-2 inline-block"></span>
                                        Roteiros
                                    </h3>

                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => toggleAllRoteiros(true)}
                                            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                                        >
                                            Expandir todos
                                        </button>
                                        <button
                                            onClick={() => toggleAllRoteiros(false)}
                                            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
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
                                        onCadastrarOperacoes={handleNavigateToProcesso}
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
            </AnimatePresence>

            {/* Modal de operações */}
            <OperacoesModal
                isOpen={modalOperacoes.isOpen}
                onClose={handleCloseModalOperacoes}
                dados={modalOperacoes.dados}
            />
        </div>
    );
}