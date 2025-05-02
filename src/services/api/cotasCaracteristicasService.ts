import { CotaCaracteristica } from "@/types/cadastros/cotaCaracteristica";

export const getCotasCaracteristicas = async (authHeaders: HeadersInit): Promise<CotaCaracteristica[]> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetch(`${apiUrl}/inspecao/cotas_caracteristicas?tipo=cotas`, {
        method: 'GET',
        headers: authHeaders,
    });

    if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
    }

    const data = await response.json();

    return Array.isArray(data) ? data.map(item => {
        const id = item.id !== undefined && item.id !== null ? Number(item.id) : 0;
        return {
            id: id,
            descricao: item.descricao || '',
            tipo: item.tipo || '',
            simbolo_path_svg: item.simbolo_path_svg || '',
            unidade_medida: item.unidade_medida || '',
        };
    }) : [];
};

export const createCotaCaracteristica = async (
    cotaCaracteristica: Omit<CotaCaracteristica, 'id'>,
    authHeaders: HeadersInit
): Promise<CotaCaracteristica> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetch(`${apiUrl}/inspecao/cotas_caracteristicas`, {
        method: 'POST',
        headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            descricao: cotaCaracteristica.descricao,
            tipo: cotaCaracteristica.tipo,
            simbolo_path_svg: cotaCaracteristica.simbolo_path_svg,
            unidade_medida: cotaCaracteristica.unidade_medida
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao criar: ${response.status}`);
    }

    return await response.json();
};

export const updateCotaCaracteristica = async (
    cotaCaracteristica: CotaCaracteristica,
    authHeaders: HeadersInit
): Promise<CotaCaracteristica> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetch(`${apiUrl}/inspecao/cotas_caracteristicas?id=${cotaCaracteristica.id}`, {
        method: 'PUT',
        headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: cotaCaracteristica.id,
            descricao: cotaCaracteristica.descricao,
            tipo: cotaCaracteristica.tipo,
            simbolo_path_svg: cotaCaracteristica.simbolo_path_svg,
            unidade_medida: cotaCaracteristica.unidade_medida
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao atualizar: ${response.status}`);
    }

    return await response.json();
};

export const deleteCotaCaracteristica = async (
    id: number,
    authHeaders: HeadersInit
): Promise<void> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetch(`${apiUrl}/inspecao/cotas_caracteristicas?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders
    });

    if (!response.ok) {
        let errorMessage = 'Erro desconhecido ao excluir o registro';
        try {
            const errorData = await response.json();
            if (errorData && errorData.message) {
                errorMessage = errorData.message;
            } else if (errorData && errorData.error) {
                errorMessage = errorData.error;
            }
        } catch (e) {
            // Erro silencioso - já temos uma mensagem padrão
        }

        throw new Error(errorMessage || `Erro ao excluir: ${response.status} ${response.statusText}`);
    }
};