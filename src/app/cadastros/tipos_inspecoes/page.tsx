"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { DataCards } from "@/components/ui/cadastros/DataCards";
import { DataListContainer } from "@/components/ui/cadastros/DataListContainer";
import { DataTable } from "@/components/ui/cadastros/DataTable";
import { EmptyState } from "@/components/ui/cadastros/EmptyState";
import { FilterOption, FilterPanel, ViewMode } from "@/components/ui/cadastros/FilterPanel";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { Tooltip } from "@/components/ui/cadastros/Tooltip";
import { TipoInspecaoModal } from "@/components/ui/cadastros/modais_cadastros/TipoInspecaoModal";
import { useApiConfig } from "@/hooks/useApiConfig";
import { getTiposInspecao } from "@/services/api/tipoInspecaoService";
import { AlertState, TipoInspecao } from "@/types/cadastros/tipoInspecao";
import { motion } from "framer-motion";
import { IterationCcw, Pencil, Plus, SlidersHorizontal } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

// Card component for list item
const Card = React.memo(({ tipo, onEdit }: {
    tipo: TipoInspecao;
    onEdit: (id: string) => void;
}) => (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all duration-300">
        <div className="p-4">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        #{tipo.codigo}
                    </span>
                </div>
                <span className={`px-2 py-0.5 text-xs leading-5 font-medium rounded-full flex items-center gap-1.5 ${tipo.situacao === 'A'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                    }`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${tipo.situacao === 'A' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {tipo.situacao === 'A' ? 'Ativo' : 'Inativo'}
                </span>
            </div>

            <h3 className="text-base font-medium text-gray-800 mb-2 line-clamp-2">
                {tipo.descricao_tipo_inspecao}
            </h3>

            <div className="flex justify-between items-end mt-3">
                <div className="flex space-x-1">
                    <Tooltip text="Editar">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            className="p-1.5 rounded-md text-yellow-500 hover:bg-yellow-50 cursor-pointer"
                            onClick={() => onEdit(tipo.id)}
                            aria-label="Editar"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </motion.button>
                    </Tooltip>
                </div>
            </div>
        </div>
    </div>
));

export default function TiposInspecoesPage() {
    // State for filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("todos");

    const [isPending, startTransition] = useTransition();

    // View toggle state
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    // State for data and loading
    const [tiposInspecao, setTiposInspecao] = useState<TipoInspecao[]>([]);
    const [allData, setAllData] = useState<TipoInspecao[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeFilters, setActiveFilters] = useState(0);
    const [apiError, setApiError] = useState<string | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTipoInspecao, setSelectedTipoInspecao] = useState<TipoInspecao | undefined>(undefined);

    // Alert state para mensagens de sucesso fora do modal
    const [alert, setAlert] = useState<AlertState>({ message: null, type: "success" });

    // ARIA Live region for screen readers
    const [notification, setNotification] = useState('');

    // Utilize uma ref para controlar se a requisição já foi feita
    const dataFetchedRef = useRef(false);

    const { getAuthHeaders } = useApiConfig();

    // Calculate active filters
    useEffect(() => {
        let count = 0;
        if (searchTerm) count++;
        if (statusFilter !== "todos") count++;
        setActiveFilters(count);
    }, [searchTerm, statusFilter]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setApiError(null);

        try {
            const data = await getTiposInspecao(getAuthHeaders());
            setAllData(data);
        } catch (error) {
            console.error("Erro ao buscar tipos de inspeção:", error);
            setApiError(`Falha ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [getAuthHeaders]);

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
                // Filtrar usando função memoizada para melhor performance
                const filterData = () => {
                    // Só realizar filtragem se houver filtros ativos
                    if (!searchTerm && statusFilter === "todos") {
                        return allData;
                    }

                    return allData.filter(item => {
                        // Verificar texto de busca
                        const matchesSearch = !searchTerm ||
                            item.descricao_tipo_inspecao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.codigo.toLowerCase().includes(searchTerm.toLowerCase());

                        // Verificar filtro de status
                        const matchesStatus = statusFilter === "todos" || item.situacao === statusFilter;

                        return matchesSearch && matchesStatus;
                    });
                };

                const filtered = filterData();
                setTiposInspecao(filtered);

                // Notifications for screen readers
                if (filtered.length === 0) {
                    setNotification('Nenhum resultado encontrado para os filtros atuais.');
                } else {
                    setNotification(`${filtered.length} tipos de inspeção encontrados.`);
                }
            });
        }
    }, [searchTerm, statusFilter, allData]);

    const handleEdit = useCallback((id: string) => {
        const tipoToEdit = allData.find(tipo => tipo.id === id);
        if (tipoToEdit) {
            setSelectedTipoInspecao(tipoToEdit);
            setIsModalOpen(true);
            setNotification(`Iniciando edição do tipo de inspeção ${id}.`);
        }
    }, [allData]);

    const handleModalSuccess = useCallback(async (data: any) => {
        if (selectedTipoInspecao) {
            try {
                // Criar objeto com dados atualizados
                const updatedTipoInspecao: TipoInspecao = {
                    id: selectedTipoInspecao.id,
                    descricao_tipo_inspecao: data.descricao_tipo_inspecao,
                    situacao: data.situacao,
                    codigo: data.codigo || selectedTipoInspecao.codigo
                };

                // Criando uma função de atualização para evitar inconsistências de estado
                const updateItem = (item: TipoInspecao) =>
                    item.id === selectedTipoInspecao.id
                        ? updatedTipoInspecao
                        : item;

                // Atualiza o item em ambas as listas de forma consistente
                setTiposInspecao(prev => prev.map(updateItem));
                setAllData(prev => prev.map(updateItem));

                // Mostrar mensagem de sucesso na página
                setAlert({
                    message: `Tipo de inspeção ${data.codigo || selectedTipoInspecao.id} atualizado com sucesso!`,
                    type: "success"
                });

                // Para leitores de tela
                setNotification(`Tipo de inspeção ${data.codigo || selectedTipoInspecao.id} atualizado com sucesso.`);
            } catch (error) {
                console.error("Erro ao atualizar tipo de inspeção:", error);
                setAlert({
                    message: error instanceof Error ? error.message : "Erro ao atualizar tipo de inspeção",
                    type: "error"
                });
                setNotification(`Erro ao atualizar tipo de inspeção: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
            }
        }
    }, [selectedTipoInspecao, getAuthHeaders]);

    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setStatusFilter("todos");
        setNotification("Filtros resetados.");
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setTimeout(() => {
            setSelectedTipoInspecao(undefined);
        }, 200);
    }, []);

    // Limpar alerta
    const clearAlert = useCallback(() => {
        setAlert({ message: null, type: "success" });
    }, []);

    const filterOptions = useMemo(() => {
        const statusOptions: FilterOption[] = [
            { value: "todos", label: "Todos os status" },
            { value: "A", label: "Ativos", color: "bg-green-100 text-green-800" },
            { value: "I", label: "Inativos", color: "bg-red-100 text-red-800" },
        ];

        return [
            {
                id: "status",
                label: "Status",
                value: statusFilter,
                options: statusOptions,
                onChange: setStatusFilter,
            },
        ];
    }, [statusFilter]);

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

        if (statusFilter !== "todos") {
            filters.push({
                id: "status",
                value: statusFilter,
                label: statusFilter === "A" ? "Ativos" : "Inativos",
                color: statusFilter === "A"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800",
            });
        }

        return filters;
    }, [searchTerm, statusFilter]);

    const tableColumns = useMemo(() => [
        {
            key: "codigo",
            title: "ID",
            render: (tipo: TipoInspecao) => (
                <span className="text-sm font-medium text-gray-900">#{tipo.id}</span>
            ),
        },
        {
            key: "descricao",
            title: "Descrição",
            render: (tipo: TipoInspecao) => (
                <div className="text-sm text-gray-900 max-w-md truncate">{tipo.descricao_tipo_inspecao}</div>
            ),
        },
        {
            key: "status",
            title: "Status",
            render: (tipo: TipoInspecao) => (
                <span className={`px-2 py-1 inline-flex items-center gap-1.5 text-xs leading-5 font-semibold rounded-full ${tipo.situacao === 'A'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${tipo.situacao === 'A' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {tipo.situacao === 'A' ? 'Ativo' : 'Inativo'}
                </span>
            ),
        },
        {
            key: "acoes",
            title: "Ações",
            render: (tipo: TipoInspecao) => (
                <div className="flex items-center justify-end gap-2">
                    <Tooltip text="Editar">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="text-yellow-500 hover:bg-yellow-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:ring-offset-1 rounded p-1 cursor-pointer"
                            onClick={() => handleEdit(tipo.id)}
                            aria-label="Editar"
                        >
                            <Pencil className="h-4 w-4" />
                        </motion.button>
                    </Tooltip>
                </div>
            ),
        },
    ], [handleEdit]);

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

            {/* Modal de Tipo de Inspeção */}
            {selectedTipoInspecao && (
                <TipoInspecaoModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    tipoInspecao={selectedTipoInspecao}
                    onSuccess={handleModalSuccess}
                    onError={(errorMessage) => {
                        setAlert({
                            message: errorMessage,
                            type: "error"
                        });
                        setNotification(`Erro: ${errorMessage}`);
                    }}
                />
            )}

            {/* Page Header Component - botão de criar desabilitado */}
            <PageHeader
                title="Tipos de Inspeções"
                subtitle="Consulta e edição de tipos de inspeção"
                buttonLabel="Novo Tipo de Inspeção"
                buttonDisabled={true}
                showButton={true}
            />

            {/* Filters Component */}
            <FilterPanel
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Buscar por código ou descrição..."
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
                isEmpty={tiposInspecao.length === 0}
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
                            description="Não encontramos tipos de inspeção que correspondam aos seus filtros atuais."
                            primaryAction={{
                                label: "Novo Tipo de Inspeção",
                                onClick: () => { },
                                icon: <Plus className="mr-2 h-4 w-4" />,
                                disabled: true,
                            }}
                            secondaryAction={{
                                label: "Limpar filtros",
                                onClick: resetFilters,
                            }}
                        />
                    )
                }
                totalItems={allData.length}
                totalFilteredItems={tiposInspecao.length}
                activeFilters={activeFilters}
                onResetFilters={resetFilters}
            >
                {viewMode === "table" ? (
                    <DataTable data={tiposInspecao} columns={tableColumns} />
                ) : (
                    <DataCards
                        data={tiposInspecao}
                        renderCard={(tipo) => (
                            <Card
                                key={tipo.id}
                                tipo={tipo}
                                onEdit={handleEdit}
                            />
                        )}
                    />
                )}
            </DataListContainer>
        </div>
    );
}
