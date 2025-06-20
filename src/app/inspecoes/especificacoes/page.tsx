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
    Clipboard,
    Eye,
    MessageSquare, RefreshCw,
    Ruler,
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

            router.push('/inspecoes');
            return;
        }
    }, [auth.user, router]); const [fichaDados, setFichaDados] = useState<{
        id_ficha_inspecao: number,
        id_tipo_inspecao: number | null,
        situacao: string | null,
        qtde_produzida: number | null,
        exibe_faixa: string,
        exibe_resultado: string
    }>({
        id_ficha_inspecao: 0,
        id_tipo_inspecao: null,
        situacao: null,
        qtde_produzida: null,
        exibe_faixa: 'S',
        exibe_resultado: 'S'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); const [editingValues, setEditingValues] = useState<{ [key: number]: { valor_encontrado: string | number | boolean; observacao: string; conforme?: boolean | null } }>({});
    const [expandedObservations, setExpandedObservations] = useState<Set<number>>(new Set()); const [isSaving, setIsSaving] = useState(false);
    // Variável para controlar se a inspeção foi iniciada
    const [isInspectionStarted, setIsInspectionStarted] = useState(false);
    // Variável para controlar se está encaminhando para o CQ
    const [isForwardingToCQ, setIsForwardingToCQ] = useState(false);
    // Variável para controlar se está confirmando recebimento
    const [isConfirmingReceipt, setIsConfirmingReceipt] = useState(false);
    // Variável para controlar se está finalizando a inspeção
    const [isFinalizing, setIsFinalizing] = useState(false);
    // Variável para expandir/retrair cards
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    // Estado para exibição de mensagens de alerta
    const [alertMessage, setAlertMessage] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);    // Referências para os inputs de cada especificação
    const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});    // Função auxiliar para converter um valor para o tipo adequado
    const convertToValidValue = useCallback((value: unknown): string | number | boolean => {
        if (value === null || value === undefined) {
            return '';
        }

        // Garante que o valor retornado é sempre um dos tipos permitidos
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return value;
        }

        // Se não for um dos tipos permitidos, converte para string
        return String(value);
    }, []);    // Função para processar os valores vindos da API e garantir que são tratados corretamente
    const processSpecValue = useCallback((spec: { valor_encontrado?: string | number | null | undefined; observacao?: string | null; conforme?: boolean | null }) => {
        return {
            valor_encontrado: spec.valor_encontrado !== null && spec.valor_encontrado !== undefined ?
                // Preservar números zero como 0
                (spec.valor_encontrado === 0 ? 0 : convertToValidValue(spec.valor_encontrado)) :
                '',
            observacao: spec.observacao || '',
            conforme: spec.conforme !== undefined ? spec.conforme : null
        };
    }, [convertToValidValue]);

    // Função auxiliar para verificar se um valor está realmente preenchido
    const isValueFilled = useCallback((value: string | number | boolean | null | undefined) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        // Zero é considerado preenchido
        return true;
    }, []);

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

        hasInitialized.current = true; const loadSpecifications = async () => {
            setLoading(true);
            setError(null); try {
                const response = await inspecaoService.getInspectionSpecifications(parseInt(id));
                setSpecifications(response.specifications);

                // Inicializa os estados de edição com os valores carregados
                const initialEditingValues: { [key: number]: { valor_encontrado: string | number | boolean; observacao: string; conforme?: boolean | null } } = {};                // Prepara os valores iniciais para o estado editingValues
                response.specifications.forEach(spec => {
                    // Inicializa valores para todas as especificações, garantindo tratamento correto para valores como 0
                    initialEditingValues[spec.id_especificacao] = processSpecValue(spec);
                });

                // Atualiza o estado com os valores iniciais
                setEditingValues(initialEditingValues);

                setFichaDados({
                    id_ficha_inspecao: response.fichaDados.id_ficha_inspecao,
                    id_tipo_inspecao: response.fichaDados.id_tipo_inspecao || null,
                    situacao: response.fichaDados.situacao || null,
                    qtde_produzida: response.fichaDados.qtde_produzida,
                    exibe_faixa: response.fichaDados.exibe_faixa,
                    exibe_resultado: response.fichaDados.exibe_resultado
                });
            } catch (error) {
                console.error("Erro ao carregar especificações:", error);
                setError("Erro ao carregar especificações da inspeção");
                hasInitialized.current = false;
            } finally {
                setLoading(false);
            }
        };

        loadSpecifications();
    }, [id, convertToValidValue, processSpecValue]); // Depende do ID e das funções de processamento


    // Função para refresh manual
    const handleRefresh = useCallback(async () => {
        if (!id) {
            setError("ID da ficha de inspeção não fornecido");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null); try {
            const response = await inspecaoService.getInspectionSpecifications(parseInt(id));
            setSpecifications(response.specifications);

            // Inicializa os estados de edição com os valores atualizados
            const initialEditingValues: { [key: number]: { valor_encontrado: string | number | boolean; observacao: string; conforme?: boolean | null } } = {};            // Prepara os valores iniciais para o estado editingValues
            response.specifications.forEach(spec => {
                // Inicializa valores para todas as especificações, garantindo tratamento correto para valores como 0
                initialEditingValues[spec.id_especificacao] = processSpecValue(spec);
            });

            // Atualiza o estado com os valores atualizados
            setEditingValues(initialEditingValues);

            setFichaDados({
                id_ficha_inspecao: response.fichaDados.id_ficha_inspecao,
                id_tipo_inspecao: response.fichaDados.id_tipo_inspecao || null,
                situacao: response.fichaDados.situacao || null,
                qtde_produzida: response.fichaDados.qtde_produzida,
                exibe_faixa: response.fichaDados.exibe_faixa,
                exibe_resultado: response.fichaDados.exibe_resultado
            });
        } catch (error) {
            console.error("Erro ao carregar especificações:", error);
            setError("Erro ao carregar especificações da inspeção");
        } finally {
            setLoading(false);
        }
    }, [id, processSpecValue]);
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

            // Se local_inspecao for "P" e perfil_inspecao for "O", permite edição
            if (localInspecao === "P" && perfilInspecao === "O") return true;

            // Verifica se o perfil do usuário corresponde ao local_inspecao
            return localInspecao === perfilInspecao;
        } catch (error) {
            console.error('Erro ao verificar permissão:', error);
            return false;
        }
    }, []);

    // Função para atualizar valores em edição    
    const handleValueChange = useCallback((specId: number, field: 'valor_encontrado' | 'observacao' | 'conforme', value: string | number | boolean) => {
        setEditingValues((prev) => {
            const currentSpec = prev[specId] || { valor_encontrado: '', observacao: '', conforme: null };

            // Se estiver atualizando o valor_encontrado, calcular automaticamente se está conforme
            if (field === 'valor_encontrado' && fichaDados.exibe_resultado === 'S') {
                // Encontrar a especificação atual
                const spec = specifications.find(s => s.id_especificacao === specId);

                if (spec && (spec.tipo_valor === 'F' || spec.tipo_valor === 'U')) {
                    // Para valores numéricos, verificar se está dentro da faixa
                    const numValue = parseFloat(value as string);

                    // Se o valor não for um número válido, não definir conforme
                    if (!isNaN(numValue)) {
                        // Verificar se está dentro da tolerância
                        const minValue = spec.valor_minimo;
                        const maxValue = spec.valor_maximo;

                        // Verificar se está dentro dos limites
                        let isWithinLimits = true;

                        if (minValue !== null && numValue < minValue) {
                            isWithinLimits = false;
                        }

                        if (maxValue !== null && numValue > maxValue) {
                            isWithinLimits = false;
                        }

                        // Atualizar conformidade automaticamente
                        return {
                            ...prev,
                            [specId]: {
                                ...currentSpec,
                                [field]: value,
                                conforme: isWithinLimits
                            }
                        };
                    }
                }
            }

            // Para outros casos ou se não for possível calcular conforme
            return {
                ...prev,
                [specId]: {
                    ...currentSpec,
                    [field]: value
                }
            };
        });
    }, [specifications, fichaDados.exibe_resultado]);

    // Função para obter mensagem de permissão baseada no local_inspecao
    const getPermissionMessage = useCallback((localInspecao: string) => {
        if (localInspecao === 'Q') return "Requer perfil de Qualidade (Q) para editar";
        if (localInspecao === 'P') return "Requer perfil de Operador (O) para editar";
        return "";
    }, []);    // Function removed as it's no longer used// Função para iniciar a inspeção
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
    }, [id]);    // Global action handlers

    // Efeito para verificar os dados do localStorage
    useEffect(() => {
        // Função para checar os dados armazenados no localStorage
        const checkLocalStorageData = () => {
            try {
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

        checkLocalStorageData();

        const handleStorageChange = () => {
            checkLocalStorageData();
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);    // Função para interromper a inspeção
    const handleInterruptInspection = useCallback(async () => {
        if (!isInspectionStarted || !id) return;

        try {
            setIsSaving(true);
            // Preparar os apontamentos para enviar ao servidor
            const apontamentos = specifications.map(spec => {                // Verificar se há valores em edição para esta especificação
                const editingValue = editingValues[spec.id_especificacao];                // Determinar o valor encontrado 
                let valorEncontrado: string | number | null = null;
                if (editingValue?.valor_encontrado !== undefined) {
                    // Para campos de tipo select (A, C, S, L), já deve estar como "S" ou "N"
                    if (typeof editingValue.valor_encontrado === 'boolean') {
                        valorEncontrado = editingValue.valor_encontrado ? 'S' : 'N';
                    } else {
                        valorEncontrado = editingValue.valor_encontrado;
                    }
                } else if (spec.valor_encontrado !== undefined) {
                    // Para campos do tipo select que já estão no spec, verificar se precisa converter
                    if (isSelectType(spec.tipo_valor) && typeof spec.valor_encontrado === 'boolean') {
                        valorEncontrado = spec.valor_encontrado ? 'S' : 'N';
                    } else {
                        valorEncontrado = spec.valor_encontrado;
                    }
                }                // Determinar o valor de conformidade
                // Para campos de select, o valor de conforme deve ser null, pois já é representado em valor_encontrado
                let conforme: boolean | null = null;

                if (!isSelectType(spec.tipo_valor)) {
                    conforme = editingValue?.conforme !== undefined
                        ? editingValue.conforme
                        : (spec.conforme !== undefined ? spec.conforme : null);
                }

                // Determinar a observação
                const observacao: string | null = editingValue?.observacao !== undefined
                    ? editingValue.observacao
                    : (spec.observacao || null);

                return {
                    id_especificacao: spec.id_especificacao,
                    valor_encontrado: valorEncontrado,
                    conforme: conforme,
                    observacao: observacao
                };
            });

            await inspecaoService.interruptInspection(parseInt(id), apontamentos);

            setIsInspectionStarted(false);
            setEditingValues({}); // Limpar valores em edição

            setAlertMessage({
                message: "Inspeção interrompida com sucesso",
                type: "info",
            });

            // Recarregar os dados atualizados
            await handleRefresh();

        } catch (error) {
            console.error("Erro ao interromper inspeção:", error);
            setAlertMessage({
                message: "Erro ao interromper a inspeção",
                type: "error",
            });
        } finally {
            setIsSaving(false);
        }
    }, [id, isInspectionStarted, specifications, editingValues, handleRefresh, isSelectType]);

    const handleForwardToCQ = useCallback(async () => {
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

    /**
     * Finaliza uma ficha de inspeção
     */
    const handleFinalizeInspection = useCallback(async () => {
        if (!isInspectionStarted || !id) return;

        try {
            setIsSaving(true);
            setIsFinalizing(true);

            // Preparar os apontamentos para enviar ao servidor
            const apontamentos = specifications.map(spec => {
                // Verificar se há valores em edição para esta especificação
                const editingValue = editingValues[spec.id_especificacao];                // Determinar o valor encontrado 
                let valorEncontrado: string | number | null = null;
                if (editingValue?.valor_encontrado !== undefined) {
                    if (typeof editingValue.valor_encontrado === 'boolean') {
                        valorEncontrado = editingValue.valor_encontrado ? 'S' : 'N';
                    } else {
                        valorEncontrado = editingValue.valor_encontrado;
                    }
                } else if (spec.valor_encontrado !== undefined) {
                    valorEncontrado = spec.valor_encontrado;
                }

                // Para campos de select, o valor de conforme deve ser null, pois já é representado em valor_encontrado
                let conforme: boolean | null = null;

                if (!isSelectType(spec.tipo_valor)) {
                    conforme = editingValue?.conforme !== undefined
                        ? editingValue.conforme
                        : (spec.conforme !== undefined ? spec.conforme : null);
                }

                // Determinar a observação
                const observacao: string | null = editingValue?.observacao !== undefined
                    ? editingValue.observacao
                    : (spec.observacao || null);

                return {
                    id_especificacao: spec.id_especificacao,
                    valor_encontrado: valorEncontrado,
                    conforme: conforme,
                    observacao: observacao
                };
            });

            await inspecaoService.finalizeInspection(parseInt(id), apontamentos);

            setIsInspectionStarted(false);
            setEditingValues({}); // Limpar valores em edição

            setAlertMessage({
                message: "Inspeção finalizada com sucesso",
                type: "success",
            });

            // Recarregar os dados atualizados
            await handleRefresh();

        } catch (error) {
            console.error("Erro ao finalizar inspeção:", error);
            setAlertMessage({
                message: "Erro ao finalizar a inspeção",
                type: "error",
            });
        } finally {
            setIsSaving(false);
            setIsFinalizing(false);
        }
    }, [id, isInspectionStarted, specifications, editingValues, handleRefresh, isSelectType]);

    const getInstrumentIcon = (tipoInstrumento: string) => {
        if (tipoInstrumento?.toLowerCase() === 'visual') {
            return <Eye className="h-5 w-5" />;
        }
        return <Ruler className="h-5 w-5" />;
    }; const getConformeStatus = (conforme: boolean | null | undefined, valorEncontrado: string | number | boolean | null | undefined) => {
        // Caso 1: Se não tiver valor encontrado (vazio ou null) - Badge cinza "Não informado"
        if (!isValueFilled(valorEncontrado)) {
            return {
                icon: <AlertCircle className="h-4 w-4" />,
                text: "Não informado",
                className: "badge-nao-informado valor-informado-badge badge-needs-attention"
            };
        }

        // A partir daqui, o valor foi informado

        // Caso 2: Se exibe_resultado for 'N' - Badge azul "Informado"
        if (fichaDados.exibe_resultado === 'N') {
            return {
                icon: <CheckCircle className="h-4 w-4" />,
                text: "Informado",
                className: "badge-informado valor-informado-badge"
            };
        }

        // Caso 3: Se exibe_resultado for 'S' - Mostra status de conformidade (verde ou vermelho)
        if (conforme === true) {
            return {
                icon: <CheckCircle className="h-4 w-4" />,
                text: "Conforme",
                className: "badge-conforme valor-informado-badge"
            };
        }

        if (conforme === false) {
            return {
                icon: <XCircle className="h-4 w-4" />,
                text: "Não Conforme",
                className: "badge-nao-conforme valor-informado-badge"
            };
        }

        // Caso 4: Se exibe_resultado for 'S', valor foi informado, mas conforme não está definido
        return {
            icon: <AlertCircle className="h-4 w-4" />,
            text: "Não informado",
            className: "badge-nao-informado valor-informado-badge badge-needs-attention"
        };
    };

    // Função para verificar se os botões de ação devem ser exibidos
    const shouldShowActionButtons = useCallback(() => {
        // Se id_tipo_inspecao for 1, 2, 3 ou 4 e situação de 1 a 9
        if (
            (fichaDados.id_tipo_inspecao === 1 ||
                fichaDados.id_tipo_inspecao === 2 ||
                fichaDados.id_tipo_inspecao === 3 ||
                fichaDados.id_tipo_inspecao === 4) &&
            (fichaDados.situacao !== null &&
                parseInt(fichaDados.situacao) >= 1 &&
                parseInt(fichaDados.situacao) <= 9)
        ) {
            return true;
        }

        // Se id_tipo_inspecao for 5 e situação de 2 a 7
        if (
            fichaDados.id_tipo_inspecao === 5 &&
            (fichaDados.situacao !== null &&
                parseInt(fichaDados.situacao) >= 2 &&
                parseInt(fichaDados.situacao) <= 7)
        ) {
            return true;
        }

        return false;
    }, [fichaDados.id_tipo_inspecao, fichaDados.situacao]);

    if (loading) {
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
                    </button>
                    <div>
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
    }

    return (
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
                    </div>                    {/* Botões de ação no cabeçalho - Design mais técnico */}                    {specifications.length > 0 && (<div className="flex flex-row items-center space-x-2">                        {shouldShowActionButtons() && (
                        <button
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
                                    {isInspectionStarted ? "Inspeção iniciada" : "Iniciar Inspeção"}
                                </>
                            )}
                        </button>
                    )}

                        {(() => {
                            const userDataStr = localStorage.getItem('userData');
                            let canForwardCQ = false;
                            let userProfile = '';

                            if (userDataStr) {
                                try {
                                    const userData = JSON.parse(userDataStr);
                                    // Verificar se o valor de encaminhar_ficha é 4
                                    canForwardCQ = userData?.encaminhar_ficha === 4;
                                    userProfile = userData?.perfil_inspecao || '';

                                    console.log('[Debug] userProfile:', userProfile);
                                } catch (e) {
                                    console.error('Error parsing userData:', e);
                                }
                            }

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


                            // Exibe botão apenas se o tipo de inspeção for 4 e o usuário tem permissão
                            const showForwardButton = inspectionType === 4 && canForwardCQ;

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
                        {(() => {
                            // Verificar se deve mostrar o botão de confirmar recebimento
                            const userDataStr = localStorage.getItem('userData');
                            let userHasQProfile = false;

                            if (userDataStr) {
                                try {
                                    const userData = JSON.parse(userDataStr);
                                    // Verificar se o perfil de inspeção contém a letra Q
                                    const perfilInspecao = userData?.perfil_inspecao || '';
                                    userHasQProfile = perfilInspecao.includes('Q');
                                } catch (e) {
                                    console.error('Erro ao verificar perfil do usuário:', e);
                                }
                            }

                            // Mostra o botão apenas se atender aos critérios
                            const showConfirmButton =
                                fichaDados.id_ficha_inspecao === 5 &&
                                fichaDados.situacao === "4" &&
                                userHasQProfile;


                            if (showConfirmButton) {
                                return (
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
                                );
                            }

                            return null;
                        })()}
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
                >                    {specifications
                    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                    .map((spec, index) => {
                        // Usar os valores em edição se existirem, caso contrário usar os valores originais
                        const valorAtual = editingValues[spec.id_especificacao]?.valor_encontrado !== undefined ?
                            editingValues[spec.id_especificacao].valor_encontrado :
                            spec.valor_encontrado;

                        const conformeAtual = editingValues[spec.id_especificacao]?.conforme !== undefined ?
                            editingValues[spec.id_especificacao].conforme :
                            spec.conforme;

                        const statusInfo = getConformeStatus(conformeAtual, valorAtual);
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
                            data-expanded={isExpanded}                            >                                {/* Status Indicator - Thin stripe on top instead of left border */}
                            <div className={`absolute top-0 left-0 right-0 h-1 ${statusInfo.text === 'Não informado' ? 'bg-slate-300' :
                                statusInfo.text === 'Conforme' ? 'bg-green-500' :
                                    statusInfo.text === 'Não Conforme' ? 'bg-red-500' :
                                        statusInfo.text === 'Informado' ? 'bg-blue-500' :
                                            'bg-slate-300'
                                }`}></div>
                            {/* Removed permission indicator from corner */}

                            {/* Card Header - Always visible */}                                <div
                                className="p-4 cursor-pointer" onClick={() => {
                                    setExpandedCards(prev => {
                                        const newSet = new Set<number>();
                                        // Se o item clicado já estava expandido, apenas feche-o (retornando um conjunto vazio)
                                        // Se não estava expandido, adicione apenas este item ao conjunto
                                        if (!prev.has(spec.id_especificacao)) {
                                            newSet.add(spec.id_especificacao);
                                            // Definir um timeout curto para garantir que o componente seja renderizado
                                            // antes de tentar dar foco ao input
                                            setTimeout(() => {
                                                // Dar foco ao input quando o card é expandido
                                                if (inputRefs.current[spec.id_especificacao]) {
                                                    inputRefs.current[spec.id_especificacao]?.focus();
                                                }
                                            }, 100);
                                        }
                                        return newSet;
                                    });
                                }}
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
                                    </div>                                    {/* Right: Status badge and expand/collapse */}                                        <div className="flex items-center gap-2">                                        {spec.valor_encontrado !== null && spec.valor_encontrado !== undefined && (<div className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium shadow-sm valor-informado-badge bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                                        <Clipboard className="h-3.5 w-3.5 text-slate-500 mr-0.5" />
                                        <span className="font-medium">
                                            Valor já preenchido: {isNumericType(spec.tipo_valor) ?
                                                `${spec.valor_encontrado} ${spec.unidade_medida || ''}` :
                                                isSelectType(spec.tipo_valor) ?
                                                    (spec.conforme === true ?
                                                        getSelectOptions(spec.tipo_valor).find(opt => opt.value === true)?.label :
                                                        getSelectOptions(spec.tipo_valor).find(opt => opt.value === false)?.label) :
                                                    spec.valor_encontrado.toString()
                                            }
                                        </span>
                                    </div>
                                    )}                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium status-badge-indicator ${statusInfo.text === 'Conforme' ? 'bg-green-50 text-green-700 ring-1 ring-green-200/50'
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
                                </div>                            </div>
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
                                            </p>                                                <div className="flex flex-wrap gap-2">
                                                {getSelectOptions(spec.tipo_valor).map((option) => (<button key={String(option.value)}
                                                    onClick={() => {
                                                        // Atualizar valor_encontrado com S para true e N para false
                                                        handleValueChange(spec.id_especificacao, 'valor_encontrado', option.value ? 'S' : 'N');
                                                        // Também definir conforme com o mesmo valor para manter consistência na interface
                                                        handleValueChange(spec.id_especificacao, 'conforme', option.value);
                                                    }}
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
                                            )}                                            </label><input
                                                type="number"
                                                step="0.01"
                                                value={(() => {
                                                    // Convert value to string or number before assignment
                                                    const value = editingValues[spec.id_especificacao]?.valor_encontrado !== undefined
                                                        ? editingValues[spec.id_especificacao].valor_encontrado
                                                        : spec.valor_encontrado || '';

                                                    // If it's a boolean, convert to string
                                                    if (typeof value === 'boolean') {
                                                        return value ? 'S' : 'N';
                                                    }

                                                    // Otherwise return as is
                                                    return value;
                                                })()}
                                                onChange={(e) => handleValueChange(spec.id_especificacao, 'valor_encontrado', e.target.value)}
                                                disabled={!isInspectionStarted || !hasEditPermission(spec.local_inspecao)}
                                                className={`w-full px-4 py-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm font-mono
                                                        ${!isInspectionStarted || !hasEditPermission(spec.local_inspecao) ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}
                                                    `}
                                                placeholder="Digite o valor..."
                                                ref={(el) => { inputRefs.current[spec.id_especificacao] = el; }}
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
                </motion.div>)}            {/* Global Action Buttons - Technical Design */}
            {specifications.length > 0 && isInspectionStarted && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="sticky bottom-4 z-10 mt-4"
                >
                    <div className="bg-white rounded-lg border border-slate-200 shadow-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-sm bg-white/90">                    {/* Technical Status counters */}
                        <div className="minimal-counters flex items-center gap-4 text-xs text-slate-600 overflow-x-auto pb-1 w-full sm:w-auto">
                            {fichaDados.exibe_resultado === 'S' ? (
                                <>
                                    <div className="counter-item">
                                        <div className="counter-dot bg-green-500"></div>
                                        <span className="counter-label">Conformes:</span>
                                        <span className="counter-value text-green-600 font-mono ml-1">
                                            {specifications.filter(s => {
                                                const editingValue = editingValues[s.id_especificacao];
                                                return (editingValue?.conforme !== undefined) ?
                                                    editingValue.conforme === true :
                                                    s.conforme === true;
                                            }).length}
                                        </span>
                                    </div>

                                    <div className="counter-item">
                                        <div className="counter-dot bg-red-500"></div>
                                        <span className="counter-label">Não conformes:</span>
                                        <span className="counter-value text-red-600 font-mono ml-1">
                                            {specifications.filter(s => {
                                                const editingValue = editingValues[s.id_especificacao];
                                                return (editingValue?.conforme !== undefined) ?
                                                    editingValue.conforme === false :
                                                    s.conforme === false;
                                            }).length}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="counter-item">
                                        <div className="counter-dot bg-blue-500"></div>
                                        <span className="counter-label">Informados:</span>                                    <span className="counter-value text-blue-600 font-mono ml-1">
                                            {specifications.filter(s => {
                                                const editingValue = editingValues[s.id_especificacao];
                                                return (editingValue?.valor_encontrado !== undefined && editingValue.valor_encontrado !== '') ?
                                                    true :
                                                    (s.valor_encontrado !== null && s.valor_encontrado !== undefined && s.valor_encontrado !== 0);
                                            }).length}
                                        </span>
                                    </div>
                                </>
                            )}
                            <div className="counter-item">
                                <div className="counter-dot bg-slate-400"></div>
                                <span className="counter-label">{fichaDados.exibe_resultado === 'S' ? 'Pendentes:' : 'Não informados:'}</span>
                                <span className="counter-value text-slate-600 font-mono ml-1">
                                    {specifications.filter(s => {
                                        const editingValue = editingValues[s.id_especificacao]; if (isNumericType(s.tipo_valor)) {
                                            return (editingValue?.valor_encontrado !== undefined) ?
                                                !editingValue.valor_encontrado :
                                                (s.valor_encontrado === null || s.valor_encontrado === undefined);
                                        }

                                        if (isSelectType(s.tipo_valor)) {
                                            return (editingValue?.conforme !== undefined) ?
                                                editingValue.conforme === null :
                                                s.conforme === null;
                                        }

                                        return false;
                                    }).length}
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
                        <div className="flex items-center gap-3 whitespace-nowrap">                            {shouldShowActionButtons() && (
                            <button
                                onClick={handleInterruptInspection}
                                disabled={isSaving || !isInspectionStarted}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                            >
                                {isSaving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Interrompendo...
                                    </>
                                ) : (
                                    <>
                                        <StopCircle className="h-4 w-4" />
                                        Interromper Inspeção
                                    </>
                                )}
                            </button>
                        )}                            {shouldShowActionButtons() && isInspectionStarted &&
                            // Verificar se pelo menos um campo foi preenchido
                            (Object.keys(editingValues).length > 0 ||
                                specifications.some(s => s.valor_encontrado !== null && s.valor_encontrado !== undefined)) && (
                                <button
                                    onClick={handleFinalizeInspection}
                                    disabled={isSaving || isFinalizing}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1ABC9C] to-[#16A085] text-white rounded-md text-sm font-medium hover:from-[#16A085] hover:to-[#0E8C7F] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                                >
                                    {isFinalizing ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Finalizando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4" />
                                            Finalizar Inspeção
                                        </>
                                    )}
                                </button>
                            )}
                        </div>                </div>
                </motion.div>
            )}
        </div>
    );
}