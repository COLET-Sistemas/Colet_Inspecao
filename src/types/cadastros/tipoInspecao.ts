export interface TipoInspecao {
    id: string;
    codigo: string;
    descricao_tipo_inspecao: string;
    situacao: "A" | "I";
}

export interface TipoInspecaoFilter {
    searchTerm?: string;
    status?: string;
}

export interface AlertState {
    message: string | null;
    type: "success" | "error" | "warning";
}