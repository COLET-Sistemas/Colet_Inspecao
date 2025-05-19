'use client';

import { AlertMessage } from '@/components/ui/AlertMessage';
import { PageHeader } from '@/components/ui/cadastros/PageHeader';
import { EspecificacoesModal } from '@/components/ui/cadastros/modais_cadastros/EspecificacoesModal';
import { OperacoesModal } from '@/components/ui/cadastros/modais_cadastros/OperacoesModal';
import { useApiConfig } from '@/hooks/useApiConfig';
import { atualizarOrdemEspecificacoes } from '@/services/api/especificacaoService';
import { getProcessoDetalhes } from '@/services/api/processoService';
import { AlertState } from '@/types/cadastros/especificacao';
import { EspecificacaoInspecao, OperacaoProcesso, ProcessoDetalhes } from '@/types/cadastros/processo';
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Clock, ListFilter } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

// Componente para card de especificação
const EspecificacaoCard = ({ especificacao }: { especificacao: EspecificacaoInspecao }) => {
    // Função para mostrar SVG com melhor tratamento visual (usar dangerouslySetInnerHTML com cautela)
    const renderSVG = (svgString: string | undefined) => {
        if (!svgString) return (
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <span className="text-gray-400 text-xs font-medium">N/A</span>
            </div>
        );
        return (
            <div
                dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${svgString}</svg>` }}
                className="w-8 h-8 mx-auto"
                style={{
                    filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))',
                    transform: 'scale(1.2)'
                }}
            />
        );
    };

    // Função para obter nome completo do tipo de valor
    const getTipoValorDescricao = () => {
        switch (especificacao.tipo_valor) {
            case 'F': return 'Faixa';
            case 'U': return 'Único';
            case 'A': return 'Aprovado/Reprovado';
            case 'C': return 'Conforme/Não Conforme';
            case 'S': return 'Sim/Não';
            case 'L': return 'Liberado/Retido';
            default: return especificacao.tipo_valor;
        }
    };

    // Função para renderizar valores conforme o tipo
    const renderValor = () => {
        switch (especificacao.tipo_valor) {
            case 'F':
                return `${especificacao.valor_minimo} a ${especificacao.valor_maximo} ${especificacao.unidade_medida}`;
            case 'U':
                return `${especificacao.valor_minimo} ${especificacao.unidade_medida}`;
            case 'A': return 'Aprovado/Reprovado';
            case 'C': return 'Conforme/Não Conforme';
            case 'S': return 'Sim/Não';
            case 'L': return 'Liberado/Retido';
            default:
                return '';
        }
    };

    // Render checkbox para "Cota de Segurança"
    const renderCotaSeguranca = () => {
        if (!especificacao.cota_seguranca || especificacao.cota_seguranca !== 'S') return null;

        return (
            <div className="flex items-center mt-2 gap-1 bg-blue-50 border border-blue-100 rounded-md px-2 py-1">
                <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 0118 10c0 6.627-5.373 12-12 12S0 16.627 0 10c0-3.865 1.85-7.3 4.72-9.467l-3.08-1.96L12 1.944zm6.857 8.053L12.293 16l-3.293-3.293a1 1 0 011.414-1.414L12 12.877l3.443-3.443a1 1 0 111.414 1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-blue-700 font-medium">Cota de Segurança</span>
            </div>
        );
    };

    return (
        <tr className="hover:bg-blue-50/30 transition-all duration-150 border-b border-gray-100">            <td className="w-8 py-3 text-center">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-medium text-xs">
                {especificacao.ordem}
            </span>
        </td>
            <td className="w-12 py-3 px-2">
                <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-50">
                    {renderSVG(especificacao.svg_cota)}
                </div>            </td><td className="px-3 py-3">
                <div className="flex flex-col">
                    <div className="flex items-center">
                        <span className="font-medium text-gray-800">
                            {especificacao.especificacao_cota}
                        </span>                    </div>
                    {especificacao.complemento_cota && (
                        <div className="mt-1">
                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                                {especificacao.complemento_cota}
                            </span>
                        </div>
                    )}
                </div>
            </td>
            <td className="px-3 py-3">
                <div className="flex flex-col">
                    <div className="flex items-center">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-xs inline-flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {especificacao.tipo_instrumento}
                        </span>                    </div>                    {especificacao.svg_caracteristica && (
                            <div className="mt-2 w-8 h-8 mx-auto">
                                <div
                                    dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${especificacao.svg_caracteristica}</svg>` }}
                                    className="w-full h-full"
                                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
                                />
                            </div>
                        )}
                </div>
            </td>            <td className="px-3 py-3">                <div className="flex flex-col">
                <div className="text-xs bg-gray-50 rounded-md px-2 py-1 inline-block mb-1">
                    <span className="text-gray-500">Tipo: </span>
                    <span className="font-medium text-gray-800">{getTipoValorDescricao()}</span>
                </div>
                {!['A', 'C', 'S', 'L'].includes(especificacao.tipo_valor) && (
                    <div className="text-xs text-gray-800 font-medium bg-yellow-50 border border-yellow-100 px-2 py-1 rounded-md inline-block">
                        {renderValor()}
                    </div>
                )}
                {especificacao.cota_seguranca === 'S' && renderCotaSeguranca()}
            </div>
            </td>
            <td className="text-center py-3">
                <div className={`w-5 h-5 rounded-full mx-auto flex items-center justify-center ${especificacao.uso_inspecao_setup === 'S'
                    ? 'bg-green-500 ring-2 ring-green-100'
                    : 'bg-red-500 ring-2 ring-red-100'
                    }`}>
                    {especificacao.uso_inspecao_setup === 'S' && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    )}
                </div>
                <div className="text-[9px] font-medium text-gray-500 mt-1">Setup</div>
            </td>
            <td className="text-center py-3">
                <div className={`w-5 h-5 rounded-full mx-auto flex items-center justify-center ${especificacao.uso_inspecao_qualidade === 'S'
                    ? 'bg-green-500 ring-2 ring-green-100'
                    : 'bg-red-500 ring-2 ring-red-100'
                    }`}>
                    {especificacao.uso_inspecao_qualidade === 'S' && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    )}
                </div>
                <div className="text-[9px] font-medium text-gray-500 mt-1">Qualidade</div>
            </td>
            <td className="text-center py-3">
                <div className={`w-5 h-5 rounded-full mx-auto flex items-center justify-center ${especificacao.uso_inspecao_processo === 'S'
                    ? 'bg-green-500 ring-2 ring-green-100'
                    : 'bg-red-500 ring-2 ring-red-100'
                    }`}>
                    {especificacao.uso_inspecao_processo === 'S' && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    )}
                </div>
                <div className="text-[9px] font-medium text-gray-500 mt-1">Processo</div>
            </td>
        </tr>
    );
};

