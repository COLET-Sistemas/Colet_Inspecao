"use client";

import { DataCards } from "@/components/ui/cadastros/DataCards";
import { DataListContainer } from "@/components/ui/cadastros/DataListContainer";
import { DataTable } from "@/components/ui/cadastros/DataTable";
import { EmptyState } from "@/components/ui/cadastros/EmptyState";
import { FilterOption, FilterPanel, ViewMode } from "@/components/ui/cadastros/FilterPanel";
import { TipoInstrumentoMedicaoModal } from "@/components/ui/cadastros/modais_cadastros/TipoInstrumentoMedicaoModal";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { Tooltip } from "@/components/ui/cadastros/Tooltip";
import { motion } from "framer-motion";
import { Eye, Pencil, Plus, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

interface TipoInstrumentoMedicao {
    id: number;
    nome_tipo_instrumento: string;
    observacao: string;
    status: "A" | "I";
    dataCriacao: string;
}

// Card component for list item
const Card = ({ tipo, onView, onEdit }: {
    tipo: TipoInstrumentoMedicao;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
}) => (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all duration-300">
        <div className="p-4">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        #{tipo.id}
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
                {tipo.nome_tipo_instrumento}
            </h3>

            {tipo.observacao && (
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                    {tipo.observacao}
                </p>
            )}

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
                            className="p-1.5 rounded-md text-green-600 hover:bg-green-50"
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
    const [activeFilters, setActiveFilters] = useState(0);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTipoInstrumentoMedicao, setSelectedTipoInstrumentoMedicao] = useState<TipoInstrumentoMedicao | undefined>(undefined);

    // ARIA Live region for screen readers
    const [notification, setNotification] = useState('');

    // Calculate active filters
    useEffect(() => {
        let count = 0;
        if (searchTerm) count++;
        if (statusFilter !== "todos") count++;
        setActiveFilters(count);
    }, [searchTerm, statusFilter]);

    const loadData = useCallback(() => {
        setIsLoading(true);

        const timer = setTimeout(() => {
            // Simulação de dados - em produção será substituído por uma chamada API real
            const mockData: TipoInstrumentoMedicao[] = [
                {
                    id: 1,
                    nome_tipo_instrumento: "Paquímetro",
                    observacao: "Instrumento utilizado para medição de dimensões externas, internas e profundidade.",
                    status: "A",
                    dataCriacao: "2023-06-15"
                },
                {
                    id: 2,
                    nome_tipo_instrumento: "Micrômetro",
                    observacao: "Instrumento de alta precisão para medições de dimensões.",
                    status: "A",
                    dataCriacao: "2023-07-22"
                },
                {
                    id: 3,
                    nome_tipo_instrumento: "Relógio Comparador",
                    observacao: "Utilizado para comparar diferenças em altura ou desvios de peças.",
                    status: "A",
                    dataCriacao: "2023-08-10"
                },
                {
                    id: 4,
                    nome_tipo_instrumento: "Trena",
                    observacao: "Instrumento para medição de comprimento e distâncias.",
                    status: "I",
                    dataCriacao: "2023-09-05"
                },
                {
                    id: 5,
                    nome_tipo_instrumento: "Calibrador de Folga",
                    observacao: "Utilizado para verificar folgas e tolerâncias.",
                    status: "A",
                    dataCriacao: "2023-10-18"
                },
                {
                    id: 6,
                    nome_tipo_instrumento: "Balança de Precisão",
                    observacao: "Instrumento para medição de massa com alta precisão.",
                    status: "A",
                    dataCriacao: "2023-11-03"
                },
                {
                    id: 7,
                    nome_tipo_instrumento: "Escala de Aço",
                    observacao: "Instrumento para medição de comprimento com marcações milimétricas.",
                    status: "A",
                    dataCriacao: "2023-11-15"
                },
                {
                    id: 8,
                    nome_tipo_instrumento: "Goniômetro",
                    observacao: "Instrumento para medição de ângulos.",
                    status: "I",
                    dataCriacao: "2023-11-27"
                }
            ];

            setAllData(mockData);

            startTransition(() => {
                let filtered = [...mockData];

                if (searchTerm) {
                    filtered = filtered.filter(item =>
                        item.nome_tipo_instrumento.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.observacao && item.observacao.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                }

                if (statusFilter !== "todos") {
                    filtered = filtered.filter(item => item.status === statusFilter);
                }

                setTiposInstrumentosMedicao(filtered);
                setIsLoading(false);

                // Notifications for screen readers
                if (filtered.length === 0) {
                    setNotification('Nenhum resultado encontrado para os filtros atuais.');
                } else {
                    setNotification(`${filtered.length} tipos de instrumentos de medição encontrados.`);
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
        console.log(`Visualizando tipo de instrumento de medição ${id}`);
        const tipoToView = tiposInstrumentosMedicao.find(tipo => tipo.id === id);
        if (tipoToView) {
            setSelectedTipoInstrumentoMedicao(tipoToView);
            // Apenas visualização em modo de somente leitura
            setNotification(`Visualizando detalhes do tipo de instrumento de medição ${id}.`);
        }
    }, [tiposInstrumentosMedicao]);

    const handleEdit = useCallback((id: number) => {
        console.log(`Editando tipo de instrumento de medição ${id}`);
        const tipoToEdit = tiposInstrumentosMedicao.find(tipo => tipo.id === id);
        if (tipoToEdit) {
            setSelectedTipoInstrumentoMedicao(tipoToEdit);
            setIsModalOpen(true);
            setNotification(`Iniciando edição do tipo de instrumento de medição ${id}.`);
        }
    }, [tiposInstrumentosMedicao]);

    const handleCreateNew = useCallback(() => {
        console.log("Novo tipo de instrumento de medição");
        setSelectedTipoInstrumentoMedicao(undefined); // Limpa qualquer seleção anterior
        setIsModalOpen(true);
    }, []);

    // Callback quando o modal for bem-sucedido
    const handleModalSuccess = useCallback((data: any) => {
        if (selectedTipoInstrumentoMedicao) {
            // Modo de edição - atualiza o item na lista
            setTiposInstrumentosMedicao(prev =>
                prev.map(item => item.id === selectedTipoInstrumentoMedicao.id ? {
                    ...item,
                    nome_tipo_instrumento: data.nome_tipo_instrumento,
                    observacao: data.observacao,
                    status: data.status,
                } : item)
            );
            setAllData(prev =>
                prev.map(item => item.id === selectedTipoInstrumentoMedicao.id ? {
                    ...data,
                    dataCriacao: item.dataCriacao
                } : item)
            );
            setNotification(`Tipo de instrumento de medição ${data.nome_tipo_instrumento || selectedTipoInstrumentoMedicao.id} atualizado com sucesso.`);
        } else {
            // Modo de criação - adiciona o novo item à lista
            const newItem: TipoInstrumentoMedicao = {
                id: data.id || Math.floor(Math.random() * 1000) + 100,
                nome_tipo_instrumento: data.nome_tipo_instrumento,
                observacao: data.observacao || "",
                status: data.status,
                dataCriacao: new Date().toISOString().split('T')[0],
            };
            setTiposInstrumentosMedicao(prev => [newItem, ...prev]);
            setAllData(prev => [newItem, ...prev]);
            setNotification(`Novo tipo de instrumento de medição criado com sucesso.`);
        }
    }, [selectedTipoInstrumentoMedicao]);

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
            key: "status",
            title: "Status",
            render: (tipo: TipoInstrumentoMedicao) => (
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
            render: (tipo: TipoInstrumentoMedicao) => (
                <span className="text-sm text-gray-500">
                    {new Date(tipo.dataCriacao).toLocaleDateString('pt-BR')}
                </span>
            ),
        },
        {
            key: "acoes",
            title: "Ações",
            render: (tipo: TipoInstrumentoMedicao) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => handleView(tipo.id)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        aria-label="Visualizar detalhes"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleEdit(tipo.id)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        aria-label="Editar"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
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

            {/* Modal de Tipo de Instrumento de Medição */}
            <TipoInstrumentoMedicaoModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                tipoInstrumentoMedicao={selectedTipoInstrumentoMedicao}
                onSuccess={handleModalSuccess}
            />

            {/* Page Header Component */}
            <PageHeader
                title="Tipos de Instrumentos de Medição"
                buttonLabel="Novo Tipo de Instrumento"
                onButtonClick={handleCreateNew}
                buttonDisabled={false}
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
            />

            {/* Data Container with Dynamic View */}
            <DataListContainer
                isLoading={isLoading || isPending}
                isEmpty={tiposInstrumentosMedicao.length === 0}
                emptyState={
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