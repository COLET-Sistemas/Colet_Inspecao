"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { LoadingSpinner } from "@/components/ui/Loading";
import { RestrictedAccess } from "@/components/ui/RestrictedAccess";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import definicaoService from "@/services/api/definicaoService";
import { InspectionItem } from "@/services/api/inspecaoService";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    Calendar,
    FileText,
    Layers,
    MapPin,
    Package,
    RefreshCw,
    Tag
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function DefinicoesPage() {
    const router = useRouter();
    const [definicoesData, setDefinicoesData] = useState<InspectionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | "warning" | "info">("error");
    const [postosText, setPostosText] = useState<string>("");
    const [hasQPermission, setHasQPermission] = useState(false);
    const [isCheckingPermission, setIsCheckingPermission] = useState(true);

    // Função para formatar data e hora
    const formatDateTime = (dateTimeString: string): string => {
        try {
            let date: Date;

            if (dateTimeString.includes('/')) {
                const parts = dateTimeString.split(' ');
                const dateParts = parts[0].split('/');
                const timeParts = parts[1].split(':');

                date = new Date(
                    parseInt(dateParts[2]),
                    parseInt(dateParts[1]) - 1,
                    parseInt(dateParts[0]),
                    parseInt(timeParts[0]),
                    parseInt(timeParts[1]),
                    parseInt(timeParts[2] || '0')
                );
            } else {
                date = new Date(dateTimeString);
            }

            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateTimeString;
        }
    };

    // Função para ordenar os dados por prioridade
    const sortDataByPriority = useCallback((data: InspectionItem[]) => {
        const dataCopy = [...data];

        // Ordenar por prioridade: não conformes primeiro, depois por dias em atraso
        dataCopy.sort((a, b) => {
            // Primeiro critério: resultado da inspeção (não conforme tem prioridade)
            if (a.resultado_inspecao === "N" && b.resultado_inspecao !== "N") return -1;
            if (a.resultado_inspecao !== "N" && b.resultado_inspecao === "N") return 1;

            // Segundo critério: dias em atraso (mais antigo tem prioridade)
            const dataCriacaoA = new Date(a.data_hora_criacao);
            const dataCriacaoB = new Date(b.data_hora_criacao);
            return dataCriacaoA.getTime() - dataCriacaoB.getTime();
        });

        setDefinicoesData(dataCopy);
    }, []);

    // Verificar permissões do usuário
    useEffect(() => {
        try {
            const userDataStr = localStorage.getItem('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                if (userData?.perfil_inspecao) {
                    const perfil = userData.perfil_inspecao;
                    const hasQ = (typeof perfil === 'string' && perfil.includes('Q')) ||
                        (Array.isArray(perfil) && perfil.includes('Q'));
                    setHasQPermission(hasQ);
                }
            }
            setIsCheckingPermission(false);
        } catch (error) {
            console.error("Erro ao verificar permissões:", error);
            setIsCheckingPermission(false);
        }
    }, []);

    const handleManualRefresh = useCallback(async () => {
        if (!hasQPermission) return;

        setIsRefreshing(true);
        setIsLoading(true);
        setAlertMessage(null); // Limpa alertas anteriores

        try {
            // Obter postos do localStorage como nas outras páginas
            const postos = getPostosFromLocalStorage();

            // Obter dados do usuário para exibição
            const userDataStr = localStorage.getItem('userData');
            let userPostos: string[] = [];
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                if (userData?.postos && Array.isArray(userData.postos)) {
                    userPostos = userData.postos;
                }
            }

            // Montar texto para exibição
            if (userPostos.length > 0) {
                setPostosText(`Postos: ${userPostos.join(', ')}`);
            }

            // Buscar dados da API de definições usando o serviço especializado
            const data = await definicaoService.getFichasInspecaoDefinicoes(postos);

            // Ordenar dados por prioridade e atualizar estado
            sortDataByPriority(data);

            setLastRefresh(new Date());

            // Se ainda não houver dados após o refresh, mostra uma mensagem informativa
            setTimeout(() => {
                if (data.length === 0) {
                    setAlertMessage("Verificação concluída. Não há definições pendentes no momento.");
                    setAlertType("info");
                }
            }, 100);

        } catch (error) {
            console.error("Erro ao atualizar dados manualmente:", error);
            setAlertMessage("Erro ao verificar dados. Tente novamente em alguns instantes.");
            setAlertType("error");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [hasQPermission, sortDataByPriority]);

    // Função para obter postos do localStorage
    const getPostosFromLocalStorage = (): string[] => {
        try {
            const postosData = localStorage.getItem("postos-vinculados");
            if (!postosData) return [];

            const parsedData = JSON.parse(postosData);
            if (Array.isArray(parsedData)) return parsedData;
            if (Array.isArray(parsedData?.selectedPostos)) return parsedData.selectedPostos;
            return [];
        } catch {
            return [];
        }
    };

    // Função para carregar dados de definições - disponibilizada no escopo do componente
    const fetchData = useCallback(async () => {
        if (!hasQPermission) return;

        setIsRefreshing(true);
        setIsLoading(true);
        try {
            // Obter postos do localStorage como nas outras páginas
            const postos = getPostosFromLocalStorage();

            // Obter dados do usuário para exibição
            const userDataStr = localStorage.getItem('userData');
            let userPostos: string[] = [];
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                if (userData?.postos && Array.isArray(userData.postos)) {
                    userPostos = userData.postos;
                }
            }

            // Montar texto para exibição
            if (userPostos.length > 0) {
                setPostosText(`Postos: ${userPostos.join(', ')}`);
            }

            // Buscar dados da API de definições usando o serviço especializado
            const data = await definicaoService.getFichasInspecaoDefinicoes(postos);

            // Ordenar dados por prioridade e atualizar estado
            sortDataByPriority(data);

            setLastRefresh(new Date());
        } catch (error) {
            console.error("Erro ao carregar definições:", error);
            setAlertMessage("Erro ao carregar definições. Tente novamente mais tarde.");
            setAlertType("error");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [hasQPermission, sortDataByPriority]);

    // Carregar dados de definições
    useEffect(() => {
        fetchData();
    }, [hasQPermission, fetchData]);

    // Função para navegar para a tela de detalhes da definição
    const handleItemClick = (item: InspectionItem) => {
        router.push(`/definicoes/${item.id_ficha_inspecao}`);
    };

    return (
        <div className="space-y-5 p-2 sm:p-4 md:p-6 mx-auto">
            <RestrictedAccess
                hasPermission={hasQPermission}
                isLoading={isCheckingPermission}
                customMessage="Apenas usuários com perfil Qualidade (Q) podem acessar esta página."
                customTitle="Acesso Restrito"
                redirectTo="/dashboard"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 py-0 gap-3">
                <div className="flex-1">
                    <PageHeader
                        title="Listas de Definições"
                        subtitle={postosText}
                        infoSubtitle={
                            !isLoading && definicoesData.length > 0
                                ? `Todos os postos: ${definicoesData.length} inspeção${definicoesData.length > 1 ? 'es' : ''} pendente${definicoesData.length > 1 ? 's' : ''} para análise.`
                                : ""
                        }

                        showButton={false}
                        showRefreshButton={false}
                    />
                </div>
                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                    {/* Versão desktop com texto e indicador de última atualização */}
                    <div className="hidden sm:flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <span className="mr-1.5">Última atualização:</span>
                        <span className="font-medium text-gray-700">{lastRefresh.toLocaleTimeString('pt-BR')}</span>
                    </div>

                    {/* Botão para desktop */}
                    <button
                        onClick={fetchData}
                        disabled={isRefreshing}
                        className={`
                            hidden sm:flex relative items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm
                            ${isRefreshing
                                ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                                : "border-gray-200 bg-white text-gray-700 hover:border-[#1ABC9C] hover:bg-[#1ABC9C] hover:text-white hover:shadow-md"
                            }
                        `}
                        title="Atualizar dados"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        <span>
                            {isRefreshing ? "Atualizando..." : "Atualizar"}
                        </span>
                    </button>

                    {/* Botão apenas com ícone para mobile */}
                    <button
                        onClick={fetchData}
                        disabled={isRefreshing}
                        className={`
                            sm:hidden flex items-center justify-center h-10 w-10 rounded-full border transition-all duration-200 shadow-sm
                            ${isRefreshing
                                ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                                : "border-gray-200 bg-white text-gray-700 hover:border-[#1ABC9C] hover:bg-[#1ABC9C] hover:text-white"
                            }
                        `}
                        title="Atualizar dados"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {alertMessage && (
                <AlertMessage
                    message={alertMessage}
                    type={alertType}
                    onDismiss={() => setAlertMessage(null)}
                />
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="relative">
                        <LoadingSpinner
                            color="primary" size="medium" text="Carregando inspeções..."
                        />
                    </div>
                </div>
            ) : definicoesData.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-12 text-center sm:py-16"
                >
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm sm:h-24 sm:w-24">
                        <FileText className="h-8 w-8 text-gray-400 sm:h-10 sm:w-10" />
                    </div>
                    <h3 className="mt-6 text-lg font-semibold text-gray-900 sm:text-xl">Nenhuma definição encontrada</h3>
                    <p className="mt-2 px-4 text-sm text-gray-500 sm:text-base max-w-md mx-auto">Não há definições pendentes para os postos selecionados.</p>
                    <button
                        onClick={handleManualRefresh}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-[#1ABC9C] hover:border-[#1ABC9C]/30 focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]/20"
                    >
                        <RefreshCw className="h-4 w-4 transition-transform duration-300 hover:rotate-180" />
                        Verificar novamente
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                    className="space-y-3 overflow-hidden"
                >
                    {definicoesData.map((item: InspectionItem, index: number) => {
                        // Define cor baseada apenas no resultado da inspeção (N = Não conforme)
                        let bgColorClass = "border-gray-200 bg-white/60 hover:border-gray-300 hover:bg-white";

                        if (item.resultado_inspecao === "N") {
                            bgColorClass = "border-red-200 bg-red-50/80 hover:border-red-300 hover:bg-red-50";
                        }

                        return (
                            <motion.div
                                key={item.id_ficha_inspecao}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03, duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                                onClick={() => handleItemClick(item)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleItemClick(item);
                                    }
                                }}
                                tabIndex={0}
                                role="button"
                                aria-label={`Abrir definição ${item.tipo_inspecao} - OF: ${item.numero_ordem}`}
                                className={`group relative w-full overflow-hidden rounded-lg border ${bgColorClass} backdrop-blur-sm p-4 pr-0 transition-all duration-300 hover:shadow-md hover:shadow-gray-200/50 cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#1ABC9C]`}
                            >
                                {/* Cabeçalho do Card */}
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#e74c3c] to-[#c0392b] text-white text-sm font-semibold shadow-sm">

                                            {item.id_ficha_inspecao.toString().padStart(2, '0')}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#1ABC9C] transition-colors truncate">
                                                {item.tipo_inspecao}
                                            </h3>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-sm text-gray-600">
                                                <span className="flex items-center font-medium truncate">
                                                    <Tag className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                                    <span>OF:</span>
                                                    <span className="ml-1 font-semibold">#{item.numero_ordem}</span>
                                                </span>
                                                <span className="hidden sm:block text-gray-300">|</span>
                                                <span className="flex items-center">
                                                    <span className="truncate">{item.referencia}{item.produto && ` - ${item.produto}`}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status badges e informações temporais */}
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <div className="flex gap-1.5">
                                            <span className={`text-xs font-medium ${item.tipo_inspecao === "Nao Conformidade" ? "text-red-700 bg-red-50 border border-red-100" : "text-blue-700 bg-blue-50 border border-blue-100"
                                                } px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5`}>
                                                {item.resultado_inspecao === "N" && <AlertTriangle className="h-3 w-3" />}
                                                {item.tipo_inspecao}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Grid de informações detalhadas */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2 mt-2 pt-3 border-t border-gray-200 pr-0">
                                    <div className="lg:col-span-1">
                                        <div className="flex items-center">
                                            <Layers className="h-4 w-4 text-gray-500 mr-2" />
                                            <p className="text-xs font-medium text-gray-500 uppercase mr-1.5">Proc:</p>
                                            <p className="text-xs font-semibold text-gray-900">{item.processo}-{item.tipo_acao}</p>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-1">
                                        <div className="flex items-center">
                                            <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                                            <p className="text-xs font-medium text-gray-500 uppercase mr-1.5">Posto:</p>
                                            <p className="text-xs font-semibold text-gray-900">{item.codigo_posto}</p>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-1">
                                        <div className="flex items-center">
                                            <Tag className="h-4 w-4 text-gray-500 mr-2" />
                                            <p className="text-xs font-medium text-gray-500 uppercase mr-1.5">Origem:</p>
                                            <p className="text-xs font-semibold text-gray-900">{item.origem}</p>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-1 lg:pr-10">
                                        <div className="flex items-center">
                                            <Package className="h-4 w-4 text-gray-500 mr-2" />
                                            <p className="text-xs font-medium text-gray-500 uppercase mr-1.5">Qtde Prod / Insp:</p>
                                            <p className="text-xs font-semibold text-gray-900">{item.qtde_produzida || 0} / {item.qtde_inspecionada || 0}</p>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-1">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                                            <p className="text-xs font-medium text-gray-500 uppercase mr-1.5">Criado:</p>
                                            <p className="text-xs font-semibold text-gray-900">
                                                {formatDateTime(item.data_hora_criacao)}
                                            </p>
                                        </div>
                                    </div>


                                    {item.obs_criacao && item.obs_criacao.trim() !== "" && (
                                        <div className="col-span-2 sm:col-span-3 flex items-center mt-1 sm:mt-0">
                                            <div className="flex items-center max-w-full">
                                                <FileText className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                                                <p className="text-xs font-medium text-gray-500 uppercase mr-1.5">Obs:</p>
                                                <p className="text-xs font-semibold text-gray-900 line-clamp-1">
                                                    {item.obs_criacao}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Gradient overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1ABC9C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}