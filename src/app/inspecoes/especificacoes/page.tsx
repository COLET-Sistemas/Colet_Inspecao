"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuth } from "@/hooks/useAuth";
import inspecaoService, { InspectionSpecification } from "@/services/api/inspecaoService";
import { motion } from "framer-motion";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    CheckSquare,
    Eye,
    MessageSquare,
    RefreshCw,
    Ruler,
    Save,
    Send,
    StopCircle,
    XCircle
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import './especificacoes-styles.css';

export default function EspecificacoesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams?.get('id');
    const hasInitialized = useRef(false);
    const auth = useAuth();
    const [specifications, setSpecifications] = useState<InspectionSpecification[]>([]);

    // Enhanced validation for codigo_pessoa in localStorage
    useEffect(() => {
        // Check userData in localStorage
        const userDataStr = localStorage.getItem('userData');
        let localStorageHasCodigoPessoa = false;

        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                localStorageHasCodigoPessoa = !!userData?.codigo_pessoa;
            } catch (e) {
                console.error('Error parsing userData from localStorage:', e);
            }
        }

        // If neither auth context nor localStorage has codigo_pessoa, redirect
        if (!auth.user?.codigo_pessoa && !localStorageHasCodigoPessoa) {
            console.log('Código de pessoa não encontrado no userData do localStorage, redirecionando...');
            router.push('/inspecoes');
            return;
        }
    }, [auth.user, router]);

    const [fichaDados, setFichaDados] = useState<{
        id_ficha_inspecao: number,
        qtde_produzida: number | null,
        exibe_faixa: string,
        exibe_resultado: string
    }>({
        id_ficha_inspecao: 0,
        qtde_produzida: null,
        exibe_faixa: 'S',
        exibe_resultado: 'S'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); const [editingValues, setEditingValues] = useState<{ [key: number]: { valor_encontrado: string; observacao: string; conforme?: boolean | null } }>({});
    const [expandedObservations, setExpandedObservations] = useState<Set<number>>(new Set()); const [isSaving, setIsSaving] = useState(false);
    // Variável para controlar se a inspeção foi iniciada
    const [isInspectionStarted, setIsInspectionStarted] = useState(false);
    // Variável para controlar se está encaminhando para o CQ
    const [isForwardingToCQ, setIsForwardingToCQ] = useState(false);
    // Variável para controlar se está confirmando recebimento
    const [isConfirmingReceipt, setIsConfirmingReceipt] = useState(false);
    // Variável para expandir/retrair cards
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    // Estado para exibição de mensagens de alerta
    const [alertMessage, setAlertMessage] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

    // UseEffect com proteção contra StrictMode e chamadas duplicadas
    useEffect(() => {
        if (hasInitialized.current) {
            return;
        }

        if (!id) {
            setError("ID da ficha de inspeção não fornecido");
            setLoading(false);
            return;
        }

        hasInitialized.current = true;

        const loadSpecifications = async () => {
            console.log(`[SINGLE CALL] Carregando especificações para ID: ${id}`);
            setLoading(true);
            setError(null);

            try {
                const response = await inspecaoService.getInspectionSpecifications(parseInt(id));
                setSpecifications(response.specifications);
                setFichaDados(response.fichaDados);
            } catch (error) {
                console.error("Erro ao carregar especificações:", error);
                setError("Erro ao carregar especificações da inspeção");
                hasInitialized.current = false;
            } finally {
                setLoading(false);
            }
        };

        loadSpecifications();
    }, [id]); // Só depende do ID


    // Função para refresh manual
    const handleRefresh = useCallback(async () => {
        if (!id) {
            setError("ID da ficha de inspeção não fornecido");
            setLoading(false);
            return;
        }

        console.log(`[REFRESH] Recarregando especificações para ID: ${id}`);
        setLoading(true);
        setError(null);

        try {
            const response = await inspecaoService.getInspectionSpecifications(parseInt(id));
            setSpecifications(response.specifications);
            setFichaDados(response.fichaDados);
        } catch (error) {
            console.error("Erro ao carregar especificações:", error);
            setError("Erro ao carregar especificações da inspeção");
        } finally {
            setLoading(false);
        }
    }, [id]);
    const handleBack = useCallback(() => {
        router.back();
    }, [router]);
    const toggleObservationField = useCallback((specId: number) => {
        // Verificação já é feita através do disabled no botão e é redundante aqui
        // pois o botão não será clicável se o usuário não tiver permissão
        setExpandedObservations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(specId)) {
                newSet.delete(specId);
            } else {
                newSet.add(specId);
            }
            return newSet;
        });
    }, []);

    // Função para obter as opções de select baseadas no tipo_valor
    const getSelectOptions = useCallback((tipoValor: string) => {
        switch (tipoValor) {
            case 'A': return [
                { value: true, label: 'Aprovado' },
                { value: false, label: 'Reprovado' }
            ];
            case 'C': return [
                { value: true, label: 'Conforme' },
                { value: false, label: 'Não Conforme' }
            ];
            case 'S': return [
                { value: true, label: 'Sim' },
                { value: false, label: 'Não' }
            ];
            case 'L': return [
                { value: true, label: 'Liberdade' },
                { value: false, label: 'Retido' }
            ];
            default: return [];
        }
    }, []);

    // Função para verificar se o tipo_valor requer select
    const isSelectType = useCallback((tipoValor: string) => {
        return ['A', 'C', 'S', 'L'].includes(tipoValor);
    }, []);

    // Função para verificar se o tipo_valor requer input numérico
    const isNumericType = useCallback((tipoValor: string) => {
        return ['F', 'U'].includes(tipoValor);
    }, []);    // Função para verificar se o usuário tem permissão para editar uma especificação
    // baseado no local_inspecao e perfil_inspecao
    const hasEditPermission = useCallback((localInspecao: string) => {
        // Obtém o perfil de inspeção do usuário do localStorage
        const userDataStr = localStorage.getItem('userData');
        if (!userDataStr) return false;

        try {
            const userData = JSON.parse(userDataStr);
            const perfilInspecao = userData.perfil_inspecao || '';

            // Se local_inspecao for "*", todos os usuários podem editar
            if (localInspecao === "*") return true;

            // Verifica se o perfil do usuário corresponde ao local_inspecao
            return localInspecao === perfilInspecao;
        } catch (error) {
            console.error('Erro ao verificar permissão:', error);
            return false;
        }
    }, []);    // Função para atualizar valores em edição
    const handleValueChange = useCallback((specId: number, field: 'valor_encontrado' | 'observacao' | 'conforme', value: string | number | boolean) => {
        setEditingValues((prev) => {
            const currentSpec = prev[specId] || { valor_encontrado: '', observacao: '', conforme: null };
            return {
                ...prev,
                [specId]: {
                    ...currentSpec,
                    [field]: value
                }
            };
        });
    }, []);

    // Função para obter mensagem de permissão baseada no local_inspecao
    const getPermissionMessage = useCallback((localInspecao: string) => {
        if (localInspecao === 'Q') return "Requer perfil de Qualidade (Q) para editar";
        if (localInspecao === 'P') return "Requer perfil de Operador (O) para editar";
        return "";
    }, []);

    // Função para obter o perfil atual do usuário
    const getCurrentUserProfile = useCallback(() => {
        try {
            const userDataStr = localStorage.getItem('userData');
            if (!userDataStr) return '';

            const userData = JSON.parse(userDataStr);
            return userData.perfil_inspecao || '';
        } catch (error) {
            console.error('Erro ao obter perfil do usuário:', error);
            return '';
        }
    }, []);

    const calculateConforme = useCallback((valorEncontrado: number, valorMinimo: number | null, valorMaximo: number | null, tipoValor: string, conformeValue?: boolean | null): boolean | null => {
        // Para tipos de select (A, C, S, L), retorna o valor de conforme diretamente
        if (isSelectType(tipoValor)) {
            return conformeValue !== undefined ? conformeValue : null;
        }

        // Para tipos numéricos (F, U), calcula baseado nos limites
        if (isNumericType(tipoValor)) {
            if (valorMinimo !== null && valorMaximo !== null) {
                return valorEncontrado >= valorMinimo && valorEncontrado <= valorMaximo;
            } else if (valorMaximo !== null) {
                return valorEncontrado <= valorMaximo;
            } else if (valorMinimo !== null) {
                return valorEncontrado >= valorMinimo;
            }
        } return null;
    }, [isSelectType, isNumericType]);    // Função para iniciar a inspeção
    const handleStartInspection = useCallback(async () => {
        if (!id) return;

        try {
            setIsSaving(true);
            // Certificando que não estamos no modo de encaminhamento para o CQ
            setIsForwardingToCQ(false);

            // O código da pessoa já está sendo obtido no service
            await inspecaoService.startInspection(parseInt(id));
            setIsInspectionStarted(true);

            setAlertMessage({
                message: "Inspeção iniciada com sucesso",
                type: "success",
            });
        } catch (error) {
            console.error("Erro ao iniciar inspeção:", error);
            setAlertMessage({
                message: "Erro ao iniciar a inspeção",
                type: "error",
            });
        } finally {
            setIsSaving(false);
        }
    }, [id]);

    // Global action handlers
    const handleSaveAllChanges = useCallback(async () => {
        setIsSaving(true);
        const errors: string[] = [];

        try {
            // Get all specifications that have pending changes
            const specsToSave = specifications.filter(spec =>
                editingValues[spec.id_especificacao] !== undefined
            );

            for (const spec of specsToSave) {
                try {
                    const editingData = editingValues[spec.id_especificacao];

                    if (isSelectType(spec.tipo_valor)) {
                        // Para tipos de select, salvamos apenas o valor conforme
                        if (editingData.conforme === undefined || editingData.conforme === null) continue;

                        const updateData = {
                            valor_encontrado: editingData.conforme === true ? 1 : 0,
                            conforme: editingData.conforme,
                            observacao: editingData.observacao || null
                        };

                        await inspecaoService.updateInspectionSpecification(spec.id_especificacao, updateData);

                    } else {
                        // Para tipos numéricos
                        const valorEncontrado = parseFloat(editingData.valor_encontrado);
                        if (isNaN(valorEncontrado)) continue;

                        const conforme = calculateConforme(valorEncontrado, spec.valor_minimo, spec.valor_maximo, spec.tipo_valor);

                        const updateData = {
                            valor_encontrado: valorEncontrado,
                            conforme: conforme,
                            observacao: editingData.observacao || null
                        };

                        await inspecaoService.updateInspectionSpecification(spec.id_especificacao, updateData);
                    }
                } catch (error) {
                    console.error(`Erro ao salvar especificação ${spec.id_especificacao}:`, error);
                    errors.push(`Especificação ${spec.ordem}: ${error}`);
                }
            }

            if (errors.length === 0) {
                // Reload specifications to get updated data
                await handleRefresh();
                // Clear all editing values
                setEditingValues({});
                // TODO: Show success notification
                console.log('Todas as alterações foram salvas com sucesso!');
            } else {
                // TODO: Show partial success notification with errors
                console.error('Algumas especificações não puderam ser salvas:', errors);
            }

        } catch (error) {
            console.error("Erro geral ao salvar alterações:", error);
            // TODO: Show error notification
        } finally {
            setIsSaving(false);
        }
    }, [specifications, editingValues, isSelectType, calculateConforme, handleRefresh]);

    // Efeito para verificar os dados do localStorage
    useEffect(() => {
        // Função para checar os dados armazenados no localStorage
        const checkLocalStorageData = () => {
            try {
                console.log('=== Verificando dados no localStorage ===');

                // Verificar dados do colaborador
                const colaboradorData = localStorage.getItem('colaborador');
                if (colaboradorData) {
                    const parsed = JSON.parse(colaboradorData);
                    console.log('Dados do colaborador:', parsed);
                } else {
                    console.log('Nenhum dado de colaborador encontrado no localStorage');
                }

                // Verificar userData
                const userDataStr = localStorage.getItem('userData');
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    console.log('UserData:', userData);
                    console.log('Código da pessoa (userData):', userData.codigo_pessoa);
                    console.log('Perfil de inspeção (userData):', userData.perfil_inspecao);
                } else {
                    console.log('Nenhum userData encontrado no localStorage');
                }

                // Verificar código da pessoa direto
                const codigoPessoa = localStorage.getItem('codigo_pessoa');
                console.log('Código da pessoa (direto):', codigoPessoa);

                console.log('======================================');
            } catch (error) {
                console.error('Erro ao ler dados do localStorage:', error);
            }
        };

        // Executar a verificação na montagem do componente
        checkLocalStorageData();

        // Opcionalmente, você pode adicionar um listener para mudanças no localStorage
        // Mas isso só funciona para mudanças feitas em outras abas/janelas
        const handleStorageChange = () => {
            console.log('🔄 localStorage foi modificado em outra aba');
            checkLocalStorageData();
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Função para interromper a inspeção
    const handleInterruptInspection = useCallback(() => {
        if (isInspectionStarted) {
            // Poderíamos adicionar uma chamada API aqui se necessário
            setIsInspectionStarted(false);
        }
    }, [isInspectionStarted]); const handleForwardToCQ = useCallback(async () => {
        if (!id) return;

        try {
            setIsSaving(true);
            setIsForwardingToCQ(true);
            await inspecaoService.forwardToCQ(parseInt(id));

            setAlertMessage({
                message: "Ficha encaminhada para o CQ com sucesso",
                type: "success",
            });

            // Redireciona após um pequeno delay para garantir que o usuário veja a mensagem
            setTimeout(() => {
                router.back();
            }, 1500);
        } catch (error) {
            console.error("Erro ao encaminhar para CQ:", error);
            setAlertMessage({
                message: "Falha ao encaminhar ficha para o CQ",
                type: "error",
            });
        } finally {
            setIsSaving(false);
            setIsForwardingToCQ(false);
        }
    }, [id, router]);

    /**
     * Confirma o recebimento de uma ficha de inspeção
     */
    const handleConfirmReceipt = useCallback(async () => {
        if (!id) return;

        try {
            setIsSaving(true);
            setIsConfirmingReceipt(true);
            await inspecaoService.confirmReceipt(parseInt(id));

            setAlertMessage({
                message: "Recebimento confirmado com sucesso",
                type: "success",
            });

            // Recarregar dados após confirmar recebimento
            await handleRefresh();
        } catch (error) {
            console.error("Erro ao confirmar recebimento:", error);
            setAlertMessage({
                message: "Falha ao confirmar recebimento",
                type: "error",
            });
        } finally {
            setIsSaving(false);
            setIsConfirmingReceipt(false);
        }
    }, [id, handleRefresh]);

    const getInstrumentIcon = (tipoInstrumento: string) => {
        if (tipoInstrumento?.toLowerCase() === 'visual') {
            return <Eye className="h-5 w-5" />;
        }
        return <Ruler className="h-5 w-5" />;
    }; const getConformeStatus = (conforme: boolean | null | undefined, valorEncontrado: number | null | undefined) => {
        // Se não tiver valor encontrado
        if (valorEncontrado === null || valorEncontrado === undefined) {
            return {
                icon: <AlertCircle className="h-4 w-4" />,
                text: "Não informado",
                className: "bg-slate-50 text-slate-700 ring-1 ring-slate-200/50"
            };
        }

        // Se exibe_resultado for 'N', apenas mostra se foi informado ou não
        if (fichaDados.exibe_resultado === 'N') {
            return {
                icon: <CheckCircle className="h-4 w-4" />,
                text: "Informado",
                className: "bg-blue-100 text-blue-800 border border-blue-300 shadow-sm"
            };
        }

        // Se exibe_resultado for 'S', mostra status de conformidade
        if (conforme === true) {
            return {
                icon: <CheckCircle className="h-4 w-4" />,
                text: "Conforme",
                className: "bg-green-100 text-green-800 border border-green-300 shadow-sm"
            };
        }

        if (conforme === false) {
            return {
                icon: <XCircle className="h-4 w-4" />,
                text: "Não Conforme",
                className: "bg-red-100 text-red-800 border border-red-300 shadow-sm"
            };
        }

        return {
            icon: <AlertCircle className="h-4 w-4" />,
            text: "Pendente",
            className: "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"
        };
    }; if (loading) {
        return (
            <div className="w-full space-y-4 p-2 sm:p-3 md:p-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </button>                    <div>
                        <h1 className="text-xl font-medium text-slate-800">Especificações da Inspeção</h1>
                        <p className="text-sm text-slate-500">Ficha #{id}</p>
                    </div>
                </div>
                <div className="flex justify-center py-20">
                    <LoadingSpinner
                        size="large"
                        text="Carregando especificações..."
                        color="primary"
                        showText={true}
                    />
                </div>
            </div>
        );
    } if (error) {
        return (
            <div className="w-full space-y-4 p-2 sm:p-3 md:p-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </button>                    <div>
                        <h1 className="text-xl font-medium text-slate-800">Especificações da Inspeção</h1>
                        <p className="text-sm text-slate-500">Ficha #{id}</p>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="text-center bg-white p-8 rounded-xl border border-red-100 shadow-lg max-w-md">
                        <div className="relative mx-auto h-16 w-16 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-red-100 animate-pulse"></div>
                            <AlertCircle className="relative z-10 h-10 w-10 text-red-500" />
                        </div>

                        <h3 className="mt-6 text-lg font-semibold text-slate-900">
                            Erro ao carregar especificações
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100 font-mono">
                            {error}
                        </p>
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={handleRefresh}
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1ABC9C] to-[#16A085] px-5 py-2.5 text-sm font-medium text-white hover:from-[#16A085] hover:to-[#0E8C7F] transition-all shadow-md hover:shadow-lg"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Tentar novamente
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    } return (
        <div className="space-y-5 p-2 sm:p-4 md:p-6 mx-auto">
            {alertMessage && (
                <AlertMessage
                    message={alertMessage.message}
                    type={alertMessage.type}
                    onDismiss={() => setAlertMessage(null)}
                    autoDismiss={true}
                    dismissDuration={3000}
                />
            )}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 gap-4">
                    <div className="flex items-center">
                        <button
                            onClick={handleBack}
                            className="mr-3 rounded-full hover:bg-slate-100 p-2 transition-all bg-slate-50 border border-slate-200"
                        >
                            <ArrowLeft className="h-5 w-5 text-slate-600" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold text-slate-800">Especificações da Inspeção</h1>
                                <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md font-medium">
                                    Ficha #{fichaDados.id_ficha_inspecao}
                                </span>
                            </div>                            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1">
                                    <Ruler className="h-3.5 w-3.5" />
                                    {specifications.length} especificação(ões)
                                </span>
                                {fichaDados.qtde_produzida && (
                                    <>
                                        <span className="text-slate-300">•</span>
                                        <span>Qtde produzida: {fichaDados.qtde_produzida}</span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Botões de ação no cabeçalho - Design mais técnico */}                    {specifications.length > 0 && (<div className="flex flex-row items-center space-x-2">                        <button
                        onClick={handleStartInspection}
                        disabled={isInspectionStarted || isSaving}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1ABC9C] to-[#16A085] px-4 py-2.5 text-sm font-medium text-white hover:from-[#16A085] hover:to-[#0E8C7F] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving && !isForwardingToCQ && !isConfirmingReceipt ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Iniciando...
                            </>
                        ) : (
                            <>
                                <CheckSquare className="h-4 w-4" />
                                {isInspectionStarted ? "Inspeção iniciada" : "Iniciar"}
                            </>
                        )}
                    </button>

                        {/* Botão de Encaminhar CQ - exibido com base em condições */}
                        {(() => {                            // Verificar se deve mostrar o botão de encaminhar CQ usando a mesma lógica do getCurrentUserProfile
                            const userDataStr = localStorage.getItem('userData');
                            let canForwardCQ = false;
                            let userProfile = '';

                            if (userDataStr) {
                                try {
                                    const userData = JSON.parse(userDataStr);
                                    // Verificar se o valor de encaminhar_ficha é 4
                                    canForwardCQ = userData?.encaminhar_ficha === 4;
                                    userProfile = userData?.perfil_inspecao || '';
                                    console.log('[Debug] encaminhar_ficha value:', userData?.encaminhar_ficha);
                                    console.log('[Debug] userProfile:', userProfile);
                                } catch (e) {
                                    console.error('Error parsing userData:', e);
                                }
                            }
                            // Obter ID do tipo de inspeção da ficha
                            // Usamos a primeira especificação porque todas pertencem à mesma ficha de inspeção
                            // e o id_tipo_inspecao é uma propriedade da ficha, não da especificação
                            const fichaData = specifications.length > 0 ? fichaDados : null;
                            const inspectionType = specifications.length > 0 ? (() => {
                                // Verificar se há dados adicionais no localStorage sobre a ficha
                                try {
                                    const fichaStr = localStorage.getItem('currentInspectionSheet');
                                    if (fichaStr) {
                                        const ficha = JSON.parse(fichaStr);
                                        return ficha?.id_tipo_inspecao || null;
                                    }
                                } catch (e) {
                                    console.error('Error parsing ficha data from localStorage:', e);
                                }

                                // Caso não encontre no localStorage, usar o ID da ficha para identificar
                                return fichaData?.id_ficha_inspecao === 4 ? 4 : null;
                            })() : null;

                            console.log('[Debug] id_tipo_inspecao:', inspectionType);

                            // Exibe botão apenas se o tipo de inspeção for 4 e o usuário tem permissão
                            const showForwardButton = inspectionType === 4 && canForwardCQ;
                            console.log('[Debug] showForwardButton:', showForwardButton, '(inspecao tipo 4:', inspectionType === 4, ', permissão encaminhar_ficha=4:', canForwardCQ, ')');

                            if (showForwardButton) {
                                return (
                                    <button
                                        onClick={handleForwardToCQ}
                                        disabled={isSaving}
                                        className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving && isForwardingToCQ ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Encaminhando...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4" />
                                                Encaminhar CQ
                                            </>
                                        )}
                                    </button>
                                );
                            }

                            return null;
                        })()}

                        <button
                            onClick={handleConfirmReceipt}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving && isConfirmingReceipt ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    Confirmando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    Confirmar Recebimento
                                </>
                            )}
                        </button>
                    </div>
                    )}</div>
            </div>


            {specifications.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-8 text-center sm:py-12 bg-white rounded-lg border border-dashed border-slate-300 shadow-sm"
                >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                        <Ruler className="h-7 w-7 text-slate-400" />
                    </div>
                    <h3 className="mt-4 text-base font-medium text-slate-800">
                        Nenhuma especificação encontrada
                    </h3>
                    <p className="mt-1 px-4 text-sm text-slate-500 max-w-md mx-auto">
                        Não há especificações cadastradas para esta ficha de inspeção.
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                >
                    {specifications
                        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                        .map((spec, index) => {
                            const statusInfo = getConformeStatus(spec.conforme, spec.valor_encontrado);
                            const isExpanded = expandedCards.has(spec.id_especificacao); return (<motion.div
                                key={spec.id_especificacao}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: isExpanded ? 1.01 : 1,
                                    boxShadow: isExpanded ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "0 0 0 rgba(0, 0, 0, 0)"
                                }} transition={{ delay: index * 0.03 }} className={`spec-card group relative bg-white rounded-lg border ${isExpanded
                                    ? 'border-slate-300'
                                    : statusInfo.text === 'Conforme'
                                        ? 'border-green-200'
                                        : statusInfo.text === 'Não Conforme'
                                            ? 'border-red-200'
                                            : statusInfo.text === 'Informado'
                                                ? 'border-blue-200'
                                                : 'border-slate-200'
                                    } overflow-hidden hover:shadow-md transition-all duration-200                                    `}
                                data-expanded={isExpanded}
                            >                                {/* Status Indicator - Thin stripe on top instead of left border */}
                                <div className={`absolute top-0 left-0 right-0 h-1 ${statusInfo.text === 'Conforme' ? 'bg-green-500' :
                                    statusInfo.text === 'Não Conforme' ? 'bg-red-500' :
                                        statusInfo.text === 'Não informado' ? 'bg-slate-300' :
                                            statusInfo.text === 'Informado' ? 'bg-blue-500' : 'bg-amber-500'
                                    }`}></div>
                                {/* Removed permission indicator from corner */}

                                {/* Card Header - Always visible */}                                <div
                                    className="p-4 cursor-pointer" onClick={() => setExpandedCards(prev => {
                                        const newSet = new Set<number>();
                                        // Se o item clicado já estava expandido, apenas feche-o (retornando um conjunto vazio)
                                        // Se não estava expandido, adicione apenas este item ao conjunto
                                        if (!prev.has(spec.id_especificacao)) {
                                            newSet.add(spec.id_especificacao);
                                        }
                                        return newSet;
                                    })}
                                >
                                    <div className="flex items-center justify-between">
                                        {/* Left: Order badge and title */}
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {/* Technical order number badge */}
                                            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200 shadow-sm">
                                                <span className="font-semibold text-slate-700">{spec.ordem}</span>
                                            </div>                                                {/* Title with technical styling */}                                            <div className="min-w-0">                                                    <h3 className="text-base font-semibold text-slate-800 truncate flex items-center">                                                {spec.svg_cota && (
                                                <span className="inline-flex mr-2.5 flex-shrink-0 text-slate-700 items-center justify-center">
                                                    <svg
                                                        viewBox="0 0 100 100"
                                                        width="28"
                                                        height="28"
                                                        className="spec-icon-svg"
                                                        dangerouslySetInnerHTML={{ __html: spec.svg_cota }}
                                                        style={{ strokeWidth: "1", minWidth: "28px" }}
                                                    />
                                                </span>
                                            )}
                                                {spec.descricao_cota}
                                                {spec.complemento_cota && (
                                                    <span className="text-slate-400 text-sm ml-1">
                                                        ({spec.complemento_cota})
                                                    </span>)}
                                            </h3>
                                            </div>
                                        </div>

                                        {/* Right: Status badge and expand/collapse */}
                                        <div className="flex items-center gap-3">                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.text === 'Conforme'
                                            ? 'bg-green-50 text-green-700 ring-1 ring-green-200/50'
                                            : statusInfo.text === 'Não Conforme'
                                                ? 'bg-red-50 text-red-700 ring-1 ring-red-200/50'
                                                : statusInfo.text === 'Informado'
                                                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50'
                                                    : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/50'
                                            }`}>
                                            <span className="w-3 h-3 flex-shrink-0">
                                                {statusInfo.icon}
                                            </span>
                                            {statusInfo.text}
                                        </span>

                                            {/* Expand/collapse icon with improved styling */}
                                            <button className="p-1.5 rounded-md hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                                                {isExpanded ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                                                        <polyline points="18 15 12 9 6 15"></polyline>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                                                        <polyline points="6 9 12 15 18 9"></polyline>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>                                    {/* Short description with technical look */}                                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mt-2 ml-13">
                                        {/* Left side with specification details */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Caracteristica SVG badge */}
                                            {spec.svg_caracteristica && (
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                                                    <span className="inline-flex flex-shrink-0 text-slate-400 items-center justify-center">
                                                        <svg
                                                            viewBox="0 0 100 100"
                                                            width="18"
                                                            height="18"
                                                            className="spec-icon-svg"
                                                            dangerouslySetInnerHTML={{ __html: spec.svg_caracteristica }}
                                                            style={{ strokeWidth: "1", minWidth: "18px" }}
                                                        />
                                                    </span>
                                                    <span className="truncate font-medium">{spec.descricao_caracteristica || 'Característica'}</span>
                                                </div>
                                            )}

                                            {/* Instrument info */}
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                                                <span className="text-slate-400">{getInstrumentIcon(spec.tipo_instrumento || '')}</span>
                                                <span className="truncate font-medium">{spec.tipo_instrumento || '-'}</span>
                                            </div>

                                            {/* Technical tolerance display - only shown when exibe_faixa is 'S' */}
                                            {fichaDados.exibe_faixa === 'S' && (
                                                <div className="bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                                                    {isNumericType(spec.tipo_valor) ? (
                                                        <span className="flex items-center gap-1.5 font-medium">
                                                            {spec.valor_minimo !== null && spec.valor_maximo !== null ? (
                                                                <>{spec.valor_minimo} - {spec.valor_maximo} <span className="text-slate-500">{spec.unidade_medida || ''}</span></>
                                                            ) : spec.valor_minimo !== null ? (
                                                                <>Min: {spec.valor_minimo} <span className="text-slate-500">{spec.unidade_medida || ''}</span></>
                                                            ) : spec.valor_maximo !== null ? (
                                                                <>Max: {spec.valor_maximo} <span className="text-slate-500">{spec.unidade_medida || ''}</span></>
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </span>
                                                    ) : isSelectType(spec.tipo_valor) && (
                                                        <span className="font-medium">
                                                            {getSelectOptions(spec.tipo_valor).map(opt => opt.label).join(' / ')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 ml-auto">
                                            {isInspectionStarted && !hasEditPermission(spec.local_inspecao) && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border bg-amber-50 border-amber-200 text-amber-700">
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                        </svg>
                                                        Perfil sem permissão
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {spec.valor_encontrado !== null && spec.valor_encontrado !== undefined && (
                                    <div className="mt-2 ml-13">
                                        <div className={`
                                            inline-flex items-center gap-1.5 px-2 py-1 rounded-md border
                                            ${fichaDados.exibe_resultado === 'S' ?
                                                (spec.conforme === true ?
                                                    'bg-green-50 border-green-200' :
                                                    spec.conforme === false ?
                                                        'bg-red-50 border-red-200' :
                                                        'bg-amber-50 border-amber-200') :
                                                'bg-blue-50 border-blue-200'
                                            }`}>
                                            {fichaDados.exibe_resultado === 'S' ? (
                                                <span className="text-xs font-medium">
                                                    {spec.conforme === true ?
                                                        <CheckCircle className="h-3.5 w-3.5 text-green-600" /> :
                                                        spec.conforme === false ?
                                                            <XCircle className="h-3.5 w-3.5 text-red-600" /> :
                                                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                                    }
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium">
                                                    <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                                                </span>
                                            )}
                                            <span className="font-medium">
                                                {isNumericType(spec.tipo_valor) ?
                                                    `${spec.valor_encontrado} ${spec.unidade_medida || ''}` :
                                                    isSelectType(spec.tipo_valor) ?
                                                        (spec.conforme === true ?
                                                            getSelectOptions(spec.tipo_valor).find(opt => opt.value === true)?.label :
                                                            getSelectOptions(spec.tipo_valor).find(opt => opt.value === false)?.label) :
                                                        spec.valor_encontrado.toString()
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {/* Expandable content */}
                                {isExpanded && (<motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="border-t border-slate-100 bg-slate-50/60 p-4"
                                >
                                    {/* Technical Input Field */}
                                    <div className="bg-white rounded-md border border-slate-200 p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Inserir Medição</span>
                                        </div>
                                        {isSelectType(spec.tipo_valor) ? (
                                            <div>
                                                <p className="text-xs text-slate-600 mb-2 font-medium flex items-center gap-2">
                                                    Selecione uma opção:
                                                    {isInspectionStarted && !hasEditPermission(spec.local_inspecao) && (
                                                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 ml-auto">
                                                            {getPermissionMessage(spec.local_inspecao)}
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {getSelectOptions(spec.tipo_valor).map((option) => (<button key={String(option.value)}
                                                        onClick={() => handleValueChange(spec.id_especificacao, 'conforme', option.value)}
                                                        disabled={!isInspectionStarted || !hasEditPermission(spec.local_inspecao)}
                                                        className={`px-3.5 py-2 rounded-md text-sm font-medium transition-all 
                                                                ${(!isInspectionStarted || !hasEditPermission(spec.local_inspecao) ? 'opacity-50 cursor-not-allowed ' : '')}
                                                                ${(editingValues[spec.id_especificacao]?.conforme === option.value || (!editingValues[spec.id_especificacao] && spec.conforme === option.value))
                                                                ? (option.value
                                                                    ? 'bg-green-100 text-green-800 border border-green-200 shadow-inner'
                                                                    : 'bg-red-100 text-red-800 border border-red-200 shadow-inner')
                                                                : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div>                                                <label className="block text-xs text-slate-600 font-medium mb-2 flex items-center gap-2">
                                                Valor encontrado:
                                                {spec.unidade_medida && (
                                                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">{spec.unidade_medida}</span>
                                                )}
                                                {isInspectionStarted && !hasEditPermission(spec.local_inspecao) && (
                                                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 ml-auto">
                                                        {getPermissionMessage(spec.local_inspecao)}
                                                    </span>
                                                )}
                                            </label><input
                                                    type="number"
                                                    step="0.01"
                                                    value={editingValues[spec.id_especificacao]?.valor_encontrado !== undefined
                                                        ? editingValues[spec.id_especificacao].valor_encontrado
                                                        : spec.valor_encontrado || ''}
                                                    onChange={(e) => handleValueChange(spec.id_especificacao, 'valor_encontrado', e.target.value)}
                                                    disabled={!isInspectionStarted || !hasEditPermission(spec.local_inspecao)}
                                                    className={`w-full px-4 py-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm font-mono
                                                        ${!isInspectionStarted || !hasEditPermission(spec.local_inspecao) ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}
                                                    `}
                                                    placeholder="Digite o valor..."
                                                />
                                            </div>
                                        )}

                                        {/* Technical observations button */}
                                        <div className="mt-4 flex justify-end">                                            <button
                                            onClick={() => toggleObservationField(spec.id_especificacao)}
                                            disabled={!isInspectionStarted || !hasEditPermission(spec.local_inspecao)}
                                            className={`text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 font-medium
                                                    ${!isInspectionStarted || !hasEditPermission(spec.local_inspecao) ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                        >
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            {expandedObservations.has(spec.id_especificacao) ? 'Ocultar observação' : 'Adicionar observação'}
                                        </button>
                                        </div>                                        {/* Technical expandable observation field */}
                                        {expandedObservations.has(spec.id_especificacao) && (
                                            <div className="mt-3">                                                <textarea
                                                placeholder="Digite sua observação técnica..."
                                                value={editingValues[spec.id_especificacao]?.observacao || spec.observacao || ''}
                                                onChange={(e) => handleValueChange(spec.id_especificacao, 'observacao', e.target.value)}
                                                disabled={!isInspectionStarted || !hasEditPermission(spec.local_inspecao)}
                                                className={`w-full p-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none shadow-sm
                                                        ${!isInspectionStarted || !hasEditPermission(spec.local_inspecao) ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}
                                                    `}
                                                rows={2}
                                            />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                                )}
                            </motion.div>
                            );
                        })}
                </motion.div>
            )}            {/* Global Action Buttons - Technical Design */}
            {specifications.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="sticky bottom-4 z-10 mt-4"
                >
                    <div className="bg-white rounded-lg border border-slate-200 shadow-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-sm bg-white/90">
                        {/* Technical Status counters */}                        <div className="minimal-counters flex items-center gap-4 text-xs text-slate-600 overflow-x-auto pb-1 w-full sm:w-auto">                            {fichaDados.exibe_resultado === 'S' ? (
                            <>
                                <div className="counter-item">
                                    <div className="counter-dot bg-green-500"></div>
                                    <span className="counter-label">Conformes:</span>
                                    <span className="counter-value text-green-600 font-mono ml-1">
                                        {specifications.filter(s => s.conforme === true).length}
                                    </span>
                                </div>

                                <div className="counter-item">
                                    <div className="counter-dot bg-red-500"></div>
                                    <span className="counter-label">Não conformes:</span>
                                    <span className="counter-value text-red-600 font-mono ml-1">
                                        {specifications.filter(s => s.conforme === false).length}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="counter-item">
                                    <div className="counter-dot bg-blue-500"></div>
                                    <span className="counter-label">Informados:</span>
                                    <span className="counter-value text-blue-600 font-mono ml-1">
                                        {specifications.filter(s => s.valor_encontrado !== null).length}
                                    </span>
                                </div>
                            </>
                        )}<div className="counter-item">
                                <div className="counter-dot bg-slate-400"></div>
                                <span className="counter-label">{fichaDados.exibe_resultado === 'S' ? 'Pendentes:' : 'Não informados:'}</span>
                                <span className="counter-value text-slate-600 font-mono ml-1">
                                    {specifications.filter(s =>
                                        (isNumericType(s.tipo_valor) && s.valor_encontrado === null) ||
                                        (isSelectType(s.tipo_valor) && s.conforme === null)
                                    ).length}
                                </span>
                            </div>

                            {Object.keys(editingValues).length > 0 && (
                                <div className="counter-item">
                                    <div className="counter-dot bg-blue-500"></div>
                                    <span className="counter-label">Alterações:</span>
                                    <span className="counter-value text-blue-600 font-mono ml-1">
                                        {Object.keys(editingValues).length}
                                    </span>
                                </div>
                            )}
                        </div>                        {/* Technical Action buttons */}
                        <div className="flex items-center gap-3 whitespace-nowrap">
                            {isInspectionStarted && (
                                <>
                                    {specifications.filter(s =>
                                        (isNumericType(s.tipo_valor) && s.valor_encontrado === null) ||
                                        (isSelectType(s.tipo_valor) && s.conforme === null)
                                    ).length === 0 ? (
                                        // Mostrar "Finalizar Inspeção" quando todos os campos estiverem preenchidos
                                        <button
                                            onClick={handleSaveAllChanges}
                                            disabled={isSaving}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1ABC9C] to-[#16A085] text-white rounded-md text-sm font-medium hover:from-[#16A085] hover:to-[#0E8C7F] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                    Salvando...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckSquare className="h-4 w-4" />
                                                    Finalizar Inspeção
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        // Mostrar "Salvar Alterações" quando houver alterações, mas não todos os campos preenchidos
                                        Object.keys(editingValues).length > 0 && (
                                            <button
                                                onClick={handleSaveAllChanges}
                                                disabled={isSaving}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1ABC9C] to-[#16A085] text-white rounded-md text-sm font-medium hover:from-[#16A085] hover:to-[#0E8C7F] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                        Salvando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4" />
                                                        Salvar Alterações
                                                    </>
                                                )}
                                            </button>
                                        )
                                    )}
                                </>
                            )}<button
                                onClick={handleInterruptInspection}
                                disabled={isSaving || !isInspectionStarted}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                            >
                                <StopCircle className="h-4 w-4" />
                                Interromper
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}