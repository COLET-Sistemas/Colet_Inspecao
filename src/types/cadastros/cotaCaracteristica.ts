export interface CotaCaracteristica {
    id: number;
    descricao: string;
    tipo: string;
    simbolo_path_svg: string;
    unidade_medida: string;
}

export interface CotaCaracteristicaFilter {
    searchTerm?: string;
    tipo?: string;
}

export interface AlertState {
    message: string | null;
    type: "success" | "error" | "warning";
}