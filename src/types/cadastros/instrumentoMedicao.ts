export interface InstrumentoMedicao {
    id_instrumento: number;
    id_tipo_instrumento: number;
    tag: string;
    nome_instrumento: string;
    codigo_artigo: string;
    numero_patrimonio: string;
    numero_serie: string;
    situacao: "A" | "I";
    data_validade: string;
    data_ultima_calibracao: string;
    frequencia_calibracao: string;
    id: number; // Adicionado para compatibilidade com DataTable e DataCards
    nome_tipo_instrumento?: string; // Nome do tipo de instrumento para exibição
}

export interface InstrumentoMedicaoFilter {
    searchTerm?: string;
    status?: string;
}

export interface AlertState {
    message: string | null;
    type: "success" | "error" | "warning";
}