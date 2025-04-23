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

interface Especificacao {
    id: number;
    codigo: string;
    descricao: string;
    tipo: string;
    unidadeMedida: string;
    status: "ativo" | "inativo";
    dataCriacao: string;
    valorMinimo: number;
    valorNominal: number;
    valorMaximo: number;
}

// Card component for list item
const Card = ({ especificacao, onView, onEdit, onDelete }: {
    especificacao: Especificacao;
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
                            {especificacao.codigo}
                        </span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs leading-5 font-medium rounded-full ${getStatusClass(especificacao.status)}`}>
                        {getStatusLabel(especificacao.status)}
                    </span>
                </div>

                <h3 className="text-base font-medium text-gray-800 mb-2 line-clamp-2">
                    {especificacao.descricao}
                </h3>

                <div className="flex justify-between items-center mt-2 mb-3">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 inline-block">
                        {especificacao.tipo}
                    </span>
                    <span className="text-xs text-gray-600">
                        {especificacao.unidadeMedida}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mt-3">
                    <div className="text-center">
                        <div className="font-medium">Min</div>
                        <div>{especificacao.valorMinimo}</div>
                    </div>
                    <div className="text-center bg-green-50 rounded-md py-1">
                        <div className="font-medium text-green-700">Nominal</div>
                        <div className="text-green-800 font-semibold">{especificacao.valorNominal}</div>
                    </div>
                    <div className="text-center">
                        <div className="font-medium">Max</div>
                        <div>{especificacao.valorMaximo}</div>
                    </div>
                </div>

                <div className="flex justify-between items-end mt-3">
                    <div className="text-xs text-gray-500">
                        Criado em: {formatDate(especificacao.dataCriacao)}
                    </div>

                    <div className="flex space-x-1">
                        <Tooltip text="Visualizar">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                                onClick={() => onView(especificacao.id)}
                                aria-label="Visualizar"
                            >
                                <Eye className="h-3.5 w-3.5" />
                            </motion.button>
                        </Tooltip>

                        <Tooltip text="Editar">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                className="p-1.5 rounded-md text-[#1ABC9C] hover:bg-[#1ABC9C]/5"
                                onClick={() => onEdit(especificacao.id)}
                                aria-label="Editar"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </motion.button>
                        </Tooltip>

                        <Tooltip text="Excluir">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
                                onClick={() => onDelete(especificacao.id)}
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

export default function EspecificacoesPage() {
    // State for filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("todos");
    const [tipoFilter, setTipoFilter] = useState<string>("todos");

    const [isPending, startTransition] = useTransition();

    // View toggle state
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    // State for data and loading
    const [especificacoes, setEspecificacoes] = useState<Especificacao[]>([]);
    const [allData, setAllData] = useState<Especificacao[]>([]);
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
            const mockData: Especificacao[] = [
                {
                    id: 1,
                    codigo: "ESP-001",
                    descricao: "Diâmetro do Furo 10mm",
                    tipo: "Dimensional",
                    unidadeMedida: "mm",
                    status: "ativo",
                    dataCriacao: "2023-06-15",
                    valorMinimo: 9.95,
                    valorNominal: 10.0,
                    valorMaximo: 10.05
                },
                {
                    id: 2,
                    codigo: "ESP-002",
                    descricao: "Profundidade do Rasgo",
                    tipo: "Dimensional",
                    unidadeMedida: "mm",
                    status: "ativo",
                    dataCriacao: "2023-07-22",
                    valorMinimo: 5.8,
                    valorNominal: 6.0,
                    valorMaximo: 6.2
                },
                {
                    id: 3,
                    codigo: "ESP-003",
                    descricao: "Rugosidade Superfície Lateral",
                    tipo: "Superficial",
                    unidadeMedida: "Ra",
                    status: "ativo",
                    dataCriacao: "2023-08-10",
                    valorMinimo: 0,
                    valorNominal: 1.2,
                    valorMaximo: 1.6
                },
                {
                    id: 4,
                    codigo: "ESP-004",
                    descricao: "Dureza Superficial",
                    tipo: "Material",
                    unidadeMedida: "HRC",
                    status: "inativo",
                    dataCriacao: "2023-09-05",
                    valorMinimo: 42,
                    valorNominal: 45,
                    valorMaximo: 48
                },
                {
                    id: 5,
                    codigo: "ESP-005",
                    descricao: "Diâmetro Externo",
                    tipo: "Dimensional",
                    unidadeMedida: "mm",
                    status: "ativo",
                    dataCriacao: "2023-10-18",
                    valorMinimo: 24.95,
                    valorNominal: 25.0,
                    valorMaximo: 25.05
                },
                {
                    id: 6,
                    codigo: "ESP-006",
                    descricao: "Planicidade da Base",
                    tipo: "Geométrica",
                    unidadeMedida: "mm",
                    status: "ativo",
                    dataCriacao: "2023-11-03",
                    valorMinimo: 0,
                    valorNominal: 0,
                    valorMaximo: 0.05
                },
                {
                    id: 7,
                    codigo: "ESP-007",
                    descricao: "Perpendicularidade",
                    tipo: "Geométrica",
                    unidadeMedida: "mm",
                    status: "ativo",
                    dataCriacao: "2023-11-15",
                    valorMinimo: 0,
                    valorNominal: 0,
                    valorMaximo: 0.08
                },
                {
                    id: 8,
                    codigo: "ESP-008",
                    descricao: "Resistência à Tração",
                    tipo: "Material",
                    unidadeMedida: "MPa",
                    status: "inativo",
                    dataCriacao: "2023-11-27",
                    valorMinimo: 420,
                    valorNominal: 450,
                    valorMaximo: 480
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

                setEspecificacoes(filtered);
                setIsLoading(false);

                // Notifications for screen readers
                if (filtered.length === 0) {
                    setNotification('Nenhum resultado encontrado para os filtros atuais.');
                } else {
                    setNotification(`${filtered.length} especificações encontradas.`);
                }
            });
        }, 600);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, tipoFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // List of unique specification types for filter dropdown - memoized
    const tipos = useMemo(() => [
        "Dimensional", "Superficial", "Material", "Geométrica"
    ], []);

    // Handle CRUD operations with feedback
    const handleView = useCallback((id: number) => {
        console.log(`Visualizando especificação ${id}`);
        setNotification(`Visualizando detalhes da especificação ${id}.`);
        // Implementar a lógica de visualização
    }, []);

    const handleEdit = useCallback((id: number) => {
        console.log(`Editando especificação ${id}`);
        setNotification(`Iniciando edição da especificação ${id}.`);
        // Implementar a lógica de edição
    }, []);

    const handleDelete = useCallback((id: number) => {
        console.log(`Excluindo especificação ${id}`);
        // Aqui você pode implementar um modal de confirmação
        if (confirm('Tem certeza que deseja excluir esta especificação?')) {
            setNotification(`Especificação ${id} excluída com sucesso.`);
            // Implementar a lógica de exclusão
            setEspecificacoes(prev => prev.filter(especificacao => especificacao.id !== id));
        }
    }, []);

    const handleCreateNew = useCallback(() => {
        console.log("Nova especificação");
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
            default:
                return status;
        }
    }, []);

    // Table columns configuration
    const tableColumns = useMemo(() => [
        {
            key: "codigo",
            title: "Código",
            render: (especificacao: Especificacao) => (
                <span className="text-sm font-medium text-gray-900">{especificacao.codigo}</span>
            ),
        },
        {
            key: "descricao",
            title: "Descrição",
            render: (especificacao: Especificacao) => (
                <div className="text-sm text-gray-900 max-w-md truncate">{especificacao.descricao}</div>
            ),
        },
        {
            key: "tipo",
            title: "Tipo",
            render: (especificacao: Especificacao) => (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {especificacao.tipo}
                </span>
            ),
        },
        {
            key: "unidadeMedida",
            title: "Unidade",
            render: (especificacao: Especificacao) => (
                <span className="text-sm text-gray-500">
                    {especificacao.unidadeMedida}
                </span>
            ),
        },
        {
            key: "valores",
            title: "Valores (Min | Nom | Max)",
            render: (especificacao: Especificacao) => (
                <div className="text-sm text-gray-500">
                    <span className="text-gray-700">{especificacao.valorMinimo}</span>
                    {' | '}
                    <span className="font-medium text-green-700">{especificacao.valorNominal}</span>
                    {' | '}
                    <span className="text-gray-700">{especificacao.valorMaximo}</span>
                </div>
            ),
        },
        {
            key: "status",
            title: "Status",
            render: (especificacao: Especificacao) => (
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(especificacao.status)}`}>
                    {getStatusLabel(especificacao.status)}
                </span>
            ),
        },
        {
            key: "acoes",
            title: "Ações",
            render: (especificacao: Especificacao) => (
                <div className="flex items-center justify-end gap-2">
                    <Tooltip text="Visualizar">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1 rounded p-1"
                            onClick={() => handleView(especificacao.id)}
                            aria-label="Visualizar"
                        >
                            <Eye className="h-4 w-4" />
                        </motion.button>
                    </Tooltip>

                    <Tooltip text="Editar">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="text-[#1ABC9C] hover:text-[#16A085] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]/30 focus:ring-offset-1 rounded p-1"
                            onClick={() => handleEdit(especificacao.id)}
                            aria-label="Editar"
                        >
                            <Pencil className="h-4 w-4" />
                        </motion.button>
                    </Tooltip>

                    <Tooltip text="Excluir">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="text-red-500 hover:text-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-1 rounded p-1"
                            onClick={() => handleDelete(especificacao.id)}
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
                title="Especificações da Inspeção"
                buttonLabel="Nova Especificação"
                onButtonClick={handleCreateNew}
            />

            {/* Filters Component */}
            <FilterPanel
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Buscar por código ou descrição... (Ctrl+F)"
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
                isEmpty={especificacoes.length === 0}
                emptyState={
                    <EmptyState
                        icon={<SlidersHorizontal className="h-8 w-8 text-gray-500" strokeWidth={1.5} />}
                        title="Nenhum resultado encontrado"
                        description="Não encontramos especificações que correspondam aos seus filtros atuais."
                        primaryAction={{
                            label: "Nova Especificação",
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
                totalFilteredItems={especificacoes.length}
                activeFilters={activeFilters}
                onResetFilters={resetFilters}
            >
                {viewMode === "table" ? (
                    <DataTable data={especificacoes} columns={tableColumns} />
                ) : (
                    <DataCards
                        data={especificacoes}
                        renderCard={(especificacao) => (
                            <Card
                                especificacao={especificacao}
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