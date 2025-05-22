import { InstrumentoMedicao } from "@/types/cadastros/instrumentoMedicao";
import { fetchWithAuth } from "./authInterceptor";

export const getInstrumentosMedicao = async (authHeaders: HeadersInit): Promise<InstrumentoMedicao[]> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    // Buscar instrumentos de medição
    const instrumentosResponse = await fetchWithAuth(`${apiUrl}/inspecao/instrumentos_medicao`, {
        method: 'GET',
        headers: authHeaders,
    });

    if (!instrumentosResponse.ok) {
        throw new Error(`Erro ao buscar dados: ${instrumentosResponse.status}`);
    }

    const instrumentosData = await instrumentosResponse.json();

    // Buscar tipos de instrumentos de medição
    const tiposResponse = await fetchWithAuth(`${apiUrl}/inspecao/tipos_instrumentos_medicao`, {
        method: 'GET',
        headers: authHeaders,
    });

    if (!tiposResponse.ok) {
        throw new Error(`Erro ao buscar tipos de instrumentos: ${tiposResponse.status}`);
    }

    const tiposData = await tiposResponse.json();

    // Criar um mapa para rápida consulta de tipos por ID
    const tiposMap = new Map();
    if (Array.isArray(tiposData)) {
        tiposData.forEach((tipo: { id: number; nome_tipo_instrumento: string; observacao: string }) => {
            if (tipo.id !== undefined && tipo.id !== null) {
                tiposMap.set(Number(tipo.id), {
                    id: Number(tipo.id),
                    nome_tipo_instrumento: tipo.nome_tipo_instrumento || '',
                    observacao: tipo.observacao || ''
                });
            }
        });
    }

    return Array.isArray(instrumentosData) ? instrumentosData.map(item => {
        const id_tipo_instrumento = item.id_tipo_instrumento !== undefined && item.id_tipo_instrumento !== null ? Number(item.id_tipo_instrumento) : 0;
        const id_instrumento = item.id_instrumento !== undefined && item.id_instrumento !== null ? Number(item.id_instrumento) : 0;

        // Buscar o tipo de instrumento correspondente no mapa
        const tipoInstrumento = tiposMap.get(id_tipo_instrumento);
        const nome_tipo_instrumento = tipoInstrumento ? tipoInstrumento.nome_tipo_instrumento : '';

        return {
            id_instrumento,
            id_tipo_instrumento,
            id: id_instrumento, // Usando id_instrumento como id para compatibilidade com DataTable/DataCards
            tag: item.tag || '',
            nome_instrumento: item.nome_instrumento || '',
            codigo_artigo: item.codigo_artigo || '',
            numero_patrimonio: item.numero_patrimonio || '',
            numero_serie: item.numero_serie || '',
            situacao: item.situacao || '',
            data_validade: item.data_validade || '',
            data_ultima_calibracao: item.data_ultima_calibracao || '',
            frequencia_calibracao: item.frequencia_calibracao || '',
            nome_tipo_instrumento // Adicionando o nome do tipo de instrumento
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

    const response = await fetchWithAuth(`${apiUrl}/inspecao/instrumentos_medicao`, {
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
        let errorMessage = `Erro ao criar: ${response.status}`;
        let errorData: { message?: string } = {};
        try {
            errorData = await response.json();
            if ((response.status === 409 || response.status === 499) && (errorData as { message?: string }).message) {
                errorMessage = (errorData as { message: string }).message;
            } else if ((errorData as { message?: string }).message) {
                errorMessage = (errorData as { message: string }).message;
            }
        } catch {
            // fallback para mensagem padrão
        }
        throw new Error(errorMessage);
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

    const response = await fetchWithAuth(`${apiUrl}/inspecao/instrumentos_medicao`, {
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
        let errorMessage = `Erro ao atualizar: ${response.status}`;
        let errorData: { message?: string } = {};
        try {
            errorData = await response.json();
            if ((response.status === 409 || response.status === 499) && (errorData as { message?: string }).message) {
                errorMessage = (errorData as { message: string }).message;
            } else if ((errorData as { message?: string }).message) {
                errorMessage = (errorData as { message: string }).message;
            } else if ((errorData as { erro?: string }).erro) {
                errorMessage = (errorData as { erro: string }).erro;
            }
        } catch {
            // fallback para mensagem padrão
        }
        throw new Error(errorMessage);
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

    // Enviar o id como query string, não no body
    const response = await fetchWithAuth(`${apiUrl}/inspecao/instrumentos_medicao?id=${id}`, {
        method: 'DELETE',
        headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        let errorMessage = 'Erro desconhecido ao excluir o registro';
        try {
            const errorData = await response.json();
            if ((response.status === 409 || response.status === 499) && (errorData as { message?: string }).message) {
                errorMessage = (errorData as { message: string }).message;
            } else if ((errorData as { message?: string }).message) {
                errorMessage = (errorData as { message: string }).message;
            } else if ((errorData as { erro?: string }).erro) {
                errorMessage = (errorData as { erro: string }).erro;
            }
        } catch {
            // Erro silencioso - já temos uma mensagem padrão
        }
        throw new Error(errorMessage || `Erro ao excluir: ${response.status} ${response.statusText}`);
    }
};