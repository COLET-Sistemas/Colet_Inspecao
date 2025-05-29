import { Posto } from "@/types/cadastros/posto";
import { fetchWithAuth } from "./authInterceptor";

export const getPostos = async (): Promise<Posto[]> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/postos`, {
        method: 'GET'
    });

    if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
    }

    const data = await response.json();

    return Array.isArray(data) ? data.map(item => {
        return {
            posto: item.posto || '',
            nome_posto: item.nome_posto || '',
            codigo_parada: item.codigo_parada || '',
            descricao_parada: item.descricao_parada || '',
            tipo_recurso: item.tipo_recurso || '',
            id: item.posto || '',
        };
    }) : [];
};

export const getSavedSelectedPostos = (localStorageKey: string): Set<string> => {
    try {
        const savedSelected = localStorage.getItem(localStorageKey);
        if (savedSelected) {
            const parsedData = JSON.parse(savedSelected);
            return new Set<string>(parsedData.map((item: unknown) => String(item)));
        }
    } catch (e) {
        console.error("Erro ao carregar postos do local storage:", e);
    }
    return new Set<string>();
};

export const saveSelectedPostos = (localStorageKey: string, selectedPostos: Set<string>): void => {
    try {
        localStorage.setItem(localStorageKey, JSON.stringify([...selectedPostos]));
    } catch (error) {
        throw new Error(`Erro ao salvar postos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
};