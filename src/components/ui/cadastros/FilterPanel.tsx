import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronDown,
    LayoutGrid,
    LayoutList,
    RefreshCw,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
// Update import path to use absolute path from project root
import { Tooltip } from "@/components/ui/cadastros/Tooltip";

// Hook para detectar tamanho da tela
const useMediaQuery = (query: string): boolean => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        const listener = () => setMatches(media.matches);
        media.addEventListener("change", listener);

        return () => media.removeEventListener("change", listener);
    }, [matches, query]);

    return matches;
};

// Componente condicional para renderizar Tooltip apenas em desktop
const ConditionalTooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
    // Detecta se o dispositivo é móvel ou tablet (width < 768px)
    const isMobileOrTablet = useMediaQuery('(max-width: 768px)');

    // Se for mobile ou tablet, retorna apenas o children sem o tooltip
    if (isMobileOrTablet) {
        return <>{children}</>;
    }

    // Se for desktop, retorna o Tooltip completo
    return <Tooltip text={text}>{children}</Tooltip>;
};

export type ViewMode = "table" | "card";
export type FilterOption = {
    value: string;
    label: string;
    color?: string;
};

interface FilterPanelProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    filters?: {
        id: string;
        label: string;
        value: string;
        options: FilterOption[];
        onChange: (value: string) => void;
    }[];
    activeFilters: number;
    onResetFilters: () => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    selectedFilters?: {
        id: string;
        value: string;
        label: string;
        color?: string;
    }[];
    sortField?: string;
    onSortFieldChange?: (field: string) => void;
    disableFilters?: boolean;
}

