
/**
 * Interface para especificação de inspeção
 */
export interface EspecificacaoInspecao {
    id: number;
    operacao: number;
    ordem: number;
    id_cota: number;
    especificacao_cota: string;
    complemento_cota: string;
    svg_cota: string;
    id_caracteristica_especial: number;
    especificacao_caracteristica: string;
    caracteristica_especial?: string; // Adicionado para compatibilidade com o modal
    svg_caracteristica: string;
    id_tipo_instrumento: number;
    tipo_instrumento: string;
    tipo_valor: string;
    valor_minimo: number;
    valor_maximo: number;
    unidade_medida: string;
    uso_inspecao_setup: string;
    uso_inspecao_processo: string;
    uso_inspecao_qualidade: string;
    cota_seguranca?: string; // Opcional, indica se é uma cota de segurança (S/N)
}

/**
 * Interface para operação do processo
 */
export interface OperacaoProcesso {
    id_operacao: number;
    operacao: number;
    descricao_operacao: string;
    frequencia_minutos: number;
    especificacoes_inspecao: EspecificacaoInspecao[];
}

/**
 * Interface para detalhes completos do processo
 */
export interface ProcessoDetalhes {
    referencia: string;
    descricao: string;
    roteiro: string;
    nome_roteiro: string;
    processo: number;
    tipo_acao: string;
    recurso: string;
    setor: string;
    operacoes: OperacaoProcesso[];
}

/**
 * Interface para listagem resumida de processos
 */
export interface ProcessoListItem {
    referencia: string;
    descricao: string;
    roteiro: string;
    nome_roteiro: string;
    processo: number;
    tipo_acao: string;
    setor: string;
    total_operacoes: number;
}

/**
 * Interface para filtros de busca de processos
 */
export interface ProcessoFiltros {
    referencia?: string;
    roteiro?: string;
    processo?: string | number;
    setor?: string;
}

/**
 * Interface para parâmetros de busca de processos
 */
export interface ProcessoParams {
    referencia: string;
    roteiro: string;
    processo: string | number;
}
