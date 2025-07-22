"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { LoadingSpinner } from "@/components/ui/Loading";
import { RestrictedAccess } from "@/components/ui/RestrictedAccess";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import definicaoService from "@/services/api/definicaoService";
import { InspectionItem } from "@/services/api/inspecaoService";
import { motion } from "framer-motion";
import { AlertCircle, FileText, RefreshCw } from "lucide-react";
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
            setDefinicoesData(data);
            setLastRefresh(new Date());
        } catch (error) {
            console.error("Erro ao carregar definições:", error);
            setAlertMessage("Erro ao carregar definições. Tente novamente mais tarde.");
            setAlertType("error");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [hasQPermission, setAlertMessage, setAlertType, setDefinicoesData, setIsLoading, setIsRefreshing, setLastRefresh, setPostosText]);

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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-0 py-0 gap-3">
                <div className="flex-1">
                    <PageHeader
                        title="Listas de Definições"
                        subtitle={postosText}
                        infoSubtitle={!isLoading && definicoesData.length > 0 ? `Resumo do totalizador: ${definicoesData.length} item(ns) pendente(s) para análise` : ""}
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

            {/* Status summary section */}
            {!isLoading && definicoesData.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-gray-800">Status das Definições</h3>
                            <p className="text-gray-600">Total de {definicoesData.length} definição(ões) aguardando análise</p>
                        </div>
                        <div className="flex items-center gap-4 mt-3 md:mt-0">
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                                <span className="text-sm text-gray-600">Aguardando</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                                <span className="text-sm text-gray-600">Em análise</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-green-500"></span>
                                <span className="text-sm text-gray-600">Finalizada</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center h-60">
                    <LoadingSpinner size="large" />
                </div>
            ) : definicoesData.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-center mb-2">
                        <AlertCircle size={48} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700">Nenhuma definição encontrada</h3>
                    <p className="text-gray-500">Não há definições pendentes para os postos selecionados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {definicoesData.map((item) => (
                        <motion.div
                            key={item.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white p-4 rounded-lg shadow cursor-pointer border border-gray-200 hover:border-blue-500 transition-all relative overflow-hidden"
                            onClick={() => handleItemClick(item)}
                        >
                            {/* Status indicator strip */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>

                            <div className="flex items-start mb-2 pl-2">
                                <div className="bg-amber-100 p-2 rounded-lg mr-3">
                                    <FileText size={24} className="text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-lg">{item.referencia}</h3>
                                    <p className="text-gray-600 text-sm">Lote: {item.numero_lote}</p>
                                </div>
                            </div>

                            <div className="pl-2">
                                <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full w-fit mb-2">
                                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                    <span>Aguardando definição</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-2 mt-2 pl-2">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-gray-500">Processo:</p>
                                        <p className="font-medium">{item.processo}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Operação:</p>
                                        <p className="font-medium">{item.operacao}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Posto:</p>
                                        <p className="font-medium">{item.codigo_posto}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Criado em:</p>
                                        <p className="font-medium">{new Date(item.data_hora_criacao).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Priority/age indicator */}
                            <div className="absolute top-2 right-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Prioridade
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
