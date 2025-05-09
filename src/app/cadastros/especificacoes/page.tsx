'use client';

import { AlertMessage } from '@/components/ui/AlertMessage';
import { PageHeader } from '@/components/ui/cadastros/PageHeader';
import { useApiConfig } from '@/hooks/useApiConfig';
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronRight, Edit, Save, Search, Trash, Workflow, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from 'react';

// Define tipos para os dados que virão da API
interface Especificacao {
    processo: number;
    tipo_acao: string;
    recurso: string;
    setor: string;
    especificacoes_inspecao: number;
}

interface Roteiro {
    roteiro: string;
    nome_roteiro: string;
    processos: Especificacao[];
}

interface DadosReferencia {
    referencia: string;
    descricao: string;
    unidade_estoque: string;
    roteiros: Roteiro[];
}

// Interface para operação de processo
interface OperacaoProcesso {
    id: number;
    operacao: string;
    descricao: string;
    imagem?: string;
}

// Interface para o formulário de operação
interface FormOperacao {
    id?: number;
    operacao: string;
    descricao: string;
    imagem?: File | null;
}

// Define estado para alertas
interface AlertState {
    message: string | null;
    type: "success" | "error" | "warning" | "info";
}

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

// Componente para linha da tabela com memoização
const ProcessoRow = ({
    processo,
    referencia,
    roteiro,
    onClickVerProcessos
}: {
    processo: Especificacao;
    referencia: string;
    roteiro: string;
    onClickVerProcessos: (referencia: string, roteiro: string, processo: number) => void;
}) => {
    return (
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
            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                <button
                    onClick={() => onClickVerProcessos(referencia, roteiro, processo.processo)}
                    className="inline-flex items-center px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors text-xs"
                >
                    <Workflow className="w-4 h-4 mr-1" />

                </button>
            </td>
        </motion.tr>
    );
};

