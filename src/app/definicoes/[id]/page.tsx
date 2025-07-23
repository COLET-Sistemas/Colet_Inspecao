"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { LoadingSpinner } from "@/components/ui/Loading";
import { RestrictedAccess } from "@/components/ui/RestrictedAccess";
import definicaoService from "@/services/api/definicaoService";
import inspecaoService, { InspectionItem, InspectionSpecification } from "@/services/api/inspecaoService";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    FileCheck,
    FileText,
    Ruler,
    SearchCheck,
    Tag
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Interface para ocorrências de não conformidade
interface OcorrenciaNaoConformidade {
    id_ocorrencia: number;
    quantidade: number;
    maior_menor: string; // "<", ">", "R" (Rejeitado/Reprovado)
    menor_valor: number;
    maior_valor: number;
}

// Estendendo a interface InspectionSpecification para incluir ocorrências
interface ExtendedInspectionSpecification extends InspectionSpecification {
    ocorrencias_nc?: OcorrenciaNaoConformidade[];
}

export default function DefinicaoDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [definicao, setDefinicao] = useState<InspectionItem | null>(null);
    const [especificacoes, setEspecificacoes] = useState<ExtendedInspectionSpecification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingEspecificacoes, setIsLoadingEspecificacoes] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | "warning" | "info">("error");
    const [hasQPermission, setHasQPermission] = useState(false);
    const [isCheckingPermission, setIsCheckingPermission] = useState(true);
    const [expandedSpecs, setExpandedSpecs] = useState<number[]>([]);

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
                // Usamos agora o endpoint /inspecao/especificacoes_inspecao?id=ID
                const foundDefinicao = await definicaoService.getFichaInspecaoByIdDireto(parseInt(id));

                if (foundDefinicao) {
                    setDefinicao(foundDefinicao);

                    // Log para debug - verificar se id_ficha_inspecao está presente
                    console.log("Definição encontrada:", foundDefinicao);
                    console.log("ID da ficha de inspeção:", foundDefinicao.id_ficha_inspecao);

                    // Não carregaremos as especificações automaticamente
                    // Elas serão carregadas apenas quando o usuário clicar no botão
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

    // Função para carregar as especificações quando solicitado pelo usuário
    const fetchEspecificacoes = async () => {
        // Verificar se temos uma definição válida com ID
        if (!definicao || !definicao.id_ficha_inspecao) {
            setAlertMessage("Não foi possível identificar a ficha de inspeção.");
            setAlertType("error");
            return;
        }

        console.log("Carregando especificações para idFichaInspecao:", definicao.id_ficha_inspecao);

        setIsLoadingEspecificacoes(true);
        try {
            // Buscar as especificações usando o endpoint inspecao/especificacoes_inspecao
            const result = await inspecaoService.getInspectionSpecifications(definicao.id_ficha_inspecao);
            // Temos que fazer um cast para o tipo estendido, já que a API pode retornar ocorrencias_nc
            setEspecificacoes(result.specifications as unknown as ExtendedInspectionSpecification[]);
            console.log("Especificações carregadas:", result.specifications.length);

            // Expandir todas as especificações por padrão
            setExpandedSpecs(result.specifications.map(spec => spec.id_especificacao));

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

    // Função para alternar a expansão de uma especificação
    const toggleSpecExpansion = (specId: number) => {
        setExpandedSpecs(prev => {
            if (prev.includes(specId)) {
                return prev.filter(id => id !== specId);
            } else {
                return [...prev, specId];
            }
        });
    };

    return (
        <div className="p-2 sm:p-4 md:p-6 mx-auto bg-gray-50 min-h-screen">
            <RestrictedAccess
                hasPermission={hasQPermission}
                isLoading={isCheckingPermission}
                customMessage="Apenas usuários com perfil Qualidade (Q) podem acessar esta página."
                customTitle="Acesso Restrito"
                redirectTo="/dashboard"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                <div className="flex items-center">
                    <button
                        onClick={handleBack}
                        className="mr-3 p-2 rounded-full bg-white shadow-sm hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center">

                            Detalhes da Inspeção
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {definicao ? `Ficha: ${definicao.id_ficha_inspecao} • ${definicao.referencia || ''}` : "Carregando..."}
                        </p>
                    </div>
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
                <div className="flex justify-center items-center h-60 bg-white rounded-lg shadow-sm">
                    <div className="text-center">
                        <LoadingSpinner size="large" />
                        <p className="mt-4 text-gray-600">Carregando informações da inspeção...</p>
                    </div>
                </div>
            ) : definicao ? (
                <div className="space-y-6">
                    <div className="border-t border-gray-200 mt-6 pt-6">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm border border-blue-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-blue-200 rounded-bl-full opacity-30"></div>
                                <div className="flex items-center gap-2">
                                    <Tag size={16} className="text-blue-600" />
                                    <p className="text-gray-700 text-sm font-medium">Quantidade Produzida</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-800 mt-1.5">
                                    {definicao.qtde_produzida !== null && definicao.qtde_produzida !== undefined
                                        ? definicao.qtde_produzida.toLocaleString('pt-BR')
                                        : "N/A"}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">Unidades totais no lote</p>
                            </div>
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm border border-blue-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-blue-200 rounded-bl-full opacity-30"></div>
                                <div className="flex items-center gap-2">
                                    <SearchCheck size={16} className="text-blue-600" />
                                    <p className="text-gray-700 text-sm font-medium">Quantidade Inspecionada</p>
                                </div>
                                <div className="flex items-baseline mt-1.5">
                                    <p className="text-2xl font-bold text-gray-800">
                                        {definicao.qtde_inspecionada !== null && definicao.qtde_inspecionada !== undefined
                                            ? definicao.qtde_inspecionada.toLocaleString('pt-BR')
                                            : "N/A"}
                                    </p>
                                    {definicao.qtde_produzida && definicao.qtde_inspecionada && (
                                        <span className="ml-2 text-xs text-gray-500">
                                            ({Math.round(definicao.qtde_inspecionada / definicao.qtde_produzida * 100)}%)
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">Unidades verificadas na inspeção</p>
                            </div>
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm border border-blue-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-blue-200 rounded-bl-full opacity-30"></div>
                                <div className="flex items-center gap-2">
                                    <Ruler size={16} className="text-blue-600" />
                                    <p className="text-gray-700 text-sm font-medium">Instrumentos de Medição</p>
                                </div>

                                {especificacoes.length > 0 ? (
                                    <div className="mt-1.5">
                                        <div className="grid grid-cols-2 gap-x-1 gap-y-1">
                                            {Object.entries(
                                                especificacoes.reduce((acc, curr) => {
                                                    const tipo = curr.tipo_instrumento;
                                                    if (!acc[tipo]) acc[tipo] = 0;
                                                    acc[tipo]++;
                                                    return acc;
                                                }, {} as Record<string, number>)
                                            ).map(([tipo, count], idx) => (
                                                <div key={idx} className="flex items-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 flex-shrink-0"></div>
                                                    <span className="text-[11px] text-gray-700 truncate flex-grow">{tipo}</span>
                                                    <span className="text-[11px] font-medium bg-blue-100 text-blue-700 px-1 ml-0.5 rounded flex-shrink-0">
                                                        {count}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 mt-1.5">Carregue as especificações para ver</p>
                                )}
                            </div>
                        </div>

                        {definicao.observacao_inspecao && (
                            <div className="mt-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                                <div className="flex items-start gap-2 mb-2">
                                    <FileText size={18} className="text-blue-600 mt-0.5" />
                                    <h3 className="text-md font-medium text-gray-700">Observações da Inspeção</h3>
                                </div>
                                <div className="bg-gray-50 p-3 rounded border border-gray-100 min-h-[60px] text-gray-700">
                                    {definicao.observacao_inspecao}
                                </div>
                            </div>
                        )}

                    </div>
                    {/* Seção de Especificações da Inspeção */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-md bg-blue-100">
                                    <Ruler size={20} className="text-blue-700" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">Especificações da Inspeção</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {especificacoes.length > 0
                                            ? `${especificacoes.length} itens de inspeção cadastrados`
                                            : "Carregue as especificações para visualizar os itens"}
                                    </p>
                                </div>
                            </div>
                            <div>

                                {/* Botão para carregar/recarregar as especificações */}
                                <div className="mt-3 sm:mt-2">
                                    {!isLoadingEspecificacoes && (
                                        <button
                                            onClick={fetchEspecificacoes}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2 shadow-sm w-full sm:w-auto"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                                                <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
                                                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
                                            </svg>
                                            {especificacoes.length > 0 ? "Atualizar Especificações" : "Carregar Especificações"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6">
                            {isLoadingEspecificacoes ? (
                                <div className="flex justify-center items-center h-32">
                                    <div className="text-center">
                                        <LoadingSpinner size="medium" />
                                        <p className="mt-3 text-gray-500">Carregando especificações...</p>
                                    </div>
                                </div>
                            ) : especificacoes.length === 0 ? (
                                <div className="bg-gray-50 p-8 rounded-lg border border-dashed border-gray-300 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <SearchCheck size={48} className="text-gray-300 mb-3" />
                                        <p className="text-gray-700 font-medium text-lg mb-1">Nenhuma especificação carregada</p>
                                        <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                                            Para visualizar os detalhes e itens de especificação desta inspeção, clique no botão abaixo para carregar os dados.
                                        </p>
                                        <button
                                            onClick={fetchEspecificacoes}
                                            className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                                        >
                                            <SearchCheck size={18} />
                                            Carregar Especificações
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Lista de especificações moderna */}
                                    <ul className="divide-y divide-gray-200">
                                        {especificacoes.map((especificacao, index) => {
                                            const isExpanded = expandedSpecs.includes(especificacao.id_especificacao);
                                            const hasOcorrencias = especificacao.ocorrencias_nc && especificacao.ocorrencias_nc.length > 0;

                                            // Determinar o status e cor da especificação
                                            let statusClass = "bg-gray-100 text-gray-700";
                                            let statusText = "Pendente";
                                            let statusIconColor = "text-gray-500";

                                            if (especificacao.conforme === true) {
                                                statusClass = "bg-green-100 text-green-800";
                                                statusText = "Conforme";
                                                statusIconColor = "text-green-500";
                                            } else if (especificacao.conforme === false) {
                                                statusClass = "bg-red-100 text-red-800";
                                                statusText = "Não Conforme";
                                                statusIconColor = "text-red-500";
                                            }

                                            return (
                                                <li key={index} className="py-3 first:pt-0 last:pb-0">
                                                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                                        {/* Cabeçalho da Especificação */}
                                                        <div
                                                            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                                            onClick={() => toggleSpecExpansion(especificacao.id_especificacao)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 ${statusIconColor}`}>
                                                                    {especificacao.ordem}
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-medium text-gray-900 flex items-center">
                                                                        {especificacao.descricao_caracteristica}
                                                                        {especificacao.complemento_cota &&
                                                                            <span className="text-gray-600 ml-1 text-sm">({especificacao.complemento_cota})</span>
                                                                        }
                                                                    </h3>
                                                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                                                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                            <Ruler size={12} className="text-blue-600" />
                                                                            {especificacao.tipo_instrumento}
                                                                        </span>
                                                                        {especificacao.valor_minimo !== null && (
                                                                            <span className="text-gray-500">
                                                                                Min: {especificacao.valor_minimo} {especificacao.unidade_medida}
                                                                            </span>
                                                                        )}
                                                                        {especificacao.valor_maximo !== null && (
                                                                            <span className="text-gray-500">
                                                                                Máx: {especificacao.valor_maximo} {especificacao.unidade_medida}
                                                                            </span>
                                                                        )}
                                                                        {especificacao.local_inspecao && (
                                                                            <span className="text-gray-500">
                                                                                Local: {especificacao.local_inspecao}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                                                                    {statusText}
                                                                </div>
                                                                {hasOcorrencias && (
                                                                    <div className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                        <AlertTriangle size={12} />
                                                                        {especificacao.ocorrencias_nc?.length}
                                                                    </div>
                                                                )}
                                                                <div className="text-gray-400">
                                                                    {isExpanded ? (
                                                                        <ChevronUp size={18} />
                                                                    ) : (
                                                                        <ChevronDown size={18} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Conteúdo Detalhado (expandido) */}
                                                        {isExpanded && (
                                                            <div className="border-t border-gray-200 bg-gray-50 p-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                    {/* Coluna 1: Dados da Especificação */}
                                                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                                        <h4 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
                                                                            <FileText size={14} className="text-blue-600" />
                                                                            Especificação Técnica
                                                                        </h4>

                                                                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                                                                            <div>
                                                                                <span className="text-gray-500 block text-xs">Tipo de Valor</span>
                                                                                <span className="font-medium">
                                                                                    {especificacao.tipo_valor === 'F' ? 'Flutuante' :
                                                                                        especificacao.tipo_valor === 'A' ? 'Aprovado/Reprovado' :
                                                                                            especificacao.tipo_valor === 'C' ? 'Conforme/Não Conforme' :
                                                                                                especificacao.tipo_valor === 'S' ? 'Sim/Não' :
                                                                                                    especificacao.tipo_valor === 'L' ? 'Liberado/Retido' :
                                                                                                        especificacao.tipo_valor === 'U' ? 'Unidade' :
                                                                                                            especificacao.tipo_valor}
                                                                                </span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-gray-500 block text-xs">Característica</span>
                                                                                <span className="font-medium">{especificacao.descricao_caracteristica}</span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-gray-500 block text-xs">Cota</span>
                                                                                <span className="font-medium">{especificacao.descricao_cota}</span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-gray-500 block text-xs">Complemento</span>
                                                                                <span className="font-medium">{especificacao.complemento_cota || "N/A"}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Visualização SVG */}
                                                                        {(especificacao.svg_caracteristica || especificacao.svg_cota) && (
                                                                            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-4">
                                                                                {especificacao.svg_caracteristica && (
                                                                                    <div>
                                                                                        <span className="text-xs font-medium text-gray-500 block mb-1">Característica</span>
                                                                                        <div
                                                                                            className="w-20 h-20 bg-white border border-gray-200 rounded p-1"
                                                                                            dangerouslySetInnerHTML={{ __html: especificacao.svg_caracteristica }}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                                {especificacao.svg_cota && (
                                                                                    <div>
                                                                                        <span className="text-xs font-medium text-gray-500 block mb-1">Cota</span>
                                                                                        <div
                                                                                            className="w-20 h-20 bg-white border border-gray-200 rounded p-1"
                                                                                            dangerouslySetInnerHTML={{ __html: especificacao.svg_cota }}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Coluna 2: Valores e Limites */}
                                                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                                        <h4 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
                                                                            <Ruler size={14} className="text-blue-600" />
                                                                            Valores e Limites
                                                                        </h4>

                                                                        <div className="mb-4">
                                                                            <div className="flex items-center gap-3 mb-2">
                                                                                <div className="flex-1 h-1 bg-gray-200 rounded-full relative">
                                                                                    {especificacao.valor_minimo !== null && especificacao.valor_maximo !== null && (
                                                                                        <div className="absolute inset-0 bg-blue-200 rounded-full"></div>
                                                                                    )}
                                                                                    {especificacao.valor_encontrado !== null && especificacao.valor_minimo !== null && especificacao.valor_maximo !== null && (
                                                                                        <div
                                                                                            className={`absolute w-3 h-3 rounded-full -mt-1 ${especificacao.conforme === true ? 'bg-green-500' :
                                                                                                especificacao.conforme === false ? 'bg-red-500' : 'bg-gray-500'
                                                                                                }`}
                                                                                            style={{
                                                                                                left: `${Math.max(0, Math.min(100, (
                                                                                                    ((Number(especificacao.valor_encontrado) - Number(especificacao.valor_minimo)) /
                                                                                                        (Number(especificacao.valor_maximo) - Number(especificacao.valor_minimo))) * 100
                                                                                                )))}%`
                                                                                            }}
                                                                                        ></div>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-2">
                                                                                <div className="text-left">
                                                                                    <span className="text-xs text-gray-500">Mínimo</span>
                                                                                    <p className="font-medium">
                                                                                        {especificacao.valor_minimo !== null ?
                                                                                            `${especificacao.valor_minimo} ${especificacao.unidade_medida}` : 'N/A'}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <span className="text-xs text-gray-500">Máximo</span>
                                                                                    <p className="font-medium">
                                                                                        {especificacao.valor_maximo !== null ?
                                                                                            `${especificacao.valor_maximo} ${especificacao.unidade_medida}` : 'N/A'}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                                                                            <div className="flex justify-between items-center mb-1">
                                                                                <span className="text-xs font-medium text-gray-500">Valor Encontrado</span>
                                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass}`}>
                                                                                    {statusText}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-lg font-bold">
                                                                                {especificacao.valor_encontrado !== undefined && especificacao.valor_encontrado !== null
                                                                                    ? `${especificacao.valor_encontrado} ${especificacao.unidade_medida}`
                                                                                    : 'Não medido'}
                                                                            </div>
                                                                        </div>

                                                                        {especificacao.observacao && (
                                                                            <div className="mt-4">
                                                                                <span className="text-xs font-medium text-gray-500">Observação</span>
                                                                                <p className="text-sm p-2 bg-gray-50 border border-gray-200 rounded mt-1">
                                                                                    {especificacao.observacao}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Coluna 3: Não Conformidades se houver */}
                                                                    {hasOcorrencias ? (
                                                                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                                            <h4 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
                                                                                <AlertTriangle size={14} className="text-amber-500" />
                                                                                Ocorrências de Não Conformidade
                                                                            </h4>

                                                                            <div className="space-y-3">
                                                                                {especificacao.ocorrencias_nc?.map((ocorrencia, idx) => {
                                                                                    // Determinar texto de condição
                                                                                    let condicaoTexto = "";
                                                                                    let condicaoClass = "";

                                                                                    if (ocorrencia.maior_menor === "<") {
                                                                                        condicaoTexto = "Menor que limite";
                                                                                        condicaoClass = "bg-amber-100 text-amber-800";
                                                                                    }
                                                                                    else if (ocorrencia.maior_menor === ">") {
                                                                                        condicaoTexto = "Maior que limite";
                                                                                        condicaoClass = "bg-amber-100 text-amber-800";
                                                                                    }
                                                                                    else if (ocorrencia.maior_menor === "R") {
                                                                                        condicaoTexto = "Reprovado";
                                                                                        condicaoClass = "bg-red-100 text-red-800";
                                                                                    }

                                                                                    return (
                                                                                        <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
                                                                                            <div className="flex items-center gap-3">
                                                                                                <div className="bg-red-50 p-1.5 rounded-full">
                                                                                                    <AlertTriangle size={14} className="text-red-500" />
                                                                                                </div>
                                                                                                <div>
                                                                                                    <div className={`text-xs px-2 py-0.5 rounded-full ${condicaoClass}`}>
                                                                                                        {condicaoTexto}
                                                                                                    </div>
                                                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                                                        {ocorrencia.maior_menor !== "R" && (
                                                                                                            <span>
                                                                                                                Entre {ocorrencia.menor_valor} e {ocorrencia.maior_valor} {especificacao.unidade_medida}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="text-lg font-bold text-red-600">
                                                                                                {ocorrencia.quantidade}
                                                                                                <div className="text-xs text-gray-500 text-right">unidades</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}

                                                                                {/* Total de não conformidades */}
                                                                                <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
                                                                                    <span className="text-sm font-medium text-gray-700">Total de não conformidades</span>
                                                                                    <span className="text-sm font-bold">
                                                                                        {especificacao.ocorrencias_nc?.reduce((acc, curr) => acc + curr.quantidade, 0)} unidades
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                                            <h4 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
                                                                                <CheckCircle2 size={14} className="text-green-600" />
                                                                                Status
                                                                            </h4>

                                                                            <div className="flex flex-col items-center justify-center h-32">
                                                                                {especificacao.conforme === true ? (
                                                                                    <>
                                                                                        <CheckCircle2 size={32} className="text-green-600 mb-2" />
                                                                                        <p className="text-green-700 font-medium">Conforme as especificações</p>
                                                                                        <p className="text-sm text-gray-500 mt-1">Sem ocorrências de não conformidade</p>
                                                                                    </>
                                                                                ) : especificacao.conforme === false ? (
                                                                                    <>
                                                                                        <AlertTriangle size={32} className="text-amber-500 mb-2" />
                                                                                        <p className="text-amber-700 font-medium">Não conforme</p>
                                                                                        <p className="text-sm text-gray-500 mt-1">Verificar detalhes da medição</p>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Clock size={32} className="text-gray-400 mb-2" />
                                                                                        <p className="text-gray-500 font-medium">Pendente de medição</p>
                                                                                        <p className="text-sm text-gray-500 mt-1">Aguardando inspeção</p>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Seção de Ações */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-6">
                        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                            <div className="flex flex-wrap gap-4 items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                        <FileCheck size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Definição de Ações</h2>
                                        <p className="text-indigo-100 text-sm mt-1">Informe as decisões e próximos passos para esta inspeção</p>
                                    </div>
                                </div>

                                {/* Indicador de status atual */}
                                {definicao.situacao && (
                                    <div className="px-3 py-1.5 bg-white bg-opacity-95 rounded-lg shadow-sm flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <span className="text-sm font-medium text-indigo-800">
                                            Status: {definicao.situacao === "5" ? "Pendente de Decisão" : `Situação ${definicao.situacao}`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Coluna esquerda: Ações principais */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-6">
                                        <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                                            <FileCheck size={18} className="text-indigo-600" />
                                            Definir Próximo Passo
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Ação a ser tomada:</label>
                                                <select className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 h-11">
                                                    <option value="">Selecione uma ação</option>
                                                    <option value="aprovado">Aprovar</option>
                                                    <option value="reprovado">Reprovar</option>
                                                    <option value="retrabalho">Enviar para retrabalho</option>
                                                    <option value="scrap">Sucatear</option>
                                                    <option value="reinspecao">Solicitar reinspecão</option>
                                                </select>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Esta ação definirá o fluxo subsequente da inspeção
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Destino:</label>
                                                <select className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 h-11">
                                                    <option value="">Selecione um destino</option>
                                                    <option value="linha">Linha de produção</option>
                                                    <option value="retrabalho">Célula de retrabalho</option>
                                                    <option value="descarte">Área de descarte</option>
                                                    <option value="almoxarifado">Almoxarifado</option>
                                                </select>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Local para onde os itens serão encaminhados
                                                </p>
                                            </div>
                                        </div>

                                        {/* Prioridade */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade:</label>
                                            <div className="flex flex-wrap gap-3">
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                                        <input
                                                            type="radio"
                                                            name="prioridade"
                                                            value="normal"
                                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                            defaultChecked
                                                        />
                                                        <div className="ml-2">
                                                            <span className="block text-sm font-medium text-gray-900">Normal</span>
                                                            <span className="text-xs text-gray-500">Processamento padrão</span>
                                                        </div>
                                                    </label>
                                                </div>
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                                        <input
                                                            type="radio"
                                                            name="prioridade"
                                                            value="alta"
                                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <div className="ml-2">
                                                            <span className="block text-sm font-medium text-gray-900">Alta</span>
                                                            <span className="text-xs text-gray-500">Priorizar processo</span>
                                                        </div>
                                                    </label>
                                                </div>
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                                        <input
                                                            type="radio"
                                                            name="prioridade"
                                                            value="urgente"
                                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <div className="ml-2">
                                                            <span className="block text-sm font-medium text-gray-900">Urgente</span>
                                                            <span className="text-xs text-gray-500">Atender imediatamente</span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Justificativa / Observações:</label>
                                            <textarea
                                                rows={4}
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                placeholder="Descreva detalhes adicionais sobre sua decisão, incluindo justificativas técnicas se necessário..."
                                            ></textarea>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Estas informações serão visíveis para todas as áreas envolvidas no processo
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Coluna direita: Resumo e ações */}
                                <div className="lg:col-span-1">
                                    <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-5 mb-6 sticky top-6">
                                        <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                                            <Tag size={18} className="text-indigo-600" />
                                            Resumo da Decisão
                                        </h3>

                                        <div className="space-y-4 mb-6">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Total de Itens</span>
                                                <span className="font-bold">{especificacoes.length}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Não Conformidades</span>
                                                <span className="font-bold text-red-600">{especificacoes.filter(e => e.conforme === false).length}</span>
                                            </div>

                                            {definicao.resultado_inspecao && (
                                                <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                                                    <span className="text-sm text-gray-600">Resultado Atual</span>
                                                    <span className={`font-bold ${definicao.resultado_inspecao === 'Aprovado'
                                                        ? 'text-green-600'
                                                        : definicao.resultado_inspecao === 'Reprovado'
                                                            ? 'text-red-600'
                                                            : 'text-amber-600'
                                                        }`}>
                                                        {definicao.resultado_inspecao}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3 mt-6">
                                            <button className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                                <FileCheck size={18} />
                                                <span>Salvar Decisão</span>
                                            </button>
                                            <button
                                                onClick={handleBack}
                                                className="w-full px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-300"
                                            >
                                                <ArrowLeft size={18} />
                                                <span>Voltar</span>
                                            </button>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                                                <div className="text-blue-600 mt-0.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                                                    </svg>
                                                </div>
                                                <p className="text-xs text-blue-700">
                                                    Após salvar esta decisão, o processo seguirá para a próxima etapa e as áreas envolvidas serão notificadas automaticamente.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                            <FileText size={64} className="text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Definição não encontrada</h2>
                        <p className="text-gray-600 text-center max-w-md mb-8">
                            Não foi possível localizar a definição que você está procurando. É possível que ela não exista ou que você não tenha permissão para acessá-la.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2 shadow-sm"
                            >
                                <ArrowLeft size={18} />
                                <span>Voltar para a lista</span>
                            </button>
                            <p className="text-center text-sm text-gray-500 mt-4">
                                Se você acredita que isso é um erro, entre em contato com o suporte técnico.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
