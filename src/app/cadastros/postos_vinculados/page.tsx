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
import { CheckSquare, IterationCcw, SlidersHorizontal } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

// Interface para os dados de postos
interface Posto {
    posto: string;
    nome_posto: string;
    codigo_parada: string;
    descricao_parada: string;
    tipo_recurso: string;
    id: string;
}

// Interface para o estado de alerta
interface AlertState {
    message: string | null;
    type: 'success' | 'error' | 'warning' | 'info';
}

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
                <span className="text-sm text-gray-600">
                    {posto.tipo_recurso}
                </span>
            </div>
        </div>
    </div>
));

export default function PostosVinculadosPage() {
    // State for filters
    const [searchTerm, setSearchTerm] = useState("");
    const [tipoRecursoFilter, setTipoRecursoFilter] = useState<string>("todos");

    const [isPending, startTransition] = useTransition();

    // Contador de renderização para forçar atualizações
    const [renderCount, setRenderCount] = useState(0);

    // View toggle state
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    // State for data and loading
    const [postos, setPostos] = useState<Posto[]>([]);
    const [allData, setAllData] = useState<Posto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeFilters, setActiveFilters] = useState(0);
    const [apiError, setApiError] = useState<string | null>(null);

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
            // Correção: Usar a configuração de API do projeto em vez de URL hardcoded
            const response = await fetch('http://10.0.0.151:8080/postos');

            if (!response.ok) {
                throw new Error(`Erro ao obter postos: ${response.status}`);
            }

            const data = await response.json();
            // Adicionar o campo id aos postos para compatibilidade com os componentes
            const postsWithId = data.map((posto: any) => ({
                ...posto,
                id: posto.posto // Usando o campo posto como id
            }));

            setAllData(postsWithId);
            // Aplicar os mesmos filtros aos dados quando carregados
            const filtered = filterData(postsWithId, searchTerm, tipoRecursoFilter);
            setPostos(filtered);

            // Extrair tipos de recurso únicos para o filtro
            const uniqueTiposRecurso = [...new Set(postsWithId.map((posto: Posto) => posto.tipo_recurso))] as string[];
            setTiposRecurso(uniqueTiposRecurso);

            // Carregar postos selecionados do local storage
            const savedSelected = localStorage.getItem(localStorageKey);
            if (savedSelected) {
                try {
                    const parsedData = JSON.parse(savedSelected);
                    // Garantir que todos os valores são strings
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
    }, [getAuthHeaders, searchTerm, tipoRecursoFilter]);

    // Função auxiliar para filtrar dados
    const filterData = (data: Posto[], search: string, tipoRecurso: string) => {
        if (!search && tipoRecurso === "todos") {
            return data;
        }

        return data.filter(item => {
            // Verificar texto de busca
            const matchesSearch = !search ||
                item.posto.toLowerCase().includes(search.toLowerCase()) ||
                item.nome_posto.toLowerCase().includes(search.toLowerCase()) ||
                item.tipo_recurso.toLowerCase().includes(search.toLowerCase());

            // Verificar filtro de tipo de recurso
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
        if (dataFetchedRef.current === false) {
            dataFetchedRef.current = true;
            loadData();
        }
    }, [loadData]);

    // Effect para filtrar dados quando os filtros mudam
    useEffect(() => {
        if (allData.length > 0) {
            // Usar startTransition para não bloquear a UI durante filtragens pesadas
            startTransition(() => {
                const filtered = filterData(allData, searchTerm, tipoRecursoFilter);
                setPostos(filtered);

                // Notifications for screen readers
                if (filtered.length === 0) {
                    setNotification('Nenhum resultado encontrado para os filtros atuais.');
                } else {
                    setNotification(`${filtered.length} postos encontrados.`);
                }
            });
        }
    }, [searchTerm, tipoRecursoFilter, allData]);

    // Gerenciar a seleção de postos
    const handleToggleSelect = useCallback((postoId: string) => {
        // Usando uma abordagem direta com array para garantir que o React detecte a mudança
        setSelectedPostos(prevSelected => {
            // Convertemos o Set para array para manipulação
            const prevArray = Array.from(prevSelected);

            if (prevSelected.has(postoId)) {
                // Se já está selecionado, remove
                const newArray = prevArray.filter(id => id !== postoId);
                setNotification(`Posto ${postoId} desmarcado.`);

                // Salvar no local storage
                localStorage.setItem(localStorageKey, JSON.stringify(newArray));

                // Retorna um novo Set baseado no array filtrado
                return new Set(newArray);
            } else {
                // Se não está selecionado, adiciona
                const newArray = [...prevArray, postoId];
                setNotification(`Posto ${postoId} marcado.`);

                // Salvar no local storage
                localStorage.setItem(localStorageKey, JSON.stringify(newArray));

                // Retorna um novo Set baseado no array com o novo elemento
                return new Set(newArray);
            }
        });


        // Esta é uma solução temporária que força um re-render
        setTimeout(() => {
            setRenderCount(prev => prev + 1);
        }, 0);
    }, [localStorageKey, renderCount]);

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
            },
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
    ], [handleToggleSelect, selectedPostos]);

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
                        renderKey={renderCount} // Passando o renderCount como renderKey
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
                            />
                        )}
                    />
                )}
            </DataListContainer>
        </div>
    );
}