// Componente para o modal de operações de processos
const OperacoesProcessoModal = ({
    isOpen,
    onClose,
    dados,
    onSave,
    onEdit,
    onDelete
}: {
    isOpen: boolean;
    onClose: () => void;
    dados: {
        referencia: string;
        roteiro: string;
        processo: number;
        operacoes: OperacaoProcesso[];
    } | null;
    onSave: (dados: FormOperacao) => Promise<void>;
    onEdit: (dados: FormOperacao) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}) => {
    const [modoEdicao, setModoEdicao] = useState(false);
    const [operacaoAtual, setOperacaoAtual] = useState<FormOperacao>({
        operacao: '',
        descricao: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Resetar formulário
    const resetForm = () => {
        setOperacaoAtual({
            operacao: '',
            descricao: ''
        });
        setModoEdicao(false);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Fechar modal
    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Salvar formulário (criar ou editar)
    const handleSave = async () => {
        if (!operacaoAtual.operacao || !operacaoAtual.descricao) {
            setError('Preencha todos os campos obrigatórios');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (modoEdicao) {
                await onEdit(operacaoAtual);
            } else {
                await onSave(operacaoAtual);
            }
            resetForm();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Erro ao salvar operação');
        } finally {
            setLoading(false);
        }
    };

    // Iniciar edição de uma operação
    const handleStartEdit = (operacao: OperacaoProcesso) => {
        setOperacaoAtual({
            id: operacao.id,
            operacao: operacao.operacao,
            descricao: operacao.descricao
        });
        setModoEdicao(true);
    };

    // Confirmar exclusão de uma operação
    const handleConfirmDelete = async (id: number) => {
        if (confirm('Tem certeza que deseja excluir esta operação?')) {
            setLoading(true);
            try {
                await onDelete(id);
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Erro ao excluir operação');
            } finally {
                setLoading(false);
            }
        }
    };

    // Cancelar edição
    const handleCancelEdit = () => {
        resetForm();
    };

    // Lidar com upload de imagem
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setOperacaoAtual(prev => ({
                ...prev,
                imagem: e.target.files![0]
            }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 p-4 flex items-center justify-center">
            <motion.div
                className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                {/* Header do modal */}
                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg z-10">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <Workflow className="w-4 h-4 mr-2 text-[#1ABC9C]" />
                        Operações do Processo
                    </h3>
                    <div className="flex gap-2 items-center">
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-md text-gray-700">
                            Referência: <b>{dados?.referencia}</b>
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-md text-gray-700">
                            Roteiro: <b>{dados?.roteiro}</b>
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-md text-gray-700">
                            Processo: <b>{dados?.processo}</b>
                        </span>
                        <button
                            onClick={handleClose}
                            className="text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Corpo do modal */}
                <div className="overflow-y-auto p-4 flex-grow">
                    {/* Formulário de cadastro/edição */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-sm mb-3 flex items-center">
                            <span className="h-4 w-1 bg-[#1ABC9C] rounded-full mr-2 inline-block"></span>
                            {modoEdicao ? 'Editar Operação' : 'Nova Operação'}
                        </h4>

                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-md text-xs">
                                <div className="flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1.5" />
                                    {error}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Operação *
                                </label>
                                <input
                                    type="text"
                                    value={operacaoAtual.operacao}
                                    onChange={(e) => setOperacaoAtual(prev => ({ ...prev, operacao: e.target.value }))}
                                    className="w-full rounded-md border-gray-200 text-xs focus:ring-[#1ABC9C] focus:border-[#1ABC9C] bg-white"
                                    placeholder="Digite a operação"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Descrição *
                                </label>
                                <input
                                    type="text"
                                    value={operacaoAtual.descricao}
                                    onChange={(e) => setOperacaoAtual(prev => ({ ...prev, descricao: e.target.value }))}
                                    className="w-full rounded-md border-gray-200 text-xs focus:ring-[#1ABC9C] focus:border-[#1ABC9C] bg-white"
                                    placeholder="Digite a descrição"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Imagem (opcional)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                className="w-full text-xs"
                                disabled={loading}
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            {modoEdicao && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md disabled:opacity-70 transition-colors"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleSave}
                                className="px-3 py-1.5 text-xs bg-[#1ABC9C] hover:bg-[#16A085] text-white rounded-md flex items-center disabled:opacity-70 transition-colors"
                                disabled={loading}
                            >
                                {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>}
                                <Save className="w-3 h-3 mr-1" />
                                {modoEdicao ? 'Atualizar' : 'Salvar'}
                            </button>
                        </div>
                    </div>

                    {/* Lista de operações */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        #
                                    </th>
                                    <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Operação
                                    </th>
                                    <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Descrição
                                    </th>
                                    <th scope="col" className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {dados?.operacoes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-3 py-4 text-center text-xs text-gray-500">
                                            <div className="flex flex-col items-center py-3">
                                                <AlertCircle className="w-5 h-5 text-gray-400 mb-1" />
                                                Nenhuma operação cadastrada
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {dados?.operacoes.map((operacao) => (
                                    <motion.tr
                                        key={operacao.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-900">
                                            {operacao.id}
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-700">
                                            {operacao.operacao}
                                        </td>
                                        <td className="px-3 py-2.5 text-xs text-gray-700">
                                            {operacao.descricao}
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-700 text-right">
                                            <div className="flex justify-end space-x-1">
                                                <button
                                                    onClick={() => handleStartEdit(operacao)}
                                                    className="text-blue-600 hover:text-blue-800 rounded p-1 hover:bg-blue-50"
                                                    disabled={loading}
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleConfirmDelete(operacao.id)}
                                                    className="text-red-600 hover:text-red-800 rounded p-1 hover:bg-red-50"
                                                    disabled={loading}
                                                >
                                                    <Trash className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Rodapé do modal */}
                <div className="px-4 py-3 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white rounded-b-lg">
                    <button
                        onClick={handleClose}
                        className="px-3 py-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md disabled:opacity-70 transition-colors"
                        disabled={loading}
                    >
                        Fechar
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// Componente memoizado para o roteiro
const RoteiroAccordion = ({
    roteiro,
    isExpanded,
    onToggle,
    referencia,
    onClickVerProcessos
}: {
    roteiro: Roteiro;
    isExpanded: boolean;
    onToggle: (roteiroId: string) => void;
    referencia: string;
    onClickVerProcessos: (referencia: string, roteiro: string, processo: number) => void;
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
                        <div className="p-4 border-t border-gray-200">
                            <div className="overflow-x-auto rounded-lg border border-gray-100">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Processo</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo Ação</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recurso</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Setor</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Especificações</th>
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

export default function Especificacoes() {
    const [codigoReferencia, setCodigoReferencia] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState<AlertState>({ message: null, type: "success" });
    const [dadosReferencia, setDadosReferencia] = useState<DadosReferencia | null>(null);
    const [expandedRoteiros, setExpandedRoteiros] = useState<Record<string, boolean>>({});
    const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [modalOperacoes, setModalOperacoes] = useState<{
        isOpen: boolean;
        dados: {
            referencia: string;
            roteiro: string;
            processo: number;
            operacoes: OperacaoProcesso[];
        } | null;
    }>({ isOpen: false, dados: null });

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

    const handleOpenModalOperacoes = useCallback(async (referencia: string, roteiro: string, processo: number) => {
        try {
            setIsLoading(true);

            if (!apiUrl) {
                throw new Error("URL da API não configurada");
            }

            const response = await fetch(
                `${apiUrl}/inspecao/operacoes_processos?referencia=${encodeURIComponent(referencia)}&roteiro=${encodeURIComponent(roteiro)}&processo=${processo}`,
                {
                    method: 'GET',
                    headers: getAuthHeaders()
                }
            );

            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
            }

            const operacoes = await response.json();

            setModalOperacoes({
                isOpen: true,
                dados: { referencia, roteiro, processo, operacoes }
            });
        } catch (error) {
            console.error('Erro ao buscar operações:', error);
            setAlert({
                message: error instanceof Error ? error.message : 'Erro ao buscar operações do processo',
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, getAuthHeaders]);

    const handleSaveOperacao = useCallback(async (dados: FormOperacao) => {
        if (!modalOperacoes.dados) return;

        try {
            setIsLoading(true);

            if (!apiUrl) {
                throw new Error("URL da API não configurada");
            }

            const { referencia, roteiro, processo } = modalOperacoes.dados;

            // Preparar FormData para envio com possível imagem
            const formData = new FormData();
            formData.append('referencia', referencia);
            formData.append('roteiro', roteiro);
            formData.append('processo', processo.toString());
            formData.append('operacao', dados.operacao);
            formData.append('descricao', dados.descricao);

            if (dados.imagem) {
                formData.append('imagem', dados.imagem);
            }

            const response = await fetch(
                `${apiUrl}/inspecao/operacoes_processos`,
                {
                    method: 'POST',
                    headers: {
                        ...getAuthHeaders(),
                        // Não incluímos Content-Type aqui pois o browser vai configurar automaticamente com o boundary para o FormData
                    },
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error(`Erro ao cadastrar operação: ${response.status} - ${response.statusText}`);
            }

            // Atualizar a lista após o cadastro bem-sucedido
            const updatedOperacoes = await fetch(
                `${apiUrl}/inspecao/operacoes_processos?referencia=${encodeURIComponent(referencia)}&roteiro=${encodeURIComponent(roteiro)}&processo=${processo}`,
                {
                    method: 'GET',
                    headers: getAuthHeaders()
                }
            );

            if (updatedOperacoes.ok) {
                const operacoes = await updatedOperacoes.json();
                setModalOperacoes(prev => ({
                    ...prev,
                    dados: { ...prev.dados!, operacoes }
                }));
            }

            setAlert({
                message: "Operação cadastrada com sucesso",
                type: "success"
            });

        } catch (error) {
            console.error('Erro ao cadastrar operação:', error);
            setAlert({
                message: error instanceof Error ? error.message : 'Erro ao cadastrar operação',
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, getAuthHeaders, modalOperacoes.dados]);

    const handleEditOperacao = useCallback(async (dados: FormOperacao) => {
        if (!modalOperacoes.dados || !dados.id) return;

        try {
            setIsLoading(true);

            if (!apiUrl) {
                throw new Error("URL da API não configurada");
            }

            const { referencia, roteiro, processo } = modalOperacoes.dados;

            // Preparar FormData para envio com possível imagem
            const formData = new FormData();
            formData.append('id', dados.id.toString());
            formData.append('referencia', referencia);
            formData.append('roteiro', roteiro);
            formData.append('processo', processo.toString());
            formData.append('operacao', dados.operacao);
            formData.append('descricao', dados.descricao);

            if (dados.imagem) {
                formData.append('imagem', dados.imagem);
            }

            const response = await fetch(
                `${apiUrl}/inspecao/operacoes_processos/${dados.id}`,
                {
                    method: 'PUT',
                    headers: {
                        ...getAuthHeaders(),
                      
                    },
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error(`Erro ao atualizar operação: ${response.status} - ${response.statusText}`);
            }

            // Atualizar a lista após a edição bem-sucedida
            const updatedOperacoes = await fetch(
                `${apiUrl}/inspecao/operacoes_processos?referencia=${encodeURIComponent(referencia)}&roteiro=${encodeURIComponent(roteiro)}&processo=${processo}`,
                {
                    method: 'GET',
                    headers: getAuthHeaders()
                }
            );

            if (updatedOperacoes.ok) {
                const operacoes = await updatedOperacoes.json();
                setModalOperacoes(prev => ({
                    ...prev,
                    dados: { ...prev.dados!, operacoes }
                }));
            }

            setAlert({
                message: "Operação atualizada com sucesso",
                type: "success"
            });

        } catch (error) {
            console.error('Erro ao atualizar operação:', error);
            setAlert({
                message: error instanceof Error ? error.message : 'Erro ao atualizar operação',
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, getAuthHeaders, modalOperacoes.dados]);

    const handleDeleteOperacao = useCallback(async (id: number) => {
        if (!modalOperacoes.dados) return;

        try {
            setIsLoading(true);

            if (!apiUrl) {
                throw new Error("URL da API não configurada");
            }

            const { referencia, roteiro, processo } = modalOperacoes.dados;

            const response = await fetch(
                `${apiUrl}/inspecao/operacoes_processos/${id}`,
                {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                }
            );

            if (!response.ok) {
                throw new Error(`Erro ao excluir operação: ${response.status} - ${response.statusText}`);
            }

            // Atualizar a lista após a exclusão bem-sucedida
            const updatedOperacoes = await fetch(
                `${apiUrl}/inspecao/operacoes_processos?referencia=${encodeURIComponent(referencia)}&roteiro=${encodeURIComponent(roteiro)}&processo=${processo}`,
                {
                    method: 'GET',
                    headers: getAuthHeaders()
                }
            );

            if (updatedOperacoes.ok) {
                const operacoes = await updatedOperacoes.json();
                setModalOperacoes(prev => ({
                    ...prev,
                    dados: { ...prev.dados!, operacoes }
                }));
            }

            setAlert({
                message: "Operação excluída com sucesso",
                type: "success"
            });

        } catch (error) {
            console.error('Erro ao excluir operação:', error);
            setAlert({
                message: error instanceof Error ? error.message : 'Erro ao excluir operação',
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, getAuthHeaders, modalOperacoes.dados]);

    const handleCloseModalOperacoes = useCallback(() => {
        setModalOperacoes({ isOpen: false, dados: null });
    }, []);

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
                                    {dadosReferencia.roteiros.map((roteiro) => (
                                        <RoteiroAccordion
                                            key={roteiro.roteiro}
                                            roteiro={roteiro}
                                            isExpanded={expandedRoteiros[roteiro.roteiro]}
                                            onToggle={toggleRoteiro}
                                            referencia={dadosReferencia.referencia}
                                            onClickVerProcessos={(referencia, roteiro, processo) => {
                                                handleOpenModalOperacoes(referencia, roteiro, processo);
                                            }}
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
            <OperacoesProcessoModal
                isOpen={modalOperacoes.isOpen}
                onClose={handleCloseModalOperacoes}
                dados={modalOperacoes.dados}
                onSave={handleSaveOperacao}
                onEdit={handleEditOperacao}
                onDelete={handleDeleteOperacao}
            />
        </div>
    );
}