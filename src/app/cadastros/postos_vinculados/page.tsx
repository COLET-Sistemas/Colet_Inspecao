"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { DataCards } from "@/components/ui/cadastros/DataCards";
import { DataListContainer } from "@/components/ui/cadastros/DataListContainer";
import { DataTable } from "@/components/ui/cadastros/DataTable";
import { EmptyState } from "@/components/ui/cadastros/EmptyState";
import { FilterOption, FilterPanel, ViewMode } from "@/components/ui/cadastros/FilterPanel";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { SelectableCheckbox } from "@/components/ui/cadastros/SelectableCheckbox";
import { RestrictedAccess } from "@/components/ui/RestrictedAccess";
import { useAuth } from "@/hooks/useAuth";
import { fetchWithAuth } from "@/services/api/authInterceptor";
import { AlertState, Posto } from "@/types/cadastros/posto";
import { CheckSquare, IterationCcw, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

// Card component for list item
const Card = React.memo(({ posto, isSelected, onToggleSelect }: {
    posto: Posto;
    isSelected: boolean;
    onToggleSelect: (posto: string) => void;
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
                />
            </div>
            <h3 className="text-base font-medium text-gray-800 mb-2 line-clamp-2">
                {posto.nome_posto}
            </h3>
            <div className="mt-3">
                <span className="text-sm text-gray-600">{posto.tipo_recurso}</span>
            </div>
        </div>
    </div>
));
Card.displayName = 'PostoCard';

const hasPermission = (permission: string): boolean => {
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

export default function PostosVinculadosPage() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [tipoRecursoFilter, setTipoRecursoFilter] = useState<string>("todos");
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [postos, setPostos] = useState<Posto[]>([]);
    const [allData, setAllData] = useState<Posto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeFilters, setActiveFilters] = useState(0);
    const [apiError, setApiError] = useState<string | null>(null);
    const [selectedPostos, setSelectedPostos] = useState<Set<string>>(new Set());
    const [alert, setAlert] = useState<AlertState>({ message: null, type: "success" });
    const [notification, setNotification] = useState("");
    const [tiposRecurso, setTiposRecurso] = useState<string[]>([]);
    const dataFetchedRef = useRef(false);
    const localStorageKey = 'postos-vinculados';
    const apiUrl = localStorage.getItem("apiUrl");

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        let count = 0;
        if (searchTerm) count++;
        if (tipoRecursoFilter !== "todos") count++;
        setActiveFilters(count);
    }, [searchTerm, tipoRecursoFilter]);

    const filterData = useCallback((data: Posto[], search: string, tipoRecurso: string) => {
        return data.filter(item => {
            const matchesSearch = !search ||
                item.posto.toLowerCase().includes(search.toLowerCase()) ||
                item.nome_posto.toLowerCase().includes(search.toLowerCase()) ||
                item.tipo_recurso.toLowerCase().includes(search.toLowerCase());
            const matchesTipoRecurso = tipoRecurso === "todos" || item.tipo_recurso === tipoRecurso;
            return matchesSearch && matchesTipoRecurso;
        });
    }, []);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setApiError(null); try {
            const response = await fetchWithAuth(`${apiUrl}/postos`);
            if (!response.ok) throw new Error(`Erro ao obter postos: ${response.status}`);
            const data = await response.json();
            const postsWithId = data.map((posto: Omit<Posto, 'id'>) => ({ ...posto, id: posto.posto }));
            setAllData(postsWithId);
            setPostos(filterData(postsWithId, searchTerm, tipoRecursoFilter));
            setTiposRecurso([...new Set(postsWithId.map((posto: Posto) => posto.tipo_recurso))].sort() as string[]);
            const savedSelected = localStorage.getItem(localStorageKey);
            if (savedSelected) {
                try {
                    const parsedData = JSON.parse(savedSelected);
                    const parsedSelected = new Set<string>(parsedData.map((item: unknown) => String(item)));
                    setSelectedPostos(parsedSelected);
                    setNotification(`${parsedSelected.size} postos carregados de configurações anteriores.`);
                } catch { }
            }
        } catch (error) {
            setApiError(`Falha ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [searchTerm, tipoRecursoFilter, apiUrl, filterData]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        dataFetchedRef.current = false;
        loadData();
        setNotification("Atualizando dados...");
    }, [loadData]);

    useEffect(() => {
        if (dataFetchedRef.current === false && hasPermission('G')) {
            dataFetchedRef.current = true;
            loadData();
        }
    }, [loadData]);

    useEffect(() => {
        if (allData.length > 0) {
            startTransition(() => {
                const filtered = filterData(allData, searchTerm, tipoRecursoFilter);
                setPostos(filtered);
                setNotification(filtered.length === 0 ? 'Nenhum resultado encontrado para os filtros atuais.' : `${filtered.length} postos encontrados.`);
            });
        }
    }, [searchTerm, tipoRecursoFilter, allData, filterData]);

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

    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setTipoRecursoFilter("todos");
        setNotification("Filtros resetados.");
    }, []);

    const clearAlert = useCallback(() => {
        setAlert({ message: null, type: "success" });
    }, []);

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
        if (searchTerm) filters.push({
            id: "search",
            value: searchTerm,
            label: `Pesquisa: "${searchTerm}"`,
            color: "bg-purple-100 text-purple-800",
        });
        if (tipoRecursoFilter !== "todos") filters.push({
            id: "tipoRecurso",
            value: tipoRecursoFilter,
            label: `Tipo: ${tipoRecursoFilter}`,
            color: "bg-blue-100 text-blue-800",
        });
        return filters;
    }, [searchTerm, tipoRecursoFilter]);

    const tableColumns = useMemo(() => [
        {
            key: "selecao",
            title: "Seleção",
            headerClassName: "text-center",
            isSelectable: true,
            render: (item: { id: string | number }) => {
                const posto = item as Posto;
                return (
                    <div className="flex items-center justify-center">
                        <SelectableCheckbox
                            id={posto.posto}
                            isSelected={selectedPostos.has(posto.posto)}
                            onToggle={handleToggleSelect}
                        />
                    </div>
                );
            },
        },
        {
            key: "posto",
            title: "Código",
            render: (item: { id: string | number }) => {
                const posto = item as Posto;
                return <span className="text-sm font-medium text-gray-900">{posto.posto}</span>;
            },
        },
        {
            key: "nome_posto",
            title: "Nome Posto",
            render: (item: { id: string | number }) => {
                const posto = item as Posto;
                return <div className="text-sm text-gray-900 max-w-md truncate">{posto.nome_posto}</div>;
            },
        },
        {
            key: "tipo_recurso",
            title: "Tipo de Recurso",
            render: (item: { id: string | number }) => {
                const posto = item as Posto;
                return <div className="text-sm text-gray-600">{posto.tipo_recurso}</div>;
            },
        },
    ], [handleToggleSelect, selectedPostos]);

    if (authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
                <p className="text-gray-500">Carregando...</p>
            </div>
        );
    }

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
        <div className="space-y-5 p-2 sm:p-4 md:p-6 mx-auto">
            <div className="sr-only" role="status" aria-live="polite">
                {notification}
            </div>
            <AlertMessage
                message={alert.message}
                type={alert.type}
                onDismiss={clearAlert}
                autoDismiss
                dismissDuration={5000}
            />
            <PageHeader
                title="Postos Vinculados"
                subtitle="Seleção de postos disponíveis desse dispositivo para inspeção"
                showButton={false}
            />
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
                    />
                ) : (
                    <DataCards
                        data={postos}
                        itemsPerRow={4}
                        renderCard={(posto) => (
                            <Card
                                key={posto.posto}
                                posto={posto}
                                isSelected={selectedPostos.has(posto.posto)}
                                onToggleSelect={handleToggleSelect}
                            />
                        )}
                    />
                )}
            </DataListContainer>
        </div>
    );
}