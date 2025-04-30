export interface TipoInstrumentoMedicao {
    id: number;
    nome_tipo_instrumento: string;
    observacao: string;
}

export interface TipoInstrumentoMedicaoFilter {
    searchTerm?: string;
    status?: string;
}

export interface AlertState {
    message: string | null;
    type: "success" | "error" | "warning";
}