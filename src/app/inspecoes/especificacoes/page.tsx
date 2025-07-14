"use client";

import { AlertMessage } from "@/components/ui/AlertMessage";
import { LoadingSpinner } from "@/components/ui/Loading";
import { PageHeader } from "@/components/ui/cadastros/PageHeader";
import { ConfirmInspectionModal } from "@/components/ui/cadastros/modais_cadastros/ConfirmInspectionModal";
import QuantidadeEditModal from "@/components/ui/inspecoes/QuantidadeEditModal";
import { useAuth } from "@/hooks/useAuth";
import inspecaoService, { InspectionSpecification } from "@/services/api/inspecaoService";
import { motion } from "framer-motion";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    CheckSquare,
    Edit3,
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
        qtde_inspecionada: number | null,
        exibe_faixa: string,
        exibe_resultado: string,
        descricao_tipo_inspecao: string | null
    }>({
        id_ficha_inspecao: 0,
        id_tipo_inspecao: null,
        situacao: null,
        qtde_produzida: null,
        qtde_inspecionada: null,
        exibe_faixa: 'S',
        exibe_resultado: 'S',
        descricao_tipo_inspecao: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); const [editingValues, setEditingValues] = useState<{ [key: number]: { valor_encontrado: string | number | boolean | null; observacao: string; conforme?: boolean | null } }>({});
    const [isSaving, setIsSaving] = useState(false);
    // Variável para controlar se a inspeção foi iniciada
    const [isInspectionStarted, setIsInspectionStarted] = useState(false);
    // Variável para controlar se está encaminhando para o CQ
    const [isForwardingToCQ, setIsForwardingToCQ] = useState(false);
    // Variável para controlar se está confirmando recebimento
    const [isConfirmingReceipt, setIsConfirmingReceipt] = useState(false);
    // Variável para controlar se está finalizando a inspeção
    const [isFinalizing, setIsFinalizing] = useState(false);
    // Variável para controlar se o modal de edição de quantidades está aberto
    const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);

    // Modal de confirmação para inspeção tipo 9
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Variável para expandir/retrair cards
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    // Estado para rastrear qual input está em foco
    const [focusedInputId, setFocusedInputId] = useState<number | null>(null);
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
    const processSpecValue = useCallback((spec: { valor_encontrado?: string | number | null | undefined; observacao?: string | null; conforme?: boolean | string | null }) => {
        // Processa o valor 'conforme', convertendo strings 'S'/'N' para boolean
        let conformeValue: boolean | null = null;
        if (spec.conforme !== undefined && spec.conforme !== null) {
            if (typeof spec.conforme === 'boolean') {
                conformeValue = spec.conforme;
            } else if (spec.conforme === 'S') {
                conformeValue = true;
            } else if (spec.conforme === 'N') {
                conformeValue = false;
            }
        }

        return {
            valor_encontrado: spec.valor_encontrado !== null && spec.valor_encontrado !== undefined ?
                (spec.valor_encontrado === 0 ? 0 : convertToValidValue(spec.valor_encontrado)) :
                '',
            observacao: spec.observacao || '',
            conforme: conformeValue
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
                    qtde_inspecionada: response.fichaDados.qtde_inspecionada,
                    exibe_faixa: response.fichaDados.exibe_faixa,
                    exibe_resultado: response.fichaDados.exibe_resultado,
                    descricao_tipo_inspecao: response.fichaDados.descricao_tipo_inspecao || null
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
                qtde_inspecionada: response.fichaDados.qtde_inspecionada || null,
                exibe_faixa: response.fichaDados.exibe_faixa,
                exibe_resultado: response.fichaDados.exibe_resultado,
                descricao_tipo_inspecao: response.fichaDados.descricao_tipo_inspecao || null
            });
        } catch (error) {
            console.error("Erro ao carregar especificações:", error);
            setError("Erro ao carregar especificações da inspeção");
        } finally {
            setLoading(false);
        }
    }, [id, processSpecValue]);
    const handleBack = useCallback(() => {
        router.push('/inspecoes');
        setTimeout(() => {
            localStorage.removeItem('activeInspectionTab');
        }, 1500);
    }, [router]);

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
    }, []);
    const hasEditPermission = useCallback((localInspecao: string) => {
        // Obtém o perfil de inspeção do usuário do localStorage
        const userDataStr = localStorage.getItem('userData');
        if (!userDataStr) return false;

        try {
            const userData = JSON.parse(userDataStr);
            const perfilInspecao = userData.perfil_inspecao || '';

            // Exceção: Se id_tipo_inspecao for 5 e o usuário tiver perfil "Q",
            // ele pode editar qualquer especificação independente do local_inspecao
            if (fichaDados.id_tipo_inspecao === 5 && perfilInspecao.includes("Q")) return true;

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
    }, [fichaDados.id_tipo_inspecao]);

    // Função para atualizar valores em edição    
    const handleValueChange = useCallback((specId: number, field: 'valor_encontrado' | 'observacao' | 'conforme', value: string | number | boolean) => {
        setEditingValues((prev) => {
            const currentSpec = prev[specId] || { valor_encontrado: '', observacao: '', conforme: null };

            // Encontrar a especificação atual para verificar o tipo_valor
            const specification = specifications.find(spec => spec.id_especificacao === specId);
            if (!specification) return prev;

            // Copia o valor atual para não modificá-lo diretamente
            const updatedValues = { ...currentSpec };

            if (field === 'valor_encontrado') {
                const tipoValor = specification.tipo_valor;

                // Para campos numéricos (F, U)
                if (['F', 'U'].includes(tipoValor)) {
                    // Garantir que o valor é um número válido ou string vazia
                    if (value === '') {
                        updatedValues.valor_encontrado = '';
                        updatedValues.conforme = null;
                    } else {
                        // Converter para string e permitir apenas números e ponto decimal
                        let numericValue = String(value).replace(/[^0-9.]/g, '');

                        // Garantir apenas um ponto decimal
                        const parts = numericValue.split('.');
                        if (parts.length > 2) {
                            numericValue = `${parts[0]}.${parts.slice(1).join('')}`;
                        }

                        updatedValues.valor_encontrado = numericValue;

                        // Para campos numéricos, o conforme deve ser sempre null
                        // A conformidade será determinada pelo backend com base nos valores mín/máx
                        updatedValues.conforme = null;
                    }
                }
                // Para campos de seleção (A, C, S, L)
                else if (['A', 'C', 'S', 'L'].includes(tipoValor)) {
                    // Para campos de seleção, deixamos valor_encontrado como null
                    // e usamos apenas o campo 'conforme' para armazenar true/false
                    updatedValues.valor_encontrado = null;

                    // Se o valor for booleano ou string 'S'/'N', converter para o campo conforme
                    if (typeof value === 'boolean') {
                        updatedValues.conforme = value; // true = S (conforme), false = N (não conforme)
                    } else if (value === 'S') {
                        updatedValues.conforme = true;
                    } else if (value === 'N') {
                        updatedValues.conforme = false;
                    }
                }
                // Para outros tipos de campos
                else {
                    updatedValues.valor_encontrado = value;
                    // Para outros tipos, o conforme também deve ser null
                    updatedValues.conforme = null;
                }
            } else if (field === 'observacao') {
                updatedValues.observacao = String(value);
            } else if (field === 'conforme') {
                // Para campos de seleção, ao definir conforme, devemos deixar valor_encontrado como null
                if (specification && ['A', 'C', 'S', 'L'].includes(specification.tipo_valor)) {
                    updatedValues.valor_encontrado = null;

                    // Tratar string 'S'/'N' ou booleanos
                    if (value === 'S') {
                        updatedValues.conforme = true;
                    } else if (value === 'N') {
                        updatedValues.conforme = false;
                    } else if (typeof value === 'boolean') {
                        updatedValues.conforme = value;
                    } else {
                        updatedValues.conforme = null;
                    }
                } else {
                    updatedValues.conforme = typeof value === 'boolean' ? value : null;
                }
            }

            return {
                ...prev,
                [specId]: updatedValues
            };
        });
    }, [specifications]);

    // Função para obter mensagem de permissão baseada no local_inspecao
    const getPermissionMessage = useCallback((localInspecao: string) => {
        if (localInspecao === 'Q') return "Requer perfil de Qualidade (Q) para editar";
        if (localInspecao === 'P') return "Requer perfil de Operador (O) para editar";
        return "";
    }, []);    // Function removed as it's no longer used// Função para iniciar a inspeção

    // Função que realmente inicia o processo de inspeção
    const startInspectionProcess = useCallback(async () => {
        try {
            setIsSaving(true);
            // Certificando que não estamos no modo de encaminhamento para o CQ
            setIsForwardingToCQ(false);

            // O código da pessoa já está sendo obtido no service
            await inspecaoService.startInspection(parseInt(id || ""));
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

    const handleStartInspection = useCallback(async () => {
        if (!id) return;

        // Verificar se é inspeção tipo 9 e mostrar modal de confirmação
        if (fichaDados.id_tipo_inspecao === 9) {
            setIsConfirmModalOpen(true);
            return;
        }

        await startInspectionProcess();
    }, [id, fichaDados.id_tipo_inspecao, startInspectionProcess]);

    const processInspectionValue = useCallback((spec: InspectionSpecification, editingValue?: { valor_encontrado?: string | number | boolean | null; observacao?: string; conforme?: boolean | null }) => {
        const result = {
            valorEncontrado: null as string | number | null,
            conforme: null as boolean | null,
            observacao: null as string | null
        };

        // Process valor_encontrado based on tipo_valor
        if (['F', 'U'].includes(spec.tipo_valor)) {
            if (editingValue?.valor_encontrado !== undefined && editingValue.valor_encontrado !== '') {
                const numValue = parseFloat(String(editingValue.valor_encontrado));
                result.valorEncontrado = isNaN(numValue) ? null : numValue;
            } else if (spec.valor_encontrado !== undefined && spec.valor_encontrado !== null) {
                const numValue = parseFloat(String(spec.valor_encontrado));
                result.valorEncontrado = isNaN(numValue) ? null : numValue;
            }

            result.conforme = null;
        }
        // For selection fields (A, C, S, L)
        else if (['A', 'C', 'S', 'L'].includes(spec.tipo_valor)) {
            // For selection fields, always set valorEncontrado to null
            result.valorEncontrado = null;
            if (editingValue?.conforme !== undefined) {
                if (editingValue.conforme === true) {
                    result.conforme = true;  // Corresponde a 'S' no backend
                } else if (editingValue.conforme === false) {
                    result.conforme = false; // Corresponde a 'N' no backend
                } else {
                    result.conforme = null;
                }
            } else if (spec.conforme !== undefined) {
                result.conforme = spec.conforme;
            }
        }

        else {
            if (editingValue?.valor_encontrado !== undefined) {
                if (typeof editingValue.valor_encontrado === 'boolean') {
                    result.valorEncontrado = editingValue.valor_encontrado ? 'S' : 'N';
                } else {
                    result.valorEncontrado = editingValue.valor_encontrado;
                }
            } else if (spec.valor_encontrado !== undefined) {
                result.valorEncontrado = spec.valor_encontrado;
            }

            result.conforme = null;
        }

        // Process observacao
        result.observacao = editingValue?.observacao !== undefined
            ? editingValue.observacao
            : (spec.observacao || null);

        return result;
    }, []);    // Função para interromper a inspeção
    const handleInterruptInspection = useCallback(async () => {
        if (!isInspectionStarted || !id) return;

        try {
            setIsSaving(true);
            // Preparar os apontamentos para enviar ao servidor - apenas os que foram alterados
            const apontamentos = specifications
                .map(spec => {
                    // Verificar se há valores em edição para esta especificação
                    const editingValue = editingValues[spec.id_especificacao];

                    // Se não houver valores em edição, não incluir esta especificação
                    if (!editingValue) return null;

                    // Verificar se houve alguma alteração nos valores
                    const valorAlterado = editingValue.valor_encontrado !== undefined &&
                        editingValue.valor_encontrado !== '' &&
                        editingValue.valor_encontrado !== spec.valor_encontrado;

                    const conformeAlterado = editingValue.conforme !== undefined &&
                        editingValue.conforme !== spec.conforme;

                    const observacaoAlterada = editingValue.observacao !== undefined &&
                        editingValue.observacao !== spec.observacao &&
                        editingValue.observacao !== '';

                    // Se nenhum valor foi alterado, não incluir esta especificação
                    if (!valorAlterado && !conformeAlterado && !observacaoAlterada) return null;

                    // Process values using our helper function
                    const processedValues = processInspectionValue(spec, editingValue);

                    return {
                        id_especificacao: spec.id_especificacao,
                        valor_encontrado: processedValues.valorEncontrado,
                        conforme: processedValues.conforme,
                        observacao: processedValues.observacao
                    };
                })
                .filter(item => item !== null);

            await inspecaoService.interruptInspection(
                parseInt(id),
                apontamentos,
                fichaDados.qtde_produzida
            );

            setIsInspectionStarted(false);
            setEditingValues({});

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
    }, [id, isInspectionStarted, specifications, editingValues, handleRefresh, fichaDados.qtde_produzida, processInspectionValue]);

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

    const handleFinalizeInspection = useCallback(async () => {
        if (!isInspectionStarted || !id) return;

        try {
            setIsSaving(true);
            setIsFinalizing(true);

            // Preparar os apontamentos para enviar ao servidor - apenas os que foram alterados
            const apontamentos = specifications
                .map(spec => {
                    // Verificar se há valores em edição para esta especificação
                    const editingValue = editingValues[spec.id_especificacao];

                    // Se não houver valores em edição, não incluir esta especificação
                    if (!editingValue) return null;

                    // Verificar se houve alguma alteração nos valores
                    const valorAlterado = editingValue.valor_encontrado !== undefined &&
                        editingValue.valor_encontrado !== '' &&
                        editingValue.valor_encontrado !== spec.valor_encontrado;

                    const conformeAlterado = editingValue.conforme !== undefined &&
                        editingValue.conforme !== spec.conforme;

                    const observacaoAlterada = editingValue.observacao !== undefined &&
                        editingValue.observacao !== spec.observacao &&
                        editingValue.observacao !== '';

                    // Se nenhum valor foi alterado, não incluir esta especificação
                    if (!valorAlterado && !conformeAlterado && !observacaoAlterada) return null;

                    // Process values using our helper function
                    const processedValues = processInspectionValue(spec, editingValue);

                    return {
                        id_especificacao: spec.id_especificacao,
                        valor_encontrado: processedValues.valorEncontrado,
                        conforme: processedValues.conforme,
                        observacao: processedValues.observacao
                    };
                })
                .filter(item => item !== null);

            const response = await inspecaoService.finalizeInspection(
                parseInt(id),
                apontamentos,
                fichaDados.qtde_produzida
            );

            setIsInspectionStarted(false);
            setEditingValues({});

            // Verificar se a API retornou uma mensagem ou um erro
            if (response.mensagem) {
                // Se há uma mensagem, exibir como sucesso
                setAlertMessage({
                    message: response.mensagem,
                    type: "success",
                });
            } else if (response.erro) {
                // Se há um erro mas nenhuma mensagem, exibir como info
                setAlertMessage({
                    message: response.erro,
                    type: "info",
                });
            } else {
                // Caso padrão se nenhuma mensagem/erro específico for retornado
                setAlertMessage({
                    message: "Inspeção finalizada com sucesso",
                    type: "success",
                });
            }

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
    }, [id, isInspectionStarted, specifications, editingValues, handleRefresh, fichaDados.qtde_produzida, processInspectionValue]);


    const handleEditQuantity = useCallback(() => {
        setIsQuantityModalOpen(true);
    }, []);

    const handleCloseQuantityModal = useCallback(() => {
        setIsQuantityModalOpen(false);
    }, []);

    const handleQuantityEditSuccess = useCallback((qtdeProduzida: number | null, qtdeInspecionada: number | null, message: string) => {
        // Atualiza o estado local após sucesso na API
        setFichaDados(prev => ({
            ...prev,
            qtde_produzida: qtdeProduzida,
            qtde_inspecionada: qtdeInspecionada
        }));

        setAlertMessage({
            message: message,
            type: "success"
        });
    }, []);

    const handleQuantityEditError = useCallback((message: string) => {
        setAlertMessage({
            message: message,
            type: "error"
        });
    }, []);

    const getInstrumentIcon = (tipoInstrumento: string) => {
        if (tipoInstrumento?.toLowerCase() === 'visual') {
            return <Eye className="h-5 w-5" />;
        }
        return <Ruler className="h-5 w-5" />;
    }; const getConformeStatus = (conforme: boolean | null | undefined | string, valorEncontrado: string | number | boolean | null | undefined, unidadeMedida?: string, tipoValor?: string, spec?: InspectionSpecification) => {

        let conformeBoolean: boolean | null | undefined = null;
        if (typeof conforme === 'boolean') {
            conformeBoolean = conforme;
        } else if (conforme === 'S') {
            conformeBoolean = true;
        } else if (conforme === 'N') {
            conformeBoolean = false;
        } else {
            conformeBoolean = conforme as (boolean | null | undefined);
        }

        // Se exibe_resultado for 'N', sempre mostramos apenas "Informado" ou "Não informado"
        if (fichaDados.exibe_resultado === 'N') {
            // Se não tem valor preenchido - Não informado
            if (!isValueFilled(valorEncontrado) && conformeBoolean === null) {
                return {
                    icon: <AlertCircle className="h-4 w-4 relative top-[-2px] mr-1" />,
                    text: "Não informado",
                    className: "badge-nao-informado valor-informado-badge badge-needs-attention"
                };
            } else {
                // Se tem valor ou conforme - Informado
                // Formatar o valor para exibição
                let displayValue;

                if (isSelectType(tipoValor || '')) {
                    if (conformeBoolean === true) {
                        switch (tipoValor) {
                            case 'A': displayValue = 'Aprovado'; break;
                            case 'C': displayValue = 'Conforme'; break;
                            case 'S': displayValue = 'Sim'; break;
                            case 'L': displayValue = 'Liberdade'; break;
                            default: displayValue = 'Conforme'; break;
                        }
                    } else if (conformeBoolean === false) {
                        switch (tipoValor) {
                            case 'A': displayValue = 'Reprovado'; break;
                            case 'C': displayValue = 'Não Conforme'; break;
                            case 'S': displayValue = 'Não'; break;
                            case 'L': displayValue = 'Retido'; break;
                            default: displayValue = 'Não Conforme'; break;
                        }
                    } else {
                        displayValue = '';
                    }
                } else if (typeof valorEncontrado === 'boolean') {
                    displayValue = valorEncontrado ? 'Conforme' : 'Não Conforme';
                } else if (valorEncontrado === 'S' || valorEncontrado === 'N') {
                    displayValue = valorEncontrado === 'S' ? 'Conforme' : 'Não Conforme';
                } else if (valorEncontrado !== null && valorEncontrado !== undefined) {
                    displayValue = `${valorEncontrado}${unidadeMedida ? ' ' + unidadeMedida : ''}`;
                } else {
                    displayValue = '';
                }

                return {
                    icon: <CheckCircle className="h-4 w-4 relative top-[-2px] mr-1" />,
                    text: displayValue ? `Informado: ${displayValue}` : "Informado",
                    className: "badge-informado valor-informado-badge"
                };
            }
        }

        // Caso 1: Não informado - se não tem valor preenchido nem conforme definido
        if (!isValueFilled(valorEncontrado) && conformeBoolean === null) {
            return {
                icon: <AlertCircle className="h-4 w-4 relative top-[-2px] mr-1" />,
                text: "Não informado",
                className: "badge-nao-informado valor-informado-badge badge-needs-attention"
            };
        }

        // Caso 2: Para tipos de seleção (A, C, S, L), o campo conforme determina o status
        if (['A', 'C', 'S', 'L'].includes(tipoValor || '')) {
            if (conformeBoolean === true) {
                const text = "Conforme";
                let displayText = "";
                switch (tipoValor) {
                    case 'A': displayText = "Aprovado"; break;
                    case 'C': displayText = "Conforme"; break;
                    case 'S': displayText = "Sim"; break;
                    case 'L': displayText = "Liberdade"; break;
                }
                return {
                    icon: <CheckCircle className="h-4 w-4 relative top-[-2px] mr-1" />,
                    text: `${text}: ${displayText}`,
                    className: "badge-conforme"
                };
            } else if (conformeBoolean === false) {
                const text = "Não Conforme";
                let displayText = "";
                switch (tipoValor) {
                    case 'A': displayText = "Reprovado"; break;
                    case 'C': displayText = "Não Conforme"; break;
                    case 'S': displayText = "Não"; break;
                    case 'L': displayText = "Retido"; break;
                }
                return {
                    icon: <XCircle className="h-4 w-4 relative top-[-2px] mr-1" />,
                    text: `${text}: ${displayText}`,
                    className: "badge-nao-conforme"
                };
            }
        }

        // Caso 3: Para tipo numérico Float (F), verificar se está dentro do intervalo min-max
        if (tipoValor === 'F' && isValueFilled(valorEncontrado)) {
            // Converte para número para comparação
            const numericValue = typeof valorEncontrado === 'number'
                ? valorEncontrado
                : typeof valorEncontrado === 'string'
                    ? parseFloat(valorEncontrado)
                    : 0;

            const spec_valor_minimo = spec?.valor_minimo !== undefined ? spec.valor_minimo : null;
            const spec_valor_maximo = spec?.valor_maximo !== undefined ? spec.valor_maximo : null;

            // Verifica se está dentro do intervalo
            const isWithinRange =
                (spec_valor_minimo === null || numericValue >= spec_valor_minimo) &&
                (spec_valor_maximo === null || numericValue <= spec_valor_maximo);

            // Formatação do valor para exibição
            const displayValue = `${numericValue}${unidadeMedida ? ' ' + unidadeMedida : ''}`;

            if (isWithinRange) {
                return {
                    icon: <CheckCircle className="h-4 w-4 relative top-[-2px] mr-1" />,
                    text: `Conforme: ${displayValue}`,
                    className: "badge-conforme"
                };
            } else {
                return {
                    icon: <XCircle className="h-4 w-4 relative top-[-2px] mr-1" />,
                    text: `Não Conforme: ${displayValue}`,
                    className: "badge-nao-conforme"
                };
            }
        }

        // Caso 4: Para tipo Único (U), verificar se é igual ao valor_maximo
        if (tipoValor === 'U' && isValueFilled(valorEncontrado)) {
            // Converte para número para comparação
            const numericValue = typeof valorEncontrado === 'number'
                ? valorEncontrado
                : typeof valorEncontrado === 'string'
                    ? parseFloat(valorEncontrado)
                    : 0;

            const spec_valor_maximo = spec?.valor_maximo !== undefined ? spec.valor_maximo : null;

            // Verifica se é igual ao valor padrão
            const isEqualToTarget = spec_valor_maximo !== null && numericValue === spec_valor_maximo;

            // Formatação do valor para exibição
            const displayValue = `${numericValue}${unidadeMedida ? ' ' + unidadeMedida : ''}`;

            if (isEqualToTarget) {
                return {
                    icon: <CheckCircle className="h-4 w-4 relative top-[-2px] mr-1" />,
                    text: `Conforme: ${displayValue}`,
                    className: "badge-conforme"
                };
            } else {
                return {
                    icon: <XCircle className="h-4 w-4 relative top-[-2px] mr-1" />,
                    text: `Não Conforme: ${displayValue}`,
                    className: "badge-nao-conforme"
                };
            }
        }

        // Caso 5: Valor encontrado preenchido mas não temos regras específicas
        // Mostramos como "Informado: [valor]"
        let displayValue;
        if (typeof valorEncontrado === 'boolean') {
            displayValue = valorEncontrado ? 'Conforme' : 'Não Conforme';
        } else if (valorEncontrado === 'S' || valorEncontrado === 'N') {
            displayValue = valorEncontrado === 'S' ? 'Conforme' : 'Não Conforme';
        } else {
            displayValue = `${valorEncontrado}${unidadeMedida ? ' ' + unidadeMedida : ''}`;
        }

        return {
            icon: <CheckCircle className="h-4 w-4 relative top-[-2px] mr-1" />,
            text: `Informado: ${displayValue}`,
            className: "badge-informado valor-informado-badge"
        };
    };

    // Função para verificar se os botões de ação devem ser exibidos
    const shouldShowActionButtons = useCallback(() => {
        // Primeiro, verifica se o usuário tem permissão baseada em registrar_ficha no localStorage
        let userCanRegister = false;
        const userDataStr = localStorage.getItem('userData');

        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                const registrarFicha = userData?.registrar_ficha;
                const idTipoInspecao = fichaDados?.id_tipo_inspecao;

                // Verifica se registrarFicha existe e contém o id_tipo_inspecao atual
                if (registrarFicha !== undefined && idTipoInspecao !== null) {
                    if (typeof registrarFicha === 'string') {
                        // Se for uma string, verificar se contém o número do tipo de inspeção
                        if (registrarFicha.includes(',')) {
                            // Se for uma string separada por vírgulas
                            const allowedTypes = registrarFicha.split(',').map(type => parseInt(type.trim()));
                            userCanRegister = allowedTypes.includes(idTipoInspecao);
                        } else {
                            // Se for uma string simples
                            userCanRegister = registrarFicha.includes(idTipoInspecao.toString());
                        }
                    } else if (Array.isArray(registrarFicha)) {
                        // Se for um array, verificar se contém o id_tipo_inspecao
                        userCanRegister = registrarFicha.includes(idTipoInspecao) ||
                            registrarFicha.includes(idTipoInspecao.toString());
                    } else if (typeof registrarFicha === 'number') {
                        // Se for um número único
                        userCanRegister = registrarFicha === idTipoInspecao;
                    } else if (typeof registrarFicha === 'boolean') {
                        // Se for booleano, assumimos que true significa que pode registrar qualquer tipo
                        userCanRegister = registrarFicha;
                    }
                }
            } catch (e) {
                console.error('Erro ao verificar permissões de registro:', e);
                userCanRegister = false;
            }
        }

        // Se o usuário não tem permissão para registrar, retorna false imediatamente
        if (!userCanRegister) {
            return false;
        }

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

        // Se id_tipo_inspecao for 9 e situação de 1 a 7 e diferente de 5
        if (
            fichaDados.id_tipo_inspecao === 9 &&
            fichaDados.situacao !== null &&
            [1, 2, 3, 4, 6, 7].includes(parseInt(fichaDados.situacao))
        ) {
            return true;
        }

        return false;
    }, [fichaDados.id_tipo_inspecao, fichaDados.situacao]);

    if (loading) {
        return (
            <div className="w-full space-y-4 p-2 sm:p-3 md:p-4">
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
            {/* Modal de edição de quantidades */}
            {isQuantityModalOpen && (
                <QuantidadeEditModal
                    isOpen={isQuantityModalOpen}
                    onClose={handleCloseQuantityModal}
                    onSuccess={handleQuantityEditSuccess}
                    onError={handleQuantityEditError}
                    initialQtdeProduzida={fichaDados.qtde_produzida}
                    initialQtdeInspecionada={fichaDados.qtde_inspecionada}
                    fichaId={id || ""}
                    title="Editar Quantidades"
                />
            )}

            {/* Modal de confirmação para inspeção tipo 9 */}
            <ConfirmInspectionModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={() => {
                    setIsConfirmModalOpen(false);
                    startInspectionProcess();
                }}
                onNoClick={handleEditQuantity}
                message={`Confirma o tamanho do lote de inspeção de ${fichaDados.qtde_inspecionada} peças.`}
                title="Confirmação de Lote"
                isSubmitting={isSaving}
            />

            {alertMessage && (
                <AlertMessage
                    message={alertMessage.message}
                    type={alertMessage.type}
                    onDismiss={() => setAlertMessage(null)}
                    autoDismiss={true}
                    dismissDuration={3000}
                />
            )}

            {/* Cabeçalho da página */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center">
                    <button
                        onClick={handleBack}
                        className="mr-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <PageHeader
                        title={`Especificações -${fichaDados.descricao_tipo_inspecao ? ` ${fichaDados.descricao_tipo_inspecao}` : ''}`}
                        subtitle={`Ficha #${fichaDados.id_ficha_inspecao} • ${specifications.length} ${specifications.length === 1 ? 'especificação' : 'especificações'}${fichaDados.qtde_produzida ? ` • Qtde produzida: ${fichaDados.qtde_produzida}` : ''}${fichaDados.qtde_inspecionada ? ` • Qtde inspecionada: ${fichaDados.qtde_inspecionada}` : ''
                            }`}
                        showButton={false}
                    />
                </div>

                {/* Botões de ação à direita do título */}
                {specifications.length > 0 && shouldShowActionButtons() && (
                    <div className="flex flex-row items-center space-x-2">
                        {/* Botão de encaminhar para CQ */}
                        {(() => {
                            const userDataStr = localStorage.getItem('userData');
                            let canForwardCQ = false;

                            if (userDataStr) {
                                try {
                                    const userData = JSON.parse(userDataStr);
                                    const encaminharFicha = userData?.encaminhar_ficha;
                                    const idTipoInspecao = fichaDados?.id_tipo_inspecao;

                                    if (encaminharFicha !== undefined && idTipoInspecao !== null) {
                                        if (typeof encaminharFicha === 'string') {
                                            if (encaminharFicha.includes(',')) {
                                                const allowedTypes = encaminharFicha.split(',').map(type => parseInt(type.trim()));
                                                canForwardCQ = allowedTypes.includes(idTipoInspecao);
                                            } else {
                                                canForwardCQ = encaminharFicha.includes(idTipoInspecao.toString());
                                            }
                                        } else if (Array.isArray(encaminharFicha)) {
                                            canForwardCQ = encaminharFicha.includes(idTipoInspecao) ||
                                                encaminharFicha.includes(idTipoInspecao.toString());
                                        } else if (typeof encaminharFicha === 'number') {
                                            canForwardCQ = encaminharFicha === idTipoInspecao;
                                        } else if (typeof encaminharFicha === 'boolean') {
                                            canForwardCQ = encaminharFicha;
                                        }
                                    }
                                } catch (e) {
                                    console.error('Error parsing userData:', e);
                                }
                            }

                            if (canForwardCQ) {
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

                        {/* Botão de confirmar recebimento */}
                        {(() => {
                            const userDataStr = localStorage.getItem('userData');
                            let userHasQProfile = false;

                            if (userDataStr) {
                                try {
                                    const userData = JSON.parse(userDataStr);
                                    const perfilInspecao = userData?.perfil_inspecao || '';
                                    userHasQProfile = perfilInspecao.includes('Q');
                                } catch (e) {
                                    console.error('Erro ao verificar perfil do usuário:', e);
                                }
                            }

                            const showConfirmButton =
                                fichaDados.id_tipo_inspecao === 5 &&
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

                        {/* Botão de Editar Quantidade - exibido apenas quando a inspeção estiver iniciada */}
                        {isInspectionStarted && (
                            <button
                                onClick={handleEditQuantity}
                                disabled={isSaving || isQuantityModalOpen}
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isQuantityModalOpen
                                    ? "bg-gradient-to-r from-[#1d4ed8] to-[#1e40af]"
                                    : "bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8]"
                                    }`}
                            >
                                <Edit3 className={`h-4 w-4 ${isQuantityModalOpen ? 'animate-spin' : ''}`} />
                                {isQuantityModalOpen ? "Editando..." : "Editar Quantidade"}
                            </button>
                        )}

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


                    </div>
                )}
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
                    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((spec, index) => {
                        const valorAtual = editingValues[spec.id_especificacao]?.valor_encontrado !== undefined ?
                            editingValues[spec.id_especificacao].valor_encontrado :
                            spec.valor_encontrado;

                        const conformeAtual = editingValues[spec.id_especificacao]?.conforme !== undefined ?
                            editingValues[spec.id_especificacao].conforme :
                            spec.conforme;

                        const statusInfo = isSelectType(spec.tipo_valor) ?
                            getConformeStatus(conformeAtual, null, undefined, spec.tipo_valor, spec) :
                            getConformeStatus(conformeAtual, valorAtual, spec.unidade_medida, spec.tipo_valor, spec);
                        const isExpanded = expandedCards.has(spec.id_especificacao); return (<motion.div
                            key={spec.id_especificacao}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: isExpanded ? 1.01 : 1,
                                boxShadow: isExpanded ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "0 0 0 rgba(0, 0, 0, 0)"
                            }} transition={{ delay: index * 0.03 }} className={`spec-card group relative bg-white rounded-xl border ${isExpanded
                                ? 'border-slate-300 shadow-lg'
                                : statusInfo.text.startsWith('Conforme:') ? 'border-green-100'
                                    : statusInfo.text.startsWith('Não Conforme:')
                                        ? 'border-red-100'
                                        : statusInfo.text.startsWith('Informado:') || statusInfo.text === 'Informado'
                                            ? 'border-blue-200'
                                            : 'border-slate-200'
                                } overflow-hidden hover:shadow-lg transition-all duration-200`}
                            data-expanded={isExpanded}                            >
                            <div className={`absolute top-0 right-0 bottom-0 w-2 ${statusInfo.text === 'Não informado' ? 'bg-slate-400' :
                                statusInfo.text.startsWith('Conforme:') ? 'bg-green-400' :
                                    statusInfo.text.startsWith('Não Conforme:') ? 'bg-red-400' :
                                        statusInfo.text.startsWith('Informado:') || statusInfo.text === 'Informado' ? 'bg-blue-400' :
                                            'bg-slate-400'
                                }`} style={{ zIndex: 10 }}></div>

                            <div
                                className="p-4 cursor-pointer" onClick={() => {
                                    setExpandedCards(prev => {
                                        const newSet = new Set<number>();
                                        if (!prev.has(spec.id_especificacao)) {
                                            newSet.add(spec.id_especificacao);
                                            setTimeout(() => {
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
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-sm">
                                            <span className="font-semibold text-slate-700">{spec.ordem}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-base font-semibold text-slate-800 truncate flex items-center">                                                {spec.svg_cota && (
                                                <span className="inline-flex mr-2.5 flex-shrink-0 text-slate-700 items-center justify-center">
                                                    <svg
                                                        viewBox="0 0 100 100"
                                                        width="32"
                                                        height="32"
                                                        className="spec-icon-svg"
                                                        dangerouslySetInnerHTML={{ __html: spec.svg_cota }}
                                                        style={{ strokeWidth: "1", minWidth: "28px" }}
                                                    />
                                                </span>
                                            )}
                                                {spec.descricao_cota}
                                                {spec.complemento_cota && (
                                                    <span className="text-slate-500 text-sm ml-2">
                                                        ({spec.complemento_cota})
                                                    </span>)}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 h-8 text-xs font-medium status-badge-modern ${statusInfo.text.startsWith('Conforme:') ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                                        : statusInfo.text.startsWith('Não Conforme:')
                                            ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : statusInfo.text.startsWith('Informado:') || statusInfo.text === 'Informado'
                                                ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                                                : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'
                                        }`}>
                                        <span className="w-3 h-3 flex-shrink-0">
                                            {statusInfo.icon}
                                        </span>
                                        {statusInfo.text}
                                    </span>


                                        <button className="p-1.5 rounded-full hover:bg-slate-100 transition-all duration-200 border border-transparent hover:border-slate-200 hover:shadow-sm">
                                            {isExpanded ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 transition-transform">
                                                    <polyline points="18 15 12 9 6 15"></polyline>
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 transition-transform">
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mt-2 ml-0 md:ml-13">
                                    <div className="flex items-center gap-2.5 flex-wrap">



                                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-slate-50 to-slate-100 px-2.5 py-1.5 h-8 rounded-full border border-slate-200 shadow-sm transition-all duration-200 hover:shadow">
                                            <span className="text-slate-500">{getInstrumentIcon(spec.tipo_instrumento || '')}</span>
                                            <span className="truncate font-medium">{spec.tipo_instrumento || '-'}</span>
                                        </div>
                                        {fichaDados.exibe_faixa === 'S' && (
                                            <div className="flex items-center bg-gradient-to-r from-slate-50 to-slate-100 px-2.5 py-1.5 h-8 rounded-full border border-slate-200 shadow-sm transition-all duration-200 hover:shadow">
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
                                        {spec.svg_caracteristica && (
                                            <div className="flex items-center gap-1.5 bg-gradient-to-r from-slate-50 to-slate-100 px-2.5 py-1.5 h-8 rounded-full border border-slate-200 shadow-sm transition-all duration-200 hover:shadow">
                                                <span className="inline-flex flex-shrink-0 text-slate-500 items-center justify-center">
                                                    <svg
                                                        viewBox="0 0 100 100"
                                                        width="20"
                                                        height="20"
                                                        className="spec-icon-svg"
                                                        dangerouslySetInnerHTML={{ __html: spec.svg_caracteristica }}
                                                        style={{ strokeWidth: "1", minWidth: "16px" }}
                                                    />
                                                </span>
                                                <span className="truncate font-medium">{spec.descricao_caracteristica || 'Característica'}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-auto md:mr-9">
                                        {isInspectionStarted && !hasEditPermission(spec.local_inspecao) && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 h-8 rounded-full border bg-amber-50 border-amber-200 text-amber-700 shadow-sm">
                                                <span className="flex items-center gap-1 font-medium">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="13"
                                                        height="13"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                    </svg>
                                                    <span className="hidden md:block">Perfil sem permissão</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                            {isExpanded && (<motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-slate-100 bg-gradient-to-b from-slate-50/80 to-white p-4"
                            >
                                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-md backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
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
                                                {getSelectOptions(spec.tipo_valor).map((option) => (
                                                    <button
                                                        key={String(option.value)}
                                                        onClick={() =>
                                                            handleValueChange(spec.id_especificacao, 'conforme', option.value)
                                                        }
                                                        disabled={!isInspectionStarted || !hasEditPermission(spec.local_inspecao)}
                                                        className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all border shadow-sm
                        ${(!isInspectionStarted || !hasEditPermission(spec.local_inspecao))
                                                                ? 'opacity-50 cursor-not-allowed'
                                                                : 'hover:shadow'
                                                            }
                        ${(() => {
                                                                // Função auxiliar para normalizar o valor conforme
                                                                const isConformeMatch = (conformeValue: boolean | string | null | undefined, optionValue: boolean) => {
                                                                    // Se for booleano, comparação direta
                                                                    if (typeof conformeValue === 'boolean') {
                                                                        return conformeValue === optionValue;
                                                                    }
                                                                    // Se for string 'S'/'N', converter para boolean
                                                                    else if (typeof conformeValue === 'string') {
                                                                        return (conformeValue === 'S' && optionValue === true) ||
                                                                            (conformeValue === 'N' && optionValue === false);
                                                                    }
                                                                    return false;
                                                                };

                                                                // Verificar em editingValues
                                                                const editingValueMatch = editingValues[spec.id_especificacao]?.conforme !== undefined &&
                                                                    isConformeMatch(editingValues[spec.id_especificacao].conforme, option.value);

                                                                // Verificar no valor original da spec
                                                                const specValueMatch = !editingValues[spec.id_especificacao] &&
                                                                    spec.conforme !== undefined &&
                                                                    spec.conforme !== null &&
                                                                    isConformeMatch(spec.conforme, option.value);

                                                                return (editingValueMatch || specValueMatch)
                                                                    ? option.value
                                                                        ? 'bg-green-100/80 text-green-700 border border-green-100 shadow-inner'
                                                                        : 'bg-red-100/80 text-red-700 border border-red-100 shadow-inner'
                                                                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100';
                                                            })()
                                                            }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="mt-2 mb-0 p-1">
                                        <div className="flex flex-col sm:flex-row items-start gap-3 w-full">
                                            {(() => {
                                                const labelClass =
                                                    "block text-xs leading-tight text-slate-600 font-medium mb-1 flex items-center gap-1.5";
                                                const inputClass =
                                                    "w-full h-[36px] px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all duration-200 ease-in-out modern-input compact-input shadow-sm relative z-10";
                                                const containerClass = "relative flex-1";

                                                return (
                                                    <>
                                                        {isNumericType(spec.tipo_valor) && (
                                                            <div className={`${containerClass} w-full sm:w-1/2`}>
                                                                <div className="w-full">
                                                                    <label className={labelClass}>
                                                                        Valor encontrado:
                                                                        {spec.unidade_medida && (
                                                                            <span className="text-xs bg-slate-100 px-1.5 mt-1 py-0.5 rounded text-slate-500 font-mono leading-none">
                                                                                {spec.unidade_medida}
                                                                            </span>
                                                                        )}
                                                                    </label>
                                                                    <div className="relative input-focus-container">
                                                                        {focusedInputId === spec.id_especificacao && (
                                                                            <div className="absolute -inset-1 bg-primary-50/20 rounded-lg transition-all duration-300 ease-in-out animate-pulse"></div>
                                                                        )}
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={(() => {
                                                                                const value =
                                                                                    editingValues[spec.id_especificacao]?.valor_encontrado !== undefined
                                                                                        ? editingValues[spec.id_especificacao].valor_encontrado
                                                                                        : spec.valor_encontrado || "";

                                                                                if (value === null) return "";
                                                                                if (typeof value === "boolean") return value ? "S" : "N";
                                                                                return value;
                                                                            })()}
                                                                            onChange={(e) =>
                                                                                handleValueChange(spec.id_especificacao, "valor_encontrado", e.target.value)
                                                                            }
                                                                            onFocus={() => setFocusedInputId(spec.id_especificacao)}
                                                                            onBlur={() => setFocusedInputId(null)}
                                                                            disabled={!isInspectionStarted || !hasEditPermission(spec.local_inspecao)}
                                                                            className={`${inputClass} font-mono ${!isInspectionStarted || !hasEditPermission(spec.local_inspecao)
                                                                                ? "opacity-50 cursor-not-allowed bg-slate-50"
                                                                                : "hover:shadow-md"
                                                                                }`}
                                                                            placeholder="Digite o valor..."
                                                                            ref={(el) => {
                                                                                inputRefs.current[spec.id_especificacao] = el;
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div
                                                            className={`${containerClass} ${isNumericType(spec.tipo_valor) ? "w-full sm:w-1/2" : "w-full"
                                                                }`}
                                                        >
                                                            <div className="w-full">
                                                                <label className={labelClass}>
                                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                                    Observação:
                                                                    {isInspectionStarted && !hasEditPermission(spec.local_inspecao) && (
                                                                        <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 ml-auto">
                                                                            {getPermissionMessage(spec.local_inspecao)}
                                                                        </span>
                                                                    )}
                                                                </label>
                                                                <div className="relative input-focus-container">
                                                                    {focusedInputId === -spec.id_especificacao && (
                                                                        <div className="absolute -inset-1 bg-primary-50/20 rounded-lg transition-all duration-300 ease-in-out animate-pulse"></div>
                                                                    )}
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Digite sua observação técnica..."
                                                                        value={
                                                                            editingValues[spec.id_especificacao]?.observacao ||
                                                                            spec.observacao ||
                                                                            ""
                                                                        }
                                                                        onChange={(e) =>
                                                                            handleValueChange(spec.id_especificacao, "observacao", e.target.value)
                                                                        }
                                                                        onFocus={() => setFocusedInputId(-spec.id_especificacao)}
                                                                        onBlur={() => setFocusedInputId(null)}
                                                                        disabled={!isInspectionStarted || !hasEditPermission(spec.local_inspecao)}
                                                                        className={`${inputClass}  mt-1  font-mono ${!isInspectionStarted || !hasEditPermission(spec.local_inspecao)
                                                                            ? "opacity-50 cursor-not-allowed bg-slate-50"
                                                                            : "hover:shadow-md"
                                                                            }`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                            )}
                        </motion.div>
                        );
                    })}
                </motion.div>)}
            {specifications.length > 0 && isInspectionStarted && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="sticky bottom-4 z-10 mt-4"
                >
                    <div className="bg-white rounded-lg border border-slate-200 shadow-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-sm bg-white/90">
                        <div className="hidden md:flex items-center gap-4 text-xs text-slate-600 overflow-x-auto pb-1 w-full sm:w-auto">
                            <div className="counter-item">
                                <div className="counter-dot bg-blue-500"></div>
                                <span className="counter-label">{specifications.length === 1 ? 'Especificação:' : 'Especificações:'}</span>
                                <span className="counter-value text-blue-600 font-mono ml-1">
                                    {specifications.length}
                                </span>
                            </div>

                            <div className="counter-item">
                                <div className="counter-dot bg-amber-500"></div>
                                <span className="counter-label">Informados:</span>
                                <span className="counter-value text-amber-600 font-mono ml-1">
                                    {specifications.filter(s => {
                                        const editingValue = editingValues[s.id_especificacao];
                                        // Para campos de seleção, verificar se conforme foi definido
                                        if (isSelectType(s.tipo_valor)) {
                                            return (editingValue?.conforme !== undefined && editingValue.conforme !== null) ||
                                                (s.conforme !== null && s.conforme !== undefined);
                                        }
                                        // Para outros campos, verificar valor_encontrado
                                        const hasEditingValue = editingValue?.valor_encontrado !== undefined && editingValue.valor_encontrado !== '';
                                        const hasOriginalValue = s.valor_encontrado !== null && s.valor_encontrado !== undefined && s.valor_encontrado !== 0;
                                        return hasEditingValue || hasOriginalValue;
                                    }).length}
                                </span>
                            </div>

                            <div className="counter-item">
                                <div className="counter-dot bg-slate-400"></div>
                                <span className="counter-label">{fichaDados.exibe_resultado === 'S' ? 'Pendentes:' : 'Não informados:'}</span>
                                <span className="counter-value text-slate-600 font-mono ml-1">
                                    {specifications.filter(s => {
                                        const editingValue = editingValues[s.id_especificacao];
                                        if (isNumericType(s.tipo_valor)) {
                                            return (editingValue?.valor_encontrado !== undefined) ?
                                                !editingValue.valor_encontrado :
                                                (s.valor_encontrado === null || s.valor_encontrado === undefined);
                                        }
                                        if (isSelectType(s.tipo_valor)) {
                                            // Para campos de seleção (A, C, S, L), verificamos se o campo conforme está definido
                                            return (editingValue?.conforme !== undefined) ?
                                                editingValue.conforme === null :
                                                s.conforme === null;
                                        }

                                        return false;
                                    }).length}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 whitespace-nowrap">
                            {shouldShowActionButtons() && (
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
                            )}
                            {shouldShowActionButtons() && isInspectionStarted &&
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
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}