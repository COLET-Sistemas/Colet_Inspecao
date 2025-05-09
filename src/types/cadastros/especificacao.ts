/**
 * Tipos para a tela de especificações
 */

// Interface para os processos de inspeção
export interface Especificacao {
    processo: number;
    tipo_acao: string;
    recurso: string;
    setor: string;
    especificacoes_inspecao: number;
}

// Interface para os roteiros de inspeção
export interface Roteiro {
    roteiro: string;
    nome_roteiro: string;
    processos: Especificacao[];
}

// Interface para os dados de referência
export interface DadosReferencia {
    referencia: string;
    descricao: string;
    unidade_estoque: string;
    roteiros: Roteiro[];
}

// Interface para parâmetros de busca de especificações
export interface EspecificacaoFilter {
    referencia?: string;
    roteiro?: string;
    processo?: number;
}

// Interface para o estado de alerta
export interface AlertState {
    message: string | null;
    type: "success" | "error" | "warning" | "info";
}

// Interface para o modal de operações
export interface ModalOperacoesState {
    isOpen: boolean;
    dados: {
        referencia: string;
        roteiro: string;
        processo: number;
    } | null;
}