// Componente para mostrar uma operação e suas especificações
interface OperacaoSectionProps {
    operacao: OperacaoProcesso;
    initialExpanded?: boolean;
    referencia: string;
    roteiro: string;
    processo: string;
    onReorder: (newOrder: EspecificacaoInspecao[]) => Promise<void>;
    onAlert: (message: string, type: "success" | "error") => void;
    onRefresh: () => Promise<void>;
}

const OperacaoSection = ({
    operacao,
    initialExpanded = false,
    referencia,
    roteiro,
    processo,
    onReorder,
    onAlert,
    onRefresh
}: OperacaoSectionProps) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded);
    const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const [especificacoes] = useState<EspecificacaoInspecao[]>(
        operacao.especificacoes_inspecao || []
    );
    const especificacoesCount = especificacoes.length || 0;

    // Função para alternar expansão
    const toggleExpand = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    // Handler para reordenação
    const handleReorder = useCallback(async () => {
        if (!isReordering || !especificacoes.length) return;

        try {
            await onReorder(especificacoes);
            onAlert("Ordem das especificações atualizada com sucesso!", "success");
            setIsReordering(false);
        } catch (error) {
            console.error('Erro ao atualizar ordem:', error);
            onAlert("Erro ao atualizar a ordem das especificações", "error");
        }
    }, [isReordering, especificacoes, onReorder, onAlert]);

    // Effect para lidar com a reordenação
    useEffect(() => {
        if (!isReordering) return;
        handleReorder();
    }, [isReordering, handleReorder]);

    return (
        <div className="mb-6 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div
                className="flex justify-between items-center p-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={toggleExpand}
            >
                <h3 className="flex items-center text-sm font-medium text-gray-800">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-2">
                        {operacao.operacao}
                    </div>
                    {operacao.descricao_operacao}
                </h3>
                <div className="flex items-center gap-3">
                    <div className="flex items-center text-xs text-gray-600">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        Frequência: {operacao.frequencia_minutos} min
                    </div>
                    {especificacoesCount > 0 && (
                        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && (
                <>
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsSpecModalOpen(true);
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-[#1ABC9C] hover:bg-[#16A085] rounded-md transition-colors"
                            >
                                Cadastrar Especificações
                            </button>
                            {especificacoesCount > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsReordering(!isReordering);
                                    }}
                                    className={`px-3 py-1.5 text-xs font-medium border rounded-md transition-colors ${isReordering
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    Reordenar
                                </button>
                            )}
                        </div>
                        {especificacoesCount > 0 && (
                            <span className="text-xs text-gray-500">
                                {especificacoesCount} especificação(ões)
                            </span>
                        )}
                    </div>

                    {/* Modal de Especificações */}
                    <EspecificacoesModal
                        isOpen={isSpecModalOpen}
                        onClose={() => setIsSpecModalOpen(false)}
                        dados={{
                            referencia,
                            roteiro,
                            processo: parseInt(processo, 10),
                            operacao: operacao.operacao
                        }}
                        onSuccess={(message: string) => {
                            onAlert(message, "success");
                            onRefresh();
                            setIsSpecModalOpen(false);
                        }}
                        modo="cadastro"
                    />

                    {especificacoesCount > 0 ? (
                        <div className="border-t border-gray-100">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-[11px] font-medium text-gray-700 uppercase tracking-wider">
                                    <tr>
                                        <th className="w-12 px-2 py-3 text-center">Ordem</th>
                                        <th className="w-12 px-2 py-3 text-center">Cota</th>
                                        <th className="px-3 py-3 text-left">Especificação</th>
                                        <th className="px-3 py-3 text-left">Instrumento</th>
                                        <th className="px-3 py-3 text-left">Valores</th>
                                        <th className="w-16 px-2 py-3 text-center">Setup</th>
                                        <th className="w-16 px-2 py-3 text-center">Qualidade</th>
                                        <th className="w-16 px-2 py-3 text-center">Processo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {especificacoes.map((esp) => (
                                        <React.Fragment key={esp.id}>
                                            <EspecificacaoCard especificacao={esp} />
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                            <p className="text-xs text-gray-500">Nenhuma especificação de inspeção cadastrada para esta operação.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default function ProcessoPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { getAuthHeaders } = useApiConfig();

    // Parâmetros da URL
    const referencia = searchParams?.get('referencia') || '';
    const roteiro = searchParams?.get('roteiro') || '';
    const processo = searchParams?.get('processo') || '';    // Estados
    const [isLoading, setIsLoading] = useState(true);
    const [alert, setAlert] = useState<AlertState>({ message: null, type: "success" });
    const [dadosProcesso, setDadosProcesso] = useState<ProcessoDetalhes | null>(null);
    const [isOperacaoModalOpen, setIsOperacaoModalOpen] = useState(false);

    // Função para limpar alertas
    const clearAlert = useCallback(() => {
        setAlert({ message: null, type: "success" });
    }, []);    // Função para voltar à tela de especificações com a referência já preenchida
    const handleVoltar = useCallback(() => {
        // Navega diretamente para a página de especificações com a referência já preenchida
        // A URL não inclui um parâmetro de busca automática, então precisamos implementar isso
        // com state ou context em uma abordagem mais abrangente
        router.push(`/cadastros/especificacoes?referencia=${encodeURIComponent(referencia)}&autoSearch=true`);
    }, [router, referencia]);

    // Carregar dados do processo
    const fetchProcessoData = useCallback(async () => {
        if (!referencia || !roteiro || !processo) {
            setAlert({
                message: "Parâmetros insuficientes para buscar os dados do processo",
                type: "error"
            });
            setIsLoading(false);
            return;
        }

        try {
            const data = await getProcessoDetalhes(
                { referencia, roteiro, processo },
                getAuthHeaders()
            );
            setDadosProcesso(data);
        } catch (error) {
            console.error('Erro ao buscar dados do processo:', error);
            setAlert({
                message: error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados',
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    }, [referencia, roteiro, processo, getAuthHeaders]);

    // Efeito para carregar os dados do processo
    useEffect(() => {
        fetchProcessoData();
    }, [fetchProcessoData]);

    return (
        <div className="space-y-5 p-2 sm:p-4 md:p-5 mx-auto max-w-7xl text-sm">
            {/* Alerta para mensagens */}
            <AlertMessage
                message={alert.message}
                type={alert.type}
                onDismiss={clearAlert}
                autoDismiss={true}
                dismissDuration={5000}
            />

            {/* Cabeçalho da página */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center">
                    <button
                        onClick={handleVoltar}
                        className="mr-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <PageHeader
                        title="Especificações do Processo"
                        subtitle="Detalhes de especificações e operações"
                        showButton={false}
                    />
                </div>
            </div>

            {/* Conteúdo principal */}
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8 mt-4 flex flex-col items-center justify-center text-center"
                    >
                        <motion.div
                            className="rounded-full bg-[#1ABC9C]/10 p-3 mb-3"
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: [1, 0.8, 1]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <div className="w-6 h-6 rounded-full border-2 border-[#1ABC9C]/80 border-t-transparent animate-spin"></div>
                        </motion.div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Buscando dados do processo...</h3>
                        <p className="text-gray-500 text-xs sm:text-sm">Aguarde enquanto carregamos as especificações.</p>
                    </motion.div>
                ) : dadosProcesso ? (
                    <motion.div
                        key="dados-processo"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                    >                        {/* Informações do processo - Card informativo com design minimalista */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center border-b border-gray-100 px-4 py-3">
                                <div className="h-4 w-1 bg-green-800 rounded-full mr-2"></div>
                                <h2 className="text-sm font-medium text-gray-800">Informações do Processo</h2>
                            </div>                            <div className="p-5">
                                <div className="grid grid-cols-1 gap-5">
                                    {/* Linha 1: Referência e Roteiro */}
                                    <div className="grid md:grid-cols-2 gap-5">
                                        {/* Referência */}
                                        <div className="flex">
                                            <div className="mr-3 pt-1">
                                                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1.5">Referência: {dadosProcesso.referencia}</h3>
                                                <p className="text-sm font-medium text-slate-800">{dadosProcesso.descricao}</p>
                                            </div>
                                        </div>

                                        {/* Roteiro */}
                                        <div className="flex">
                                            <div className="mr-3 pt-1">
                                                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1.5">Roteiro: {dadosProcesso.roteiro}</h3>
                                                <p className="text-sm font-medium text-slate-800">{dadosProcesso.nome_roteiro}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Linha 2: Processo e Detalhes */}
                                    <div className="grid md:grid-cols-2 gap-5">
                                        {/* Processo */}
                                        <div className="flex">
                                            <div className="mr-3 pt-1">
                                                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1.5">Processo: {dadosProcesso.processo}</h3>
                                                <p className="text-sm font-medium text-slate-800">{dadosProcesso.tipo_acao}</p>
                                            </div>
                                        </div>

                                        {/* Detalhes */}
                                        <div className="flex">
                                            <div className="mr-3 pt-1">
                                                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1.5">Detalhes</h3>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">Recurso: {dadosProcesso.recurso}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">Setor: {dadosProcesso.setor}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>                        {/* Operações e especificações */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">                                <div className="flex items-center">
                                <div className="h-4 w-1 bg-green-800 rounded-full mr-2"></div>
                                <h2 className="text-sm font-medium text-gray-800">Operações e Especificações</h2>
                            </div>

                                <button
                                    onClick={() => setIsOperacaoModalOpen(true)}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#1ABC9C] hover:bg-[#16A085] rounded-md transition-colors"
                                >
                                    Cadastrar Operações
                                </button>
                            </div>

                            <div className="p-4">
                                {dadosProcesso.operacoes.length > 0 ? (
                                    <div className="space-y-6">
                                        {dadosProcesso.operacoes.map(operacao => (
                                            <OperacaoSection
                                                key={operacao.id_operacao}
                                                operacao={operacao}
                                                initialExpanded={dadosProcesso.operacoes.length === 1}
                                                referencia={referencia}
                                                roteiro={roteiro}
                                                processo={processo}
                                                onAlert={(message, type) => setAlert({ message, type })}
                                                onRefresh={fetchProcessoData}
                                                onReorder={async (newOrder) => {
                                                    await atualizarOrdemEspecificacoes(
                                                        newOrder.map((esp, index) => ({
                                                            id: esp.id,
                                                            ordem: index + 1
                                                        })),
                                                        getAuthHeaders()
                                                    );
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 flex flex-col items-center justify-center text-center">
                                        <div className="rounded-full bg-gray-100 p-2.5 mb-3">
                                            <ListFilter className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <h3 className="text-base font-medium text-gray-900 mb-1">Nenhuma operação encontrada</h3>
                                        <p className="text-gray-500 text-sm">Não existem operações disponíveis para este processo.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="erro"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white rounded-xl shadow-lg border border-red-100 p-6 sm:p-8 mt-4 flex flex-col items-center justify-center text-center"
                    >
                        <div className="rounded-full bg-red-100 p-3 mb-3">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Dados não encontrados</h3>
                        <p className="text-gray-500 text-xs sm:text-sm max-w-md">Não foi possível obter os dados para o processo. Verifique os parâmetros ou tente novamente.</p>
                        <button
                            onClick={fetchProcessoData}
                            className="mt-3 px-3 py-1.5 bg-[#1ABC9C] text-white rounded-md hover:bg-[#16A085] transition-colors text-xs"
                        >
                            Tentar novamente
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Operações */}
            {dadosProcesso && (
                <OperacoesModal
                    isOpen={isOperacaoModalOpen}
                    onClose={() => setIsOperacaoModalOpen(false)}
                    dados={{
                        referencia: referencia,
                        roteiro: roteiro,
                        processo: parseInt(processo, 10)
                    }}
                    onSuccess={(message) => {
                        setAlert({ message, type: 'success' });
                        fetchProcessoData();
                        setIsOperacaoModalOpen(false);
                    }}
                    modo="cadastro"
                />
            )}
        </div>
    );
}
