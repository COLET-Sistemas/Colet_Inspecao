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
import { useApiConfig } from "@/hooks/useApiConfig";
import { deleteCotaCaracteristica, getCotasCaracteristicas } from "@/services/api/cotasCaracteristicasService";
import { AlertState, CotaCaracteristica } from "@/types/cadastros/cotaCaracteristica";
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

// Card component for list item
const Card = React.memo(({ cota, onEdit, onDelete }: {
    cota: CotaCaracteristica;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}) => {
    const getTipoLabel = (tipo: string) => {
        switch (tipo) {
            case 'O':
            case 'A':
            default: return 'Outro';
        }
    };

    const getTipoClass = (tipo: string) => {
        switch (tipo) {
            case 'O':
            case 'A':
            default: return 'bg-gray-50 text-gray-700';
        }
    };    // Convert any value to string for comparison
    const stringValue = (value: string | boolean | null | undefined): string => {
        return value !== undefined && value !== null ? String(value).toLowerCase() : '';
    };

    // Renderiza o SVG de maneira segura, dentro de um wrapper SVG
    const renderSvg = () => {
        if (!cota.simbolo_path_svg) return null;

        return (
            <div className="flex items-center justify-center p-2 mb-2 border border-gray-100 rounded bg-gray-50">
                <svg
                    viewBox="0 0 100 100"
                    width="60"
                    height="60"
                    className="overflow-visible"
                    dangerouslySetInnerHTML={{ __html: cota.simbolo_path_svg }}
                />
            </div>
        );
    };

    return (
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all duration-300">
            <div className="p-4">
                <header className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">#{cota.id}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getTipoClass(cota.tipo)}`}>
                            {getTipoLabel(cota.tipo)}
                        </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{cota.descricao}</h3>
                </header>

                {renderSvg()}

                <div className="space-y-2 mt-3">
                    {cota.unidade_medida && (
                        <div className="text-sm">
                            <span className="font-medium text-gray-700">Unidade: </span>
                            <span className="text-gray-600">{cota.unidade_medida}</span>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                        <div className="text-sm">
                            <span className="font-medium text-gray-700">Rejeita menor: </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full 
                                ${['s', 'S'].includes(stringValue(cota.rejeita_menor))
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-700'}`}>
                                {['s', 'S'].includes(stringValue(cota.rejeita_menor))
                                    ? "Sim"
                                    : ['n', 'N'].includes(stringValue(cota.rejeita_menor))
                                        ? "Não"
                                        : "-"}
                            </span>
                        </div>                        <div className="text-sm">
                            <span className="font-medium text-gray-700">Rejeita maior: </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full 
                                ${['s', 'S'].includes(stringValue(cota.rejeita_maior))
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-700'}`}>
                                {['s', 'S'].includes(stringValue(cota.rejeita_maior))
                                    ? "Sim"
                                    : ['n', 'N'].includes(stringValue(cota.rejeita_maior))
                                        ? "Não"
                                        : "-"}
                            </span>
                        </div>

                        {cota.tipo === "O" && (
                            <div className="text-sm mt-1">
                                <span className="font-medium text-gray-700">Local de Inspeção: </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700`}>
                                    {cota.local_inspecao === "P" ? "Produção" :
                                        cota.local_inspecao === "Q" ? "Qualidade" :
                                            cota.local_inspecao === "*" ? "Ambos" : "-"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={() => onEdit(cota.id)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                        aria-label="Editar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(cota.id)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                        aria-label="Excluir"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                        </svg>
                    </button>
                </div>
            </div>        </div>
    );
});

// Add display name to the component
Card.displayName = 'CotaCaracteristicaCard';

export default function CotasCaracteristicasPage() {
    // Restrição de acesso para Gestor
    const authLoading = false; // Ajuste se necessário para loading real
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
    const [notification, setNotification] = useState('');

    // Utilize uma ref para controlar se a requisição já foi feita
    const dataFetchedRef = useRef(false);

    const { getAuthHeaders } = useApiConfig();

    // Calculate active filters
    useEffect(() => {
        let count = 0;
        if (searchTerm) count++;
        if (tipoFilter !== "todos") count++;
        setActiveFilters(count);
    }, [searchTerm, tipoFilter]);

    // Função para carregar dados memoizada para evitar recriação desnecessária
    const loadData = useCallback(async () => {
        setIsLoading(true);
        setApiError(null);

        try {
            const data = await getCotasCaracteristicas(getAuthHeaders());
            setAllData(data);
        } catch (error) {
            console.error("Erro ao buscar cotas e características:", error);
            setApiError(`Falha ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [getAuthHeaders]);

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
            // Usar startTransition para não bloquear a UI durante filtragens pesadas
            startTransition(() => {
                // Filtrar usando função memoizada para melhor performance
                const filterData = () => {
                    // Só realizar filtragem se houver filtros ativos
                    if (!searchTerm && tipoFilter === "todos") {
                        return allData;
                    }

                    return allData.filter(item => {
                        // Verificar texto de busca
                        const matchesSearch = !searchTerm ||
                            item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.unidade_medida && item.unidade_medida.toLowerCase().includes(searchTerm.toLowerCase()));

                        // Verificar filtro de tipo
                        const matchesTipo = tipoFilter === "todos" || item.tipo === tipoFilter;

                        return matchesSearch && matchesTipo;
                    });
                };

                // Atualizar o estado com os dados filtrados
                setCotasCaracteristicas(filterData());
            });
        }
    }, [searchTerm, tipoFilter, allData]);

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
    }, [cotasCaracteristicas]);

    const confirmDelete = useCallback(async () => {
        if (deletingId === null) return;

        setIsDeleting(true);
        setNotification(`Excluindo cota/característica...`);

        try {
            await deleteCotaCaracteristica(deletingId, getAuthHeaders());

            // Recarregar dados
            loadData();

            // Fechar modal de confirmação
            setIsDeleteModalOpen(false);

            // Mostrar mensagem de sucesso
            setAlert({
                message: `Cota/característica excluída com sucesso!`,
                type: "success"
            });

            setNotification(`Cota/característica excluída com sucesso.`);
        } catch (error) {
            console.error('Erro ao excluir cota/característica:', error);

            // Sempre fechar o modal em caso de erro
            setIsDeleteModalOpen(false);

            // Mostrar mensagem de erro
            setAlert({
                message: error instanceof Error ? error.message : 'Erro desconhecido ao excluir o registro',
                type: "error"
            });

            setNotification(`Erro ao excluir cota/característica: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
        } finally {
            setIsDeleting(false);
            setDeletingId(null);
        }
    }, [deletingId, getAuthHeaders, loadData]);

    const handleCloseDeleteModal = useCallback(() => {
        setIsDeleteModalOpen(false);
        setDeletingId(null);
        setNotification("Exclusão cancelada.");
    }, []);

    const handleCreateNew = useCallback(() => {
        setSelectedCotaCaracteristica(undefined); // Limpa qualquer seleção anterior
        setIsModalOpen(true);
    }, []);    // Callback quando o modal for bem-sucedido
    const handleModalSuccess = useCallback(async (data: CotaCaracteristica) => {
        console.log("Dados recebidos do modal:", data);

        // Atualizar o estado local com os dados recebidos do modal
        if (selectedCotaCaracteristica) {
            // Caso de edição - O modal já fez a chamada PUT, não precisamos repetir

            // Atualiza o item em ambas as listas de forma consistente, usando os dados retornados pelo modal
            setCotasCaracteristicas(prev => prev.map(item =>
                item.id === data.id ? data : item
            ));
            setAllData(prev => prev.map(item =>
                item.id === data.id ? data : item
            ));

            // Mostrar mensagem de sucesso na página
            setAlert({
                message: `Cota/característica ${data.id} atualizada com sucesso!`,
                type: "success"
            });

            // Para leitores de tela
            setNotification(`Cota/característica ${data.id} atualizada com sucesso.`);

        } else if (data) {
            // Caso de criação - O modal já fez a chamada POST
            console.log("Item criado com sucesso:", data);

            // Após criar o item, recarrega a lista completa com uma chamada GET
            try {
                setNotification(`Atualizando lista de cotas/características...`);

                // Recarregar dados completos do servidor após criação
                await loadData();

                // Mostrar mensagem de sucesso na página
                setAlert({
                    message: `Nova cota/característica criada com sucesso!`,
                    type: "success"
                });

                // Para leitores de tela
                setNotification(`Nova cota/característica criada com sucesso.`);
            } catch (error) {
                console.error("Erro ao atualizar lista após criar item:", error);

                // Como fallback, adiciona o item retornado pelo modal às listas locais
                setCotasCaracteristicas(prev => [...prev, data]);
                setAllData(prev => [...prev, data]);

                setAlert({
                    message: `Item criado com sucesso, mas houve um erro ao atualizar a lista.`,
                    type: "warning"
                });
            }
        }
    }, [selectedCotaCaracteristica, loadData]);

    // Reset filters function
    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setTipoFilter("todos");
        setNotification("Filtros resetados.");
    }, []);

    // Close modal function
    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        // Damos um tempo para a animação de saída do modal antes de limpar a seleção
        setTimeout(() => {
            setSelectedCotaCaracteristica(undefined);
        }, 200);
    }, []);

    // Limpar alerta
    const clearAlert = useCallback(() => {
        setAlert({ message: null, type: "success" });
    }, []);

    // Prepare filter options for the FilterPanel component
    const filterOptions = useMemo(() => {
        return [
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
        ];
    }, [tipoFilter]);

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

        return filters;
    }, [searchTerm, tipoFilter]);

    const getTipoLabel = useCallback((tipo: string) => {
        switch (tipo) {
            case 'O': return 'Cota';
            case 'A': return 'Característica';
            default: return 'Outro';
        }
    }, []);

    const getTipoClass = useCallback((tipo: string) => {
        switch (tipo) {
            case 'O': return 'bg-blue-100 text-blue-800';
            case 'A': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }, []);    // Helper function for consistent string conversion
    const stringValue = (value: string | boolean | null | undefined): string => {
        return value !== undefined && value !== null ? String(value).toLowerCase() : '';
    };

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
        }, {
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
        }, {
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
                                className="text-yellow-500 hover:bg-yellow-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:ring-offset-1 rounded p-1.5 cursor-pointer"
                                onClick={() => handleEdit(cota.id)}
                                aria-label="Editar"
                            >
                                <Pencil className="h-4 w-4" />
                            </motion.button>
                        </Tooltip>
                        <Tooltip text="Excluir">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="text-red-500 hover:bg-red-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-1 rounded p-1.5 cursor-pointer"
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
    ], [handleEdit, handleDelete, getTipoClass, getTipoLabel]);

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

            {/* Alerta para mensagens de sucesso */}
            <AlertMessage
                message={alert.message}
                type={alert.type}
                onDismiss={clearAlert}
                autoDismiss={true}
                dismissDuration={5000}
            />

            {/* Modal de Cota/Característica */}
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

            {/* Modal de confirmação de exclusão */}
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

            {/* Page Header Component */}
            <PageHeader
                title="Cotas e Características Especiais"
                subtitle="Cadastro e edição de cotas e características especiais"
                buttonLabel="Nova Cota/Característica"
                onButtonClick={handleCreateNew}
                buttonDisabled={false}
                showButton={true}
            />            {/* Filters Component */}
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

            {/* Data Container with Dynamic View */}
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
                    />) : isPending ? (
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
                    ) : (<DataCards
                        data={cotasCaracteristicas}
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