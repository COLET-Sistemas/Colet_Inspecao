import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronDown,
    LayoutGrid,
    LayoutList,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";
import React, { useState } from "react";
// Update import path to use absolute path from project root
import { Tooltip } from "@/components/ui/cadastros/Tooltip";

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
    selectedFilters?: {
        id: string;
        value: string;
        label: string;
        color?: string;
    }[];
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
    selectedFilters = [],
}: FilterPanelProps) {
    const [showFilters, setShowFilters] = useState(false);

    // Debounce search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onSearchChange(value);
    };

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
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-[#1ABC9C] focus:border-[#1ABC9C] text-sm transition-shadow duration-200"
                                defaultValue={searchTerm}
                                onChange={handleSearchChange}
                                aria-label="Buscar"
                            />
                        </div>
                    </div>

                    {/* Action buttons container */}
                    <div className="flex flex-nowrap gap-2 shrink-0">
                        {/* Advanced filters toggle button */}
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]/50"
                        >
                            <SlidersHorizontal size={16} className="mr-2" />
                            <span className="whitespace-nowrap">Filtros</span>
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
                                    onClick={() => onViewModeChange("table")}
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
                                    onClick={() => onViewModeChange("card")}
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
                                                    className="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-[#1ABC9C] focus:border-[#1ABC9C] text-sm bg-white transition-shadow duration-200 w-full"
                                                    value={filter.value}
                                                    onChange={(e) => filter.onChange(e.target.value)}
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

                                    {activeFilters > 0 && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={onResetFilters}
                                            className="flex items-center justify-center px-3 py-2 mt-auto text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors self-end"
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
