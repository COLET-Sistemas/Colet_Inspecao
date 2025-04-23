"use client";

import { DataCards } from "@/components/ui/cadastros/DataCards";
import { DataListContainer } from "@/components/ui/cadastros/DataListContainer";
import { DataTable } from "@/components/ui/cadastros/DataTable";
import { EmptyState } from "@/components/ui/cadastros/EmptyState";
import { FilterOption, FilterPanel, ViewMode } from "@/components/ui/cadastros/FilterPanel";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { Tooltip } from "@/components/ui/cadastros/Tooltip";
import { motion } from "framer-motion";
import { Eye, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

interface CotaCaracteristica {
    id: number;
    codigo: string;
    descricao: string;
    tipo: string;
    unidadeMedida: string;
    tolerancia: string;
    status: "ativo" | "inativo" | "revisao";
    ultimaRevisao: string;
    proximaRevisao: string;
}

// Card component for list item
const Card = ({ cota, onView, onEdit, onDelete }: {
    cota: CotaCaracteristica;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}) => {
    const getStatusClass = (status: string) => {
        switch (status) {
            case 'ativo':
                return 'bg-green-50 text-green-700';
            case 'inativo':
                return 'bg-red-50 text-red-700';
            case 'revisao':
                return 'bg-amber-50 text-amber-700';
            default:
                return 'bg-gray-50 text-gray-700';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ativo':
                return 'Ativo';
            case 'inativo':
                return 'Inativo';
            case 'revisao':
                return 'Em Revisão';
            default:
                return status;
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all duration-300">
            <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            {cota.codigo}
                        </span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs leading-5 font-medium rounded-full ${getStatusClass(cota.status)}`}>
                        {getStatusLabel(cota.status)}
                    </span>
                </div>

                <h3 className="text-base font-medium text-gray-800 mb-2 line-clamp-2">
                    {cota.descricao}
                </h3>

                <div className="flex justify-between items-center mt-2 mb-3">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 inline-block">
                        {cota.tipo}
                    </span>
                    <span className="text-xs text-gray-600">
                        {cota.unidadeMedida}
                    </span>
                </div>

                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                        Tolerância: {cota.tolerancia}
                    </span>
                </div>

                <div className="flex justify-between items-end mt-3">
                    <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-500">
                            Última: {formatDate(cota.ultimaRevisao)}
                        </span>
                        <span className="text-xs text-gray-500">
                            Próxima: {formatDate(cota.proximaRevisao)}
                        </span>
                    </div>

                    <div className="flex space-x-1">
                        <Tooltip text="Visualizar">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                                onClick={() => onView(cota.id)}
                                aria-label="Visualizar"
                            >
                                <Eye className="h-3.5 w-3.5" />
                            </motion.button>
                        </Tooltip>

                        <Tooltip text="Editar">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                className="p-1.5 rounded-md text-[#1ABC9C] hover:bg-[#1ABC9C]/5"
                                onClick={() => onEdit(cota.id)}
                                aria-label="Editar"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </motion.button>
                        </Tooltip>

                        <Tooltip text="Excluir">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
                                onClick={() => onDelete(cota.id)}
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
};

export default function CotasCaracteristicasPage() {
    // State for filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("todos");
    const [tipoFilter, setTipoFilter] = useState<string>("todos");

    const [isPending, startTransition] = useTransition();

    // View toggle state
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    // State for data and loading
    const [cotas, setCotas] = useState<CotaCaracteristica[]>([]);
    const [allData, setAllData] = useState<CotaCaracteristica[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState(0);

    // ARIA Live region for screen readers
    const [notification, setNotification] = useState('');

    // Calculate active filters
    useEffect(() => {
        let count = 0;
        if (searchTerm) count++;
        if (statusFilter !== "todos") count++;
        if (tipoFilter !== "todos") count++;
        setActiveFilters(count);
    }, [searchTerm, statusFilter, tipoFilter]);

    const loadData = useCallback(() => {
        setIsLoading(true);

        const timer = setTimeout(() => {
            const mockData: CotaCaracteristica[] = [
                {
                    id: 1,
                    codigo: "CC-001",
                    descricao: "Diâmetro do eixo principal",
                    tipo: "Dimensional",
                    unidadeMedida: "mm",
                    tolerancia: "±0.05",
                    status: "ativo",
                    ultimaRevisao: "2023-08-15",
                    proximaRevisao: "2024-08-15"
                },
                {
                    id: 2,
                    codigo: "CC-002",
                    descricao: "Rugosidade superficial",
                    tipo: "Superficial",
                    unidadeMedida: "Ra",
                    tolerancia: "1.6",
                    status: "revisao",
                    ultimaRevisao: "2023-10-20",
                    proximaRevisao: "2024-04-20"
                },
                {
                    id: 3,
                    codigo: "CC-003",
                    descricao: "Comprimento da peça",
                    tipo: "Dimensional",
                    unidadeMedida: "mm",
                    tolerancia: "±0.1",
                    status: "ativo",
                    ultimaRevisao: "2023-12-10",
                    proximaRevisao: "2024-12-10"
                },
                {
                    id: 4,
                    codigo: "CC-004",
                    descricao: "Angulação da borda",
                    tipo: "Geométrico",
                    unidadeMedida: "graus",
                    tolerancia: "±0.2",
                    status: "ativo",
                    ultimaRevisao: "2024-01-05",
                    proximaRevisao: "2025-01-05"
                },
                {
                    id: 5,
                    codigo: "CC-005",
                    descricao: "Tolerância de posição",
                    tipo: "Geométrico",
                    unidadeMedida: "mm",
                    tolerancia: "±0.02",
                    status: "inativo",
                    ultimaRevisao: "2023-09-18",
                    proximaRevisao: "2024-09-18"
                },
                {
                    id: 6,
                    codigo: "CC-006",
                    descricao: "Dureza da peça",
                    tipo: "Material",
                    unidadeMedida: "HRC",
                    tolerancia: "45-50",
                    status: "ativo",
                    ultimaRevisao: "2024-02-03",
                    proximaRevisao: "2025-02-03"
                },
                {
                    id: 7,
                    codigo: "CC-007",
                    descricao: "Paralelismo entre faces",
                    tipo: "Geométrico",
                    unidadeMedida: "mm",
                    tolerancia: "0.03",
                    status: "revisao",
                    ultimaRevisao: "2023-11-15",
                    proximaRevisao: "2024-05-15"
                },
                {
                    id: 8,
                    codigo: "CC-008",
                    descricao: "Espessura do revestimento",
                    tipo: "Material",
                    unidadeMedida: "μm",
                    tolerancia: "5-10",
                    status: "inativo",
                    ultimaRevisao: "2023-07-27",
                    proximaRevisao: "2024-07-27"
                }
            ];

            setAllData(mockData);

            startTransition(() => {
                let filtered = [...mockData];

                if (searchTerm) {
                    filtered = filtered.filter(item =>
                        item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }

                if (statusFilter !== "todos") {
                    filtered = filtered.filter(item => item.status === statusFilter);
                }

                if (tipoFilter !== "todos") {
                    filtered = filtered.filter(item => item.tipo === tipoFilter);
                }

                setCotas(filtered);
                setIsLoading(false);

                // Notifications for screen readers
                if (filtered.length === 0) {
                    setNotification('Nenhum resultado encontrado para os filtros atuais.');
                } else {
                    setNotification(`${filtered.length} cotas e características encontradas.`);
                }
            });
        }, 600);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, tipoFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // List of unique tipos for filter dropdown - memoized
    const tipos = useMemo(() => [
        "Dimensional", "Geométrico", "Superficial", "Material"
    ], []);

    // Handle CRUD operations with feedback
    const handleView = useCallback((id: number) => {
        console.log(`Visualizando cota/característica ${id}`);
        setNotification(`Visualizando detalhes da cota/característica ${id}.`);
        // Implementar a lógica de visualização
    }, []);

    const handleEdit = useCallback((id: number) => {
        console.log(`Editando cota/característica ${id}`);
        setNotification(`Iniciando edição da cota/característica ${id}.`);
        // Implementar a lógica de edição
    }, []);

    const handleDelete = useCallback((id: number) => {
        console.log(`Excluindo cota/característica ${id}`);
        // Aqui você pode implementar um modal de confirmação
        if (confirm('Tem certeza que deseja excluir esta cota/característica?')) {
            setNotification(`Cota/característica ${id} excluída com sucesso.`);
            // Implementar a lógica de exclusão
            setCotas(prev => prev.filter(cota => cota.id !== id));
        }
    }, []);

    const handleCreateNew = useCallback(() => {
        console.log("Nova cota/característica");
        // Implementation of the creation logic
    }, []);

    // Reset filters function
    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setStatusFilter("todos");
        setTipoFilter("todos");
        setNotification("Filtros resetados.");
    }, []);

    // Prepare filter options for the FilterPanel component
    const filterOptions = useMemo(() => {
        // Status filter options
        const statusOptions: FilterOption[] = [
            { value: "todos", label: "Todos os status" },
            { value: "ativo", label: "Ativos", color: "bg-green-100 text-green-800" },
            { value: "inativo", label: "Inativos", color: "bg-red-100 text-red-800" },
            { value: "revisao", label: "Em Revisão", color: "bg-amber-100 text-amber-800" },
        ];

        // Type filter options
        const tipoOptions: FilterOption[] = [
            { value: "todos", label: "Todos os tipos" },
            ...tipos.map(tipo => ({ value: tipo, label: tipo })),
        ];

        return [
            {
                id: "status",
                label: "Status",
                value: statusFilter,
                options: statusOptions,
                onChange: setStatusFilter,
            },
            {
                id: "tipo",
                label: "Tipo",
                value: tipoFilter,
                options: tipoOptions,
                onChange: setTipoFilter,
            },
        ];
    }, [statusFilter, tipoFilter, tipos]);

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

        if (statusFilter !== "todos") {
            let label = "Status", color = "bg-gray-100 text-gray-800";

            switch (statusFilter) {
                case "ativo":
                    label = "Ativos";
                    color = "bg-green-100 text-green-800";
                    break;
                case "inativo":
                    label = "Inativos";
                    color = "bg-red-100 text-red-800";
                    break;
                case "revisao":
                    label = "Em Revisão";
                    color = "bg-amber-100 text-amber-800";
                    break;
            }

            filters.push({
                id: "status",
                value: statusFilter,
                label,
                color,
            });
        }

        if (tipoFilter !== "todos") {
            filters.push({
                id: "tipo",
                value: tipoFilter,
                label: tipoFilter,
                color: "bg-blue-100 text-blue-800",
            });
        }

        return filters;
    }, [searchTerm, statusFilter, tipoFilter]);

    // Function to get status class for table
    const getStatusClass = useCallback((status: string) => {
        switch (status) {
            case 'ativo':
                return 'bg-green-100 text-green-800';
            case 'inativo':
                return 'bg-red-100 text-red-800';
            case 'revisao':
                return 'bg-amber-100 text-amber-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }, []);

    const getStatusLabel = useCallback((status: string) => {
        switch (status) {
            case 'ativo':
                return 'Ativo';
            case 'inativo':
                return 'Inativo';
            case 'revisao':
                return 'Em Revisão';
            default:
                return status;
        }
    }, []);

    // Table columns configuration
    const tableColumns = useMemo(() => [
        {
            key: "codigo",
            title: "Código",
            render: (cota: CotaCaracteristica) => (
                <span className="text-sm font-medium text-gray-900">{cota.codigo}</span>
            ),
        },
        {
            key: "descricao",
            title: "Descrição",
            render: (cota: CotaCaracteristica) => (
                <div className="text-sm text-gray-900 max-w-md truncate">{cota.descricao}</div>
            ),
        },
        {
            key: "tipo",
            title: "Tipo",
            render: (cota: CotaCaracteristica) => (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {cota.tipo}
                </span>
            ),
        },
        {
            key: "unidadeMedida",
            title: "Unidade",
            render: (cota: CotaCaracteristica) => (
                <span className="text-sm text-gray-500">
                    {cota.unidadeMedida}
                </span>
            ),
        },
        {
            key: "tolerancia",
            title: "Tolerância",
            render: (cota: CotaCaracteristica) => (
                <span className="text-sm text-gray-500">
                    {cota.tolerancia}
                </span>
            ),
        },
        {
            key: "status",
            title: "Status",
            render: (cota: CotaCaracteristica) => (
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(cota.status)}`}>
                    {getStatusLabel(cota.status)}
                </span>
            ),
        },
        {
            key: "revisao",
            title: "Revisão",
            render: (cota: CotaCaracteristica) => (
                <div className="text-sm text-gray-500">
                    <div>Última: {new Date(cota.ultimaRevisao).toLocaleDateString('pt-BR')}</div>
                    <div>Próxima: {new Date(cota.proximaRevisao).toLocaleDateString('pt-BR')}</div>
                </div>
            ),
        },
        {
            key: "acoes",
            title: "Ações",
            render: (cota: CotaCaracteristica) => (
                <div className="flex items-center justify-end gap-2">
                    <Tooltip text="Visualizar">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1 rounded p-1"
                            onClick={() => handleView(cota.id)}
                            aria-label="Visualizar"
                        >
                            <Eye className="h-4 w-4" />
                        </motion.button>
                    </Tooltip>

                    <Tooltip text="Editar">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="text-[#1ABC9C] hover:text-[#16A085] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]/30 focus:ring-offset-1 rounded p-1"
                            onClick={() => handleEdit(cota.id)}
                            aria-label="Editar"
                        >
                            <Pencil className="h-4 w-4" />
                        </motion.button>
                    </Tooltip>

                    <Tooltip text="Excluir">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="text-red-500 hover:text-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-1 rounded p-1"
                            onClick={() => handleDelete(cota.id)}
                            aria-label="Excluir"
                        >
                            <Trash2 className="h-4 w-4" />
                        </motion.button>
                    </Tooltip>
                </div>
            ),
        },
    ], [handleView, handleEdit, handleDelete, getStatusClass, getStatusLabel]);

    return (
        <div className="space-y-5 p-2 sm:p-4 md:p-6 mx-auto">
            {/* ARIA Live region for accessibility */}
            <div className="sr-only" role="status" aria-live="polite">
                {notification}
            </div>

            {/* Page Header Component */}
            <PageHeader
                title="Cotas e Características"
                buttonLabel="Nova Cota/Característica"
                onButtonClick={handleCreateNew}
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
                isEmpty={cotas.length === 0}
                emptyState={
                    <EmptyState
                        icon={<SlidersHorizontal className="h-8 w-8 text-gray-500" strokeWidth={1.5} />}
                        title="Nenhum resultado encontrado"
                        description="Não encontramos cotas e características que correspondam aos seus filtros atuais."
                        primaryAction={{
                            label: "Nova Cota/Característica",
                            onClick: handleCreateNew,
                            icon: <Plus className="mr-2 h-4 w-4" />,
                        }}
                        secondaryAction={{
                            label: "Limpar filtros",
                            onClick: resetFilters,
                        }}
                    />
                }
                totalItems={allData.length}
                totalFilteredItems={cotas.length}
                activeFilters={activeFilters}
                onResetFilters={resetFilters}
            >
                {viewMode === "table" ? (
                    <DataTable data={cotas} columns={tableColumns} />
                ) : (
                    <DataCards
                        data={cotas}
                        renderCard={(cota) => (
                            <Card
                                cota={cota}
                                onView={handleView}
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