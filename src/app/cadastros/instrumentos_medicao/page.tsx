"use client";

import { DataCards } from "@/components/ui/cadastros/DataCards";
import { DataListContainer } from "@/components/ui/cadastros/DataListContainer";
import { DataTable } from "@/components/ui/cadastros/DataTable";
import { EmptyState } from "@/components/ui/cadastros/EmptyState";
import { FilterOption, FilterPanel, ViewMode } from "@/components/ui/cadastros/FilterPanel";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { Tooltip } from "@/components/ui/cadastros/Tooltip";
import { InstrumentoMedicaoModal } from "@/components/ui/cadastros/modais_cadastros/InstrumentoMedicaoModal";
import { useApiConfig } from "@/hooks/useApiConfig";
import { motion } from "framer-motion";
import { Eye, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

interface InstrumentoMedicaoUI {
    id: number;
    tag: string;
    nome_instrumento: string;
    numero_serie: number;
    numero_patrimonio: string;
    codigo_artigo: string;
    situacao: "A" | "I";
    data_validade: string;
    data_ultima_calibracao: string;
    frequencia_calibracao: number;
}

// A API já está com o formato correto, só mantemos como referência
interface InstrumentoMedicaoAPI {
    id?: number;
    tag: string;
    nome_instrumento: string;
    numero_serie: number;
    numero_patrimonio: string;
    codigo_artigo: string;
    situacao: "A" | "I";
    data_validade: string;
    data_ultima_calibracao: string;
    frequencia_calibracao: number;
}

const Card = ({ instrumento, onView, onEdit, onDelete }: {
    instrumento: InstrumentoMedicaoUI;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}) => {
    const getStatusClass = (status: string) => {
        switch (status) {
            case 'A':
                return 'bg-green-50 text-green-700';
            case 'I':
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
            case 'A':
                return 'Ativo';
            case 'I':
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
                            {instrumento.tag}
                        </span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs leading-5 font-medium rounded-full ${getStatusClass(instrumento.situacao)}`}>
                        {getStatusLabel(instrumento.situacao)}
                    </span>
                </div>

                <h3 className="text-base font-medium text-gray-800 mb-2 line-clamp-2">
                    {instrumento.nome_instrumento}
                </h3>

                <div className="flex justify-between items-center mt-2 mb-3">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 inline-block">
                        {instrumento.codigo_artigo}
                    </span>
                    <span className="text-xs text-gray-600">
                        Série: {instrumento.numero_serie}
                    </span>
                </div>

                <div className="flex justify-between items-end mt-3">
                    <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-500">
                            Última: {formatDate(instrumento.data_ultima_calibracao)}
                        </span>
                        <span className="text-xs text-gray-500">
                            Próxima: {formatDate(instrumento.data_validade)}
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
    const { apiUrl } = useApiConfig();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("todos");
    const [tipoFilter, setTipoFilter] = useState<string>("todos");

    const [isPending, startTransition] = useTransition();

    const [viewMode, setViewMode] = useState<ViewMode>("table");

    const [instrumentos, setInstrumentos] = useState<InstrumentoMedicaoUI[]>([]);
    const [allData, setAllData] = useState<InstrumentoMedicaoUI[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInstrumento, setSelectedInstrumento] = useState<InstrumentoMedicaoAPI | undefined>(undefined);

    const [notification, setNotification] = useState('');

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
            const mockData: InstrumentoMedicaoUI[] = [
                {
                    id: 1,
                    tag: "TAG-001",
                    nome_instrumento: "Paquímetro Digital 150mm",
                    numero_serie: 10001,
                    numero_patrimonio: "PT-001",
                    codigo_artigo: "CA-001",
                    situacao: "A",
                    data_validade: "2024-06-15",
                    data_ultima_calibracao: "2023-06-15",
                    frequencia_calibracao: 365
                },
                {
                    id: 2,
                    tag: "TAG-002",
                    nome_instrumento: "Micrômetro Externo 0-25mm",
                    numero_serie: 10002,
                    numero_patrimonio: "PT-002",
                    codigo_artigo: "CA-002",
                    situacao: "A",
                    data_validade: "2024-05-20",
                    data_ultima_calibracao: "2023-05-20",
                    frequencia_calibracao: 365
                },
                {
                    id: 3,
                    tag: "TAG-003",
                    nome_instrumento: "Relógio Comparador 10mm",
                    numero_serie: 10003,
                    numero_patrimonio: "PT-003",
                    codigo_artigo: "CA-003",
                    situacao: "A",
                    data_validade: "2024-07-10",
                    data_ultima_calibracao: "2023-07-10",
                    frequencia_calibracao: 365
                },
                {
                    id: 4,
                    tag: "TAG-004",
                    nome_instrumento: "Trena Laser 50m",
                    numero_serie: 10004,
                    numero_patrimonio: "PT-004",
                    codigo_artigo: "CA-004",
                    situacao: "I",
                    data_validade: "2024-08-05",
                    data_ultima_calibracao: "2023-08-05",
                    frequencia_calibracao: 365
                },
                {
                    id: 5,
                    tag: "TAG-005",
                    nome_instrumento: "Termômetro Infravermelho",
                    numero_serie: 10005,
                    numero_patrimonio: "PT-005",
                    codigo_artigo: "CA-005",
                    situacao: "A",
                    data_validade: "2024-09-18",
                    data_ultima_calibracao: "2023-09-18",
                    frequencia_calibracao: 365
                },
                {
                    id: 6,
                    tag: "TAG-006",
                    nome_instrumento: "Balança de Precisão 5kg",
                    numero_serie: 10006,
                    numero_patrimonio: "PT-006",
                    codigo_artigo: "CA-006",
                    situacao: "A",
                    data_validade: "2024-10-03",
                    data_ultima_calibracao: "2023-10-03",
                    frequencia_calibracao: 365
                },
                {
                    id: 7,
                    tag: "TAG-007",
                    nome_instrumento: "Medidor de Espessura Ultrassônico",
                    numero_serie: 10007,
                    numero_patrimonio: "PT-007",
                    codigo_artigo: "CA-007",
                    situacao: "I",
                    data_validade: "2024-11-15",
                    data_ultima_calibracao: "2023-11-15",
                    frequencia_calibracao: 180
                },
                {
                    id: 8,
                    tag: "TAG-008",
                    nome_instrumento: "Durômetro Portátil",
                    numero_serie: 10008,
                    numero_patrimonio: "PT-008",
                    codigo_artigo: "CA-008",
                    situacao: "A",
                    data_validade: "2024-12-27",
                    data_ultima_calibracao: "2023-12-27",
                    frequencia_calibracao: 180
                }
            ];

            setAllData(mockData);

            startTransition(() => {
                let filtered = [...mockData];

                if (searchTerm) {
                    filtered = filtered.filter(item =>
                        item.nome_instrumento.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.tag.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }

                if (statusFilter !== "todos") {
                    filtered = filtered.filter(item => item.situacao === statusFilter);
                }

                if (tipoFilter !== "todos") {
                    filtered = filtered.filter(item => item.codigo_artigo === tipoFilter);
                }

                setInstrumentos(filtered);
                setIsLoading(false);

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

    const fetchInstrumentoById = useCallback(async (id: number) => {
        try {
            const mockInstrumento: InstrumentoMedicaoAPI = {
                id: id,
                tag: `TAG-${id}`,
                nome_instrumento: instrumentos.find(i => i.id === id)?.nome_instrumento || "",
                numero_serie: 10000 + id,
                numero_patrimonio: `PT-${id}`,
                codigo_artigo: `CA-${id}`,
                situacao: instrumentos.find(i => i.id === id)?.situacao || "A",
                data_validade: "2025-12-31",
                data_ultima_calibracao: instrumentos.find(i => i.id === id)?.data_ultima_calibracao || "",
                frequencia_calibracao: 365
            };

            return mockInstrumento;
        } catch (error) {
            console.error("Erro ao buscar instrumento:", error);
            setNotification("Erro ao buscar dados do instrumento.");
            return undefined;
        }
    }, [instrumentos]);

    const tipos = useMemo(() => [
        "CA-001", "CA-002", "CA-003", "CA-004", "CA-005",
        "CA-006", "CA-007", "CA-008"
    ], []);

    const handleView = useCallback(async (id: number) => {
        const instrumento = await fetchInstrumentoById(id);
        if (instrumento) {
            setSelectedInstrumento(instrumento);
            setIsModalOpen(true);
            setNotification(`Visualizando detalhes do instrumento de medição ${id}.`);
        }
    }, [fetchInstrumentoById]);

    const handleEdit = useCallback(async (id: number) => {
        const instrumento = await fetchInstrumentoById(id);
        if (instrumento) {
            setSelectedInstrumento(instrumento);
            setIsModalOpen(true);
            setNotification(`Iniciando edição do instrumento de medição ${id}.`);
        }
    }, [fetchInstrumentoById]);

    const handleDelete = useCallback((id: number) => {
        if (confirm('Tem certeza que deseja excluir este instrumento de medição?')) {
            setNotification(`Instrumento de medição ${id} excluído com sucesso.`);
            setInstrumentos(prev => prev.filter(instrumento => instrumento.id !== id));
        }
    }, []);

    const handleCreateNew = useCallback(() => {
        setSelectedInstrumento(undefined);
        setIsModalOpen(true);
        setNotification("Iniciando cadastro de novo instrumento de medição.");
    }, []);

    const handleModalSuccess = useCallback((data: InstrumentoMedicaoAPI) => {
        loadData();
        setNotification(`Instrumento de medição ${data.id ? 'atualizado' : 'criado'} com sucesso.`);
    }, [loadData]);

    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setStatusFilter("todos");
        setTipoFilter("todos");
        setNotification("Filtros resetados.");
    }, []);

    const filterOptions = useMemo(() => {
        const statusOptions: FilterOption[] = [
            { value: "todos", label: "Todos os status" },
            { value: "A", label: "Ativos", color: "bg-green-100 text-green-800" },
            { value: "I", label: "Inativos", color: "bg-red-100 text-red-800" },
        ];

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
                case "A":
                    label = "Ativos";
                    color = "bg-green-100 text-green-800";
                    break;
                case "I":
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

    const getStatusClass = useCallback((status: string) => {
        switch (status) {
            case 'A':
                return 'bg-green-100 text-green-800';
            case 'I':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }, []);

    const getStatusLabel = useCallback((status: string) => {
        switch (status) {
            case 'A':
                return 'Ativo';
            case 'I':
                return 'Inativo';
            default:
                return status;
        }
    }, []);

    const tableColumns = useMemo(() => [
        {
            key: "tag",
            title: "Tag",
            render: (instrumento: InstrumentoMedicaoUI) => (
                <span className="text-sm font-medium text-gray-900">{instrumento.tag}</span>
            ),
        },
        {
            key: "nome_instrumento",
            title: "Nome",
            render: (instrumento: InstrumentoMedicaoUI) => (
                <div className="text-sm text-gray-900 max-w-md truncate">{instrumento.nome_instrumento}</div>
            ),
        },
        {
            key: "codigo_artigo",
            title: "Código Artigo",
            render: (instrumento: InstrumentoMedicaoUI) => (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {instrumento.codigo_artigo}
                </span>
            ),
        },
        {
            key: "numero_serie",
            title: "Número Série",
            render: (instrumento: InstrumentoMedicaoUI) => (
                <span className="text-sm text-gray-500">
                    {instrumento.numero_serie}
                </span>
            ),
        },
        {
            key: "situacao",
            title: "Situação",
            render: (instrumento: InstrumentoMedicaoUI) => (
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(instrumento.situacao)}`}>
                    {getStatusLabel(instrumento.situacao)}
                </span>
            ),
        },
        {
            key: "calibracao",
            title: "Calibração",
            render: (instrumento: InstrumentoMedicaoUI) => (
                <div className="text-sm text-gray-500">
                    <div>Última: {new Date(instrumento.data_ultima_calibracao).toLocaleDateString('pt-BR')}</div>
                    <div>Próxima: {new Date(instrumento.data_validade).toLocaleDateString('pt-BR')}</div>
                </div>
            ),
        },
        {
            key: "acoes",
            title: "Ações",
            render: (instrumento: InstrumentoMedicaoUI) => (
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
            <div className="sr-only" role="status" aria-live="polite">
                {notification}
            </div>

            <PageHeader
                title="Instrumentos de Medição"
                buttonLabel="Novo Instrumento"
                onButtonClick={handleCreateNew}
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
            />

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

            <InstrumentoMedicaoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                instrumento={selectedInstrumento}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
}
