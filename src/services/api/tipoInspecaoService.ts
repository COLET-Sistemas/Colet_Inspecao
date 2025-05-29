import { TipoInspecao } from "@/types/cadastros/tipoInspecao";
import { fetchWithAuth } from "./authInterceptor";

export const getTiposInspecao = async (): Promise<TipoInspecao[]> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/inspecao/tipos_inspecao`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
    }

    const data = await response.json();

    return Array.isArray(data) ? data.map(item => ({
        id: item.id || '',
        codigo: item.codigo || item.id || '',
        descricao_tipo_inspecao: item.descricao_tipo_inspecao || '',
        situacao: item.situacao || 'A',
    })) : [];
};

export const updateTipoInspecao = async (
    tipoInspecao: TipoInspecao
): Promise<TipoInspecao> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/inspecao/tipos_inspecao`, {
        method: 'PUT',
        body: JSON.stringify({
            id: tipoInspecao.id,
            descricao_tipo_inspecao: tipoInspecao.descricao_tipo_inspecao,
            situacao: tipoInspecao.situacao,
            codigo: tipoInspecao.codigo
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao atualizar: ${response.status}`);
    }

    return await response.json();
};