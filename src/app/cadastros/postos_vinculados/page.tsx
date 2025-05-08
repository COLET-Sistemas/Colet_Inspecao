"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { DataCards } from "@/components/ui/cadastros/DataCards";
import { DataListContainer } from "@/components/ui/cadastros/DataListContainer";
import { DataTable } from "@/components/ui/cadastros/DataTable";
import { EmptyState } from "@/components/ui/cadastros/EmptyState";
import { FilterOption, FilterPanel, ViewMode } from "@/components/ui/cadastros/FilterPanel";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { SelectableCheckbox } from "@/components/ui/cadastros/SelectableCheckbox";
import { useApiConfig } from "@/hooks/useApiConfig";
import { useAuth } from "@/hooks/useAuth";
import { AlertState, Posto } from "@/types/cadastros/posto";
import { CheckSquare, IterationCcw, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

// Card component for list item
const Card = React.memo(({ posto, isSelected, onToggleSelect, renderKey }: {
    posto: Posto;
    isSelected: boolean;
    onToggleSelect: (posto: string) => void;
    renderKey?: number;
}) => (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all duration-300">
        <div className="p-4">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        #{posto.posto}
                    </span>
                </div>
                <SelectableCheckbox
                    id={posto.posto}
                    isSelected={isSelected}
                    onToggle={onToggleSelect}
                    renderKey={renderKey}
                />
            </div>

            <h3 className="text-base font-medium text-gray-800 mb-2 line-clamp-2">
                {posto.nome_posto}
            </h3>

            <div className="mt-3">
                <span className="text-sm text-gray-600">
                    {posto.tipo_recurso}
                </span>
            </div>
        </div>
    </div>
));

// Check if user has the required permission
const hasPermission = (permission: string): boolean => {
    try {
        // Get userData from localStorage
        const userDataStr = localStorage.getItem("userData") || sessionStorage.getItem("userData");
        if (!userDataStr) return false;

        const userData = JSON.parse(userDataStr);
        // Check if perfil_inspecao exists and contains the required permission
        if (!userData || !userData.perfil_inspecao) return false;

        return userData.perfil_inspecao.includes(permission);
    } catch (error) {
        console.error("Error checking permissions:", error);
        return false;
    }
};

export default function PostosVinculadosPage() {
    // Get user authentication data
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    // State for filters
    const [searchTerm, setSearchTerm] = useState("");
    const [tipoRecursoFilter, setTipoRecursoFilter] = useState<string>("todos");

    const [isPending, startTransition] = useTransition();

    // View toggle state
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    // State for data and loading
    const [postos, setPostos] = useState<Posto[]>([]);
    const [allData, setAllData] = useState<Posto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeFilters, setActiveFilters] = useState(0);
    const [apiError, setApiError] = useState<string | null>(null);
    const [renderCount, setRenderCount] = useState(0); // Estado para forçar renderização

    // Selected postos state
    const [selectedPostos, setSelectedPostos] = useState<Set<string>>(new Set());

    // Alert state para mensagens de sucesso
    const [alert, setAlert] = useState<AlertState>({ message: null, type: "success" });

    // ARIA Live region for screen readers
    const [notification, setNotification] = useState('');

    // Tipos de recurso únicos para o filtro
    const [tiposRecurso, setTiposRecurso] = useState<string[]>([]);

    // Utilize uma ref para controlar se a requisição já foi feita
    const dataFetchedRef = useRef(false);

    const { getAuthHeaders } = useApiConfig();

    // Chave para local storage
    const localStorageKey = 'postos-vinculados';

    const apiUrl = localStorage.getItem("apiUrl");

    // Permission check - redirect if not a manager
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            if (!hasPermission('G')) {
                setAlert({
                    message: "Você não tem permissão para acessar esta página. Redirecionando...",
                    type: "error"
                });

                // Redirect after showing the message for a moment
                const timer = setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);

                return () => clearTimeout(timer);
            }
        } else if (!authLoading && !isAuthenticated) {
            // Not authenticated, redirect to login
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    // Calculate active filters
    useEffect(() => {
        let count = 0;
        if (searchTerm) count++;
        if (tipoRecursoFilter !== "todos") count++;
        setActiveFilters(count);
    }, [searchTerm, tipoRecursoFilter]);

    // Carregar dados iniciais
    const loadData = useCallback(async () => {
        setIsLoading(true);
        setApiError(null);

        try {
            const response = await fetch(`${apiUrl}/postos`);

            if (!response.ok) {
                throw new Error(`Erro ao obter postos: ${response.status}`);
            }

            const data = await response.json();
            const postsWithId = data.map((posto: any) => ({
                ...posto,
                id: posto.posto
            }));

            setAllData(postsWithId);
            const filtered = filterData(postsWithId, searchTerm, tipoRecursoFilter);
            setPostos(filtered);

            // Extrair e ordenar os tipos de recurso em ordem alfabética
            const uniqueTiposRecurso = [...new Set(postsWithId.map((posto: Posto) => posto.tipo_recurso))].sort() as string[];
            setTiposRecurso(uniqueTiposRecurso);

            const savedSelected = localStorage.getItem(localStorageKey);
            if (savedSelected) {
                try {
                    const parsedData = JSON.parse(savedSelected);
                    const parsedSelected = new Set<string>(parsedData.map((item: unknown) => String(item)));
                    setSelectedPostos(parsedSelected);
                    setNotification(`${parsedSelected.size} postos carregados de configurações anteriores.`);
                } catch (e) {
                    console.error("Erro ao carregar postos do local storage:", e);
                }
            }

        } catch (error) {
            console.error("Erro ao buscar postos:", error);
            setApiError(`Falha ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [getAuthHeaders, searchTerm, tipoRecursoFilter, apiUrl]);

    // Função auxiliar para filtrar dados
    const filterData = (data: Posto[], search: string, tipoRecurso: string) => {
        return data.filter(item => {
            const matchesSearch = !search ||
                item.posto.toLowerCase().includes(search.toLowerCase()) ||
                item.nome_posto.toLowerCase().includes(search.toLowerCase()) ||
                item.tipo_recurso.toLowerCase().includes(search.toLowerCase());

            const matchesTipoRecurso = tipoRecurso === "todos" ||
                item.tipo_recurso === tipoRecurso;

            return matchesSearch && matchesTipoRecurso;
        });
    };

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        dataFetchedRef.current = false;
        loadData();
        setNotification("Atualizando dados...");
    }, [loadData]);

    useEffect(() => {
        // Only load data if user has proper permission
        if (dataFetchedRef.current === false && hasPermission('G')) {
            dataFetchedRef.current = true;
            loadData();
        }
    }, [loadData]);

    // Effect para filtrar dados quando os filtros mudam
    useEffect(() => {
        if (allData.length > 0) {
            startTransition(() => {
                const filtered = filterData(allData, searchTerm, tipoRecursoFilter);
                setPostos(filtered);

                if (filtered.length === 0) {
                    setNotification('Nenhum resultado encontrado para os filtros atuais.');
                } else {
                    setNotification(`${filtered.length} postos encontrados.`);
                }
            });
        }
    }, [searchTerm, tipoRecursoFilter, allData]);

    // Gerenciar a seleção de postos - com melhorias para evitar re-renders
    const handleToggleSelect = useCallback((postoId: string) => {
        setSelectedPostos(prevSelected => {
            const isCurrentlySelected = prevSelected.has(postoId);
            const newSelected = new Set(prevSelected);

            if (isCurrentlySelected) {
                newSelected.delete(postoId);
                setNotification(`Posto ${postoId} desmarcado.`);
            } else {
                newSelected.add(postoId);
                setNotification(`Posto ${postoId} marcado.`);
            }

            localStorage.setItem(localStorageKey, JSON.stringify([...newSelected]));

            return newSelected;
        });
    }, [localStorageKey]);

    // Salvar postos selecionados
    const handleSaveSelection = useCallback(() => {
        try {
            localStorage.setItem(localStorageKey, JSON.stringify([...selectedPostos]));
            setAlert({
                message: `${selectedPostos.size} postos salvos com sucesso!`,
                type: "success"
            });
            setNotification(`Seleção de ${selectedPostos.size} postos salvos.`);
        } catch (error) {
            setAlert({
                message: `Erro ao salvar postos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                type: "error"
            });
            setNotification(`Erro ao salvar postos.`);
        }
    }, [selectedPostos]);

    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setTipoRecursoFilter("todos");
        setNotification("Filtros resetados.");
    }, []);

    // Limpar alerta
    const clearAlert = useCallback(() => {
        setAlert({ message: null, type: "success" });
    }, []);

    // If auth is still loading or user doesn't have permission, show access denied
    if ((authLoading) || (!authLoading && !hasPermission('G'))) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
                <AlertMessage
                    message={alert.message}
                    type={alert.type}
                    onDismiss={clearAlert}
                    autoDismiss={true}
                    dismissDuration={5000}
                />
                {!authLoading && !hasPermission('G') && (
                    <div className="text-center">
                        <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
                        <p className="text-gray-600 mb-4">
                            Esta página está disponível apenas para usuários com permissão de Gestor.
                        </p>
                        <p className="text-gray-500 text-sm">Redirecionando para o Dashboard...</p>
                    </div>
                )}
            </div>
        );
    }

    const filterOptions = useMemo(() => {
        const tipoRecursoOptions: FilterOption[] = [
            { value: "todos", label: "Todos os tipos" },
            ...tiposRecurso.map(tipo => ({
                value: tipo,
                label: tipo,
                color: "bg-blue-100 text-blue-800"
            }))
        ];

        return [
            {
                id: "tipoRecurso",
                label: "Tipo de Recurso",
                value: tipoRecursoFilter,
                options: tipoRecursoOptions,
                onChange: setTipoRecursoFilter,
            }
        ];
    }, [tipoRecursoFilter, tiposRecurso]);

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

        if (tipoRecursoFilter !== "todos") {
            filters.push({
                id: "tipoRecurso",
                value: tipoRecursoFilter,
                label: `Tipo: ${tipoRecursoFilter}`,
                color: "bg-blue-100 text-blue-800",
            });
        }

        return filters;
    }, [searchTerm, tipoRecursoFilter]);

    const tableColumns = useMemo(() => [
        {
            key: "selecao",
            title: "Seleção",
            headerClassName: "text-center",
            isSelectable: true,
            render: (posto: Posto) => (
                <div className="flex items-center justify-center">
                    <SelectableCheckbox
                        id={posto.posto}
                        isSelected={selectedPostos.has(posto.posto)}
                        onToggle={handleToggleSelect}
                        renderKey={renderCount}
                    />
                </div>
            ),
        },
        {
            key: "posto",
            title: "Código",
            render: (posto: Posto) => (
                <span className="text-sm font-medium text-gray-900">{posto.posto}</span>
            ),
        },
        {
            key: "nome_posto",
            title: "Nome Posto",
            render: (posto: Posto) => (
                <div className="text-sm text-gray-900 max-w-md truncate">{posto.nome_posto}</div>
            ),
        },
        {
            key: "tipo_recurso",
            title: "Tipo de Recurso",
            render: (posto: Posto) => (
                <div className="text-sm text-gray-600">{posto.tipo_recurso}</div>
            ),
        },
    ], [handleToggleSelect, selectedPostos, renderCount]);

    return (
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

            {/* Page Header Component */}
            <PageHeader
                title="Postos Vinculados"
                subtitle="Seleção de postos disponíveis desse dispositivo para inspeção"
                showButton={false}
            />

            {/* Exibir contagem de postos selecionados */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <CheckSquare className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                <span className="font-medium">{selectedPostos.size} postos selecionados</span> de {allData.length} disponíveis.
                                As seleções são automaticamente salvas no navegador.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Component */}
            <FilterPanel
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Buscar por código ou nome do posto..."
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filters={filterOptions}
                activeFilters={activeFilters}
                onResetFilters={resetFilters}
                selectedFilters={selectedFiltersForDisplay}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
            />

            {/* Data Container with Dynamic View */}
            <DataListContainer
                isLoading={isLoading || isPending}
                isEmpty={postos.length === 0}
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
                            description="Não encontramos postos que correspondam aos seus filtros atuais."
                            primaryAction={{
                                label: "Limpar filtros",
                                onClick: resetFilters,
                                icon: <IterationCcw className="mr-2 h-4 w-4" />,
                                disabled: false,
                            }}
                        />
                    )
                }
                totalItems={allData.length}
                totalFilteredItems={postos.length}
                activeFilters={activeFilters}
                onResetFilters={resetFilters}
            >
                {viewMode === "table" ? (
                    <DataTable
                        data={postos}
                        columns={tableColumns}
                        renderKey={renderCount}
                    />
                ) : (
                    <DataCards
                        data={postos}
                        renderCard={(posto) => (
                            <Card
                                key={posto.posto}
                                posto={posto}
                                isSelected={selectedPostos.has(posto.posto)}
                                onToggleSelect={handleToggleSelect}
                                renderKey={renderCount}
                            />
                        )}
                    />
                )}
            </DataListContainer>
        </div>
    );
}