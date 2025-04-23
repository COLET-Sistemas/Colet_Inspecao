"use client";

import { DataCards } from "@/components/ui/cadastros/DataCards";
import { DataListContainer } from "@/components/ui/cadastros/DataListContainer";
import { DataTable } from "@/components/ui/cadastros/DataTable";
import { EmptyState } from "@/components/ui/cadastros/EmptyState";
import { FilterOption, FilterPanel, ViewMode } from "@/components/ui/cadastros/FilterPanel";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { Tooltip } from "@/components/ui/cadastros/Tooltip";
import { TipoInspecaoModal } from "@/components/ui/cadastros/modais_cadastros/TipoInspecaoModal";
import { motion } from "framer-motion";
import { Pencil, Plus, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

interface TipoInspecao {
    id: string;
    codigo: string;
    descricao_tipo_inspecao: string;
    situacao: "A" | "I";
    dataCriacao: string;
}

// Card component for list item
const Card = ({ tipo, onEdit }: {
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
                <span className={`px-2 py-0.5 text-xs leading-5 font-medium rounded-full ${tipo.situacao === 'A'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                    }`}>
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
                            className="p-1.5 rounded-md text-[#1ABC9C] hover:bg-[#1ABC9C]/5"
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
);

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
    const [activeFilters, setActiveFilters] = useState(0);
    const [apiError, setApiError] = useState<string | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTipoInspecao, setSelectedTipoInspecao] = useState<TipoInspecao | undefined>(undefined);

    // ARIA Live region for screen readers
    const [notification, setNotification] = useState('');

    // Utilize uma ref para controlar se a requisição já foi feita
    const dataFetchedRef = useRef(false);

    // Calculate active filters
    useEffect(() => {
        let count = 0;
        if (searchTerm) count++;
        if (statusFilter !== "todos") count++;
        setActiveFilters(count);
    }, [searchTerm, statusFilter]);

    const loadData = useCallback(() => {
        setIsLoading(true);
        setApiError(null);

        const apiUrl = localStorage.getItem("apiUrl");
        const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

        if (!apiUrl) {
            setApiError("URL da API não está configurada");
            setIsLoading(false);
            return;
        }

        if (!authToken) {
            setApiError("Token de autenticação não encontrado");
            setIsLoading(false);
            return;
        }

        console.log('Token usado na requisição:', authToken);
        fetch(`${apiUrl}/inspecao/tipos_inspecao`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "chave": authToken
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao buscar dados: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const formattedData = Array.isArray(data) ? data.map(item => ({
                    id: item.id || '',
                    codigo: item.codigo || item.id || '',
                    descricao_tipo_inspecao: item.descricao_tipo_inspecao || '',
                    situacao: item.situacao || 'A',
                    dataCriacao: item.dataCriacao || new Date().toISOString().split('T')[0]
                })) : [];

                setAllData(formattedData);

                startTransition(() => {
                    let filtered = [...formattedData];

                    if (searchTerm) {
                        filtered = filtered.filter(item =>
                            item.descricao_tipo_inspecao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                    }

                    if (statusFilter !== "todos") {
                        filtered = filtered.filter(item => item.situacao === statusFilter);
                    }

                    setTiposInspecao(filtered);

                    // Notifications for screen readers
                    if (filtered.length === 0) {
                        setNotification('Nenhum resultado encontrado para os filtros atuais.');
                    } else {
                        setNotification(`${filtered.length} tipos de inspeção encontrados.`);
                    }
                });
            })
            .catch(error => {
                console.error("Erro ao buscar tipos de inspeção:", error);
                setApiError(`Falha ao carregar dados: ${error.message}`);
            })
            .finally(() => {
                setIsLoading(false);
            });

    }, []);

    useEffect(() => {
        if (dataFetchedRef.current === false) {
            dataFetchedRef.current = true;
            loadData();
        }
    }, []);

    // Effect para filtrar dados quando os filtros mudam
    useEffect(() => {
        if (allData.length > 0) {
            startTransition(() => {
                let filtered = [...allData];

                if (searchTerm) {
                    filtered = filtered.filter(item =>
                        item.descricao_tipo_inspecao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }

                if (statusFilter !== "todos") {
                    filtered = filtered.filter(item => item.situacao === statusFilter);
                }

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
        console.log(`Editando tipo de inspeção ${id}`);
        const tipoToEdit = tiposInspecao.find(tipo => tipo.id === id);
        if (tipoToEdit) {
            setSelectedTipoInspecao(tipoToEdit);
            setIsModalOpen(true);
            setNotification(`Iniciando edição do tipo de inspeção ${id}.`);
        }
    }, [tiposInspecao]);

    const handleCreateNew = useCallback(() => {
        console.log("Novo tipo de inspeção");
        setSelectedTipoInspecao(undefined);
        setIsModalOpen(true);
    }, []);

    const handleModalSuccess = useCallback((data: any) => {
        if (selectedTipoInspecao) {
            setTiposInspecao(prev =>
                prev.map(item => item.id === selectedTipoInspecao.id ? {
                    ...item,
                    descricao_tipo_inspecao: data.descricao_tipo_inspecao,
                    situacao: data.situacao,
                    codigo: data.codigo || item.codigo
                } : item)
            );
            setAllData(prev =>
                prev.map(item => item.id === selectedTipoInspecao.id ? {
                    ...item,
                    descricao_tipo_inspecao: data.descricao_tipo_inspecao,
                    situacao: data.situacao,
                    codigo: data.codigo || item.codigo
                } : item)
            );
            setNotification(`Tipo de inspeção ${data.codigo || selectedTipoInspecao.id} atualizado com sucesso.`);
        } else {
            const newItem: TipoInspecao = {
                id: data.id || Math.floor(Math.random() * 1000).toString(),
                codigo: data.codigo || `INSP-${Math.floor(Math.random() * 1000)}`,
                descricao_tipo_inspecao: data.descricao_tipo_inspecao,
                situacao: data.situacao,
                dataCriacao: new Date().toISOString().split('T')[0],
            };
            setTiposInspecao(prev => [newItem, ...prev]);
            setAllData(prev => [newItem, ...prev]);
            setNotification(`Novo tipo de inspeção criado com sucesso.`);
        }
    }, [selectedTipoInspecao]);

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
            title: "Código",
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
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tipo.situacao === 'A'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
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
                            className="text-[#1ABC9C] hover:text-[#16A085] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]/30 focus:ring-offset-1 rounded p-1"
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

            {/* Modal de Tipo de Inspeção */}
            <TipoInspecaoModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                tipoInspecao={selectedTipoInspecao}
                onSuccess={handleModalSuccess}
            />

            {/* Page Header Component */}
            <PageHeader
                title="Tipos de Inspeções"
                buttonLabel="Novo Tipo de Inspeção"
                onButtonClick={handleCreateNew}
                buttonDisabled={false}
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
                                icon: <Plus className="mr-2 h-4 w-4" />,
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
