// filepath: c:\ColetFrontend\colet_inspecao\src\types\cadastros\permissaoInspecao.ts
export interface PermissaoInspecao {
    operador: string;
    nome_operador: string;
    situacao: "A" | "I";
    inspecoes: string;
}

export interface PermissaoInspecaoFilter {
    searchTerm?: string;
    status?: string;
}

export interface AlertState {
    message: string | null;
    type: "success" | "error" | "warning" | "info";
}