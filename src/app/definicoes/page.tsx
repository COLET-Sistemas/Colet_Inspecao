"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { LoadingSpinner } from "@/components/ui/Loading";
import { RestrictedAccess } from "@/components/ui/RestrictedAccess";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import definicaoService from "@/services/api/definicaoService";
import { InspectionItem } from "@/services/api/inspecaoService";
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

            {/* Sem filtros e controles */}

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
                <div className="overflow-x-auto">
                    <table className="w-full bg-white rounded-lg shadow">
                        <thead className="bg-gray-50 text-gray-700 text-sm sticky top-0">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium">ID Ficha</th>
                                <th className="py-3 px-4 text-left font-medium">OF</th>
                                <th className="py-3 px-4 text-left font-medium">Produto/Referência</th>
                                <th className="py-3 px-4 text-left font-medium">Processo/Operação</th>
                                <th className="py-3 px-4 text-left font-medium">Posto</th>
                                <th className="py-3 px-4 text-left font-medium">Status</th>
                                <th className="py-3 px-4 text-left font-medium">Criado em</th>
                                <th className="py-3 px-4 text-left font-medium">Inspeção</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {definicoesData.map((item) => {
                                // Calcula dias desde a data de criação
                                const dataCriacao = new Date(item.data_hora_criacao);
                                const hoje = new Date();
                                const diasAtrasados = Math.floor((hoje.getTime() - dataCriacao.getTime()) / (1000 * 3600 * 24));

                                // Define cor baseada no resultado da inspeção (N = Não conforme) e dias atrasados
                                const statusColor = item.resultado_inspecao === "N" ? "red" : "amber";
                                const isPriority = diasAtrasados > 5 || item.resultado_inspecao === "N";


                                return (
                                    <tr
                                        key={item.id_ficha_inspecao}
                                        className={`hover:bg-gray-50 cursor-pointer border-l-4 transition-colors duration-200 ${isPriority
                                            ? item.resultado_inspecao === "N"
                                                ? "border-l-red-500"
                                                : "border-l-amber-500"
                                            : "border-l-transparent"
                                            }`}
                                        onClick={() => handleItemClick(item)}
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-md bg-${statusColor}-100 shadow-sm`}>
                                                    <FileText size={18} className={`text-${statusColor}-600`} />
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-3 px-4">
                                            <div>
                                                <span className="font-medium text-gray-800">{item.numero_ordem || "N/A"}</span>
                                                {item.numero_lote !== "0" && (
                                                    <p className="text-xs text-gray-500 mt-0.5">Lote: {item.numero_lote}</p>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-3 px-4">
                                            <div className="max-w-xs">
                                                <div className="flex items-center">
                                                    <p className="truncate text-sm font-medium text-gray-800" title={item.produto || ""}>
                                                        {item.produto || "Sem descrição do produto"}
                                                    </p>
                                                </div>
                                                <div className="mt-1 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                                                    <p className="text-xs text-blue-700 font-medium truncate" title={item.referencia || ""}>
                                                        {item.referencia || "Sem referência"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-3 px-4">
                                            <div className="text-sm">
                                                <p className="text-gray-800 font-medium">{item.processo}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-[150px]" title={`${item.operacao} - ${item.tipo_acao}`}>
                                                    {item.operacao} {item.tipo_acao ? `- ${item.tipo_acao}` : ''}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="py-3 px-4">
                                            <div className="flex items-center">
                                                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 shadow-sm">
                                                    {item.codigo_posto}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="py-3 px-4">
                                            <div className="flex flex-col gap-1.5">

                                                {diasAtrasados > 0 && (
                                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${diasAtrasados > 5 ? "text-red-700 bg-red-50 border border-red-100" : "text-amber-700 bg-amber-50 border border-amber-100"
                                                        } px-2.5 py-1 rounded-md max-w-fit shadow-sm`}>
                                                        <span className="whitespace-nowrap">{diasAtrasados} {diasAtrasados === 1 ? 'dia' : 'dias'}</span>
                                                    </div>
                                                )}

                                                <span className={`text-xs font-medium ${item.tipo_inspecao === "Nao Conformidade" ? "text-red-700 bg-red-50 border border-red-100" : "text-blue-700 bg-blue-50 border border-blue-100"
                                                    } px-2.5 py-1 rounded-md max-w-fit shadow-sm`}>
                                                    {item.tipo_inspecao}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="py-3 px-4">
                                            <div className="text-sm">
                                                <p className="font-medium text-gray-800">
                                                    {new Date(item.data_hora_criacao).toLocaleDateString('pt-BR')}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(item.data_hora_criacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-0.5 italic">
                                                    {item.nome_pessoa_criacao}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="py-3 px-4">
                                            <div className="flex flex-col gap-1.5 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Produzida:</span>
                                                    <span className="font-medium text-gray-800">{item.qtde_produzida}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Inspecionada:</span>
                                                    <span className="font-medium text-gray-800">{item.qtde_inspecionada}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
