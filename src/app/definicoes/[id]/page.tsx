"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { LoadingSpinner } from "@/components/ui/Loading";
import { RestrictedAccess } from "@/components/ui/RestrictedAccess";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import definicaoService from "@/services/api/definicaoService";
import inspecaoService, { InspectionItem, InspectionSpecification } from "@/services/api/inspecaoService";
import { ArrowLeft, Clock, FileCheck, FileText, Tag } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DefinicaoDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [definicao, setDefinicao] = useState<InspectionItem | null>(null);
    const [especificacoes, setEspecificacoes] = useState<InspectionSpecification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingEspecificacoes, setIsLoadingEspecificacoes] = useState(true);
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
                // Buscar a definição específica pelo ID diretamente, sem filtro de postos
                // Como estamos na página de detalhes, não precisamos filtrar por posto nem chamar /inspecao/fichas_inspecao?codigo_posto=CQ&aba=definicoes
                const foundDefinicao = await definicaoService.getFichaInspecaoByIdDireto(parseInt(id));

                if (foundDefinicao) {
                    setDefinicao(foundDefinicao);

                    // Log para debug - verificar se id_ficha_inspecao está presente
                    console.log("Definição encontrada:", foundDefinicao);
                    console.log("ID da ficha de inspeção:", foundDefinicao.id_ficha_inspecao);

                    // Buscar especificações da inspeção apenas se tivermos um ID válido
                    if (foundDefinicao.id_ficha_inspecao) {
                        fetchEspecificacoes(foundDefinicao.id_ficha_inspecao);
                    } else {
                        console.error("id_ficha_inspecao não encontrado na definição");
                        setAlertMessage("Erro ao identificar a ficha de inspeção.");
                        setAlertType("error");
                        setIsLoadingEspecificacoes(false);
                    }
                } else {
                    setAlertMessage("Definição não encontrada ou você não tem permissão para visualizá-la.");
                    setAlertType("error");
                    setIsLoadingEspecificacoes(false);
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

    // Função para buscar as especificações de inspeção
    const fetchEspecificacoes = async (idFichaInspecao: number) => {
        console.log("Chamando fetchEspecificacoes com idFichaInspecao:", idFichaInspecao);

        if (!idFichaInspecao) {
            console.error("ID da ficha de inspeção é undefined ou zero!");
            setAlertMessage("Erro: ID da ficha de inspeção inválido.");
            setAlertType("error");
            setIsLoadingEspecificacoes(false);
            return;
        }

        setIsLoadingEspecificacoes(true);
        try {
            // Buscar as especificações usando o endpoint inspecao/especificacoes_inspecao
            const result = await inspecaoService.getInspectionSpecifications(idFichaInspecao);
            setEspecificacoes(result.specifications);

        } catch (error) {
            console.error("Erro ao carregar especificações da inspeção:", error);
            setAlertMessage("Erro ao carregar especificações da inspeção. Tente novamente mais tarde.");
            setAlertType("error");
        } finally {
            setIsLoadingEspecificacoes(false);
        }
    };

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

                    {/* Seção de Especificações da Inspeção */}
                    <div className="border-t border-gray-200 mt-6 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText size={28} className="text-blue-600" />
                            <h2 className="text-xl font-semibold">Especificações da Inspeção</h2>
                        </div>

                        {isLoadingEspecificacoes ? (
                            <div className="flex justify-center items-center h-28">
                                <LoadingSpinner size="medium" />
                            </div>
                        ) : especificacoes.length === 0 ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                                <p className="text-gray-500">Nenhuma especificação encontrada para esta inspeção.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-2 text-left text-gray-700 text-sm font-medium border border-gray-200">Característica</th>
                                            <th className="px-4 py-2 text-left text-gray-700 text-sm font-medium border border-gray-200">Tipo Instrumento</th>
                                            <th className="px-4 py-2 text-left text-gray-700 text-sm font-medium border border-gray-200">Local</th>
                                            <th className="px-4 py-2 text-left text-gray-700 text-sm font-medium border border-gray-200">Valor Mín.</th>
                                            <th className="px-4 py-2 text-left text-gray-700 text-sm font-medium border border-gray-200">Valor Máx.</th>
                                            <th className="px-4 py-2 text-left text-gray-700 text-sm font-medium border border-gray-200">Unidade</th>
                                            <th className="px-4 py-2 text-left text-gray-700 text-sm font-medium border border-gray-200">Valor Encontrado</th>
                                            <th className="px-4 py-2 text-left text-gray-700 text-sm font-medium border border-gray-200">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {especificacoes.map((especificacao, index) => (
                                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-4 py-2 text-sm border border-gray-200">{especificacao.descricao_caracteristica}</td>
                                                <td className="px-4 py-2 text-sm border border-gray-200">{especificacao.tipo_instrumento}</td>
                                                <td className="px-4 py-2 text-sm border border-gray-200">{especificacao.local_inspecao}</td>
                                                <td className="px-4 py-2 text-sm border border-gray-200">{especificacao.valor_minimo}</td>
                                                <td className="px-4 py-2 text-sm border border-gray-200">{especificacao.valor_maximo}</td>
                                                <td className="px-4 py-2 text-sm border border-gray-200">{especificacao.unidade_medida}</td>
                                                <td className="px-4 py-2 text-sm border border-gray-200">{especificacao.valor_encontrado !== undefined ? especificacao.valor_encontrado : '-'}</td>
                                                <td className="px-4 py-2 text-sm border border-gray-200">
                                                    {especificacao.conforme !== undefined ? (
                                                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${especificacao.conforme
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {especificacao.conforme ? 'Conforme' : 'Não Conforme'}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
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
