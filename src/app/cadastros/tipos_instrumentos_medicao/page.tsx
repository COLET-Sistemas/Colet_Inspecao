"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { DataCards } from "@/components/ui/cadastros/DataCards";
import { DataListContainer } from "@/components/ui/cadastros/DataListContainer";
import { DataTable } from "@/components/ui/cadastros/DataTable";
import { EmptyState } from "@/components/ui/cadastros/EmptyState";
import { FilterPanel, ViewMode } from "@/components/ui/cadastros/FilterPanel";
import { ConfirmDeleteModal } from "@/components/ui/cadastros/modais_cadastros/ConfirmDeleteModal";
import { TipoInstrumentoMedicaoModal } from "@/components/ui/cadastros/modais_cadastros/TipoInstrumentoMedicaoModal";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { Tooltip } from "@/components/ui/cadastros/Tooltip";
import { RestrictedAccess } from "@/components/ui/RestrictedAccess";
import { useApiConfig } from "@/hooks/useApiConfig";
import { deleteTipoInstrumentoMedicao, getTiposInstrumentosMedicao } from "@/services/api/tipoInstrumentoMedicaoService";
import { AlertState, TipoInstrumentoMedicao } from "@/types/cadastros/tipoInstrumentoMedicao";
import { motion } from "framer-motion";
import { IterationCcw, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

// Card component for list item
const Card = React.memo(({ tipo, onEdit, onDelete }: {
    tipo: TipoInstrumentoMedicao;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}) => (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all duration-300">
        <div className="p-4">
            <h3 className="text-base font-medium text-gray-800 mb-2 line-clamp-2">
                {tipo.nome_tipo_instrumento}
            </h3>
            {tipo.observacao && (
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                    {tipo.observacao}
                </p>
            )}
            <div className="flex justify-between items-end mt-3">
                <div className="flex flex-col space-y-1" />
                <div className="flex space-x-1">
                    <Tooltip text="Editar">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-1"
                            onClick={() => onEdit(tipo.id)}
                            aria-label="Editar"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </motion.button>
                    </Tooltip>
                    <Tooltip text="Excluir">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-1"
                            onClick={() => onDelete(tipo.id)}
                            aria-label="Excluir"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
                    </Tooltip>
                </div>
            </div>
        </div>
    </div>
));

Card.displayName = 'TipoInstrumentoMedicaoCard';

// Check if user has the required permission
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

export default function TiposInstrumentosMedicaoPage() {
    // Estados relacionados a autenticação
    const [authLoading, setAuthLoading] = useState(true);
    const [hasManagerPermission, setHasManagerPermission] = useState(false);
    // State for filters
    const [searchTerm, setSearchTerm] = useState("");
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [tiposInstrumentosMedicao, setTiposInstrumentosMedicao] = useState<TipoInstrumentoMedicao[]>([]);
    const [allData, setAllData] = useState<TipoInstrumentoMedicao[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeFilters, setActiveFilters] = useState(0);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTipoInstrumentoMedicao, setSelectedTipoInstrumentoMedicao] = useState<TipoInstrumentoMedicao | undefined>(undefined);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [alert, setAlert] = useState<AlertState>({ message: null, type: "success" });
    const [notification, setNotification] = useState("");
    const dataFetchedRef = useRef(false);
    const { getAuthHeaders } = useApiConfig();

    // Check authentication status when component mounts
    useEffect(() => {
        const hasPermissionResult = hasPermission("G");
        setHasManagerPermission(hasPermissionResult);
        setAuthLoading(false);
    }, []);

    // Count active filters
    useEffect(() => {
        setActiveFilters(searchTerm ? 1 : 0);
    }, [searchTerm]);

    // Load data
    const loadData = useCallback(async () => {
        setIsLoading(true);
        setApiError(null);
        try {
            const data = await getTiposInstrumentosMedicao(getAuthHeaders());
            setAllData(data);
        } catch (error) {
            setApiError(`Falha ao carregar dados: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [getAuthHeaders]);

    // Refresh handler
    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        dataFetchedRef.current = false;
        loadData();
        setNotification("Atualizando dados...");
    }, [loadData]);

    // Initial data load
    useEffect(() => {
        if (!dataFetchedRef.current) {
            dataFetchedRef.current = true;
            loadData();
        }
    }, [loadData]);

    // Filter data
    useEffect(() => {
        startTransition(() => {
            if (!searchTerm) {
                setTiposInstrumentosMedicao(allData);
            } else {
                setTiposInstrumentosMedicao(
                    allData.filter(item =>
                        item.nome_tipo_instrumento.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.observacao && item.observacao.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                );
            }
        });
    }, [searchTerm, allData]);

    // Edit handler
    const handleEdit = useCallback((id: number) => {
        const tipoToEdit = tiposInstrumentosMedicao.find(tipo => tipo.id === id);
        if (tipoToEdit) {
            setSelectedTipoInstrumentoMedicao(tipoToEdit);
            setIsModalOpen(true);
            setNotification("");
        }
    }, [tiposInstrumentosMedicao]);

    // Delete handler
    const handleDelete = useCallback((id: number) => {
        setDeletingId(id);
        setIsDeleteModalOpen(true);
        setNotification("");
    }, []);

    // Confirm delete
    const confirmDelete = useCallback(async () => {
        if (deletingId === null) return;
        setIsDeleting(true);
        setNotification("");
        try {
            await deleteTipoInstrumentoMedicao(deletingId, getAuthHeaders());
            await loadData();
            setIsDeleteModalOpen(false);
            setAlert({ message: `Tipo de instrumento de medição excluído com sucesso!`, type: "success" });
        } catch (error) {
            setIsDeleteModalOpen(false);
            setAlert({ message: error instanceof Error ? error.message : "Erro desconhecido ao excluir o registro", type: "error" });
        } finally {
            setIsDeleting(false);
            setDeletingId(null);
        }
    }, [deletingId, getAuthHeaders, loadData]);

    // Close delete modal
    const handleCloseDeleteModal = useCallback(() => {
        setIsDeleteModalOpen(false);
        setDeletingId(null);
        setNotification("");
    }, []);

    // Create new handler
    const handleCreateNew = useCallback(() => {
        setSelectedTipoInstrumentoMedicao(undefined);
        setIsModalOpen(true);
    }, []);

    // Modal success handler
    const handleModalSuccess = useCallback(async (data: TipoInstrumentoMedicao) => {
        if (selectedTipoInstrumentoMedicao) {
            setTiposInstrumentosMedicao(prev => prev.map(item => item.id === data.id ? data : item));
            setAllData(prev => prev.map(item => item.id === data.id ? data : item));
            setAlert({ message: `Tipo de instrumento de medição ${data.id} atualizado com sucesso!`, type: "success" });
        } else {
            try {
                await loadData();
                setAlert({ message: `Novo tipo de instrumento de medição criado com sucesso!`, type: "success" });
            } catch {
                setTiposInstrumentosMedicao(prev => [...prev, data]);
                setAllData(prev => [...prev, data]);
                setAlert({ message: `Item criado com sucesso, mas houve um erro ao atualizar a lista.`, type: "warning" });
            }
        }
    }, [selectedTipoInstrumentoMedicao, loadData]);

    // Reset filters
    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setNotification("");
    }, []);

    // Close modal
    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedTipoInstrumentoMedicao(undefined), 200);
    }, []);

    // Clear alert
    const clearAlert = useCallback(() => {
        setAlert({ message: null, type: "success" });
    }, []);

    // Memoized filter options (empty)
    const filterOptions = useMemo(() => [], []);

    // Memoized selected filters for display
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

    // Memoized table columns
    const tableColumns = useMemo(() => [
        {
            key: "nome_tipo_instrumento",
            title: "Nome do Tipo",
            render: (item: { id: string | number }) => {
                const tipo = item as TipoInstrumentoMedicao;
                return (
                    <div className="text-sm text-gray-900 max-w-md truncate">{tipo.nome_tipo_instrumento}</div>
                );
            },
        }, {
            key: "observacao",
            title: "Observação",
            render: (item: { id: string | number }) => {
                const tipo = item as TipoInstrumentoMedicao;
                return (
                    <div className="text-sm text-gray-500 whitespace-normal break-words">
                        {tipo.observacao || "-"}
                    </div>
                );
            },
        },
        {
            key: "acoes",
            title: "Ações",
            render: (item: { id: string | number }) => {
                const tipo = item as TipoInstrumentoMedicao;
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
                        <Tooltip text="Excluir">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-1 cursor-pointer"
                                onClick={() => handleDelete(tipo.id)}
                                aria-label="Excluir"
                            >
                                <Trash2 className="h-4 w-4" />
                            </motion.button>
                        </Tooltip>
                    </div>
                );
            },
        },
    ], [handleEdit, handleDelete]);

    if (!hasManagerPermission && !authLoading) {
        return (
            <RestrictedAccess
                hasPermission={hasManagerPermission}
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
                autoDismiss={true}
                dismissDuration={5000}
            />
            {/* Modal de Tipo de Instrumento de Medição */}
            <TipoInstrumentoMedicaoModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                tipoInstrumentoMedicao={selectedTipoInstrumentoMedicao}
                onSuccess={(modalData) => {
                    if (modalData.id) {
                        const tipoCompleto: TipoInstrumentoMedicao = {
                            id: modalData.id,
                            nome_tipo_instrumento: modalData.nome_tipo_instrumento,
                            observacao: modalData.observacao || ""
                        };
                        handleModalSuccess(tipoCompleto);
                    }
                }}
                onError={(errorMessage) => {
                    setAlert({
                        message: errorMessage,
                        type: "error"
                    });
                }}
            />
            {/* Modal de confirmação de exclusão */}
            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
                title="Confirmar Exclusão"
                message={
                    deletingId !== null
                        ? `Você está prestes a excluir permanentemente o tipo de instrumento de medição:`
                        : "Deseja realmente excluir este item?"
                }
                itemName={
                    deletingId !== null
                        ? tiposInstrumentosMedicao.find(tipo => tipo.id === deletingId)?.nome_tipo_instrumento
                        : undefined
                }
            />
            {/* Page Header Component */}
            <PageHeader
                title="Tipos de Instrumentos de Medição"
                subtitle="Cadastro e edição de tipos de instrumentos"
                buttonLabel="Novo Tipo de Instrumento"
                onButtonClick={handleCreateNew}
                buttonDisabled={false}
                showButton={true}
            />
            {/* Filters Component */}
            <FilterPanel
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Buscar por nome ou observação..."
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filters={filterOptions}
                activeFilters={activeFilters}
                onResetFilters={resetFilters}
                selectedFilters={selectedFiltersForDisplay}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                disableFilters={true}
            />
            {/* Data Container with Dynamic View */}
            <DataListContainer
                isLoading={isLoading || isPending}
                isEmpty={tiposInstrumentosMedicao.length === 0}
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
                            description="Não encontramos tipos de instrumentos de medição que correspondam aos seus filtros atuais."
                            primaryAction={{
                                label: "Novo Tipo de Instrumento",
                                onClick: handleCreateNew,
                                icon: <Plus className="mr-2 h-4 w-4" />,
                                disabled: false,
                            }}
                            secondaryAction={{
                                label: "Limpar filtros",
                                onClick: resetFilters,
                            }}
                        />
                    )
                }
                totalItems={allData.length}
                totalFilteredItems={tiposInstrumentosMedicao.length}
                activeFilters={activeFilters}
                onResetFilters={resetFilters}
            >
                {viewMode === "table" ? (
                    <DataTable data={tiposInstrumentosMedicao} columns={tableColumns} />
                ) : (
                    <DataCards
                        data={tiposInstrumentosMedicao}
                          itemsPerRow={4}
                        renderCard={(tipo) => (
                            <Card
                                key={tipo.id}
                                tipo={tipo}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        )}
                    />
                )}
            </DataListContainer>
        </div>
    );
}