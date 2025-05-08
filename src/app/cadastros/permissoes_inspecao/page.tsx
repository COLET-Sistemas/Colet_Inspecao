"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { DataCards } from "@/components/ui/cadastros/DataCards";
import { DataListContainer } from "@/components/ui/cadastros/DataListContainer";
import { DataTable } from "@/components/ui/cadastros/DataTable";
import { EmptyState } from "@/components/ui/cadastros/EmptyState";
import { FilterPanel, ViewMode } from "@/components/ui/cadastros/FilterPanel";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { Tooltip } from "@/components/ui/cadastros/Tooltip";
import { ConfirmDeleteModal } from "@/components/ui/cadastros/modais_cadastros/ConfirmDeleteModal";
import { PermissaoInspecaoModal } from "@/components/ui/cadastros/modais_cadastros/PermissaoInspecaoModal";
import { useApiConfig } from "@/hooks/useApiConfig";
import { getPermissoesInspecao } from "@/services/api/permissaoInspecaoService";
import { getTiposInspecao } from "@/services/api/tipoInspecaoService";
import { PermissaoInspecao as ApiPermissaoInspecao } from "@/types/cadastros/permissaoInspecao";
import { TipoInspecao } from "@/types/cadastros/tipoInspecao";
import { motion } from "framer-motion";
import { IterationCcw, Pencil, SlidersHorizontal } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";

// Interfaces para o componente
interface AlertState {
    message: string | null;
    type: "success" | "error" | "warning" | "info";
}

// Removendo a interface intermediária e usando diretamente a interface do arquivo types
// O componente Card ainda precisa de algumas propriedades adicionais, então vamos extender a interface
interface PermissaoInspecaoExtended extends ApiPermissaoInspecao {
    id: string; // ID obrigatório para compatibilidade com DataTable/DataCards
}

// Interface e criação do contexto
interface PermissoesContextType {
    parseInspecaoIds: (inspecoesStr: string) => Array<{ id: string, descricao: string }>;
}

const PermissoesContext = createContext<PermissoesContextType | undefined>(undefined);

// Hook para usar o contexto
function usePermissoesContext() {
    const context = useContext(PermissoesContext);
    if (!context) {
        throw new Error('usePermissoesContext must be used within a PermissoesProvider');
    }
    return context;
}

