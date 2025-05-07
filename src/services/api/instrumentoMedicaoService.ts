import { InstrumentoMedicao } from "@/types/cadastros/instrumentoMedicao";

export const getInstrumentosMedicao = async (authHeaders: HeadersInit): Promise<InstrumentoMedicao[]> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetch(`${apiUrl}/inspecao/instrumentos_medicao`, {
        method: 'GET',
        headers: authHeaders,
    });

    if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
    }

    const data = await response.json();

    return Array.isArray(data) ? data.map(item => {
        const id_tipo_instrumento = item.id_tipo_instrumento !== undefined && item.id_tipo_instrumento !== null ? Number(item.id_tipo_instrumento) : 0;
        return {
            id_tipo_instrumento: id_tipo_instrumento,
            id: id_tipo_instrumento, // Adicionado para compatibilidade com DataTable/DataCards
            tag: item.tag || '',
            nome_instrumento: item.nome_instrumento || '',
            situacao: item.situacao || '',
        };
    }) : [];
};

export const createInstrumentoMedicao = async (
    tipoInstrumento: Omit<InstrumentoMedicao, 'id_tipo_instrumento' | 'id'>,
    authHeaders: HeadersInit
): Promise<InstrumentoMedicao> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetch(`${apiUrl}/inspecao/instrumentos_medicao`, {
        method: 'POST',
        headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tag: tipoInstrumento.tag,
            nome_instrumento: tipoInstrumento.nome_instrumento,
            situacao: tipoInstrumento.situacao,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao criar: ${response.status}`);
    }

    const responseData = await response.json();
    // Garantindo que o objeto retornado tenha a propriedade 'id'
    return {
        ...responseData,
        id: responseData.id_tipo_instrumento || 0
    };
};

export const updateInstrumentoMedicao = async (
    tipoInstrumento: InstrumentoMedicao,
    authHeaders: HeadersInit
): Promise<InstrumentoMedicao> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetch(`${apiUrl}/inspecao/instrumentos_medicao?id=${tipoInstrumento.id_tipo_instrumento}`, {
        method: 'PUT',
        headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id_tipo_instrumento: tipoInstrumento.id_tipo_instrumento,
            tag: tipoInstrumento.tag,
            nome_instrumento: tipoInstrumento.nome_instrumento,
            situacao: tipoInstrumento.situacao
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao atualizar: ${response.status}`);
    }

    const responseData = await response.json();
    // Garantindo que o objeto retornado tenha a propriedade 'id'
    return {
        ...responseData,
        id: responseData.id_tipo_instrumento || tipoInstrumento.id_tipo_instrumento
    };
};

export const deleteInstrumentoMedicao = async (
    id: number,
    authHeaders: HeadersInit
): Promise<void> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetch(`${apiUrl}/inspecao/instrumentos_medicao?id=${id}`, {
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