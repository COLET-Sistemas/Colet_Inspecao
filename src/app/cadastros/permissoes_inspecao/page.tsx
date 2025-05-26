"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { DataCards } from "@/components/ui/cadastros/DataCards";
import { DataListContainer } from "@/components/ui/cadastros/DataListContainer";
import { DataTable } from "@/components/ui/cadastros/DataTable";
import { EmptyState } from "@/components/ui/cadastros/EmptyState";
import { FilterPanel, ViewMode } from "@/components/ui/cadastros/FilterPanel";
import { PermissaoInspecaoModal } from "@/components/ui/cadastros/modais_cadastros/PermissaoInspecaoModal";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { Tooltip } from "@/components/ui/cadastros/Tooltip";
import { RestrictedAccess } from "@/components/ui/RestrictedAccess";
import { useApiConfig } from "@/hooks/useApiConfig";
import { getPermissoesInspecao } from "@/services/api/permissaoInspecaoService";
import { getTiposInspecao } from "@/services/api/tipoInspecaoService";
import { PermissaoInspecao as ApiPermissaoInspecao } from "@/types/cadastros/permissaoInspecao";
import { TipoInspecao } from "@/types/cadastros/tipoInspecao";
import { motion } from "framer-motion";
import { IterationCcw, Pencil, SlidersHorizontal } from "lucide-react";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

interface AlertState {
    message: string | null;
    type: "success" | "error" | "warning" | "info";
}

interface PermissaoInspecaoExtended extends ApiPermissaoInspecao {
    id: string;
}

// Interface para filtro de permissão
interface PermissaoFilterOption {
    value: string;
    label: string;
}

// Função para gerar cores consistentes baseadas no ID
const getInspecaoColor = (id: string): { bg: string, text: string } => {
    const colorOptions = [
        { bg: "bg-blue-50", text: "text-blue-700" },
        { bg: "bg-green-50", text: "text-green-700" },
        { bg: "bg-purple-50", text: "text-purple-700" },
        { bg: "bg-amber-50", text: "text-amber-700" },
        { bg: "bg-rose-50", text: "text-rose-700" },
        { bg: "bg-cyan-50", text: "text-cyan-700" },
        { bg: "bg-indigo-50", text: "text-indigo-700" },
        { bg: "bg-yellow-50", text: "text-yellow-700" },
        { bg: "bg-orange-50", text: "text-orange-700" },
        { bg: "bg-lime-100", text: "text-lime-700" },
    ];

    const charCode = id.charCodeAt(0);
    const index = charCode % colorOptions.length;

    return colorOptions[index];
};

// Interface de dados para inspeções formatadas
interface InspecaoFormatada {
    id: string;
    descricao: string;
    color: { bg: string, text: string };
}

// Interface e criação do contexto
interface PermissoesContextType {
    parseInspecaoIds: (inspecoesStr: string) => InspecaoFormatada[];
}

// Valor padrão para evitar undefined checks
const defaultContextValue: PermissoesContextType = {
    parseInspecaoIds: () => [],
};

const PermissoesContext = createContext<PermissoesContextType>(defaultContextValue);
PermissoesContext.displayName = 'PermissoesContext'; // Melhor debuggability

// Hook para usar o contexto
function usePermissoesContext() {
    const context = useContext(PermissoesContext);
    if (!context) {
        throw new Error('usePermissoesContext must be used within a PermissoesProvider');
    }
    return context;
}

