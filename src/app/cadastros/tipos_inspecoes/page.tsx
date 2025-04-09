"use client";

import { LoadingSpinner } from "@/components/ui/Loading";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronDown,
    Eye,
    LayoutGrid,
    LayoutList,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    X
} from "lucide-react";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Virtuoso } from 'react-virtuoso';

// Update the interfaces to match Virtuoso's expected component props
// Make children optional to match Virtuoso's expected props
interface ListComponentProps extends React.HTMLAttributes<HTMLDivElement> {
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

interface TableComponentProps extends React.HTMLAttributes<HTMLTableElement> {
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

interface TipoInspecao {
    id: number;
    codigo: string;
    descricao: string;
    categoria: string;
    status: "ativo" | "inativo";
    dataCriacao: string;
}

// Componente de Tooltip para melhorar feedback visual
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showTooltip = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsVisible(true), 300);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    return (
        <div className="relative inline-block" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onFocus={showTooltip} onBlur={hideTooltip}>
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded shadow-lg -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                        style={{ pointerEvents: 'none' }}
                    >
                        {text}
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Memoized Table Row component to prevent unnecessary re-renders
const TableRow = memo(({ tipo, onView, onEdit, onDelete }: {
    tipo: TipoInspecao;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}) => (
    <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="hover:bg-gray-50"
    >
        <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm font-medium text-gray-900">{tipo.codigo}</span>
        </td>
        <td className="px-6 py-4">
            <div className="text-sm text-gray-900 max-w-md truncate">{tipo.descricao}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                {tipo.categoria}
            </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tipo.status === 'ativo'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
                }`}>
                {tipo.status === 'ativo' ? 'Ativo' : 'Inativo'}
            </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm text-gray-500">
                {new Date(tipo.dataCriacao).toLocaleDateString('pt-BR')}
            </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex items-center justify-end gap-2">
                <Tooltip text="Visualizar">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1 rounded p-1"
                        onClick={() => onView(tipo.id)}
                        aria-label="Visualizar"
                    >
                        <Eye className="h-4 w-4" />
                    </motion.button>
                </Tooltip>

                <Tooltip text="Editar">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="text-[#1ABC9C] hover:text-[#16A085] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]/30 focus:ring-offset-1 rounded p-1"
                        onClick={() => onEdit(tipo.id)}
                        aria-label="Editar"
                    >
                        <Pencil className="h-4 w-4" />
                    </motion.button>
                </Tooltip>

                <Tooltip text="Excluir">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="text-red-500 hover:text-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-1 rounded p-1"
                        onClick={() => onDelete(tipo.id)}
                        aria-label="Excluir"
                    >
                        <Trash2 className="h-4 w-4" />
                    </motion.button>
                </Tooltip>
            </div>
        </td>
    </motion.tr>
));
TableRow.displayName = 'TableRow';

// Memoized Card component
const Card = memo(({ tipo, onView, onEdit, onDelete }: {
    tipo: TipoInspecao;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all duration-300"
    >
        <div className="p-4">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        {tipo.codigo}
                    </span>
                </div>
                <span className={`px-2 py-0.5 text-xs leading-5 font-medium rounded-full ${tipo.status === 'ativo'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                    }`}>
                    {tipo.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
            </div>

            <h3 className="text-base font-medium text-gray-800 mb-2 line-clamp-2">
                {tipo.descricao}
            </h3>

            <div className="flex justify-between items-end mt-3">
                <div className="flex flex-col space-y-1">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 inline-block w-fit">
                        {tipo.categoria}
                    </span>
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
    </motion.div>
));
Card.displayName = 'Card';

export default function TiposInspecoesPage() {
    // State for filters
    const [searchTerm, setSearchTerm] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('tiposInspecaoSearchTerm') || "";
        }
        return "";
    });
    const [statusFilter, setStatusFilter] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('tiposInspecaoStatusFilter') || "todos";
        }
        return "todos";
    });
    const [categoriaFilter, setCategoriaFilter] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('tiposInspecaoCategoriaFilter') || "todas";
        }
        return "todas";
    });

    const [isPending, startTransition] = useTransition();
    const [showFilters, setShowFilters] = useState(false);

    // View toggle state with localStorage persistence
    const [viewMode, setViewMode] = useState<"table" | "card">(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('tiposInspecaoViewMode') as "table" | "card" || "table";
        }
        return "table";
    });

    // State for data and pagination
    const [tiposInspecao, setTiposInspecao] = useState<TipoInspecao[]>([]);
    const [allData, setAllData] = useState<TipoInspecao[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState(0);

    // ARIA Live region for screen readers
    const [notification, setNotification] = useState('');

    // Save user preferences to localStorage
    useEffect(() => {
        localStorage.setItem('tiposInspecaoViewMode', viewMode);
        localStorage.setItem('tiposInspecaoSearchTerm', searchTerm);
        localStorage.setItem('tiposInspecaoStatusFilter', statusFilter);
        localStorage.setItem('tiposInspecaoCategoriaFilter', categoriaFilter);
    }, [viewMode, searchTerm, statusFilter, categoriaFilter]);

    // Calculate active filters
    useEffect(() => {
        let count = 0;
        if (searchTerm) count++;
        if (statusFilter !== "todos") count++;
        if (categoriaFilter !== "todas") count++;
        setActiveFilters(count);
    }, [searchTerm, statusFilter, categoriaFilter]);

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
                // Focus on the "Novo Tipo de Inspeção" button
                document.getElementById('new-inspection-button')?.click();
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
                    descricao: "Inspeção de Qualidade Padrão",
                    categoria: "Qualidade",
                    status: "ativo",
                    dataCriacao: "2023-06-15"
                },
                {
                    id: 2,
                    codigo: "INSP-002",
                    descricao: "Inspeção de Segurança Maquinário",
                    categoria: "Segurança",
                    status: "ativo",
                    dataCriacao: "2023-07-22"
                },
                {
                    id: 3,
                    codigo: "INSP-003",
                    descricao: "Inspeção de Manutenção Preventiva",
                    categoria: "Manutenção",
                    status: "ativo",
                    dataCriacao: "2023-08-10"
                },
                {
                    id: 4,
                    codigo: "INSP-004",
                    descricao: "Inspeção de Conformidade Regulatória",
                    categoria: "Conformidade",
                    status: "inativo",
                    dataCriacao: "2023-09-05"
                },
                {
                    id: 5,
                    codigo: "INSP-005",
                    descricao: "Inspeção de Procedimentos Operacionais",
                    categoria: "Operacional",
                    status: "ativo",
                    dataCriacao: "2023-10-18"
                },
                {
                    id: 6,
                    codigo: "INSP-006",
                    descricao: "Inspeção de Equipamentos de Proteção",
                    categoria: "Segurança",
                    status: "ativo",
                    dataCriacao: "2023-11-03"
                },
                {
                    id: 7,
                    codigo: "INSP-007",
                    descricao: "Inspeção de Qualidade de Matéria-Prima",
                    categoria: "Qualidade",
                    status: "ativo",
                    dataCriacao: "2023-11-15"
                },
                {
                    id: 8,
                    codigo: "INSP-008",
                    descricao: "Inspeção de Processos de Fabricação",
                    categoria: "Operacional",
                    status: "inativo",
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

                if (categoriaFilter !== "todas") {
                    filtered = filtered.filter(item => item.categoria === categoriaFilter);
                }

                setTiposInspecao(filtered);
                setTotalPages(Math.ceil(filtered.length / 10));
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
    }, [searchTerm, statusFilter, categoriaFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Debounce search input - optimized with useRef
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setSearchTerm(value);
        }, 300);
    };

    // List of unique categories for filter dropdown - memoized
    const categorias = useMemo(() => ["Qualidade", "Segurança", "Manutenção", "Conformidade", "Operacional"], []);

    // Handle CRUD operations with feedback
    const handleView = useCallback((id: number) => {
        console.log(`Visualizando tipo de inspeção ${id}`);
        setNotification(`Visualizando detalhes do tipo de inspeção ${id}.`);
        // Implementar a lógica de visualização
    }, []);

    const handleEdit = useCallback((id: number) => {
        console.log(`Editando tipo de inspeção ${id}`);
        setNotification(`Iniciando edição do tipo de inspeção ${id}.`);
        // Implementar a lógica de edição
    }, []);

    const handleDelete = useCallback((id: number) => {
        console.log(`Excluindo tipo de inspeção ${id}`);
        // Aqui você pode implementar um modal de confirmação
        if (confirm('Tem certeza que deseja excluir este tipo de inspeção?')) {
            setNotification(`Tipo de inspeção ${id} excluído com sucesso.`);
            // Implementar a lógica de exclusão
            setTiposInspecao(prev => prev.filter(tipo => tipo.id !== id));
        }
    }, []);

    // Reset filters function
    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setStatusFilter("todos");
        setCategoriaFilter("todas");
        setNotification("Filtros resetados.");
    }, []);

    // Function to render card view with virtualization - memoized
    const renderCardView = useMemo(() => {
        // Para evitar problemas de layout com virtualização e grid,
        // vamos agrupar os itens em linhas para a virtualização
        const itemsPerRow = {
            'sm': 2,  // 2 cards por linha em telas pequenas
            'lg': 3   // 3 cards por linha em telas grandes
        };

        // Versão simples sem virtualização para conjuntos de dados pequenos
        if (tiposInspecao.length < 100) {
            return (
                <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tiposInspecao.map((tipo) => (
                            <Card
                                key={`card-${tipo.id}`}
                                tipo={tipo}
                                onView={handleView}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </div>
            );
        }

        // Versão com virtualização para conjuntos maiores de dados
        return (
            <div className="w-full p-4">
                <Virtuoso
                    totalCount={tiposInspecao.length}
                    itemContent={(index) => {
                        const tipo = tiposInspecao[index];
                        return (
                            <div className="mb-4">
                                <Card
                                    tipo={tipo}
                                    onView={handleView}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            </div>
                        );
                    }}
                    style={{ height: 'auto' }}
                    components={{
                        // Use the updated interface with proper typing
                        List: React.forwardRef<HTMLDivElement, ListComponentProps>(({ style, children, ...rest }, ref) => (
                            <div
                                ref={ref}
                                style={{ ...style, height: 'auto' }}
                                {...rest}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {children}
                            </div>
                        ))
                    }}
                />
            </div>
        );
    }, [tiposInspecao, handleView, handleEdit, handleDelete]);

    // Function to render table view - memoized and fixed
    const renderTableView = useMemo(() => (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Código
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descrição
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoria
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data de Criação
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {tiposInspecao.map((tipo) => (
                        <TableRow
                            key={`row-${tipo.id}`}
                            tipo={tipo}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    ), [tiposInspecao, handleView, handleEdit, handleDelete]);

    // Opção alternativa com virtualização - ative caso precise virtualizar grandes listas
    const renderTableViewVirtualized = useMemo(() => {
        // Este componente personalizado será usado para renderizar os itens virtualizados
        const VirtualizedTableItem = (index: number) => {
            const tipo = tiposInspecao[index];
            return (
                <TableRow
                    key={`row-virtualized-${tipo.id}`}
                    tipo={tipo}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            );
        };

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Código
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Descrição
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Categoria
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Data de Criação
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                </table>

                {/* Instead of trying to virtualize a table directly, we'll virtualize a div and render rows inside it */}
                <div className="virtualized-table-body bg-white">
                    <Virtuoso
                        totalCount={tiposInspecao.length}
                        style={{ height: 'auto' }} // Dynamic height instead of fixed
                        itemContent={index => {
                            const tipo = tiposInspecao[index];
                            // For each item, we'll render a div styled to look like a table row
                            return (
                                <div key={`row-virtualized-${tipo.id}`} className="border-b border-gray-200">
                                    <table className="min-w-full">
                                        <tbody>
                                            <TableRow
                                                tipo={tipo}
                                                onView={handleView}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                            />
                                        </tbody>
                                    </table>
                                </div>
                            );
                        }}
                    />
                </div>
            </div>
        );
    }, [tiposInspecao, handleView, handleEdit, handleDelete]);

    return (
        <div className="space-y-5 p-2 sm:p-4 md:p-6 mx-auto">
            {/* ARIA Live region for accessibility */}
            <div className="sr-only" role="status" aria-live="polite">
                {notification}
            </div>

            {/* Page header with title and actions */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Tipos de Inspeções</h1>
                <motion.button
                    id="new-inspection-button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center bg-[#1ABC9C] hover:bg-[#16A085] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md shadow-sm transition-colors duration-200 w-full sm:w-auto justify-center focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]/70 focus:ring-offset-2"
                    onClick={() => console.log("Novo tipo de inspeção")}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Novo Tipo de Inspeção</span>
                </motion.button>
            </motion.div>

            {/* Filters section - responsive with animations */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white rounded-lg shadow p-3 sm:p-4"
            >
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-wrap justify-between items-center">
                        {/* Search input */}
                        <div className="w-full md:w-auto flex-1 md:mr-4 mb-4 md:mb-0">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    id="search-input"
                                    type="text"
                                    placeholder="Buscar por código ou descrição... (Ctrl+F)"
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-[#1ABC9C] focus:border-[#1ABC9C] text-sm transition-shadow duration-200"
                                    defaultValue={searchTerm}
                                    onChange={handleSearchChange}
                                    aria-label="Buscar tipos de inspeção"
                                />
                            </div>
                        </div>

                        {/* Advanced filters toggle button */}
                        <div className="flex space-x-2">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]/50"
                            >
                                <SlidersHorizontal size={16} className="mr-2" />
                                <span>Filtros</span>
                                {activeFilters > 0 && (
                                    <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-[#1ABC9C] text-white">
                                        {activeFilters}
                                    </span>
                                )}
                            </motion.button>

                            {/* View toggle buttons */}
                            <div className="flex border border-gray-300 rounded-md overflow-hidden">
                                <Tooltip text="Visualização em tabela">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setViewMode("table")}
                                        className={`flex items-center px-3 py-2 ${viewMode === "table"
                                            ? "bg-gray-100 text-[#1ABC9C]"
                                            : "bg-white text-gray-600"
                                            } transition-colors duration-200`}
                                        aria-label="Ver como tabela"
                                    >
                                        <LayoutList size={18} />
                                    </motion.button>
                                </Tooltip>
                                <Tooltip text="Visualização em cards">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setViewMode("card")}
                                        className={`flex items-center px-3 py-2 ${viewMode === "card"
                                            ? "bg-gray-100 text-[#1ABC9C]"
                                            : "bg-white text-gray-600"
                                            } transition-colors duration-200`}
                                        aria-label="Ver como cards"
                                    >
                                        <LayoutGrid size={18} />
                                    </motion.button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    {/* Expanded filters - animated */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-2 border-t border-gray-200 mt-2">
                                    <div className="flex flex-wrap gap-3 items-center">
                                        <div className="relative">
                                            <label htmlFor="status-filter" className="block text-xs font-medium text-gray-700 mb-1 ml-1">
                                                Status
                                            </label>
                                            <select
                                                id="status-filter"
                                                className="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-[#1ABC9C] focus:border-[#1ABC9C] text-sm bg-white transition-shadow duration-200"
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                            >
                                                <option value="todos">Todos os status</option>
                                                <option value="ativo">Ativos</option>
                                                <option value="inativo">Inativos</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 top-6">
                                                <ChevronDown className="h-4 w-4" />
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <label htmlFor="categoria-filter" className="block text-xs font-medium text-gray-700 mb-1 ml-1">
                                                Categoria
                                            </label>
                                            <select
                                                id="categoria-filter"
                                                className="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-[#1ABC9C] focus:border-[#1ABC9C] text-sm bg-white transition-shadow duration-200"
                                                value={categoriaFilter}
                                                onChange={(e) => setCategoriaFilter(e.target.value)}
                                            >
                                                <option value="todas">Todas as categorias</option>
                                                {categorias.map(categoria => (
                                                    <option key={categoria} value={categoria}>{categoria}</option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 top-6">
                                                <ChevronDown className="h-4 w-4" />
                                            </div>
                                        </div>

                                        {activeFilters > 0 && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={resetFilters}
                                                className="flex items-center px-3 py-2 mt-6 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                            >
                                                <X size={16} className="mr-1" />
                                                Limpar filtros
                                            </motion.button>
                                        )}
                                    </div>

                                    {/* Exibição dos filtros atualmente selecionados */}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {statusFilter !== 'todos' && (
                                            <div className={`px-3 py-1 text-xs rounded-full inline-flex items-center gap-1
                                                ${statusFilter === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} font-medium`}
                                            >
                                                {statusFilter === 'ativo' ? 'Ativos' : 'Inativos'}
                                            </div>
                                        )}

                                        {categoriaFilter !== 'todas' && (
                                            <div className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium inline-flex items-center gap-1">
                                                {categoriaFilter}
                                            </div>
                                        )}

                                        {searchTerm && (
                                            <div className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-medium inline-flex items-center gap-1">
                                                <span>Pesquisa:</span>
                                                <span className="font-normal">{`"${searchTerm}"`}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Data display - table or card view with animations */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-white rounded-lg shadow overflow-hidden"
            >
                {isLoading || isPending ? (
                    <div className="flex items-center justify-center min-h-[300px] w-full">
                        <LoadingSpinner
                            size="medium"
                            text="Carregando dados..."
                            color="primary"
                        />
                    </div>
                ) : tiposInspecao.length > 0 ? (
                    <AnimatePresence mode="wait">
                        {viewMode === "table" ? renderTableView : renderCardView}

                        {/* Statistics and filters summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="border-t border-gray-200 px-4 py-3 bg-gray-50 text-sm text-gray-500"
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <p>
                                    Mostrando <span className="font-medium text-gray-700">{tiposInspecao.length}</span> de{" "}
                                    <span className="font-medium text-gray-700">{allData.length}</span> tipos de inspeção
                                </p>
                                {activeFilters > 0 && (
                                    <button
                                        onClick={resetFilters}
                                        className="text-[#1ABC9C] hover:text-[#16A085] text-sm font-medium flex items-center transition-colors"
                                    >
                                        <X size={14} className="mr-1" />
                                        Limpar {activeFilters} filtro{activeFilters > 1 ? 's' : ''}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-center py-12 px-4 sm:px-6 lg:px-8"
                    >
                        <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                <SlidersHorizontal className="h-8 w-8 text-gray-500" strokeWidth={1.5} />
                            </div>

                            <motion.h3
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mt-3 text-lg font-medium text-gray-900"
                            >
                                Nenhum resultado encontrado
                            </motion.h3>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mt-2 text-sm text-gray-500 max-w-sm mx-auto"
                            >
                                Não encontramos tipos de inspeção que correspondam aos seus filtros atuais.
                            </motion.p>

                            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="px-4 py-2.5 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 shadow-sm transition-all"
                                    onClick={resetFilters}
                                >
                                    Limpar filtros
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    type="button"
                                    className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-[#1ABC9C] hover:bg-[#16A085] shadow-md shadow-[#1ABC9C]/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1ABC9C] transition-all"
                                    onClick={() => console.log("Novo tipo de inspeção")}
                                >
                                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Novo Tipo de Inspeção
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
