export interface CotaCaracteristica {
    id: number;
    descricao: string;
    tipo: string;
    simbolo_path_svg: string;
    unidade_medida: string | null;
    rejeita_menor: boolean | 's' | 'n' | string | null;
    rejeita_maior: boolean | 's' | 'n' | string | null;
    local_inspecao: 'P' | 'Q' | '*' | null;
}

export interface CotaCaracteristicaFilter {
    searchTerm?: string;
    tipo?: string;
}

export interface AlertState {
    message: string | null;
    type: "success" | "error" | "warning";
}