// Componente Card para exibição em modo de cartões
const Card = React.memo(({ permissao, onEdit }: {
    permissao: PermissaoInspecaoExtended;
    onEdit: (id: string) => void;
}) => {
    // Usar o hook useContext para acessar o parseInspecaoIds
    const { parseInspecaoIds } = usePermissoesContext();
    const inspecoesInfo = parseInspecaoIds(permissao.inspecoes);

    const handleEdit = useCallback(() => {
        onEdit(permissao.id);
    }, [onEdit, permissao.id]);

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
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${inspecao.color.bg} ${inspecao.color.text}`}
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
                                onClick={handleEdit}
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
});

// Add display name for better debugging
Card.displayName = 'PermissaoCard';

// Página principal
export default function PermissoesInspecaoPage() {
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

    // Estados para gerenciamento de dados e UI
    const [isLoading, setIsLoading] = useState(true);
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
    const [selectedPermissionFilter, setSelectedPermissionFilter] = useState<string | null>(null);

    // Observa alterações nos filtros para atualizar o contador de filtros ativos
    useEffect(() => {
        let count = 0;
        if (searchTerm) count++;
        if (selectedPermissionFilter) count++;

        setActiveFilters(count);
    }, [searchTerm, selectedPermissionFilter]);

    // Handler para mudança de campo de ordenação com type safety
    const handleSortFieldChange = useCallback((field: string) => {
        if (field === "operador" || field === "nome_operador") {
            setSortField(field);
        }
    }, []);

    // Estados para modais
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentPermissao, setCurrentPermissao] = useState<ApiPermissaoInspecao | null>(null);

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

    // Função para filtrar e ordenar os dados
    const filterAndSortData = useCallback((data: PermissaoInspecaoExtended[], search: string, permissionFilter: string | null, sort: "operador" | "nome_operador") => {
        // Filtrar por termo de busca
        let filtered = data;

        if (search) {
            filtered = filtered.filter(item =>
                String(item.operador).toLowerCase().includes(search.toLowerCase()) ||
                String(item.nome_operador).toLowerCase().includes(search.toLowerCase())
            );
        }

        // Filtrar por permissão
        if (permissionFilter) {
            if (permissionFilter === "com_permissao") {
                filtered = filtered.filter(item => item.inspecoes.length > 0);
            } else if (permissionFilter === "sem_permissao") {
                filtered = filtered.filter(item => item.inspecoes.length === 0);
            } else {
                filtered = filtered.filter(item =>
                    item.inspecoes.includes(permissionFilter)
                );
            }
        }

        // Ordenar os dados
        return [...filtered].sort((a, b) => {
            const fieldA = a[sort];
            const fieldB = b[sort];

            if (fieldA < fieldB) return -1;
            if (fieldA > fieldB) return 1;
            return 0;
        });
    }, []);

    // Carrega dados - Removendo dependências de estado para evitar recriações constantes
    const loadData = useCallback(async () => {
        setIsLoading(true);
        setApiError(null);

        try {
            const headers = getAuthHeaders();

            // Carregar tipos de inspeção se ainda não foram carregados
            if (!tiposInspecaoFetchedRef.current || tiposInspecao.length === 0) {
                await loadTiposInspecao();
                tiposInspecaoFetchedRef.current = true;
            }

            // Carregar permissões
            const apiData: ApiPermissaoInspecao[] = await getPermissoesInspecao(headers);

            if (!apiData || apiData.length === 0) {
                setPermissoes([]);
                setAllData([]);
                setIsLoading(false);
                setIsRefreshing(false);
                return;
            }

            // Mapear dados adicionando ID
            const mappedData: PermissaoInspecaoExtended[] = apiData.map(item => ({
                ...item,
                id: item.operador,
            }));

            setAllData(mappedData);

            // Aplicar filtros e ordenação
            const filteredData = filterAndSortData(
                mappedData,
                searchTerm,
                selectedPermissionFilter,
                sortField
            );

            setPermissoes(filteredData);

            // Atualizar notificação
            if (filteredData.length === 0) {
                setNotification('Nenhum resultado encontrado para os filtros atuais.');
            } else {
                setNotification(`${filteredData.length} permissões de inspeção encontradas.`);
            }

            setIsLoading(false);
            setIsRefreshing(false);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : "Erro desconhecido ao carregar dados";

            setApiError(errorMessage);
            setAlert({
                message: `Falha ao carregar dados: ${errorMessage}`,
                type: "error"
            });
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [
        getAuthHeaders,
        loadTiposInspecao,
        searchTerm,
        selectedPermissionFilter,
        sortField,
        filterAndSortData,
        tiposInspecao.length
    ]);

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
        if (dataFetchedRef.current && allData.length > 0) {
            // Somente aplica filtros se os dados já foram carregados
            const filteredData = filterAndSortData(
                allData,
                searchTerm,
                selectedPermissionFilter,
                sortField
            );

            setPermissoes(filteredData);

            // Atualiza notificação
            if (filteredData.length === 0) {
                setNotification('Nenhum resultado encontrado para os filtros atuais.');
            } else {
                setNotification(`${filteredData.length} permissões de inspeção encontradas.`);
            }
        }
    }, [searchTerm, sortField, allData, selectedPermissionFilter, filterAndSortData]);

    // Manipulação de operações CRUD com feedback aprimorada
    const handleEdit = useCallback((id: string) => {
        try {
            const permissao = permissoes.find(p => p.operador === id);
            if (!permissao) {
                throw new Error(`Permissão com ID ${id} não foi encontrada`);
            }

            // Criar um novo objeto para evitar referências mutáveis
            setCurrentPermissao({
                operador: permissao.operador,
                nome_operador: permissao.nome_operador,
                situacao: permissao.situacao,
                inspecoes: permissao.inspecoes
            });

            setIsEditModalOpen(true);
            setNotification(`Iniciando edição da permissão para ${permissao.nome_operador}.`);
        } catch (error) {
            console.error('Erro ao editar permissão:', error);
            setAlert({
                message: error instanceof Error ? error.message : 'Erro desconhecido ao editar permissão',
                type: "error"
            });
        }
    }, [permissoes]);

    const handleEditSuccess = useCallback((updatedPermissao: ApiPermissaoInspecao) => {
        // Fechar modal e mostrar mensagem de sucesso
        setIsEditModalOpen(false);
        setCurrentPermissao(null);
        setAlert({
            message: `Permissões de inspeção para ${updatedPermissao.nome_operador} atualizadas com sucesso!`,
            type: "success"
        });
        setNotification(`Permissões de inspeção para ${updatedPermissao.nome_operador} atualizadas com sucesso.`);

        // Recarregar os dados da API após edição bem-sucedida
        dataFetchedRef.current = false;
        loadData();
    }, [loadData]);

    const handleEditError = useCallback((errorMessage: string) => {
        setAlert({
            message: `Erro ao atualizar permissão: ${errorMessage}`,
            type: "error"
        });
        setNotification(`Erro ao atualizar permissão: ${errorMessage}`);
    }, []);

    // Reset filtros
    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setSelectedPermissionFilter(null);
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
                descricao: tipoInspecao?.descricao_tipo_inspecao || `Tipo ${id}`,
                color: getInspecaoColor(id),
            };
        });
    }, [tiposInspecao]);

    // Funções utilitárias para formatar os dados na tabela com otimização
    const formatPermissoes = useCallback((permissoes: string) => {
        if (!permissoes) return null;

        const inspecoesInfo = parseInspecaoIds(permissoes);

        return (
            <div className="flex flex-wrap gap-1 max-w-sm">
                {inspecoesInfo.map((inspecao, index) => (
                    <span
                        key={`${inspecao.id}-${index}`}
                        className={`inline-flex items-center mx-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${inspecao.color.bg} ${inspecao.color.text}`}
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
    const filterOptions = useMemo(() => {
        // Criar a opção "Ver todos" que será a primeira na lista
        const allOption: PermissaoFilterOption = {
            value: "",
            label: "Ver todos",
        };

        // Opções especiais para filtrar por status de permissão
        const specialOptions: PermissaoFilterOption[] = [
            {
                value: "com_permissao",
                label: "Usuários com permissões"
            },
            {
                value: "sem_permissao",
                label: "Usuários sem permissões"
            }
        ];

        // Mapear os tipos de inspeção para opções de filtro
        const permissionOptions: PermissaoFilterOption[] = tiposInspecao.map(tipo => ({
            value: tipo.id,
            label: tipo.descricao_tipo_inspecao,
        }));

        // Adicionar todas as opções na ordem correta
        const options = [allOption, ...specialOptions, ...permissionOptions];

        return [
            {
                id: "permission",
                label: "Permissão",
                value: selectedPermissionFilter || "",
                options: options,
                onChange: (value: string) => setSelectedPermissionFilter(value === "" ? null : value),
            },
        ];
    }, [tiposInspecao, selectedPermissionFilter]);

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

        if (selectedPermissionFilter) {
            let permissionLabel;
            let color = "bg-blue-100 text-blue-800";

            if (selectedPermissionFilter === "com_permissao") {
                permissionLabel = "Usuários com permissões";
                color = "bg-green-100 text-green-800";
            } else if (selectedPermissionFilter === "sem_permissao") {
                permissionLabel = "Usuários sem permissões";
                color = "bg-orange-100 text-orange-800";
            } else {
                permissionLabel = tiposInspecao.find(tipo => tipo.id === selectedPermissionFilter)?.descricao_tipo_inspecao;
            }

            filters.push({
                id: "permission",
                value: selectedPermissionFilter,
                label: `Filtro: ${permissionLabel}`,
                color,
            });
        }

        return filters;
    }, [searchTerm, selectedPermissionFilter, tiposInspecao]);

    const IdCell = React.memo(({ operador }: { operador: string }) => (
        <span className="text-sm font-medium text-gray-900">{operador}</span>
    ));
    IdCell.displayName = 'IdCell';

    const NameCell = React.memo(({ nome }: { nome: string }) => (
        <div className="text-sm text-gray-900 max-w-md truncate">{nome}</div>
    ));
    NameCell.displayName = 'NameCell';

    const ActionsCell = React.memo(({ operador }: { operador: string }) => {
        const handleEditClick = useCallback(() => {
            handleEdit(operador);
        }, [operador]);

        return (
            <div className="flex items-center justify-end gap-2">
                <Tooltip text="Editar">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="text-yellow-500 hover:text-yellow-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:ring-offset-1 rounded p-1"
                        onClick={handleEditClick}
                        aria-label="Editar"
                    >
                        <Pencil className="h-4 w-4" />
                    </motion.button>
                </Tooltip>
            </div>
        );
    });
    ActionsCell.displayName = 'ActionsCell';

    const tableColumns = useMemo(() => [
        {
            key: "operador",
            title: "ID",
            render: (item: { id: string | number }) => {
                const permissao = item as PermissaoInspecaoExtended;
                return <IdCell operador={permissao.operador} />;
            },
        },
        {
            key: "nome_operador",
            title: "Nome",
            render: (item: { id: string | number }) => {
                const permissao = item as PermissaoInspecaoExtended;
                return <NameCell nome={permissao.nome_operador} />;
            },
        },
        {
            key: "inspecoes",
            title: "Permissões",
            render: (item: { id: string | number }) => {
                const permissao = item as PermissaoInspecaoExtended;
                return formatPermissoes(permissao.inspecoes);
            },
        },
        {
            key: "acoes",
            title: "Ações",
            render: (item: { id: string | number }) => {
                const permissao = item as PermissaoInspecaoExtended;
                return <ActionsCell operador={permissao.operador} />;
            },
        },
    ], [formatPermissoes, IdCell, NameCell, ActionsCell]);

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
    }

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

                {/* No deletion functionality */}

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
                    isLoading={isLoading}
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
                        <DataTable
                            data={permissoes}
                            columns={tableColumns}
                        />
                    ) : (
                        <DataCards
                            data={permissoes}
                            renderCard={(permissao: PermissaoInspecaoExtended) => (
                                <Card
                                    key={permissao.operador}
                                    permissao={permissao}
                                    onEdit={handleEdit}
                                />
                            )}
                        />
                    )}
                </DataListContainer>
            </div>
        </PermissoesContext.Provider>
    );
}