// Componente Card para exibição em modo de cartões
const Card = ({ permissao, onEdit, onDelete }: {
    permissao: PermissaoInspecaoExtended;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}) => {
    // Funções auxiliares para formatação
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR').format(date);
    };

    // Usar o hook useContext para acessar o parseInspecaoIds
    const { parseInspecaoIds } = usePermissoesContext();
    const inspecoesInfo = parseInspecaoIds(permissao.inspecoes);

    return (
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all duration-300">
            <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            {permissao.operador}
                        </span>
                    </div>
                </div>

                <h3 className="text-base font-medium text-gray-800 mb-2 line-clamp-2">
                    {permissao.nome_operador}
                </h3>

                {/* Permissões como badges (responsivos) */}
                <div className="flex flex-wrap gap-1 mb-3 min-h-[40px]">
                    {inspecoesInfo.map((inspecao, index) => (
                        <span
                            key={`${inspecao.id}-${index}`}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                            title={inspecao.descricao}
                        >
                            {inspecao.descricao}
                        </span>
                    ))}

                    {inspecoesInfo.length === 0 && (
                        <span className="text-xs text-gray-500">Sem permissões atribuídas</span>
                    )}
                </div>

                <div className="flex justify-between items-end mt-3">
                    <div className="flex space-x-1">
                        <Tooltip text="Editar">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                className="p-1.5 rounded-md text-yellow-500 hover:bg-yellow-50"
                                onClick={() => onEdit(permissao.id)}
                                aria-label="Editar"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </motion.button>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Página principal
export default function PermissoesInspecaoPage() {
    // Estados para gerenciamento de dados e UI
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const [permissoes, setPermissoes] = useState<PermissaoInspecaoExtended[]>([]);
    const [allData, setAllData] = useState<PermissaoInspecaoExtended[]>([]);
    const [tiposInspecao, setTiposInspecao] = useState<TipoInspecao[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    // Estados para filtros e ordenação
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilters, setActiveFilters] = useState(0);
    const [sortField, setSortField] = useState<"operador" | "nome_operador">("operador");

    // Handler para mudança de campo de ordenação com type safety
    const handleSortFieldChange = useCallback((field: string) => {
        if (field === "operador" || field === "nome_operador") {
            setSortField(field);
        }
    }, []);

    // Estados para modais
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentPermissao, setCurrentPermissao] = useState<ApiPermissaoInspecao | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Estado para alertas e notificações
    const [alert, setAlert] = useState<AlertState>({ message: null, type: "success" });
    const [notification, setNotification] = useState('');

    // Referência para controlar requisições
    const dataFetchedRef = useRef(false);
    const tiposInspecaoFetchedRef = useRef(false);

    const { getAuthHeaders } = useApiConfig();

    // Carrega tipos de inspeção
    const loadTiposInspecao = useCallback(async () => {
        try {
            console.log('Iniciando busca dos tipos de inspeção');
            const headers = getAuthHeaders();
            const data = await getTiposInspecao(headers);
            console.log('Tipos de inspeção recebidos:', data);
            // Não filtrar mais, mostrar todos os tipos de inspeção
            setTiposInspecao(data);
            return data;
        } catch (error) {
            console.error('Erro ao carregar tipos de inspeção:', error);
            return [];
        }
    }, [getAuthHeaders]);

    // Carrega dados - Removendo dependências de estado para evitar recriações constantes
    const loadData = useCallback(async () => {
        setIsLoading(true);
        setApiError(null);

        try {
            const headers = getAuthHeaders();
            console.log('Iniciando busca de permissões de inspeção');

            // Carregar tipos de inspeção se ainda não foram carregados
            let tiposAtivos = tiposInspecao;
            if (!tiposInspecaoFetchedRef.current || tiposInspecao.length === 0) {
                tiposAtivos = await loadTiposInspecao();
                tiposInspecaoFetchedRef.current = true;
            }

            // Carregar permissões
            const apiData: ApiPermissaoInspecao[] = await getPermissoesInspecao(headers);
            console.log('Dados recebidos da API:', apiData);

            if (!apiData || apiData.length === 0) {
                console.log('API retornou array vazio ou nulo');
                setPermissoes([]);
                setAllData([]);
                setIsLoading(false);
                setIsRefreshing(false);
                return;
            }

            const mappedData: PermissaoInspecaoExtended[] = apiData.map(item => ({
                ...item, // Mantém todos os campos originais da API
                id: item.operador, // Adiciona o id obrigatório para os componentes
            }));

            console.log('Dados mapeados:', mappedData);
            setAllData(mappedData);

            // Aplicar filtros manualmente sem reconstruir a função filterData
            let filtered = [...mappedData];

            if (searchTerm) {
                filtered = filtered.filter(item =>
                    String(item.operador).toLowerCase().includes(searchTerm.toLowerCase()) ||
                    String(item.nome_operador).toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            // Aplicar ordenação
            filtered.sort((a, b) => {
                const fieldA = a[sortField];
                const fieldB = b[sortField];

                if (fieldA < fieldB) return -1;
                if (fieldA > fieldB) return 1;
                return 0;
            });

            setPermissoes(filtered);

            if (filtered.length === 0) {
                setNotification('Nenhum resultado encontrado para os filtros atuais.');
            } else {
                setNotification(`${filtered.length} permissões de inspeção encontradas.`);
            }

            setIsLoading(false);
            setIsRefreshing(false);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            setApiError(error instanceof Error ? error.message : "Erro desconhecido ao carregar dados");
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [getAuthHeaders, searchTerm, sortField, tiposInspecao, loadTiposInspecao]); // Incluindo dependência de tipos de inspeção

    useEffect(() => {
        // Evitar o loop infinito usando a referência
        if (!dataFetchedRef.current) {
            dataFetchedRef.current = true;
            loadData();
        }

        // Limpeza - se necessário abortar requisições pendentes no futuro
        return () => {
            // Cleanup function if needed
        };
    }, [loadData]); // Dependência do loadData é necessária

    // Atualizar o controle manual dos filtros quando eles mudarem
    useEffect(() => {
        if (dataFetchedRef.current) {
            // Somente aplica filtros se os dados já foram carregados
            const filteredData = [...allData].filter(item => {
                // Filtro por termo de busca
                const matchesSearch = !searchTerm ||
                    String(item.operador).toLowerCase().includes(searchTerm.toLowerCase()) ||
                    String(item.nome_operador).toLowerCase().includes(searchTerm.toLowerCase());

                return matchesSearch;
            });

            // Aplicar ordenação
            filteredData.sort((a, b) => {
                const fieldA = a[sortField];
                const fieldB = b[sortField];

                if (fieldA < fieldB) return -1;
                if (fieldA > fieldB) return 1;
                return 0;
            });

            setPermissoes(filteredData);

            // Atualiza notificação
            if (filteredData.length === 0) {
                setNotification('Nenhum resultado encontrado para os filtros atuais.');
            } else {
                setNotification(`${filteredData.length} permissões de inspeção encontradas.`);
            }
        }
    }, [searchTerm, sortField, allData]);

    // Manipulação de operações CRUD com feedback
    const handleEdit = useCallback((id: string) => {
        const permissao = permissoes.find(p => p.operador === id);
        if (permissao) {
            setCurrentPermissao({
                operador: permissao.operador,
                nome_operador: permissao.nome_operador,
                situacao: permissao.situacao,
                inspecoes: permissao.inspecoes
            });
            setIsEditModalOpen(true);
            setNotification(`Iniciando edição da permissão para ${permissao.nome_operador}.`);
        }
    }, [permissoes]);

    const handleEditSuccess = useCallback((updatedPermissao: ApiPermissaoInspecao) => {
        // Atualizar os dados locais
        setAllData(prev =>
            prev.map(item =>
                item.operador === updatedPermissao.operador
                    ? { ...item, ...updatedPermissao, id: updatedPermissao.operador }
                    : item
            )
        );

        // Replicar a atualização para a lista filtrada
        setPermissoes(prev =>
            prev.map(item =>
                item.operador === updatedPermissao.operador
                    ? { ...item, ...updatedPermissao, id: updatedPermissao.operador }
                    : item
            )
        );

        // Fechar modal e mostrar mensagem de sucesso
        setIsEditModalOpen(false);
        setCurrentPermissao(null);
        setAlert({
            message: `Permissões de inspeção para ${updatedPermissao.nome_operador} atualizadas com sucesso!`,
            type: "success"
        });
        setNotification(`Permissões de inspeção para ${updatedPermissao.nome_operador} atualizadas com sucesso.`);
    }, []);

    const handleEditError = useCallback((errorMessage: string) => {
        setAlert({
            message: `Erro ao atualizar permissão: ${errorMessage}`,
            type: "error"
        });
        setNotification(`Erro ao atualizar permissão: ${errorMessage}`);
    }, []);

    const handleDelete = useCallback((id: string) => {
        console.log(`Excluindo permissão ${id}`);
        // Abre o modal de confirmação
        setDeletingId(id);
        setIsDeleteModalOpen(true);
        setNotification(`Confirme a exclusão da permissão ${id}.`);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!deletingId) return;

        setIsDeleting(true);

        try {
            // Simulação de uma operação de exclusão
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Remover item da lista
            setPermissoes(prev => prev.filter(item => item.id !== deletingId));
            setAllData(prev => prev.filter(item => item.id !== deletingId));

            // Fechar modal de confirmação
            setIsDeleteModalOpen(false);

            // Mostrar mensagem de sucesso
            setAlert({
                message: `Permissão excluída com sucesso!`,
                type: "success"
            });

            setNotification(`Permissão excluída com sucesso.`);
        } catch (error) {
            console.error('Erro ao excluir permissão:', error);

            // Sempre fechar o modal em caso de erro
            setIsDeleteModalOpen(false);

            // Mostrar mensagem de erro
            setAlert({
                message: error instanceof Error ? error.message : 'Erro desconhecido ao excluir o registro',
                type: "error"
            });

            setNotification(`Erro ao excluir permissão: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
        } finally {
            setIsDeleting(false);
            setDeletingId(null);
        }
    }, [deletingId]);

    const handleCloseDeleteModal = useCallback(() => {
        setIsDeleteModalOpen(false);
        setDeletingId(null);
        setNotification("Exclusão cancelada.");
    }, []);

    // Reset filtros
    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setNotification("Filtros resetados.");
    }, []);

    // Limpar alerta
    const clearAlert = useCallback(() => {
        setAlert({ message: null, type: "success" });
    }, []);

    // Função para atualizar dados
    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        dataFetchedRef.current = false;
        tiposInspecaoFetchedRef.current = false;
        loadData();
        setNotification("Atualizando dados...");
    }, [loadData]);

    // Função para encontrar os nomes dos tipos de inspeção a partir dos IDs
    const parseInspecaoIds = useCallback((inspecoesStr: string) => {
        if (!inspecoesStr || !tiposInspecao.length) return [];

        // Separa cada caractere como um ID separado
        const idsArray = Array.from(inspecoesStr);

        return idsArray.map(id => {
            // Encontra o tipo de inspeção correspondente pelo id
            const tipoInspecao = tiposInspecao.find(tipo => tipo.id === id);
            return {
                id,
                descricao: tipoInspecao?.descricao_tipo_inspecao || `Tipo ${id}`
            };
        });
    }, [tiposInspecao]);

    // Funções utilitárias para formatar os dados na tabela
    const formatPermissoes = useCallback((permissoes: string) => {
        if (!permissoes) return null;

        const inspecoesInfo = parseInspecaoIds(permissoes);

        return (
            <div className="flex flex-wrap gap-1 max-w-sm">
                {inspecoesInfo.map((inspecao, index) => (
                    <span
                        key={`${inspecao.id}-${index}`}
                        className="inline-flex items-center mx-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                        title={inspecao.descricao}
                    >
                        {inspecao.descricao}
                    </span>
                ))}
                {inspecoesInfo.length === 0 && (
                    <span className="text-xs text-gray-500">Sem permissões</span>
                )}
            </div>
        );
    }, [parseInspecaoIds]);

    // Preparar opções de filtro para o componente FilterPanel
    const filterOptions = useMemo(() => [], []);

    // Preparar filtros selecionados para exibição
    const selectedFiltersForDisplay = useMemo(() => {
        const filters = [];

        if (searchTerm) {
            filters.push({
                id: "search",
                value: searchTerm,
                label: `Pesquisa: "${searchTerm}"`,
                color: "bg-purple-100 text-purple-800",
            });
        }

        return filters;
    }, [searchTerm]);

    // Definição das colunas da tabela
    const tableColumns = useMemo(() => [
        {
            key: "operador",
            title: "ID",
            render: (permissao: PermissaoInspecaoExtended) => (
                <span className="text-sm font-medium text-gray-900">{permissao.operador}</span>
            ),
        },
        {
            key: "nome_operador",
            title: "Nome",
            render: (permissao: PermissaoInspecaoExtended) => (
                <div className="text-sm text-gray-900 max-w-md truncate">{permissao.nome_operador}</div>
            ),
        },
        {
            key: "inspecoes",
            title: "Permissões",
            render: (permissao: PermissaoInspecaoExtended) => formatPermissoes(permissao.inspecoes),
        },
        {
            key: "acoes",
            title: "Ações",
            render: (permissao: PermissaoInspecaoExtended) => (
                <div className="flex items-center justify-end gap-2">
                    <Tooltip text="Editar">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="text-yellow-500 hover:text-yellow-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:ring-offset-1 rounded p-1"
                            onClick={() => handleEdit(permissao.operador)}
                            aria-label="Editar"
                        >
                            <Pencil className="h-4 w-4" />
                        </motion.button>
                    </Tooltip>
                </div>
            ),
        },
    ], [formatPermissoes, handleEdit]);

    return (
        <PermissoesContext.Provider value={{ parseInspecaoIds }}>
            <div className="space-y-5 p-2 sm:p-4 md:p-6 mx-auto">
                {/* ARIA Live region for accessibility */}
                <div className="sr-only" role="status" aria-live="polite">
                    {notification}
                </div>

                {/* Alerta para mensagens de sucesso */}
                <AlertMessage
                    message={alert.message}
                    type={alert.type}
                    onDismiss={clearAlert}
                    autoDismiss={true}
                    dismissDuration={5000}
                />

                {/* Modal de edição de permissão */}
                {currentPermissao && (
                    <PermissaoInspecaoModal
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setCurrentPermissao(null);
                        }}
                        permissaoInspecao={currentPermissao}
                        tiposInspecao={tiposInspecao}
                        onSuccess={handleEditSuccess}
                        onError={handleEditError}
                    />
                )}

                {/* Modal de confirmação de exclusão */}
                <ConfirmDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={handleCloseDeleteModal}
                    onConfirm={confirmDelete}
                    isDeleting={isDeleting}
                    title="Confirmar Exclusão"
                    message={
                        deletingId !== null
                            ? `Você está prestes a excluir permanentemente a permissão de inspeção:`
                            : "Deseja realmente excluir este item?"
                    }
                    itemName={
                        deletingId !== null
                            ? permissoes.find(perm => perm.operador === deletingId)?.nome_operador
                            : undefined
                    }
                />

                {/* Page Header Component */}
                <PageHeader
                    title="Permissões de Inspeção"
                    subtitle="Cadastro e edição de permissões de acesso para inspeção"
                    showButton={false}
                />

                {/* Filters Component */}
                <FilterPanel
                    searchTerm={searchTerm}
                    onSearchChange={(value: string) => setSearchTerm(value)}
                    searchPlaceholder="Buscar por operador ou nome do operador..."
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    filters={filterOptions}
                    activeFilters={activeFilters}
                    onResetFilters={resetFilters}
                    selectedFilters={selectedFiltersForDisplay}
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                    sortField={sortField}
                    onSortFieldChange={handleSortFieldChange}
                />

                {/* Data Container with Dynamic View */}
                <DataListContainer
                    isLoading={isLoading || isPending}
                    isEmpty={permissoes.length === 0}
                    emptyState={
                        apiError ? (
                            <EmptyState
                                icon={<SlidersHorizontal className="h-8 w-8 text-red-500" strokeWidth={1.5} />}
                                title="Erro ao carregar dados"
                                description={apiError}
                                primaryAction={{
                                    label: "Tentar novamente",
                                    onClick: loadData,
                                    icon: <IterationCcw className="mr-2 h-4 w-4" />,
                                    disabled: false,
                                }}
                            />
                        ) : (
                            <EmptyState
                                icon={<SlidersHorizontal className="h-8 w-8 text-gray-500" strokeWidth={1.5} />}
                                title="Nenhum resultado encontrado"
                                description="Não encontramos permissões de inspeção que correspondam aos seus filtros atuais."
                                secondaryAction={{
                                    label: "Limpar filtros",
                                    onClick: resetFilters,
                                }}
                            />
                        )
                    }
                    totalItems={allData.length}
                    totalFilteredItems={permissoes.length}
                    activeFilters={activeFilters}
                    onResetFilters={resetFilters}
                >
                    {viewMode === "table" ? (
                        // @ts-ignore - O tipo está correto mas o TypeScript não consegue inferir corretamente
                        <DataTable data={permissoes} columns={tableColumns} />
                    ) : (
                        // @ts-ignore - O tipo está correto mas o TypeScript não consegue inferir corretamente
                        <DataCards
                            data={permissoes}
                            renderCard={(permissao: any) => (
                                <Card
                                    key={permissao.operador}
                                    permissao={permissao as PermissaoInspecaoExtended}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            )}
                        />
                    )}
                </DataListContainer>
            </div>
        </PermissoesContext.Provider>
    );
}