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
import { Eye, Pencil, Plus, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

interface TipoInspecao {
    id: number;
    codigo: string;
    descricao: string;
    status: "A" | "I";
    dataCriacao: string;
}

// Card component for list item
const Card = ({ tipo, onView, onEdit }: {
    tipo: TipoInspecao;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
}) => (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all duration-300">
        <div className="p-4">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        {tipo.codigo}
                    </span>
                </div>
                <span className={`px-2 py-0.5 text-xs leading-5 font-medium rounded-full ${tipo.status === 'A'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                    }`}>
                    {tipo.status === 'A' ? 'Ativo' : 'Inativo'}
                </span>
            </div>

            <h3 className="text-base font-medium text-gray-800 mb-2 line-clamp-2">
                {tipo.descricao}
            </h3>

            <div className="flex justify-between items-end mt-3">
                <div className="flex flex-col space-y-1">
                    <span className="text-xs text-gray-400">
                        {new Date(tipo.dataCriacao).toLocaleDateString('pt-BR')}
                    </span>
                </div>

                <div className="flex space-x-1">
                    <Tooltip text="Visualizar">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                            onClick={() => onView(tipo.id)}
                            aria-label="Visualizar"
                        >
                            <Eye className="h-3.5 w-3.5" />
                        </motion.button>
                    </Tooltip>

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

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTipoInspecao, setSelectedTipoInspecao] = useState<TipoInspecao | undefined>(undefined);

    // ARIA Live region for screen readers
    const [notification, setNotification] = useState('');

    // Calculate active filters
    useEffect(() => {
        let count = 0;
        if (searchTerm) count++;
        if (statusFilter !== "todos") count++;
        setActiveFilters(count);
    }, [searchTerm, statusFilter]);

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
            const mockData: TipoInspecao[] = [
                {
                    id: 1,
                    codigo: "INSP-001",
                    descricao: "Inspeção de Setup",
                    status: "A",
                    dataCriacao: "2023-06-15"
                },
                {
                    id: 2,
                    codigo: "INSP-002",
                    descricao: "Inspeção de Troca de Ferramentas",
                    status: "A",
                    dataCriacao: "2023-07-22"
                },
                {
                    id: 3,
                    codigo: "INSP-003",
                    descricao: "Inspeção de Liberação de Máquina",
                    status: "A",
                    dataCriacao: "2023-08-10"
                },
                {
                    id: 4,
                    codigo: "INSP-004",
                    descricao: "Inspeção de Processo",
                    status: "I",
                    dataCriacao: "2023-09-05"
                },
                {
                    id: 5,
                    codigo: "INSP-005",
                    descricao: "Inspeção na Qualidade",
                    status: "A",
                    dataCriacao: "2023-10-18"
                },
                {
                    id: 6,
                    codigo: "INSP-006",
                    descricao: "Inspeção de Não Conformidade",
                    status: "A",
                    dataCriacao: "2023-11-03"
                },
                {
                    id: 7,
                    codigo: "INSP-007",
                    descricao: "Inspeção Adicional",
                    status: "A",
                    dataCriacao: "2023-11-15"
                },
                {
                    id: 8,
                    codigo: "INSP-008",
                    descricao: "Inspeção de Processos de Fabricação",
                    status: "I",
                    dataCriacao: "2023-11-27"
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

                setTiposInspecao(filtered);
                setIsLoading(false);

                // Notifications for screen readers
                if (filtered.length === 0) {
                    setNotification('Nenhum resultado encontrado para os filtros atuais.');
                } else {
                    setNotification(`${filtered.length} tipos de inspeção encontrados.`);
                }
            });
        }, 600);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle CRUD operations with feedback
    const handleView = useCallback((id: number) => {
        console.log(`Visualizando tipo de inspeção ${id}`);
        const tipoToView = tiposInspecao.find(tipo => tipo.id === id);
        if (tipoToView) {
            setSelectedTipoInspecao(tipoToView);
            // Apenas visualização em modo de somente leitura
            setNotification(`Visualizando detalhes do tipo de inspeção ${id}.`);
        }
    }, [tiposInspecao]);

    const handleEdit = useCallback((id: number) => {
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
        setSelectedTipoInspecao(undefined); // Limpa qualquer seleção anterior
        setIsModalOpen(true);
    }, []);

    // Callback quando o modal for bem-sucedido
    const handleModalSuccess = useCallback((data: any) => {
        if (selectedTipoInspecao) {
            // Modo de edição - atualiza o item na lista
            setTiposInspecao(prev =>
                prev.map(item => item.id === selectedTipoInspecao.id ? {
                    ...item,
                    descricao: data.descricao,
                    status: data.status,
                    codigo: data.codigo || item.codigo
                } : item)
            );
            setAllData(prev =>
                prev.map(item => item.id === selectedTipoInspecao.id ? {
                    ...item,
                    descricao: data.descricao,
                    status: data.status,
                    codigo: data.codigo || item.codigo
                } : item)
            );
            setNotification(`Tipo de inspeção ${data.codigo || selectedTipoInspecao.id} atualizado com sucesso.`);
        } else {
            // Modo de criação - adiciona o novo item à lista
            const newItem: TipoInspecao = {
                id: data.id || Math.floor(Math.random() * 1000) + 100,
                codigo: data.codigo || `INSP-${Math.floor(Math.random() * 1000)}`,
                descricao: data.descricao,
                status: data.status,
                dataCriacao: new Date().toISOString().split('T')[0],
            };
            setTiposInspecao(prev => [newItem, ...prev]);
            setAllData(prev => [newItem, ...prev]);
            setNotification(`Novo tipo de inspeção criado com sucesso.`);
        }
    }, [selectedTipoInspecao]);

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
            setSelectedTipoInspecao(undefined);
        }, 200);
    }, []);

    // Prepare filter options for the FilterPanel component
    const filterOptions = useMemo(() => {
        // Status filter options
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

    // Table columns configuration
    const tableColumns = useMemo(() => [
        {
            key: "codigo",
            title: "Código",
            render: (tipo: TipoInspecao) => (
                <span className="text-sm font-medium text-gray-900">{tipo.codigo}</span>
            ),
        },
        {
            key: "descricao",
            title: "Descrição",
            render: (tipo: TipoInspecao) => (
                <div className="text-sm text-gray-900 max-w-md truncate">{tipo.descricao}</div>
            ),
        },
        {
            key: "status",
            title: "Status",
            render: (tipo: TipoInspecao) => (
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tipo.status === 'A'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {tipo.status === 'A' ? 'Ativo' : 'Inativo'}
                </span>
            ),
        },
        {
            key: "dataCriacao",
            title: "Data de Criação",
            render: (tipo: TipoInspecao) => (
                <span className="text-sm text-gray-500">
                    {new Date(tipo.dataCriacao).toLocaleDateString('pt-BR')}
                </span>
            ),
        },
        {
            key: "acoes",
            title: "Ações",
            render: (tipo: TipoInspecao) => (
                <div className="flex items-center justify-end gap-2">
                    <Tooltip text="Visualizar">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1 rounded p-1"
                            onClick={() => handleView(tipo.id)}
                            aria-label="Visualizar"
                        >
                            <Eye className="h-4 w-4" />
                        </motion.button>
                    </Tooltip>

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
    ], [handleView, handleEdit]);

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
                isEmpty={tiposInspecao.length === 0}
                emptyState={
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
                                onView={handleView}
                                onEdit={handleEdit}
                            />
                        )}
                    />
                )}
            </DataListContainer>
        </div>
    );
}