export function FilterPanel({
    searchTerm,
    onSearchChange,
    searchPlaceholder = "Buscar... (Ctrl+F)",
    viewMode,
    onViewModeChange,
    filters = [],
    activeFilters,
    onResetFilters,
    onRefresh,
    isRefreshing = false,
    selectedFilters = [],
    sortField,
    onSortFieldChange,
    disableFilters = false,
}: FilterPanelProps) {
    const [showFilters, setShowFilters] = useState(false);
    // Detecta se o dispositivo é móvel ou tablet (width < 768px)
    const isMobileOrTablet = useMediaQuery('(max-width: 768px)');

    // Debounce search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onSearchChange(value);
    };

    // Classe de botão comum para manter consistência de altura e estilo
    const buttonBaseClass = "flex items-center px-3 h-10 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]/50 cursor-pointer";

    // Classe específica para o botão de refresh para garantir dimensões consistentes
    const refreshButtonClass = `${buttonBaseClass} justify-center w-10`;

    // Classe para os botões de visualização (tabela/cards)
    const viewButtonClass = "flex items-center justify-center h-10 px-3 cursor-pointer";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-lg shadow p-3 sm:p-4"
        >
            <div className="flex flex-col space-y-4">
                <div className="flex flex-row flex-wrap justify-between items-center gap-3">
                    {/* Search input - modificado para ser mais responsivo */}
                    <div className="relative min-w-0 flex-1 max-w-full">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                id="search-input"
                                type="text"
                                placeholder={searchPlaceholder}
                                className="pl-10 pr-4 h-10 border border-gray-300 rounded-md w-full focus:ring-[#1ABC9C] focus:border-[#1ABC9C] text-sm transition-shadow duration-200"
                                defaultValue={searchTerm}
                                onChange={handleSearchChange}
                                title="Buscar"
                            />
                        </div>
                    </div>

                    {/* Action buttons container */}
                    <div className="flex flex-nowrap gap-2 shrink-0">
                        {/* Refresh button */}
                        {onRefresh && (
                            <ConditionalTooltip text="Atualizar dados">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={onRefresh}
                                    disabled={isRefreshing}
                                    className={`${refreshButtonClass} ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    aria-label="Atualizar lista"
                                >
                                    <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                                </motion.button>
                            </ConditionalTooltip>
                        )}                        {/* Advanced filters toggle button */}
                        <ConditionalTooltip text="Filtros avançados">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => !disableFilters && setShowFilters(!showFilters)}
                                disabled={disableFilters}
                                className={`${isMobileOrTablet ?
                                    `${buttonBaseClass} justify-center w-10` :
                                    buttonBaseClass} ${disableFilters ? 'opacity-50 cursor-not-allowed' : ''}`}
                                aria-label="Mostrar filtros avançados"
                            >
                                <SlidersHorizontal size={16} className={isMobileOrTablet ? "" : "mr-2"} />
                                {!isMobileOrTablet && (
                                    <span className="whitespace-nowrap">Filtros</span>
                                )}
                                {activeFilters > 0 && (
                                    <span className={`${isMobileOrTablet ? "ml-0" : "ml-2"} px-1.5 py-0.5 text-xs font-medium rounded-full bg-[#1ABC9C] text-white absolute ${isMobileOrTablet ? "-top-1 -right-1" : "relative"}`}>
                                        {activeFilters}
                                    </span>
                                )}
                            </motion.button>
                        </ConditionalTooltip>

                        {/* View toggle buttons */}
                        <div className="flex">
                            <ConditionalTooltip text="Visualização em tabela">
                                <div className="border border-gray-300 rounded-l-md overflow-hidden">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onViewModeChange("table")}
                                        className={`${viewButtonClass} ${viewMode === "table"
                                            ? "bg-gray-100 text-[#1ABC9C]"
                                            : "bg-white text-gray-600"
                                            } transition-colors duration-200`}
                                        aria-label="Ver como tabela"
                                    >
                                        <LayoutList size={18} />
                                    </motion.button>
                                </div>
                            </ConditionalTooltip>
                            <ConditionalTooltip text="Visualização em cards">
                                <div className="border border-gray-300 border-l-0 rounded-r-md overflow-hidden">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onViewModeChange("card")}
                                        className={`${viewButtonClass} ${viewMode === "card"
                                            ? "bg-gray-100 text-[#1ABC9C]"
                                            : "bg-white text-gray-600"
                                            } transition-colors duration-200`}
                                        aria-label="Ver como cards"
                                    >
                                        <LayoutGrid size={18} />
                                    </motion.button>
                                </div>
                            </ConditionalTooltip>
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
                                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-start">
                                    {filters.map((filter) => (
                                        <div key={filter.id} className="relative">
                                            <label
                                                htmlFor={`filter-${filter.id}`}
                                                className="block text-xs font-medium text-gray-700 mb-1 ml-1"
                                            >
                                                {filter.label}
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id={`filter-${filter.id}`}
                                                    className="appearance-none pl-3 pr-10 h-10 border border-gray-300 rounded-md focus:ring-[#1ABC9C] focus:border-[#1ABC9C] text-sm bg-white transition-shadow duration-200 w-full"
                                                    value={filter.value}
                                                    onChange={(e) => filter.onChange(e.target.value)}
                                                    aria-label={`Filtro de ${filter.label}`}
                                                >
                                                    {filter.options.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                    <ChevronDown className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Opções de ordenação */}
                                    {onSortFieldChange && (
                                        <div className="relative">
                                            <label
                                                htmlFor="sort-field"
                                                className="block text-xs font-medium text-gray-700 mb-1 ml-1"
                                            >
                                                Ordenar por
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="sort-field"
                                                    className="appearance-none pl-3 pr-10 h-10 border border-gray-300 rounded-md focus:ring-[#1ABC9C] focus:border-[#1ABC9C] text-sm bg-white transition-shadow duration-200 w-full"
                                                    value={sortField}
                                                    onChange={(e) => onSortFieldChange(e.target.value)}
                                                    aria-label="Ordenar por campo"
                                                >
                                                    <option value="operador">ID do Operador</option>
                                                    <option value="nome_operador">Nome Operador</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                    <ChevronDown className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeFilters > 0 && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={onResetFilters}
                                            className="flex items-center justify-center px-3 h-10 mt-auto text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors self-end cursor-pointer"
                                            aria-label="Limpar todos os filtros"
                                        >
                                            <X size={16} className="mr-1" />
                                            Limpar filtros
                                        </motion.button>
                                    )}
                                </div>

                                {/* Display of currently selected filters */}
                                {selectedFilters.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {selectedFilters.map((filter) => (
                                            <div
                                                key={filter.id}
                                                className={`px-3 py-1 text-xs rounded-full inline-flex items-center gap-1 ${filter.color || "bg-blue-100 text-blue-800"
                                                    } font-medium`}
                                            >
                                                {filter.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
