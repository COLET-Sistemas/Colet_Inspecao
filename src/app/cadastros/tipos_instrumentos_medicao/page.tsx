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
import { useApiConfig } from "@/hooks/useApiConfig";
import { motion } from "framer-motion";
import { Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

interface TipoInstrumentoMedicao {
    id: number;
    nome_tipo_instrumento: string;
    observacao: string;
}

interface AlertState {
    message: string | null;
    type: "success" | "error" | "warning";
}

// Card component for list item
const Card = ({ tipo, onEdit, onDelete }: {
    tipo: TipoInstrumentoMedicao;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}) => (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all duration-300">
        <div className="p-4">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        #{tipo.id}
                    </span>
                </div>
            </div>

            <h3 className="text-base font-medium text-gray-800 mb-2 line-clamp-2">
                {tipo.nome_tipo_instrumento}
            </h3>

            {tipo.observacao && (
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                    {tipo.observacao}
                </p>
            )}

            <div className="flex justify-between items-end mt-3">
                <div className="flex flex-col space-y-1">
                </div>

                <div className="flex space-x-1">
                    <Tooltip text="Editar">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            className="p-1.5 rounded-md text-yellow-500 hover:bg-yellow-50"
                            onClick={() => onEdit(tipo.id)}
                            aria-label="Editar"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </motion.button>
                    </Tooltip>
                    <Tooltip text="Excluir">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
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
);

export default function TiposInstrumentosMedicaoPage() {
    // State for filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("todos");

    const [isPending, startTransition] = useTransition();

    // View toggle state
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    // State for data and loading
    const [tiposInstrumentosMedicao, setTiposInstrumentosMedicao] = useState<TipoInstrumentoMedicao[]>([]);
    const [allData, setAllData] = useState<TipoInstrumentoMedicao[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeFilters, setActiveFilters] = useState(0);
    const [apiError, setApiError] = useState<string | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTipoInstrumentoMedicao, setSelectedTipoInstrumentoMedicao] = useState<TipoInstrumentoMedicao | undefined>(undefined);

    // Delete modal states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Alert state para mensagens de sucesso fora do modal
    const [alert, setAlert] = useState<AlertState>({ message: null, type: "success" });

    // ARIA Live region for screen readers
    const [notification, setNotification] = useState('');

    // API configuration
    const { apiUrl, getAuthHeaders, isConnected } = useApiConfig();

    // Calculate active filters
    useEffect(() => {
        let count = 0;
        if (searchTerm) count++;
        if (statusFilter !== "todos") count++;
        setActiveFilters(count);
    }, [searchTerm, statusFilter]);

    const loadData = useCallback(async () => {
        if (!apiUrl || !isConnected) {
            setApiError("API não configurada ou não conectada.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setApiError(null);

        try {
            console.log('Buscando dados da API:', `${apiUrl}/inspecao/tipos_instrumentos_medicao`);

            const response = await fetch(`${apiUrl}/inspecao/tipos_instrumentos_medicao`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar dados: ${response.status} ${response.statusText}`);
            }

            const data: TipoInstrumentoMedicao[] = await response.json();
            console.log('Dados recebidos:', data);
            setAllData(data);

            startTransition(() => {
                let filtered = [...data];

                if (searchTerm) {
                    filtered = filtered.filter(item =>
                        item.nome_tipo_instrumento.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.observacao && item.observacao.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                }

                setTiposInstrumentosMedicao(filtered);

                // Notifications for screen readers
                if (filtered.length === 0) {
                    setNotification('Nenhum resultado encontrado para os filtros atuais.');
                } else {
                    setNotification(`${filtered.length} tipos de instrumentos de medição encontrados.`);
                }
            });
        } catch (error) {
            console.error('Erro ao carregar tipos de instrumentos de medição:', error);
            setApiError(error instanceof Error ? error.message : 'Erro desconhecido ao carregar os dados');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [apiUrl, getAuthHeaders, isConnected, searchTerm]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadData();
        setNotification("Atualizando dados...");
    }, [loadData]);

    // Carrega os dados iniciais quando o componente é montado
    useEffect(() => {
        console.log('Efeito de carregamento inicial executado');
        // Carrega os dados independentemente do valor de dataFetchedRef
        loadData();
    }, [loadData]);

    // Effect para filtrar dados quando os filtros mudam
    useEffect(() => {
        if (allData.length > 0) {
            // Usar startTransition para não bloquear a UI durante filtragens pesadas
            startTransition(() => {
                // Filtrar usando função memoizada para melhor performance
                const filterData = () => {
                    // Só realizar filtragem se houver filtros ativos
                    if (!searchTerm) {
                        return allData;
                    }

                    return allData.filter(item => {
                        // Verificar texto de busca
                        const matchesSearch = !searchTerm ||
                            item.nome_tipo_instrumento.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.observacao && item.observacao.toLowerCase().includes(searchTerm.toLowerCase()));

                        return matchesSearch;
                    });
                };

                const filtered = filterData();
                setTiposInstrumentosMedicao(filtered);

                // Notifications for screen readers
                if (filtered.length === 0) {
                    setNotification('Nenhum resultado encontrado para os filtros atuais.');
                } else {
                    setNotification(`${filtered.length} tipos de instrumentos de medição encontrados.`);
                }
            });
        }
    }, [searchTerm, allData]);

    const handleEdit = useCallback((id: number) => {
        console.log(`Editando tipo de instrumento de medição ${id}`);
        const tipoToEdit = tiposInstrumentosMedicao.find(tipo => tipo.id === id);
        if (tipoToEdit) {
            setSelectedTipoInstrumentoMedicao(tipoToEdit);
            setIsModalOpen(true);
            setNotification(`Iniciando edição do tipo de instrumento de medição ${id}.`);
        }
    }, [tiposInstrumentosMedicao]);

    const handleDelete = useCallback((id: number) => {
        console.log(`Preparando exclusão do tipo de instrumento de medição ${id}`);
        setDeletingId(id);
        setIsDeleteModalOpen(true);
        const tipoToDelete = tiposInstrumentosMedicao.find(tipo => tipo.id === id);
        if (tipoToDelete) {
            setNotification(`Preparando para excluir o tipo de instrumento de medição: ${tipoToDelete.nome_tipo_instrumento}`);
        }
    }, [tiposInstrumentosMedicao]);

    const confirmDelete = useCallback(async () => {
        if (deletingId === null || !apiUrl) return;

        setIsDeleting(true);
        setNotification(`Excluindo tipo de instrumento de medição...`);

        try {
            const response = await fetch(`${apiUrl}/inspecao/tipos_instrumentos_medicao?id=${deletingId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            // Verificar especificamente o status 299, além da verificação padrão !response.ok
            if (response.status === 299) {
                throw new Error(`Não foi possível excluir este tipo de instrumento de medição porque está em uso.`);
            } else if (!response.ok) {
                throw new Error(`Erro ao excluir: ${response.status} ${response.statusText}`);
            }

            // Item excluído com sucesso
            console.log(`Tipo de instrumento de medição ${deletingId} excluído com sucesso`);

            // Recarregar dados
            loadData();

            // Fechar modal de confirmação
            setIsDeleteModalOpen(false);

            // Mostrar mensagem de sucesso
            setAlert({
                message: `Tipo de instrumento de medição excluído com sucesso!`,
                type: "error"
            });

            setNotification(`Tipo de instrumento de medição excluído com sucesso.`);
        } catch (error) {
            console.error('Erro ao excluir tipo de instrumento de medição:', error);

            // Mostrar mensagem de erro
            setAlert({
                message: error instanceof Error ? error.message : 'Erro desconhecido ao excluir o registro',
                type: "error"
            });

            setNotification(`Erro ao excluir tipo de instrumento de medição.`);

            // Manter o modal de exclusão aberto apenas se for um erro diferente de 299
            if (error instanceof Error && !error.message.includes("está em uso")) {
                setIsDeleteModalOpen(false);
            }
        } finally {
            setIsDeleting(false);
            setDeletingId(null);
        }
    }, [deletingId, apiUrl, getAuthHeaders, loadData]);

    const handleCloseDeleteModal = useCallback(() => {
        setIsDeleteModalOpen(false);
        setDeletingId(null);
        setNotification("Exclusão cancelada.");
    }, []);

    const handleCreateNew = useCallback(() => {
        console.log("Novo tipo de instrumento de medição");
        setSelectedTipoInstrumentoMedicao(undefined); // Limpa qualquer seleção anterior
        setIsModalOpen(true);
    }, []);

    // Callback quando o modal for bem-sucedido
    const handleModalSuccess = useCallback((data: any) => {
        console.log('Modal success callback com dados:', data);

        if (selectedTipoInstrumentoMedicao) {
            // Edição de um item existente - log para debug
            console.log('Atualizando tipo de instrumento com ID:', selectedTipoInstrumentoMedicao.id);

            // Garantindo que temos todos os campos necessários
            const updatedTipo = {
                id: selectedTipoInstrumentoMedicao.id,
                nome_tipo_instrumento: data.nome_tipo_instrumento,
                observacao: data.observacao ?? selectedTipoInstrumentoMedicao.observacao ?? ""
            };

            console.log('Objeto atualizado:', updatedTipo);

            // Recarrega todos os dados em vez de tentar atualizar o estado diretamente
            loadData();

            // Mostrar mensagem de sucesso na página
            setAlert({
                message: `Tipo de instrumento de medição ${updatedTipo.nome_tipo_instrumento} editado com sucesso!`,
                type: "warning"
            });

            // Para leitores de tela
            setNotification(`Tipo de instrumento de medição ${updatedTipo.nome_tipo_instrumento} atualizado com sucesso.`);
        } else {
            // É um novo registro
            console.log('Novo tipo de instrumento criado, recarregando dados');
            loadData(); // Recarrega todos os dados

            // Mostrar mensagem de sucesso na página
            setAlert({
                message: `Novo tipo de instrumento de medição criado com sucesso!`,
                type: "success"
            });

            setNotification(`Novo tipo de instrumento de medição criado com sucesso.`);
        }
    }, [selectedTipoInstrumentoMedicao, loadData]);

    // Reset filters function
    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setStatusFilter("todos");
        setNotification("Filtros resetados.");
    }, []);

    // Close modal function
    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        // Damos um tempo para a animação de saída do modal antes de limpar a seleção
        setTimeout(() => {
            setSelectedTipoInstrumentoMedicao(undefined);
        }, 200);
    }, []);

    // Limpar alerta
    const clearAlert = useCallback(() => {
        setAlert({ message: null, type: "success" });
    }, []);

    // Prepare filter options for the FilterPanel component
    const filterOptions = useMemo(() => {
        return [];
    }, []);

    // Prepare selected filters for display in the filter panel
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

    // Table columns configuration
    const tableColumns = useMemo(() => [
        {
            key: "id",
            title: "ID",
            render: (tipo: TipoInstrumentoMedicao) => (
                <span className="text-sm font-medium text-gray-900">#{tipo.id}</span>
            ),
        },
        {
            key: "nome_tipo_instrumento",
            title: "Nome do Tipo",
            render: (tipo: TipoInstrumentoMedicao) => (
                <div className="text-sm text-gray-900 max-w-md truncate">{tipo.nome_tipo_instrumento}</div>
            ),
        },
        {
            key: "observacao",
            title: "Observação",
            render: (tipo: TipoInstrumentoMedicao) => (
                <div className="text-sm text-gray-500 max-w-md truncate">
                    {tipo.observacao || "-"}
                </div>
            ),
        },
        {
            key: "acoes",
            title: "Ações",
            render: (tipo: TipoInstrumentoMedicao) => (
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
                    <Tooltip text="Excluir">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="text-red-500 hover:bg-red-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-1 rounded p-1 cursor-pointer"
                            onClick={() => handleDelete(tipo.id)}
                            aria-label="Excluir"
                        >
                            <Trash2 className="h-4 w-4" />
                        </motion.button>
                    </Tooltip>
                </div>
            ),
        },
    ], [handleEdit, handleDelete]);

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

            {/* Modal de Tipo de Instrumento de Medição */}
            <TipoInstrumentoMedicaoModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                tipoInstrumentoMedicao={selectedTipoInstrumentoMedicao}
                onSuccess={handleModalSuccess}
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
                        ? `Deseja realmente excluir o tipo de instrumento de medição ${tiposInstrumentosMedicao.find(tipo => tipo.id === deletingId)?.id
                        } - "${tiposInstrumentosMedicao.find(tipo => tipo.id === deletingId)?.nome_tipo_instrumento || ""
                        }"?`
                        : "Deseja realmente excluir este item?"
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
                                icon: null,
                                disabled: false,
                            }}
                            secondaryAction={{
                                label: "Novo Tipo de Instrumento",
                                onClick: handleCreateNew,
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
                        renderCard={(tipo) => (
                            <Card
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