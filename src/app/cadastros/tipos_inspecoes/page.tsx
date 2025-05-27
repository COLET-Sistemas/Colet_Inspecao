"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { DataCards } from "@/components/ui/cadastros/DataCards";
import { DataListContainer } from "@/components/ui/cadastros/DataListContainer";
import { DataTable } from "@/components/ui/cadastros/DataTable";
import { EmptyState } from "@/components/ui/cadastros/EmptyState";
import { FilterPanel, ViewMode } from "@/components/ui/cadastros/FilterPanel";
import { TipoInspecaoModal } from "@/components/ui/cadastros/modais_cadastros/TipoInspecaoModal";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { Tooltip } from "@/components/ui/cadastros/Tooltip";
import { RestrictedAccess } from "@/components/ui/RestrictedAccess";
import { useApiConfig } from "@/hooks/useApiConfig";
import { getTiposInspecao } from "@/services/api/tipoInspecaoService";
import { AlertState, TipoInspecao } from "@/types/cadastros/tipoInspecao";
import { motion } from "framer-motion";
import {
    IterationCcw,
    Pencil,
    Plus,
    SlidersHorizontal
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

// Tipos para melhor tipagem
interface CardProps {
    tipo: TipoInspecao;
    onEdit: (id: string) => void;
}

// Card component otimizado com melhor responsividade e animações
const TipoInspecaoCard = memo<CardProps>(({ tipo, onEdit }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{
            y: -2,
            boxShadow:
                "0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        }}
        className="group bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
        <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200">
                        #{tipo.codigo}
                    </span>
                </div>
                <div
                    className={`px-2 py-1 inline-flex items-center gap-1.5 text-xs leading-5 font-semibold rounded-full ${tipo.situacao === "A"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                >
                    <span
                        className={`inline-block w-2 h-2 rounded-full ${tipo.situacao === "A" ? "bg-green-500" : "bg-red-500"
                            }`}
                    ></span>
                    {tipo.situacao === "A" ? "Ativo" : "Inativo"}
                </div>
            </div>
            <div className="mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 leading-tight line-clamp-2 group-hover:text-gray-900 transition-colors duration-200">
                    {tipo.descricao_tipo_inspecao}
                </h3>
            </div>
            <div className="flex items-center justify-end pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-1"
                        onClick={() => onEdit(tipo.id)}
                        aria-label={`Editar ${tipo.descricao_tipo_inspecao}`}
                    >
                        <Pencil className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>
        </div>
    </motion.div>
));
TipoInspecaoCard.displayName = "TipoInspecaoCard";

// Função de permissão otimizada
const hasPermission = (permission: string): boolean => {
    try {
        const userDataStr = localStorage.getItem("userData") || sessionStorage.getItem("userData");
        if (!userDataStr) return false;
        const userData = JSON.parse(userDataStr);
        return !!userData?.perfil_inspecao?.includes(permission);
    } catch {
        return false;
    }
};

export default function TiposInspecoesPage() {
    // Estados
    const [authLoading, setAuthLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("todos");
    const [activeFilters, setActiveFilters] = useState(0);
    const [tiposInspecao, setTiposInspecao] = useState<TipoInspecao[]>([]);
    const [allData, setAllData] = useState<TipoInspecao[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTipoInspecao, setSelectedTipoInspecao] = useState<TipoInspecao | undefined>(undefined);
    const [alert, setAlert] = useState<AlertState>({ message: null, type: "success" });
    const [notification, setNotification] = useState("");
    const [isPending, startTransition] = useTransition();
    const dataFetchedRef = useRef(false);
    const { getAuthHeaders } = useApiConfig();

    // Carregar dados
    const loadData = useCallback(async () => {
        setIsLoading(true);
        setApiError(null);
        try {
            const data = await getTiposInspecao(getAuthHeaders());
            setAllData(data);
        } catch (error) {
            setApiError(`Falha ao carregar dados: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
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
        if (!dataFetchedRef.current) {
            dataFetchedRef.current = true;
            loadData();
        }
    }, [loadData]);

    useEffect(() => {
        setHasAccess(hasPermission("G"));
        setAuthLoading(false);
    }, []);

    useEffect(() => {
        let count = 0;
        if (searchTerm) count++;
        if (statusFilter !== "todos") count++;
        setActiveFilters(count);
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        if (allData.length > 0) {
            startTransition(() => {
                const filtered = allData.filter((item) => {
                    const matchesSearch =
                        !searchTerm ||
                        item.descricao_tipo_inspecao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.codigo.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesStatus = statusFilter === "todos" || item.situacao === statusFilter;
                    return matchesSearch && matchesStatus;
                });
                setTiposInspecao(filtered);
                setNotification(
                    filtered.length === 0
                        ? "Nenhum resultado encontrado para os filtros atuais."
                        : `${filtered.length} tipos de inspeção encontrados.`
                );
            });
        }
    }, [searchTerm, statusFilter, allData]);

    const handleEdit = useCallback(
        (id: string) => {
            const tipoToEdit = allData.find((tipo) => tipo.id === id);
            if (tipoToEdit) {
                setSelectedTipoInspecao(tipoToEdit);
                setIsModalOpen(true);
                setNotification(`Iniciando edição do tipo de inspeção ${id}.`);
            }
        },
        [allData]
    );

    const handleModalSuccess = useCallback(
        async (data: Pick<TipoInspecao, "descricao_tipo_inspecao" | "situacao"> & { codigo?: string }) => {
            if (selectedTipoInspecao) {
                const updatedTipoInspecao: TipoInspecao = {
                    id: selectedTipoInspecao.id,
                    descricao_tipo_inspecao: data.descricao_tipo_inspecao,
                    situacao: data.situacao,
                    codigo: data.codigo || selectedTipoInspecao.codigo,
                };
                const updateItem = (item: TipoInspecao) =>
                    item.id === selectedTipoInspecao.id ? updatedTipoInspecao : item;
                setTiposInspecao((prev) => prev.map(updateItem));
                setAllData((prev) => prev.map(updateItem));
                setAlert({
                    message: `Tipo de inspeção ${data.codigo || selectedTipoInspecao.id} atualizado com sucesso!`,
                    type: "success",
                });
                setNotification(`Tipo de inspeção ${data.codigo || selectedTipoInspecao.id} atualizado com sucesso.`);
            }
        },
        [selectedTipoInspecao]
    );

    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setStatusFilter("todos");
        setNotification("Filtros resetados.");
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedTipoInspecao(undefined), 200);
    }, []);

    const clearAlert = useCallback(() => setAlert({ message: null, type: "success" }), []);

    // Corrigir o tipo de filterOptions para corresponder ao esperado pelo FilterPanel
    const filterOptions = useMemo(
        () => [
            {
                id: "status",
                label: "Status",
                value: statusFilter,
                options: [
                    { value: "todos", label: "Todos os status" },
                    { value: "A", label: "Ativos", color: "bg-green-100 text-green-800" },
                    { value: "I", label: "Inativos", color: "bg-red-100 text-red-800" },
                ],
                onChange: setStatusFilter as (value: string) => void,
            },
        ],
        [statusFilter]
    );

    const selectedFiltersForDisplay = useMemo(
        () => {
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
                    color:
                        statusFilter === "A"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800",
                });
            }
            return filters;
        },
        [searchTerm, statusFilter]
    );

    const tableColumns = useMemo(
        () => [
            {
                key: "codigo",
                title: "ID",
                render: (item: { id: string | number }) => {
                    const tipo = item as TipoInspecao;
                    return <span className="text-sm font-medium text-gray-900">#{tipo.id}</span>;
                },
            },
            {
                key: "descricao",
                title: "Descrição",
                render: (item: { id: string | number }) => {
                    const tipo = item as TipoInspecao;
                    return <div className="text-sm text-gray-900 max-w-md truncate">{tipo.descricao_tipo_inspecao}</div>;
                },
            },
            {
                key: "status",
                title: "Status",
                render: (item: { id: string | number }) => {
                    const tipo = item as TipoInspecao;
                    return (
                        <span
                            className={`px-2 py-1 inline-flex items-center gap-1.5 text-xs leading-5 font-semibold rounded-full ${tipo.situacao === "A"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                        >
                            <span
                                className={`inline-block w-2 h-2 rounded-full ${tipo.situacao === "A" ? "bg-green-500" : "bg-red-500"
                                    }`}
                            ></span>
                            {tipo.situacao === "A" ? "Ativo" : "Inativo"}
                        </span>
                    );
                },
            },
            {
                key: "acoes",
                title: "Ações",
                render: (item: { id: string | number }) => {
                    const tipo = item as TipoInspecao;
                    return (
                        <div className="flex items-center justify-end gap-2">
                            <Tooltip text="Editar">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-1 cursor-pointer"
                                    onClick={() => handleEdit(tipo.id)}
                                    aria-label="Editar"
                                >
                                    <Pencil className="h-4 w-4" />
                                </motion.button>
                            </Tooltip>
                        </div>
                    );
                },
            },
        ],
        [handleEdit]
    );

    if (!hasAccess && !authLoading) {
        return (
            <RestrictedAccess
                hasPermission={hasAccess}
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
            {selectedTipoInspecao && (
                <TipoInspecaoModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    tipoInspecao={selectedTipoInspecao}
                    onSuccess={handleModalSuccess}
                    onError={(errorMessage) => {
                        setAlert({ message: errorMessage, type: "error" });
                        setNotification(`Erro: ${errorMessage}`);
                    }}
                />
            )}
            <PageHeader
                title="Tipos de Inspeções"
                subtitle="Consulta e edição de tipos de inspeção"
                buttonLabel="Novo Tipo de Inspeção"
                buttonDisabled
                showButton
            />
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
                            <TipoInspecaoCard key={tipo.id} tipo={tipo} onEdit={handleEdit} />
                        )}
                    />
                )}
            </DataListContainer>
        </div>
    );
}
