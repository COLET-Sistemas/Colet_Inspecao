export interface CotaCaracteristica {
    id: number;
    descricao: string;
    tipo: string;
    simbolo_path_svg: string;
    unidade_medida: string;
    rejeita_menor: boolean | 's' | 'n' | string | null;
    rejeita_maior: boolean | 's' | 'n' | string | null;
}

export interface CotaCaracteristicaFilter {
    searchTerm?: string;
    tipo?: string;
}

export interface AlertState {
    message: string | null;
    type: "success" | "error" | "warning";
}