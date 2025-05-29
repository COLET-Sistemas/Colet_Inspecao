import { TipoInstrumentoMedicao } from "@/types/cadastros/tipoInstrumentoMedicao";
import { fetchWithAuth } from "./authInterceptor";

export const getTiposInstrumentosMedicao = async (): Promise<TipoInstrumentoMedicao[]> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/inspecao/tipos_instrumentos_medicao`, {
        method: 'GET',
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
    tipoInstrumento: Omit<TipoInstrumentoMedicao, 'id'>
): Promise<TipoInstrumentoMedicao> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/inspecao/tipos_instrumentos_medicao`, {
        method: 'POST',
        body: JSON.stringify({
            nome_tipo_instrumento: tipoInstrumento.nome_tipo_instrumento,
            observacao: tipoInstrumento.observacao
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409 && errorData.message) {
            throw new Error(errorData.message);
        }
        throw new Error(errorData.erro || `Erro ao criar: ${response.status}`);
    }

    return await response.json();
};

export const updateTipoInstrumentoMedicao = async (
    tipoInstrumento: TipoInstrumentoMedicao
): Promise<TipoInstrumentoMedicao> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/inspecao/tipos_instrumentos_medicao?id=${tipoInstrumento.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            id: tipoInstrumento.id,
            nome_tipo_instrumento: tipoInstrumento.nome_tipo_instrumento,
            observacao: tipoInstrumento.observacao
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409 && errorData.message) {
            throw new Error(errorData.message);
        }
        throw new Error(errorData.message || `Erro ao atualizar: ${response.status}`);
    }

    return await response.json();
};

export const deleteTipoInstrumentoMedicao = async (
    id: number
): Promise<void> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/inspecao/tipos_instrumentos_medicao?id=${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        let errorMessage = 'Erro desconhecido ao excluir o registro';
        try {
            const errorData = await response.json();
            if (errorData && errorData.message) {
                errorMessage = errorData.message;
            } else if (errorData && errorData.erro) {
                errorMessage = errorData.erro;
            }
        } catch {
            // Erro silencioso - já temos uma mensagem padrão
        }

        throw new Error(errorMessage || `Erro ao excluir: ${response.status} ${response.statusText}`);
    }
};