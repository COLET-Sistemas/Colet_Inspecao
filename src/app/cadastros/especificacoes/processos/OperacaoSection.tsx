'use client';

import { Tooltip } from '@/components/ui/cadastros/Tooltip';
import { ConfirmDeleteModal } from '@/components/ui/cadastros/modais_cadastros/ConfirmDeleteModal';
import { EspecificacoesModal } from '@/components/ui/cadastros/modais_cadastros/EspecificacoesModal';
import { useApiConfig } from '@/hooks/useApiConfig';
import { deleteEspecificacaoInspecao } from '@/services/api/especificacaoService';
import { EspecificacaoInspecao, OperacaoProcesso } from '@/types/cadastros/processo';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Check, Clock, Pencil, Ruler, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

// Card component for a specification
interface EspecificacaoCardProps {
    especificacao: EspecificacaoInspecao;
    onEdit?: (especificacao: EspecificacaoInspecao) => void;
    onDelete?: (especificacao: EspecificacaoInspecao) => void;
    isReordering?: boolean;
    onMoveUp?: (index: number) => void;
    onMoveDown?: (index: number) => void;
    index?: number;
}

// EspecificacaoCard component implementation
const EspecificacaoCard = ({
    especificacao,
    onEdit,
    onDelete,
    isReordering = false,
    onMoveUp,
    onMoveDown,
    index = 0
}: EspecificacaoCardProps) => {
    // Function to render SVG with better visual treatment
    const renderSVG = (svgString: string | undefined) => {
        if (!svgString) return (
            <div className="w-9 h-9 flex items-center justify-center mx-auto">
                <span className="text-gray-400 text-xs font-medium">N/A</span>
            </div>
        );
        return (
            <div
                dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${svgString}</svg>` }}
                className="w-9 h-9 mx-auto"
                style={{
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))',
                    transform: 'scale(1.3)'
                }}
            />
        );
    };

    // Function to get the full name of the value type
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

    // Function to render values according to type
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

    // Render checkbox for "Security Quote"
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

    // Render use indicator (Setup, Quality or Process)
    const renderUsoIndicator = (value: string, label: string) => {
        const isActive = value === 'S';
        return (
            <div className="flex flex-col items-center">                <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${isActive ? 'bg-[#1ABC9C] text-white' : 'bg-gray-100 text-gray-300'}`}>
                {isActive ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                )}
            </div>
                <span className="text-[10px] font-medium mt-1 text-gray-600">{label}</span>
            </div>
        );
    };

    return (
        <tr className={`transition-all duration-200 border-b border-gray-100 ${isReordering ? 'bg-blue-50/30 hover:bg-blue-100/40 hover:-translate-y-0.5 hover:shadow-md' : 'hover:bg-blue-50/30'}`}>
            <td className="py-4 text-center">
                <div className="flex justify-center">
                    <span className={`w-7 h-7 rounded-full ${isReordering ? 'bg-blue-200 text-blue-800 border border-blue-400' : 'bg-blue-100 text-blue-800'} font-medium text-xs flex items-center justify-center transition-all`}>
                        {especificacao.ordem}
                    </span>
                </div>
            </td>
            <td className="py-4">
                <div className="flex justify-center">
                    <div className="w-11 h-11 flex items-center justify-center" style={{ margin: '-4px 0' }}>
                        {renderSVG(especificacao.svg_cota)}
                    </div>
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="flex flex-col">
                    <div className="flex items-center">
                        <span className="font-medium text-gray-800 text-sm">
                            {especificacao.especificacao_cota}
                        </span>
                    </div>
                    {especificacao.complemento_cota && (
                        <div className="mt-1.5">
                            <span className="text-xs text-gray-500">
                                {especificacao.complemento_cota}
                            </span>
                        </div>
                    )}
                </div>
            </td>
            <td className="py-4">
                <div className="flex justify-center">
                    {especificacao.svg_caracteristica ? (
                        <div className="w-11 h-11 flex items-center justify-center" style={{ margin: '-4px 0' }}>
                            <div
                                dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${especificacao.svg_caracteristica}</svg>` }}
                                className="w-full h-full"
                                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))' }}
                            />
                        </div>
                    ) : (
                        <div className="w-9 h-9 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">N/A</span>
                        </div>
                    )}
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="flex flex-col gap-1.5">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs inline-flex items-center">
                        <Ruler className="h-3 w-3 mr-1.5" />
                        <span className="font-medium">{especificacao.tipo_instrumento}</span>
                    </span>
                    {especificacao.especificacao_caracteristica && (
                        <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md flex items-center">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-1.5"></span>
                            {especificacao.especificacao_caracteristica}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="flex flex-col gap-2">
                    <div className="text-xs bg-gray-50 rounded-md px-3 py-1.5 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
                        <span className="text-gray-800 font-medium">{getTipoValorDescricao()}</span>
                    </div>
                    {!['A', 'C', 'S', 'L'].includes(especificacao.tipo_valor) && (
                        <div className="text-xs text-gray-800 font-medium bg-yellow-50 border border-yellow-100 px-3 py-1.5 rounded-md flex items-center shadow-sm">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1.5"></span>
                            {renderValor()}
                        </div>
                    )}
                    {especificacao.cota_seguranca === 'S' && renderCotaSeguranca()}
                </div>
            </td>
            <td className="py-4">
                <div className="flex justify-center">
                    {renderUsoIndicator(especificacao.uso_inspecao_setup, 'Setup')}
                </div>
            </td>
            <td className="py-4">
                <div className="flex justify-center">
                    {renderUsoIndicator(especificacao.uso_inspecao_qualidade, 'Qualidade')}
                </div>
            </td>
            <td className="py-4">
                <div className="flex justify-center">
                    {renderUsoIndicator(especificacao.uso_inspecao_processo, 'Processo')}
                </div>
            </td>
            <td className="py-4">
                <div className="flex items-center justify-center gap-2">
                    {isReordering ? (
                        <div className="flex items-center gap-2">
                            <Tooltip text="Mover para cima">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onMoveUp && onMoveUp(index)}
                                    className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                                    disabled={index === 0}
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </motion.button>
                            </Tooltip>
                            <Tooltip text="Mover para baixo">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onMoveDown && onMoveDown(index)}
                                    className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </motion.button>
                            </Tooltip>
                        </div>
                    ) : (
                        <>
                            <Tooltip text="Editar especificação">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onEdit && onEdit(especificacao)}
                                    className="p-2 rounded-md text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 transition-colors"
                                >
                                    <Pencil className="h-4 w-4" />
                                </motion.button>
                            </Tooltip>
                            <Tooltip text="Excluir especificação">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onDelete && onDelete(especificacao)}
                                    className="p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </motion.button>
                            </Tooltip>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

// Component that displays an operation and its specifications
interface OperacaoSectionProps {
    operacao: OperacaoProcesso;
    initialExpanded?: boolean;
    processo: string;
    referencia: string;
    roteiro: string;
    onReorder: (newOrder: EspecificacaoInspecao[]) => Promise<void>;
    onAlert: (message: string, type: "success" | "error") => void;
    onRefresh: () => Promise<void>;
    onEdit?: (operacao: OperacaoProcesso) => void;
    onDelete?: (operacao: OperacaoProcesso) => void;
}

const OperacaoSection: React.FC<OperacaoSectionProps> = ({
    operacao,
    initialExpanded = false,
    processo,
    referencia,
    roteiro,
    onReorder,
    onAlert,
    onRefresh,
    onEdit,
    onDelete
}) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded);
    const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
    const [selectedSpec, setSelectedSpec] = useState<EspecificacaoInspecao | null>(null);
    const [isReordering, setIsReordering] = useState(false);
    const [isDeleteSpecModalOpen, setIsDeleteSpecModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { getAuthHeaders } = useApiConfig();
    const [especificacoes, setEspecificacoes] = useState<EspecificacaoInspecao[]>(
        operacao.especificacoes_inspecao || []
    );
    const especificacoesCount = especificacoes.length || 0;
    const [isSaving, setIsSaving] = useState(false);

    // Reset especificacoes when operacao.especificacoes_inspecao changes
    useEffect(() => {
        setEspecificacoes(operacao.especificacoes_inspecao || []);
    }, [operacao.especificacoes_inspecao]);

    // Function to toggle expansion
    const toggleExpand = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    // Move specification up
    const moveSpecUp = useCallback((index: number) => {
        if (index <= 0) return; // Don't do anything if it's the first item

        setEspecificacoes(prev => {
            const newOrder = [...prev];
            // Swap position with previous item
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            return newOrder;
        });
    }, []);

    // Move specification down
    const moveSpecDown = useCallback((index: number) => {
        if (index >= especificacoes.length - 1) return; // Don't do anything if it's the last item

        setEspecificacoes(prev => {
            const newOrder = [...prev];
            // Swap position with next item
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            return newOrder;
        });
    }, [especificacoes.length]);

    // Handler for reordering
    const handleReorder = useCallback(async () => {
        if (!isReordering || !especificacoes.length) return;

        try {
            setIsSaving(true);

            // Prepare data to send to API with sequential order starting from 1
            const updatedEspecificacoes = especificacoes.map((esp, index) => ({
                ...esp,
                ordem: index + 1
            }));

            // Send new order to API
            await onReorder(updatedEspecificacoes);
            onAlert("Ordem das especificações atualizada com sucesso!", "success");
            setIsReordering(false);
            setIsSaving(false);
        } catch (error) {
            console.error('Erro ao atualizar ordem:', error);
            onAlert("Erro ao atualizar a ordem das especificações", "error");
            setIsSaving(false);
        }
    }, [isReordering, especificacoes, onReorder, onAlert]);    // Handler to edit specification
    const handleEditSpec = useCallback((spec: EspecificacaoInspecao) => {
        // Log para depuração
        console.log('OperacaoSection - handleEditSpec - objeto completo:', spec);

        // Certifique-se de que todos os campos são preservados
        // Criar um objeto que contenha todos os campos da especificação
        const completeSpec = {
            id: spec.id,
            operacao: spec.operacao,
            ordem: spec.ordem,
            id_cota: spec.id_cota,
            especificacao_cota: spec.especificacao_cota,
            complemento_cota: spec.complemento_cota,
            svg_cota: spec.svg_cota,
            id_caracteristica_especial: spec.id_caracteristica_especial,
            caracteristica_especial: spec.especificacao_caracteristica, // Mapeando para o campo correspondente
            especificacao_caracteristica: spec.especificacao_caracteristica,
            svg_caracteristica: spec.svg_caracteristica,
            id_tipo_instrumento: spec.id_tipo_instrumento,
            tipo_instrumento: spec.tipo_instrumento,
            tipo_valor: spec.tipo_valor,
            valor_minimo: spec.valor_minimo,
            valor_maximo: spec.valor_maximo,
            unidade_medida: spec.unidade_medida,
            uso_inspecao_setup: spec.uso_inspecao_setup,
            uso_inspecao_processo: spec.uso_inspecao_processo,
            uso_inspecao_qualidade: spec.uso_inspecao_qualidade,
            cota_seguranca: spec.cota_seguranca
        };

        setSelectedSpec(completeSpec);
        setIsSpecModalOpen(true);
    }, []);

    // Handler to delete specification
    const handleDeleteSpec = useCallback((spec: EspecificacaoInspecao) => {
        setSelectedSpec(spec);
        setIsDeleteSpecModalOpen(true);
    }, []);

    // Handler to confirm specification deletion
    const confirmDeleteSpec = useCallback(async () => {
        if (!selectedSpec) return;
        setIsDeleting(true);

        try {
            await deleteEspecificacaoInspecao(selectedSpec.id, getAuthHeaders());
            onAlert("Especificação excluída com sucesso!", "success");
            onRefresh();
        } catch (error) {
            console.error('Erro ao excluir especificação:', error);
            onAlert("Erro ao excluir especificação", "error");
        } finally {
            setIsDeleting(false);
            setIsDeleteSpecModalOpen(false);
            setSelectedSpec(null);
        }
    }, [selectedSpec, getAuthHeaders, onAlert, onRefresh]);

    return (
        <div className={`mb-6 border ${isReordering ? 'border-blue-200' : 'border-gray-100'} rounded-xl overflow-hidden shadow-sm relative`}>
            {isReordering && isExpanded && (
                <div className="absolute inset-0 bg-blue-50/20 pointer-events-none z-10">
                    <div className="absolute top-3 right-14 bg-blue-600 text-white text-xs px-2.5 py-1.5 rounded-md shadow-sm">
                        Modo de Reordenação
                    </div>
                </div>
            )}
            <div
                className={`flex justify-between items-center p-3 bg-white ${!isReordering && 'hover:bg-gray-50'} cursor-pointer transition-colors group`}
                role="button"
                onClick={toggleExpand}
                aria-expanded={isExpanded}
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
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 relative z-10 transition-opacity group-hover:opacity-100">
                        {isExpanded ? (
                            // Buttons when expanded (Reorder and Add)
                            <div className="flex items-center gap-2">
                                {/* Reorder */}
                                <Tooltip text={isReordering ? "Modo de reordenação ativo" : "Reordenar Especificações"}>
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        disabled={especificacoesCount === 0}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsReordering(!isReordering);
                                        }} className={`p-1.5 rounded-md text-white transition-colors shadow-sm ${isReordering ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} ${especificacoesCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="21" y1="10" x2="3" y2="10"></line>
                                            <line x1="21" y1="6" x2="3" y2="6"></line>
                                            <line x1="21" y1="14" x2="3" y2="14"></line>
                                            <line x1="21" y1="18" x2="3" y2="18"></line>
                                        </svg>
                                    </motion.button>
                                </Tooltip>

                                {/* Add */}
                                <Tooltip text="Cadastrar Especificações">
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        disabled={isReordering}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!isReordering) {
                                                setIsSpecModalOpen(true);
                                            }
                                        }} className={`p-1.5 rounded-md text-white transition-colors shadow-sm ${isReordering ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </motion.button>
                                </Tooltip>
                            </div>
                        ) : (
                            // Buttons when collapsed (Edit and Delete)
                            <div className="flex items-center gap-2">
                                {/* Edit */}
                                <Tooltip text="Editar operação">
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        disabled={!onEdit}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (onEdit) onEdit(operacao);
                                        }} className={`p-1.5 rounded-md transition-colors ${!onEdit ? 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-50' : 'text-gray-700 hover:text-yellow-500 hover:bg-yellow-50'}`}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </motion.button>
                                </Tooltip>

                                {/* Delete */}
                                <Tooltip text="Excluir operação">
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        disabled={!onDelete}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (onDelete) onDelete(operacao);
                                        }} className={`p-1.5 rounded-md transition-colors ${!onDelete ? 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-50' : 'text-gray-700 hover:text-red-500 hover:bg-red-50'}`}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </motion.button>
                                </Tooltip>
                            </div>
                        )}
                    </div>

                    {/* Chevron indicator */}
                    <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <>
                    {/* Adicionado console.log para depuração */}
                    {selectedSpec && console.log('OperacaoSection - selectedSpec completo:', selectedSpec)}
                    {selectedSpec && console.log('OperacaoSection - dados enviados para o modal:', {
                        id: selectedSpec.id,
                        referencia,
                        roteiro,
                        processo: parseInt(processo, 10),
                        operacao: operacao.operacao,
                        especificacao_cota: selectedSpec.especificacao_cota,
                        complemento_cota: selectedSpec.complemento_cota,
                        tipo_valor: selectedSpec.tipo_valor,
                        valor_minimo: selectedSpec.valor_minimo,
                        valor_maximo: selectedSpec.valor_maximo,
                        unidade_medida: selectedSpec.unidade_medida,
                        id_cota: selectedSpec.id_cota,
                        id_caracteristica_especial: selectedSpec.id_caracteristica_especial,
                        id_tipo_instrumento: selectedSpec.id_tipo_instrumento,
                        ordem: selectedSpec.ordem,
                        uso_inspecao_setup: selectedSpec.uso_inspecao_setup,
                        uso_inspecao_processo: selectedSpec.uso_inspecao_processo,
                        uso_inspecao_qualidade: selectedSpec.uso_inspecao_qualidade
                    })}                    {/* Debug logs para verificar o que está sendo enviado ao modal */}
                    {selectedSpec && console.log('OperacaoSection - selectedSpec completo:', selectedSpec)}

                    {/* Specifications Modal */}
                    <EspecificacoesModal
                        isOpen={isSpecModalOpen}
                        onClose={() => {
                            setIsSpecModalOpen(false);
                            setSelectedSpec(null);
                        }}
                        dados={selectedSpec ? {
                            // Usar o spread primeiro para incluir todos os campos originais
                            ...selectedSpec,
                            // Propriedades que precisam ser explicitamente definidas
                            especificacao_cota: selectedSpec.especificacao_cota,
                            complemento_cota: selectedSpec.complemento_cota,
                            tipo_valor: selectedSpec.tipo_valor,
                            valor_minimo: selectedSpec.valor_minimo,
                            valor_maximo: selectedSpec.valor_maximo,
                            unidade_medida: selectedSpec.unidade_medida,
                            id_cota: selectedSpec.id_cota,
                            id_caracteristica_especial: selectedSpec.id_caracteristica_especial,
                            caracteristica_especial: selectedSpec.caracteristica_especial,
                            id_tipo_instrumento: selectedSpec.id_tipo_instrumento,
                            ordem: selectedSpec.ordem,
                            uso_inspecao_setup: selectedSpec.uso_inspecao_setup,
                            uso_inspecao_processo: selectedSpec.uso_inspecao_processo,
                            uso_inspecao_qualidade: selectedSpec.uso_inspecao_qualidade,
                            // Sobreescrever ou adicionar os campos específicos do contexto
                            referencia,
                            roteiro,
                            processo: parseInt(processo, 10),
                            operacao: operacao.operacao
                        } : {
                            referencia,
                            roteiro,
                            processo: parseInt(processo, 10),
                            operacao: operacao.operacao
                        }}
                        onSuccess={(message: string) => {
                            onAlert(message, "success");
                            onRefresh();
                            setIsSpecModalOpen(false);
                            setSelectedSpec(null);
                        }}
                        modo={selectedSpec ? "edicao" : "cadastro"}
                    />

                    {/* Confirmation modal for deleting specification */}
                    <ConfirmDeleteModal
                        isOpen={isDeleteSpecModalOpen}
                        onClose={() => {
                            if (!isDeleting) {
                                setIsDeleteSpecModalOpen(false);
                                setSelectedSpec(null);
                            }
                        }}
                        onConfirm={confirmDeleteSpec}
                        isDeleting={isDeleting}
                        title="Confirmar Exclusão"
                        message={
                            selectedSpec
                                ? `Você está prestes a excluir permanentemente a especificação: ${selectedSpec.especificacao_cota}`
                                : "Deseja realmente excluir esta especificação?"
                        }
                        itemName={selectedSpec?.especificacao_cota}
                    />

                    {especificacoesCount > 0 ? (
                        <div className={`border-t border-gray-100 rounded-md overflow-hidden ${isReordering ? 'bg-blue-50' : ''}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className={`text-[10px] font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 ${isReordering ? 'bg-blue-100/70' : 'bg-gradient-to-r from-gray-50 to-gray-100'}`}>
                                        <th className="w-12 px-3 py-3.5 text-center">
                                            {isReordering ? (
                                                <div className="flex items-center justify-center">
                                                    <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full animate-pulse">Reordenando</span>
                                                </div>
                                            ) : 'Ordem'}
                                        </th>
                                        <th className="w-14 px-3 py-3.5 text-center">Cota</th>
                                        <th className="px-4 py-3.5 text-left">Especificação</th>
                                        <th className="w-16 px-3 py-3.5 text-center">Caract.</th>
                                        <th className="px-4 py-3.5 text-left">Instrumento</th>
                                        <th className="px-4 py-3.5 text-left">Valores</th>
                                        <th className="w-20 px-3 py-3.5 text-center">Setup</th>
                                        <th className="w-20 px-3 py-3.5 text-center">Qualidade</th>
                                        <th className="w-20 px-3 py-3.5 text-center">Processo</th>
                                        <th className="w-24 px-3 py-3.5 text-center">
                                            {isReordering ? "Mover" : "Ações"}                                        </th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {especificacoes.map((esp, index) => (
                                            <EspecificacaoCard
                                                key={esp.id}
                                                especificacao={esp}
                                                onEdit={isReordering ? undefined : handleEditSpec}
                                                onDelete={isReordering ? undefined : handleDeleteSpec}
                                                isReordering={isReordering}
                                                onMoveUp={moveSpecUp}
                                                onMoveDown={moveSpecDown}
                                                index={index}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {isReordering && (
                                <div className="flex justify-between items-center p-3 border-t border-gray-100">
                                    <div className="text-sm text-gray-600">
                                        <span className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Mova as especificações para reordenar
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setIsReordering(false)}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleReorder}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Salvando...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="h-4 w-4" />
                                                    <span>Salvar Ordem</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white p-8 text-center border-t border-gray-100 rounded-md">
                            <div className="flex flex-col items-center justify-center">
                                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 00-2 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9"></path>
                                    </svg>
                                </div>
                                <h3 className="text-sm font-medium text-gray-700 mb-1">Nenhuma especificação cadastrada</h3>
                                <p className="text-xs text-gray-500 mb-3">Clique em &quot;Cadastrar Especificação&quot; para começar.</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default OperacaoSection;
