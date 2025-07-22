"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { LoadingSpinner } from "@/components/ui/Loading";
import { RestrictedAccess } from "@/components/ui/RestrictedAccess";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import definicaoService from "@/services/api/definicaoService";
import { InspectionItem } from "@/services/api/inspecaoService";
import { ArrowLeft, Clock, FileCheck, FileText, Tag } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DefinicaoDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [definicao, setDefinicao] = useState<InspectionItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | "warning" | "info">("error");
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

    // Carregar dados da definição específica
    useEffect(() => {
        if (!hasQPermission) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Obter postos do localStorage como nas outras páginas
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

                const postos = getPostosFromLocalStorage();

                // Buscar a definição específica pelo ID com o filtro de postos
                const foundDefinicao = await definicaoService.getFichaInspecaoById(parseInt(id), postos);

                if (foundDefinicao) {
                    setDefinicao(foundDefinicao);
                } else {
                    setAlertMessage("Definição não encontrada ou você não tem permissão para visualizá-la.");
                    setAlertType("error");
                }
            } catch (error) {
                console.error("Erro ao carregar detalhes da definição:", error);
                setAlertMessage("Erro ao carregar detalhes. Tente novamente mais tarde.");
                setAlertType("error");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [hasQPermission, id]);

    const handleBack = () => {
        router.back();
    };

    // Formatar data para exibição
    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div className="flex items-center">
                    <button
                        onClick={handleBack}
                        className="mr-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <PageHeader
                        title="Detalhes da Definição"
                        subtitle={definicao ? `Ficha: ${definicao.id_ficha_inspecao}` : "Carregando..."}
                        showButton={false}
                    />
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
                <div className="flex justify-center items-center h-60">
                    <LoadingSpinner size="large" />
                </div>
            ) : definicao ? (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText size={28} className="text-blue-600" />
                                <h2 className="text-xl font-semibold">Informações Básicas</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-gray-500 text-sm">Referência</p>
                                    <p className="font-medium">{definicao.referencia}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Número de Lote</p>
                                    <p className="font-medium">{definicao.numero_lote || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Roteiro</p>
                                    <p className="font-medium">{definicao.roteiro || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Origem</p>
                                    <p className="font-medium">{definicao.origem || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Processo</p>
                                    <p className="font-medium">{definicao.processo}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Operação</p>
                                    <p className="font-medium">{definicao.operacao}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Posto</p>
                                    <p className="font-medium">{definicao.codigo_posto}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Tipo de Inspeção</p>
                                    <p className="font-medium">{definicao.tipo_inspecao}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock size={28} className="text-blue-600" />
                                <h2 className="text-xl font-semibold">Datas e Responsáveis</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-gray-500 text-sm">Data/Hora Criação</p>
                                    <p className="font-medium">{formatDate(definicao.data_hora_criacao)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Data/Hora Situação</p>
                                    <p className="font-medium">{formatDate(definicao.data_hora_situacao)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Criado por</p>
                                    <p className="font-medium">{definicao.nome_pessoa_criacao || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Inspeção por</p>
                                    <p className="font-medium">{definicao.nome_pessoa_inspecao || "N/A"}</p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <p className="text-gray-500 text-sm">Observações Criação</p>
                                <p className="p-2 bg-gray-50 rounded border border-gray-100 min-h-[60px]">
                                    {definicao.obs_criacao || "Nenhuma observação"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 mt-6 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Tag size={28} className="text-blue-600" />
                            <h2 className="text-xl font-semibold">Quantidades e Resultados</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-gray-600 text-sm mb-1">Quantidade Produzida</p>
                                <p className="text-2xl font-semibold">{definicao.qtde_produzida || "N/A"}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-gray-600 text-sm mb-1">Quantidade Inspecionada</p>
                                <p className="text-2xl font-semibold">{definicao.qtde_inspecionada || "N/A"}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-gray-600 text-sm mb-1">Resultado Inspeção</p>
                                <p className="text-2xl font-semibold">{definicao.resultado_inspecao || "Pendente"}</p>
                            </div>
                        </div>

                        {definicao.observacao_inspecao && (
                            <div className="mt-4">
                                <p className="text-gray-500 text-sm">Observações da Inspeção</p>
                                <p className="p-2 bg-gray-50 rounded border border-gray-100 min-h-[60px]">
                                    {definicao.observacao_inspecao}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-200 mt-6 pt-6">
                        <h3 className="text-lg font-medium mb-4">Definir Ações</h3>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <FileCheck size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="text-md font-medium text-blue-800">Ações para Definições</h4>
                                    <p className="text-sm text-blue-600 mt-1">
                                        Selecione a ação a ser tomada para esta inspeção. Sua decisão será registrada e notificada às áreas responsáveis.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ação a ser tomada:</label>
                                <select className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                                    <option value="">Selecione uma ação</option>
                                    <option value="aprovado">Aprovar</option>
                                    <option value="reprovado">Reprovar</option>
                                    <option value="retrabalho">Enviar para retrabalho</option>
                                    <option value="scrap">Sucatear</option>
                                    <option value="reinspecao">Solicitar reinspecão</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Destino:</label>
                                <select className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                                    <option value="">Selecione um destino</option>
                                    <option value="linha">Linha de produção</option>
                                    <option value="retrabalho">Célula de retrabalho</option>
                                    <option value="descarte">Área de descarte</option>
                                    <option value="almoxarifado">Almoxarifado</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Observações:</label>
                            <textarea
                                rows={4}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                placeholder="Descreva detalhes adicionais sobre a definição..."
                            ></textarea>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2">
                                <FileCheck size={18} />
                                <span>Salvar Definição</span>
                            </button>
                            <button onClick={handleBack} className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors flex items-center gap-2">
                                <ArrowLeft size={18} />
                                <span>Voltar</span>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <FileText size={64} className="text-gray-300" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Definição não encontrada</h2>
                    <p className="text-gray-500 mb-6">
                        A definição que você está procurando não existe ou você não tem permissão para visualizá-la.
                    </p>
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        <span>Voltar para a lista</span>
                    </button>
                </div>
            )}
        </div>
    );
}
