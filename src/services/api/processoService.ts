import { ProcessoDetalhes, ProcessoListItem, ProcessoParams } from "@/types/cadastros/processo";
import { fetchWithAuth } from "./authInterceptor";

// Cache para evitar chamadas duplicadas em sequência rápida
const requestCache = new Map<string, {
    promise: Promise<ProcessoDetalhes>;
    timestamp: number;
}>();

// Tempo de validade do cache em ms (500ms)
const CACHE_TTL = 500;

/**
 * Busca os detalhes completos de um processo específico incluindo suas operações e especificações
 * @param params Parâmetros de busca do processo (referencia, roteiro e processo)
 * @param authHeaders Headers de autenticação
 * @returns Detalhes completos do processo
 */
export const getProcessoDetalhes = async (
    params: ProcessoParams,
    authHeaders: HeadersInit
): Promise<ProcessoDetalhes> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const { referencia, roteiro, processo } = params;

    // Criar uma chave única para o cache baseada nos parâmetros
    const cacheKey = `${referencia}-${roteiro}-${processo}`;

    // Verificar se existe uma requisição em andamento ou recentemente completada
    const cachedRequest = requestCache.get(cacheKey);
    if (cachedRequest && Date.now() - cachedRequest.timestamp < CACHE_TTL) {
        console.log('Usando dados em cache para:', cacheKey);
        return cachedRequest.promise;
    }

    const url = `${apiUrl}/inspecao/especificacoes_inspecao_ft?referencia=${encodeURIComponent(referencia)}&roteiro=${encodeURIComponent(roteiro)}&processo=${processo}`;

    // Criar a promessa da requisição
    const requestPromise = (async () => {
        const response = await fetchWithAuth(url, {
            method: 'GET',
            headers: authHeaders
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
        }

        return await response.json();
    })();

    // Armazenar a promessa no cache
    requestCache.set(cacheKey, {
        promise: requestPromise,
        timestamp: Date.now()
    });

    // Após a conclusão (sucesso ou erro), limpar o cache após o TTL
    requestPromise.finally(() => {
        setTimeout(() => {
            const currentCache = requestCache.get(cacheKey);
            if (currentCache && currentCache.promise === requestPromise) {
                requestCache.delete(cacheKey);
            }
        }, CACHE_TTL);
    });

    return requestPromise;
};

/**
 * Busca a lista de processos disponíveis
 * @param authHeaders Headers de autenticação
 * @param filtros Filtros opcionais para a busca
 * @returns Lista de processos
 */
export const getProcessos = async (
    authHeaders: HeadersInit,
    filtros?: Partial<ProcessoParams>
): Promise<ProcessoListItem[]> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    // Construir a URL com os filtros
    let url = `${apiUrl}/inspecao/processos`;

    if (filtros) {
        const searchParams = new URLSearchParams();
        if (filtros.referencia) searchParams.append('referencia', filtros.referencia);
        if (filtros.roteiro) searchParams.append('roteiro', filtros.roteiro);
        if (filtros.processo) searchParams.append('processo', filtros.processo.toString());

        const searchParamsString = searchParams.toString();
        if (searchParamsString) {
            url += `?${searchParamsString}`;
        }
    }

    const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: authHeaders
    });

    if (!response.ok) {
        throw new Error(`Erro ao buscar processos: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    return Array.isArray(data) ? data : [];
};

/**
 * Busca referências disponíveis para filtro
 * @param authHeaders Headers de autenticação
 * @returns Lista de referências
 */
export const getReferencias = async (authHeaders: HeadersInit): Promise<string[]> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/inspecao/referencias`, {
        method: 'GET',
        headers: authHeaders
    });

    if (!response.ok) {
        throw new Error(`Erro ao buscar referências: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data.map(item => item.referencia || '') : [];
};

/**
 * Busca roteiros disponíveis para uma referência específica
 * @param referencia Referência para filtrar os roteiros
 * @param authHeaders Headers de autenticação
 * @returns Lista de roteiros
 */
export const getRoteirosByReferencia = async (
    referencia: string,
    authHeaders: HeadersInit
): Promise<string[]> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/inspecao/roteiros?referencia=${encodeURIComponent(referencia)}`, {
        method: 'GET',
        headers: authHeaders
    });

    if (!response.ok) {
        throw new Error(`Erro ao buscar roteiros: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data.map(item => item.roteiro || '') : [];
};

/**
 * Deleta uma operação de processo específica
 * @param id ID da operação a ser deletada
 * @param authHeaders Headers de autenticação
 * @returns void
 */
export const deleteOperacaoProcesso = async (
    id: number,
    authHeaders: HeadersInit
): Promise<void> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/inspecao/operacoes_processos?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || errorData?.erro || `Erro ao excluir: ${response.status}`);
    }
};
