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

interface InstrumentoMedicao {
    id: number;
    codigo: string;
    descricao: string;
    tipo: string;
    unidadeMedida: string;
    status: "ativo" | "inativo" | "calibrando";
    proximaCalibracao: string;
    ultimaCalibracao: string;
}

// Card component for list item
const Card = ({ instrumento, onView, onEdit, onDelete }: {
    instrumento: InstrumentoMedicao;
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
            case 'calibrando':
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
            case 'calibrando':
                return 'Em Calibração';
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
                            {instrumento.codigo}
                        </span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs leading-5 font-medium rounded-full ${getStatusClass(instrumento.status)}`}>
                        {getStatusLabel(instrumento.status)}
                    </span>
                </div>

                <h3 className="text-base font-medium text-gray-800 mb-2 line-clamp-2">
                    {instrumento.descricao}
                </h3>

                <div className="flex justify-between items-center mt-2 mb-3">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 inline-block">
                        {instrumento.tipo}
                    </span>
                    <span className="text-xs text-gray-600">
                        {instrumento.unidadeMedida}
                    </span>
                </div>

                <div className="flex justify-between items-end mt-3">
                    <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-500">
                            Última: {formatDate(instrumento.ultimaCalibracao)}
                        </span>
                        <span className="text-xs text-gray-500">
                            Próxima: {formatDate(instrumento.proximaCalibracao)}
                        </span>
                    </div>

                    <div className="flex space-x-1">
                        <Tooltip text="Visualizar">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                                onClick={() => onView(instrumento.id)}
                                aria-label="Visualizar"
                            >
                                <Eye className="h-3.5 w-3.5" />
                            </motion.button>
                        </Tooltip>

                        <Tooltip text="Editar">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                className="p-1.5 rounded-md text-[#1ABC9C] hover:bg-[#1ABC9C]/5"
                                onClick={() => onEdit(instrumento.id)}
                                aria-label="Editar"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </motion.button>
                        </Tooltip>

                        <Tooltip text="Excluir">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
                                onClick={() => onDelete(instrumento.id)}
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

export default function InstrumentosMedicaoPage() {
    // State for filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("todos");
    const [tipoFilter, setTipoFilter] = useState<string>("todos");

    const [isPending, startTransition] = useTransition();

    // View toggle state
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    // State for data and loading
    const [instrumentos, setInstrumentos] = useState<InstrumentoMedicao[]>([]);
    const [allData, setAllData] = useState<InstrumentoMedicao[]>([]);
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

    // Handle keyboard accessibility
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Implement keyboard shortcuts
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                document.getElementById('search-input')?.focus();
            }
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                handleCreateNew();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const loadData = useCallback(() => {
        setIsLoading(true);

        const timer = setTimeout(() => {
            const mockData: InstrumentoMedicao[] = [
                {
                    id: 1,
                    codigo: "IMD-001",
                    descricao: "Paquímetro Digital 150mm",
                    tipo: "Paquímetro",
                    unidadeMedida: "mm",
                    status: "ativo",
                    proximaCalibracao: "2024-06-15",
                    ultimaCalibracao: "2023-06-15"
                },
                {
                    id: 2,
                    codigo: "IMD-002",
                    descricao: "Micrômetro Externo 0-25mm",
                    tipo: "Micrômetro",
                    unidadeMedida: "mm",
                    status: "calibrando",
                    proximaCalibracao: "2024-05-20",
                    ultimaCalibracao: "2023-05-20"
                },
                {
                    id: 3,
                    codigo: "IMD-003",
                    descricao: "Relógio Comparador 10mm",
                    tipo: "Relógio Comparador",
                    unidadeMedida: "mm",
                    status: "ativo",
                    proximaCalibracao: "2024-07-10",
                    ultimaCalibracao: "2023-07-10"
                },
                {
                    id: 4,
                    codigo: "IMD-004",
                    descricao: "Trena Laser 50m",
                    tipo: "Trena",
                    unidadeMedida: "m",
                    status: "inativo",
                    proximaCalibracao: "2024-08-05",
                    ultimaCalibracao: "2023-08-05"
                },
                {
                    id: 5,
                    codigo: "IMD-005",
                    descricao: "Termômetro Infravermelho",
                    tipo: "Termômetro",
                    unidadeMedida: "°C",
                    status: "ativo",
                    proximaCalibracao: "2024-09-18",
                    ultimaCalibracao: "2023-09-18"
                },
                {
                    id: 6,
                    codigo: "IMD-006",
                    descricao: "Balança de Precisão 5kg",
                    tipo: "Balança",
                    unidadeMedida: "g",
                    status: "ativo",
                    proximaCalibracao: "2024-10-03",
                    ultimaCalibracao: "2023-10-03"
                },
                {
                    id: 7,
                    codigo: "IMD-007",
                    descricao: "Medidor de Espessura Ultrassônico",
                    tipo: "Medidor de Espessura",
                    unidadeMedida: "mm",
                    status: "inativo",
                    proximaCalibracao: "2024-11-15",
                    ultimaCalibracao: "2023-11-15"
                },
                {
                    id: 8,
                    codigo: "IMD-008",
                    descricao: "Durômetro Portátil",
                    tipo: "Durômetro",
                    unidadeMedida: "HRC",
                    status: "calibrando",
                    proximaCalibracao: "2024-12-27",
                    ultimaCalibracao: "2023-12-27"
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

                setInstrumentos(filtered);
                setIsLoading(false);

                // Notifications for screen readers
                if (filtered.length === 0) {
                    setNotification('Nenhum resultado encontrado para os filtros atuais.');
                } else {
                    setNotification(`${filtered.length} instrumentos de medição encontrados.`);
                }
            });
        }, 600);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, tipoFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // List of unique instrument types for filter dropdown - memoized
    const tipos = useMemo(() => [
        "Paquímetro", "Micrômetro", "Relógio Comparador",
        "Trena", "Termômetro", "Balança",
        "Medidor de Espessura", "Durômetro"
    ], []);

    // Handle CRUD operations with feedback
    const handleView = useCallback((id: number) => {
        console.log(`Visualizando instrumento de medição ${id}`);
        setNotification(`Visualizando detalhes do instrumento de medição ${id}.`);
        // Implementar a lógica de visualização
    }, []);

    const handleEdit = useCallback((id: number) => {
        console.log(`Editando instrumento de medição ${id}`);
        setNotification(`Iniciando edição do instrumento de medição ${id}.`);
        // Implementar a lógica de edição
    }, []);

    const handleDelete = useCallback((id: number) => {
        console.log(`Excluindo instrumento de medição ${id}`);
        // Aqui você pode implementar um modal de confirmação
        if (confirm('Tem certeza que deseja excluir este instrumento de medição?')) {
            setNotification(`Instrumento de medição ${id} excluído com sucesso.`);
            // Implementar a lógica de exclusão
            setInstrumentos(prev => prev.filter(instrumento => instrumento.id !== id));
        }
    }, []);

    const handleCreateNew = useCallback(() => {
        console.log("Novo instrumento de medição");
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
            { value: "calibrando", label: "Em Calibração", color: "bg-amber-100 text-amber-800" },
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
                case "calibrando":
                    label = "Em Calibração";
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
            case 'calibrando':
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
            case 'calibrando':
                return 'Em Calibração';
            default:
                return status;
        }
    }, []);

    // Table columns configuration
    const tableColumns = useMemo(() => [
        {
            key: "codigo",
            title: "Código",
            render: (instrumento: InstrumentoMedicao) => (
                <span className="text-sm font-medium text-gray-900">{instrumento.codigo}</span>
            ),
        },
        {
            key: "descricao",
            title: "Descrição",
            render: (instrumento: InstrumentoMedicao) => (
                <div className="text-sm text-gray-900 max-w-md truncate">{instrumento.descricao}</div>
            ),
        },
        {
            key: "tipo",
            title: "Tipo",
            render: (instrumento: InstrumentoMedicao) => (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {instrumento.tipo}
                </span>
            ),
        },
        {
            key: "unidadeMedida",
            title: "Unidade",
            render: (instrumento: InstrumentoMedicao) => (
                <span className="text-sm text-gray-500">
                    {instrumento.unidadeMedida}
                </span>
            ),
        },
        {
            key: "status",
            title: "Status",
            render: (instrumento: InstrumentoMedicao) => (
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(instrumento.status)}`}>
                    {getStatusLabel(instrumento.status)}
                </span>
            ),
        },
        {
            key: "calibracao",
            title: "Calibração",
            render: (instrumento: InstrumentoMedicao) => (
                <div className="text-sm text-gray-500">
                    <div>Última: {new Date(instrumento.ultimaCalibracao).toLocaleDateString('pt-BR')}</div>
                    <div>Próxima: {new Date(instrumento.proximaCalibracao).toLocaleDateString('pt-BR')}</div>
                </div>
            ),
        },
        {
            key: "acoes",
            title: "Ações",
            render: (instrumento: InstrumentoMedicao) => (
                <div className="flex items-center justify-end gap-2">
                    <Tooltip text="Visualizar">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1 rounded p-1"
                            onClick={() => handleView(instrumento.id)}
                            aria-label="Visualizar"
                        >
                            <Eye className="h-4 w-4" />
                        </motion.button>
                    </Tooltip>

                    <Tooltip text="Editar">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="text-[#1ABC9C] hover:text-[#16A085] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]/30 focus:ring-offset-1 rounded p-1"
                            onClick={() => handleEdit(instrumento.id)}
                            aria-label="Editar"
                        >
                            <Pencil className="h-4 w-4" />
                        </motion.button>
                    </Tooltip>

                    <Tooltip text="Excluir">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="text-red-500 hover:text-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-1 rounded p-1"
                            onClick={() => handleDelete(instrumento.id)}
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
                title="Instrumentos de Medição"
                buttonLabel="Novo Instrumento"
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
                isEmpty={instrumentos.length === 0}
                emptyState={
                    <EmptyState
                        icon={<SlidersHorizontal className="h-8 w-8 text-gray-500" strokeWidth={1.5} />}
                        title="Nenhum resultado encontrado"
                        description="Não encontramos instrumentos de medição que correspondam aos seus filtros atuais."
                        primaryAction={{
                            label: "Novo Instrumento",
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
                totalFilteredItems={instrumentos.length}
                activeFilters={activeFilters}
                onResetFilters={resetFilters}
            >
                {viewMode === "table" ? (
                    <DataTable data={instrumentos} columns={tableColumns} />
                ) : (
                    <DataCards
                        data={instrumentos}
                        renderCard={(instrumento) => (
                            <Card
                                instrumento={instrumento}
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
