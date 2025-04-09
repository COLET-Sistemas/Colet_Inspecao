"use client";

import { LoadingSpinner } from "@/components/ui/Loading";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    LayoutGrid,
    LayoutList,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState, useTransition } from "react";

interface TipoInspecao {
    id: number;
    codigo: string;
    descricao: string;
    categoria: string;
    status: "ativo" | "inativo";
    dataCriacao: string;
}

// Memoized Table Row component to prevent unnecessary re-renders
const TableRow = memo(({ tipo }: { tipo: TipoInspecao }) => (
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
            <div className="text-sm text-gray-900">{tipo.descricao}</div>
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
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="text-blue-600 hover:text-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1 rounded p-1"
                    title="Visualizar"
                >
                    <Eye className="h-4 w-4" />
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="text-[#1ABC9C] hover:text-[#16A085] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]/30 focus:ring-offset-1 rounded p-1"
                    title="Editar"
                >
                    <Pencil className="h-4 w-4" />
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="text-red-500 hover:text-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-1 rounded p-1"
                    title="Excluir"
                >
                    <Trash2 className="h-4 w-4" />
                </motion.button>
            </div>
        </td>
    </motion.tr>
));
TableRow.displayName = 'TableRow';

// Memoized Card component
const Card = memo(({ tipo }: { tipo: TipoInspecao }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white border border-gray-100 rounded-lg shadow-sm transition-all duration-300"
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
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                        title="Visualizar"
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        className="p-1.5 rounded-md text-[#1ABC9C] hover:bg-[#1ABC9C]/5"
                        title="Editar"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
                        title="Excluir"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </motion.button>
                </div>
            </div>
        </div>
    </motion.div>
));
Card.displayName = 'Card';

export default function TiposInspecoesPage() {
    // State for filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("todos");
    const [categoriaFilter, setCategoriaFilter] = useState<string>("todas");
    const [isPending, startTransition] = useTransition();

    // View toggle state with localStorage persistence
    const [viewMode, setViewMode] = useState<"table" | "card">(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('tiposInspecaoViewMode') as "table" | "card" || "table";
        }
        return "table";
    });

    // State for data and pagination
    const [tiposInspecao, setTiposInspecao] = useState<TipoInspecao[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    // Save view preference to localStorage
    useEffect(() => {
        localStorage.setItem('tiposInspecaoViewMode', viewMode);
    }, [viewMode]);

    // Mock data and filtering
    useEffect(() => {
        const loadData = () => {
            setIsLoading(true);

            // Simulate API loading delay
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
                    }
                ];

                startTransition(() => {
                    // Apply filters
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
                });
            }, 600);

            return () => clearTimeout(timer);
        };

        loadData();
    }, [searchTerm, statusFilter, categoriaFilter]);

    // Debounce search input
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const timer = setTimeout(() => {
            setSearchTerm(value);
        }, 300);

        return () => clearTimeout(timer);
    }, []);

    // List of unique categories for filter dropdown
    const categorias = useMemo(() => ["Qualidade", "Segurança", "Manutenção", "Conformidade", "Operacional"], []);

    // Function to render card view - memoized
    const renderCardView = useMemo(() => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
        >
            <AnimatePresence>
                {tiposInspecao.map((tipo) => (
                    <Card key={tipo.id} tipo={tipo} />
                ))}
            </AnimatePresence>
        </motion.div>
    ), [tiposInspecao]);

    // Function to render table view - memoized
    const renderTableView = useMemo(() => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-x-auto"
        >
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
                    <AnimatePresence>
                        {tiposInspecao.map((tipo) => (
                            <TableRow key={tipo.id} tipo={tipo} />
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>
        </motion.div>
    ), [tiposInspecao]);

    return (
        <div className="space-y-6 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
            {/* Page header with title and actions */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Tipos de Inspeções</h1>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center bg-[#1ABC9C] hover:bg-[#16A085] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md shadow-sm transition-colors duration-200 w-full sm:w-auto justify-center"
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
                    {/* Search input */}
                    <div className="w-full">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por código ou descrição..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-[#1ABC9C] focus:border-[#1ABC9C] text-sm transition-shadow duration-200"
                                defaultValue={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>

                    {/* Filters and view toggle - responsive layout */}
                    <div className="flex flex-wrap justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                            <div className="relative">
                                <select
                                    className="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-[#1ABC9C] focus:border-[#1ABC9C] text-sm bg-white transition-shadow duration-200"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="todos">Todos os status</option>
                                    <option value="ativo">Ativos</option>
                                    <option value="inativo">Inativos</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </div>

                            <div className="relative">
                                <select
                                    className="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-[#1ABC9C] focus:border-[#1ABC9C] text-sm bg-white transition-shadow duration-200"
                                    value={categoriaFilter}
                                    onChange={(e) => setCategoriaFilter(e.target.value)}
                                >
                                    <option value="todas">Todas as categorias</option>
                                    {categorias.map(categoria => (
                                        <option key={categoria} value={categoria}>{categoria}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </div>
                        </div>

                        {/* View toggle buttons */}
                        <div className="flex border border-gray-300 rounded-md overflow-hidden ml-auto">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setViewMode("table")}
                                className={`flex items-center px-3 py-2 ${viewMode === "table"
                                    ? "bg-gray-100 text-[#1ABC9C]"
                                    : "bg-white text-gray-600"
                                    } transition-colors duration-200`}
                                aria-label="Ver como tabela"
                                title="Ver como tabela"
                            >
                                <LayoutList size={18} />
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setViewMode("card")}
                                className={`flex items-center px-3 py-2 ${viewMode === "card"
                                    ? "bg-gray-100 text-[#1ABC9C]"
                                    : "bg-white text-gray-600"
                                    } transition-colors duration-200`}
                                aria-label="Ver como cards"
                                title="Ver como cards"
                            >
                                <LayoutGrid size={18} />
                            </motion.button>
                        </div>
                    </div>
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

                        {/* Pagination */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
                        >
                            <div className="flex-1 flex justify-between sm:hidden">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    disabled={currentPage <= 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Anterior
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    disabled={currentPage >= totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Próxima
                                </motion.button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Mostrando <span className="font-medium">1</span> a <span className="font-medium">{tiposInspecao.length}</span> de{" "}
                                        <span className="font-medium">{tiposInspecao.length}</span> resultados
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginação">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                            disabled={currentPage <= 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <span className="sr-only">Anterior</span>
                                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                        </motion.button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`relative inline-flex items-center px-4 py-2 border ${currentPage === page
                                                    ? 'bg-[#1ABC9C] text-white border-[#1ABC9C]'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    } text-sm font-medium transition-colors`}
                                            >
                                                {page}
                                            </motion.button>
                                        ))}
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                            disabled={currentPage >= totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <span className="sr-only">Próxima</span>
                                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                        </motion.button>
                                    </nav>
                                </div>
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
                                Não encontramos tipos de inspeção que correspondam aos seus filtros atuais. Tente ajustar seus critérios de busca ou adicione um novo.
                            </motion.p>

                            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="px-4 py-2.5 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 shadow-sm transition-all"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setStatusFilter("todos");
                                        setCategoriaFilter("todas");
                                    }}
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
