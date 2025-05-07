export interface Posto {
    posto: string;
    nome_posto: string;
    codigo_parada: string;
    descricao_parada: string;
    tipo_recurso: string;
    id: string;
}

// Interface para o estado de alerta
export interface AlertState {
    message: string | null;
    type: 'success' | 'error' | 'warning' | 'info';
}