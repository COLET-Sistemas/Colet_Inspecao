"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { DataCards } from "@/components/ui/cadastros/DataCards";
import { DataTable } from "@/components/ui/cadastros/DataTable";
import { EmptyState } from "@/components/ui/cadastros/EmptyState";
import { FilterPanel, ViewMode } from "@/components/ui/cadastros/FilterPanel";
import { ConfirmDeleteModal } from "@/components/ui/cadastros/modais_cadastros/ConfirmDeleteModal";
import { CotaCaracteristicaModal } from "@/components/ui/cadastros/modais_cadastros/CotaCaracteristicaModal";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { Tooltip } from "@/components/ui/cadastros/Tooltip";
import { LoadingSpinner } from "@/components/ui/Loading";
import { RestrictedAccess } from "@/components/ui/RestrictedAccess";
import { deleteCotaCaracteristica, getCotasCaracteristicas } from "@/services/api/cotasCaracteristicasService";
import { AlertState, CotaCaracteristica } from "@/types/cadastros/cotaCaracteristica";
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

// Helpers para tipo e stringValue
const getTipoLabel = (tipo: string) => {
    switch (tipo) {
        case 'O': return 'Cota';
        case 'A': return 'Característica';
        default: return 'Outro';
    }
};
const getTipoClass = (tipo: string) => {
    switch (tipo) {
        case 'O': return 'bg-blue-100 text-blue-800';
        case 'A': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};
const stringValue = (value: string | boolean | null | undefined): string => {
    return value !== undefined && value !== null ? String(value).toLowerCase() : '';
};

// Card component for list item
const Card = React.memo(({ cota, onEdit, onDelete }: {
    cota: CotaCaracteristica;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}) => {
    const renderSvg = () => {
        if (!cota.simbolo_path_svg) return (
            <div className="flex items-center justify-center p-2 mb-3 rounded-lg bg-gray-50 border border-gray-100 shadow-sm min-h-[56px]">
                <span className="text-xs text-gray-400 italic">Sem símbolo</span>
            </div>
        );
        return (
            <div className="flex items-center justify-center p-2 mb-3 rounded-lg bg-gray-50 border border-gray-100 shadow-sm">
                <svg
                    viewBox="0 0 100 100"
                    width="56"
                    height="56"
                    className="overflow-visible"
                    dangerouslySetInnerHTML={{ __html: cota.simbolo_path_svg }}
                />
            </div>
        );
    };
    return (
        <div className="group bg-white border border-gray-100 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col h-full">
            <div className="flex-1 flex flex-col p-5">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-lg truncate" title={cota.descricao}>{cota.descricao}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ml-3 ${getTipoClass(cota.tipo)}`}>{getTipoLabel(cota.tipo)}</span>
                </div>
                {renderSvg()}
                <div className="flex flex-wrap gap-4 mt-1.5 mb-1 items-center justify-between">
                    {/* Unidade de medida */}
                    <div className="flex flex-col items-center min-w-[80px]">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            Unidade
                        </span>
                        <span className="text-sm text-gray-700 font-semibold mt-0.5">{cota.unidade_medida || '-'}</span>
                    </div>
                    {/* Rejeita menor */}
                    <div className="flex flex-col items-center min-w-[80px]">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            Rejeita menor
                        </span>
                        <span className={`text-xs font-semibold mt-0.5 px-2 py-0.5 rounded-full ${['s', 'S'].includes(stringValue(cota.rejeita_menor)) ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                            {['s', 'S'].includes(stringValue(cota.rejeita_menor)) ? "Sim" : ['n', 'N'].includes(stringValue(cota.rejeita_menor)) ? "Não" : "-"}
                        </span>
                    </div>
                    {/* Rejeita maior */}
                    <div className="flex flex-col items-center min-w-[80px]">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            Rejeita maior
                        </span>
                        <span className={`text-xs font-semibold mt-0.5 px-2 py-0.5 rounded-full ${['s', 'S'].includes(stringValue(cota.rejeita_maior)) ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                            {['s', 'S'].includes(stringValue(cota.rejeita_maior)) ? "Sim" : ['n', 'N'].includes(stringValue(cota.rejeita_maior)) ? "Não" : "-"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    {cota.tipo === "O" ? (
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                Local inspeção:   {cota.local_inspecao === "P" ? "Produção" :
                                    cota.local_inspecao === "Q" ? "Qualidade" :
                                        cota.local_inspecao === "*" ? "Ambos" : "-"}
                            </span>
                        </div>
                    ) : <div />}
                    <div className="flex gap-1.5 ml-auto">
                        <Tooltip text="Editar">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-1 cursor-pointer"
                                onClick={() => onEdit(cota.id)}
                                aria-label="Editar"
                            >
                                <Pencil className="h-4 w-4" />
                            </motion.button>
                        </Tooltip>
                        <Tooltip text="Excluir">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-1 cursor-pointer"
                                onClick={() => onDelete(cota.id)}
                                aria-label="Excluir"
                            >
                                <Trash2 className="h-4 w-4" />
                            </motion.button>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </div>
    );
});

Card.displayName = 'CotaCaracteristicaCard';

export default function CotasCaracteristicasPage() {
    // Restrição de acesso para Gestor
    const authLoading = false;
    const hasPermission = (permission: string) => {
        try {
            const userDataStr = localStorage.getItem("userData") || sessionStorage.getItem("userData");
            if (!userDataStr) return false;
            const userData = JSON.parse(userDataStr);
            if (!userData || !userData.perfil_inspecao) return false;
            return userData.perfil_inspecao.includes(permission);
        } catch {
            return false;
        }
    };
    // State for filters
    const [searchTerm, setSearchTerm] = useState("");
    const [tipoFilter, setTipoFilter] = useState<string>("todos");
    const [localInspecaoFilter, setLocalInspecaoFilter] = useState<string>("todos");
    const [isPending, startTransition] = useTransition();
    // View toggle state
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    // State for data and loading
    const [cotasCaracteristicas, setCotasCaracteristicas] = useState<CotaCaracteristica[]>([]);
    const [allData, setAllData] = useState<CotaCaracteristica[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeFilters, setActiveFilters] = useState(0);
    const [apiError, setApiError] = useState<string | null>(null);
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCotaCaracteristica, setSelectedCotaCaracteristica] = useState<CotaCaracteristica | undefined>(undefined);
    // Delete modal states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    // Alert state para mensagens de sucesso fora do modal
    const [alert, setAlert] = useState<AlertState>({ message: null, type: "success" });
    // ARIA Live region for screen readers
    const [notification, setNotification] = useState('');    // Utilize uma ref para controlar se a requisição já foi feita
    const dataFetchedRef = useRef(false);

    // Limpar alerta
    const clearAlert = useCallback(() => {
        setAlert({ message: null, type: "success" });
    }, []);

    // Calculate active filters
    useEffect(() => {
        let count = 0;
        if (searchTerm) count++;
        if (tipoFilter !== "todos") count++;
        if (localInspecaoFilter !== "todos") count++;
        setActiveFilters(count);
    }, [searchTerm, tipoFilter, localInspecaoFilter]);    // Função para carregar dados memoizada para evitar recriação desnecessária
    const loadData = useCallback(async () => {
        setIsLoading(true);
        setApiError(null);
        try {
            const data = await getCotasCaracteristicas();
            setAllData(data);
        } catch (error) {
            setApiError(`Falha ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        dataFetchedRef.current = false;
        loadData();
        setNotification("Atualizando dados...");
    }, [loadData]);

    // Carrega os dados iniciais quando o componente é montado
    useEffect(() => {
        if (dataFetchedRef.current === false) {
            dataFetchedRef.current = true;
            loadData();
        }
    }, [loadData]);

    // Effect para filtrar dados quando os filtros mudam
    useEffect(() => {
        if (allData.length > 0) {
            startTransition(() => {
                const filterData = () => {
                    if (!searchTerm && tipoFilter === "todos" && localInspecaoFilter === "todos") {
                        return allData;
                    }
                    return allData.filter(item => {
                        const matchesSearch = !searchTerm ||
                            item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.unidade_medida && item.unidade_medida.toLowerCase().includes(searchTerm.toLowerCase()));
                        const matchesTipo = tipoFilter === "todos" || item.tipo === tipoFilter;
                        const matchesLocalInspecao = localInspecaoFilter === "todos" || item.local_inspecao === localInspecaoFilter;
                        return matchesSearch && matchesTipo && matchesLocalInspecao;
                    });
                };
                setCotasCaracteristicas(filterData());
            });
        }
    }, [searchTerm, tipoFilter, localInspecaoFilter, allData]);

    const handleEdit = useCallback((id: number) => {
        const cotaToEdit = cotasCaracteristicas.find(cota => cota.id === id);
        if (cotaToEdit) {
            setSelectedCotaCaracteristica(cotaToEdit);
            setIsModalOpen(true);
            setNotification(`Iniciando edição da cota/característica ${id}.`);
        }
    }, [cotasCaracteristicas]);

    const handleDelete = useCallback((id: number) => {
        setDeletingId(id);
        setIsDeleteModalOpen(true);
        const cotaToDelete = cotasCaracteristicas.find(cota => cota.id === id);
        if (cotaToDelete) {
            setNotification(`Preparando para excluir a cota/característica: ${cotaToDelete.descricao}`);
        }
    }, [cotasCaracteristicas]); const confirmDelete = useCallback(async () => {
        if (deletingId === null) return;
        setIsDeleting(true);
        setNotification(`Excluindo cota/característica...`);
        try {
            await deleteCotaCaracteristica(deletingId);
            loadData();
            setIsDeleteModalOpen(false);
            setAlert({
                message: `Cota/característica excluída com sucesso!`,
                type: "success"
            });
            setNotification(`Cota/característica excluída com sucesso.`);
        } catch (error) {
            setIsDeleteModalOpen(false);
            setAlert({
                message: error instanceof Error ? error.message : 'Erro desconhecido ao excluir o registro',
                type: "error"
            });
            setNotification(`Erro ao excluir cota/característica: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
        } finally {
            setIsDeleting(false);
            setDeletingId(null);
        }
    }, [deletingId, loadData]);

    const handleCloseDeleteModal = useCallback(() => {
        setIsDeleteModalOpen(false);
        setDeletingId(null);
        setNotification("Exclusão cancelada.");
    }, []);

    const handleCreateNew = useCallback(() => {
        setSelectedCotaCaracteristica(undefined);
        setIsModalOpen(true);
    }, []);

    const handleModalSuccess = useCallback(async (data: CotaCaracteristica) => {
        if (selectedCotaCaracteristica) {
            setCotasCaracteristicas(prev => prev.map(item =>
                item.id === data.id ? data : item
            ));
            setAllData(prev => prev.map(item =>
                item.id === data.id ? data : item
            ));
            setAlert({
                message: `Cota/característica ${data.id} atualizada com sucesso!`,
                type: "success"
            });
            setNotification(`Cota/característica ${data.id} atualizada com sucesso.`);
        } else if (data) {
            setNotification(`Atualizando lista de cotas/características...`);
            await loadData();
            setAlert({
                message: `Nova cota/característica criada com sucesso!`,
                type: "success"
            });
            setNotification(`Nova cota/característica criada com sucesso.`);
        }
    }, [selectedCotaCaracteristica, loadData]);

    // Reset filters function
    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setTipoFilter("todos");
        setLocalInspecaoFilter("todos");
        setNotification("Filtros resetados.");
    }, []);

    // Close modal function
    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setTimeout(() => {
            setSelectedCotaCaracteristica(undefined);
        }, 200);
    }, []);

    // Prepare filter options for the FilterPanel component
    const filterOptions = useMemo(() => [
        {
            id: "tipo",
            label: "Tipo",
            value: tipoFilter,
            options: [
                { value: "todos", label: "Todos os tipos" },
                { value: "O", label: "Cota", color: "bg-blue-100 text-blue-800" },
                { value: "A", label: "Característica", color: "bg-green-100 text-green-800" },
            ],
            onChange: setTipoFilter,
        },
        {
            id: "localInspecao",
            label: "Local de Inspeção",
            value: localInspecaoFilter,
            options: [
                { value: "todos", label: "Todos" },
                { value: "P", label: "Produção", color: "bg-blue-100 text-blue-800" },
                { value: "Q", label: "Qualidade", color: "bg-green-100 text-green-800" },
                { value: "*", label: "Ambos", color: "bg-purple-100 text-purple-800" },
            ],
            onChange: setLocalInspecaoFilter,
        },
    ], [tipoFilter, localInspecaoFilter]);

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
        if (tipoFilter !== "todos") {
            let label, color;
            switch (tipoFilter) {
                case "O":
                    label = "Cota";
                    color = "bg-blue-100 text-blue-800";
                    break;
                case "A":
                    label = "Característica";
                    color = "bg-green-100 text-green-800";
                    break;
                default:
                    label = tipoFilter;
                    color = "bg-gray-100 text-gray-800";
            }
            filters.push({
                id: "tipo",
                value: tipoFilter,
                label,
                color,
            });
        }
        if (localInspecaoFilter !== "todos") {
            let label, color;
            switch (localInspecaoFilter) {
                case "P":
                    label = "Produção";
                    color = "bg-blue-100 text-blue-800";
                    break;
                case "Q":
                    label = "Qualidade";
                    color = "bg-green-100 text-green-800";
                    break;
                case "*":
                    label = "Ambos";
                    color = "bg-purple-100 text-purple-800";
                    break;
                default:
                    label = localInspecaoFilter;
                    color = "bg-gray-100 text-gray-800";
            }
            filters.push({
                id: "localInspecao",
                value: localInspecaoFilter,
                label,
                color,
            });
        }
        return filters;
    }, [searchTerm, tipoFilter, localInspecaoFilter]);

    // Table columns configuration
    const tableColumns = useMemo(() => [
        {
            key: "simbolo",
            title: "Símbolo",
            render: (item: { id: string | number }) => {
                const cota = item as CotaCaracteristica;
                return (
                    <div className="flex items-center justify-center">
                        {cota.simbolo_path_svg ? (
                            <svg
                                viewBox="0 0 100 100"
                                width="40"
                                height="40"
                                className="overflow-visible"
                                dangerouslySetInnerHTML={{ __html: cota.simbolo_path_svg }}
                            />
                        ) : (
                            <span className="text-xs text-gray-400 italic">Sem símbolo</span>
                        )}
                    </div>
                );
            },
        },
        {
            key: "descricao",
            title: "Descrição",
            render: (item: { id: string | number }) => {
                const cota = item as CotaCaracteristica;
                return (
                    <div className="text-sm text-gray-900 max-w-md truncate">{cota.descricao}</div>
                );
            },
        },
        {
            key: "unidade_medida",
            title: "Unidade de Medida",
            render: (item: { id: string | number }) => {
                const cota = item as CotaCaracteristica;
                return (
                    <div className="text-sm text-gray-500 max-w-md truncate">
                        {cota.unidade_medida || "-"}
                    </div>
                );
            },
        },
        {
            key: "tipo",
            title: "Tipo",
            render: (item: { id: string | number }) => {
                const cota = item as CotaCaracteristica;
                return (
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTipoClass(cota.tipo)}`}>
                        {getTipoLabel(cota.tipo)}
                    </span>
                );
            },
        },
        {
            key: "rejeita_menor",
            title: "Rejeita Menor",
            render: (item: { id: string | number }) => {
                const cota = item as CotaCaracteristica;
                const strValue = stringValue(cota.rejeita_menor);
                const isRejeita = ['s', 'S'].includes(strValue);
                return (
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isRejeita ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {['s', 'S'].includes(strValue) ? "Sim" : ['n', 'N'].includes(strValue) ? "Não" : "-"}
                    </span>
                );
            },
        },
        {
            key: "rejeita_maior",
            title: "Rejeita Maior",
            render: (item: { id: string | number }) => {
                const cota = item as CotaCaracteristica;
                const strValue = stringValue(cota.rejeita_maior);
                const isRejeita = ['s', 'S'].includes(strValue);
                return (
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isRejeita ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {['s', 'S'].includes(strValue) ? "Sim" : ['n', 'N'].includes(strValue) ? "Não" : "-"}
                    </span>
                );
            },
        },
        {
            key: "local_inspecao",
            title: "Local de Inspeção",
            render: (item: { id: string | number }) => {
                const cota = item as CotaCaracteristica;
                if (cota.tipo !== "O") return <span className="text-xs text-gray-400">-</span>;
                return (
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-700`}>
                        {cota.local_inspecao === "P" ? "Produção" :
                            cota.local_inspecao === "Q" ? "Qualidade" :
                                cota.local_inspecao === "*" ? "Ambos" : "-"}
                    </span>
                );
            },
        },
        {
            key: "acoes",
            title: "Ações",
            render: (item: { id: string | number }) => {
                const cota = item as CotaCaracteristica;
                return (
                    <div className="flex items-center justify-end gap-2">
                        <Tooltip text="Editar">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-1 cursor-pointer"
                                onClick={() => handleEdit(cota.id)}
                                aria-label="Editar"
                            >
                                <Pencil className="h-4 w-4" />
                            </motion.button>
                        </Tooltip>
                        <Tooltip text="Excluir">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-1 cursor-pointer"
                                onClick={() => handleDelete(cota.id)}
                                aria-label="Excluir"
                            >
                                <Trash2 className="h-4 w-4" />
                            </motion.button>
                        </Tooltip>
                    </div>
                );
            },
        },
    ], [handleEdit, handleDelete]);

    if (!hasPermission('G')) {
        return (
            <RestrictedAccess
                hasPermission={hasPermission('G')}
                isLoading={authLoading}
                customMessage="Esta página está disponível apenas para usuários com permissão de Gestor."
                redirectTo="/dashboard"
                redirectDelay={2000}
            />
        );
    }

    return (
        <div className="space-y-5 p-2 sm:p-4 md:p-6 mx-auto">
            {/* ARIA Live region for accessibility */}
            <div className="sr-only" role="status" aria-live="polite">
                {notification}
            </div>
            <AlertMessage
                message={alert.message}
                type={alert.type}
                onDismiss={clearAlert}
                autoDismiss={true}
                dismissDuration={5000}
            />
            <CotaCaracteristicaModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                cotaCaracteristica={selectedCotaCaracteristica}
                onSuccess={handleModalSuccess}
                onError={(errorMessage) => {
                    setAlert({
                        message: errorMessage,
                        type: "error"
                    });
                    setNotification(`Erro: ${errorMessage}`);
                }}
            />
            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
                title="Confirmar Exclusão"
                message={
                    deletingId !== null
                        ? `Você está prestes a excluir permanentemente a cota/característica:`
                        : "Deseja realmente excluir este item?"
                }
                itemName={
                    deletingId !== null
                        ? cotasCaracteristicas.find(cota => cota.id === deletingId)?.descricao
                        : undefined
                }
            />
            <PageHeader
                title="Cotas e Características Especiais"
                subtitle="Cadastro e edição de cotas e características especiais"
                buttonLabel="Nova Cota/Característica"
                onButtonClick={handleCreateNew}
                buttonDisabled={false}
                showButton={true}
            />
            <FilterPanel
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Buscar por descrição ou unidade de medida..."
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filters={filterOptions}
                activeFilters={activeFilters}
                onResetFilters={resetFilters}
                selectedFilters={selectedFiltersForDisplay}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
            />
            <div className="bg-white p-4 rounded-lg shadow-sm">
                {isLoading ? (
                    <LoadingSpinner text="Carregando cotas e características..." color="primary" size="medium" />
                ) : apiError ? (
                    <EmptyState
                        icon={<svg className="w-12 h-12 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        title="Ocorreu um erro"
                        description={apiError}
                        primaryAction={{
                            label: "Tentar novamente",
                            onClick: handleRefresh
                        }}
                    />
                ) : isPending ? (
                    <LoadingSpinner text="Carregando cotas e características..." color="primary" size="medium" />
                ) : cotasCaracteristicas.length === 0 ? (
                    <EmptyState
                        icon={<svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>}
                        title="Nenhuma cota ou característica encontrada"
                        description="Não existem cotas ou características cadastradas que atendam aos critérios de filtro."
                        primaryAction={{
                            label: activeFilters > 0 ? "Limpar filtros" : "Criar primeira cota/característica",
                            onClick: activeFilters > 0 ? resetFilters : handleCreateNew
                        }}
                    />
                ) : viewMode === "table" ? (
                    <DataTable
                        data={cotasCaracteristicas}
                        columns={tableColumns}
                    />
                ) : (
                    <DataCards
                        data={cotasCaracteristicas}
                        itemsPerRow={4}
                        renderCard={(cota) => (
                            <Card
                                key={cota.id}
                                cota={cota as CotaCaracteristica}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        )}
                    />
                )}
            </div>
        </div>
    );
}