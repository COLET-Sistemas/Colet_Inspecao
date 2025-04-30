import { TipoInstrumentoMedicao } from "@/types/cadastros/tipoInstrumentoMedicao";

export const getTiposInstrumentosMedicao = async (authHeaders: HeadersInit): Promise<TipoInstrumentoMedicao[]> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetch(`${apiUrl}/inspecao/tipos_instrumentos_medicao`, {
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
            nome_tipo_instrumento: item.nome_tipo_instrumento || '',
            observacao: item.observacao || '',
        };
    }) : [];
};

export const createTipoInstrumentoMedicao = async (
    tipoInstrumento: Omit<TipoInstrumentoMedicao, 'id'>,
    authHeaders: HeadersInit
): Promise<TipoInstrumentoMedicao> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetch(`${apiUrl}/inspecao/tipos_instrumentos_medicao`, {
        method: 'POST',
        headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            nome_tipo_instrumento: tipoInstrumento.nome_tipo_instrumento,
            observacao: tipoInstrumento.observacao
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao criar: ${response.status}`);
    }

    return await response.json();
};

export const updateTipoInstrumentoMedicao = async (
    tipoInstrumento: TipoInstrumentoMedicao,
    authHeaders: HeadersInit
): Promise<TipoInstrumentoMedicao> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetch(`${apiUrl}/inspecao/tipos_instrumentos_medicao?id=${tipoInstrumento.id}`, {
        method: 'PUT',
        headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: tipoInstrumento.id,
            nome_tipo_instrumento: tipoInstrumento.nome_tipo_instrumento,
            observacao: tipoInstrumento.observacao
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao atualizar: ${response.status}`);
    }

    return await response.json();
};

export const deleteTipoInstrumentoMedicao = async (
    id: number,
    authHeaders: HeadersInit
): Promise<void> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetch(`${apiUrl}/inspecao/tipos_instrumentos_medicao?id=${id}`, {
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