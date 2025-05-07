export interface InstrumentoMedicao {
    id_tipo_instrumento: number;
    tag: string;
    nome_instrumento: string;
    situacao: "A" | "I";
    id: number; // Adicionado para compatibilidade com DataTable e DataCards
}

export interface InstrumentoMedicaoFilter {
    searchTerm?: string;
    status?: string;
}

export interface AlertState {
    message: string | null;
    type: "success" | "error" | "warning";
}