import { PermissaoInspecao } from "@/types/cadastros/permissaoInspecao";
import { fetchWithAuth } from "./authInterceptor";

export const getPermissoesInspecao = async (): Promise<PermissaoInspecao[]> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        console.error("URL da API não está configurada");
        throw new Error("URL da API não está configurada");
    }

    try {
        const response = await fetchWithAuth(`${apiUrl}/inspecao/operadores?situacao=A`, {
            method: 'GET'
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "Erro desconhecido");
            console.error(`Erro na resposta da API: ${response.status} - ${errorText}`);
            throw new Error(`Erro ao buscar dados: ${response.status}`);
        } const data: unknown = await response.json();

        // Verifica se a resposta é um array
        if (!Array.isArray(data)) {
            console.warn("A API não retornou um array:", data);
            if (data && typeof data === 'object' && data !== null) {
                const dataObject = data as Record<string, unknown>;
                const arrayProps = Object.keys(dataObject).filter(key => Array.isArray(dataObject[key]));
                if (arrayProps.length > 0) {
                    const arrayData = dataObject[arrayProps[0]] as ApiPermissaoInspecaoData[];
                    return mapPermissoesData(arrayData);
                }
            }
            return [];
        }

        return mapPermissoesData(data);
    } catch (error) {
        console.error("Erro ao buscar permissões de inspeção:", error);
        throw error;
    }
};

// Interface para representar a estrutura da resposta da API
interface ApiPermissaoInspecaoData {
    operador?: string | number;
    nome_operador?: string;
    situacao?: string;
    inspecoes?: string | number | null;
    [key: string]: unknown;
}

// Função auxiliar para mapear os dados da API para o formato esperado
function mapPermissoesData(data: ApiPermissaoInspecaoData[]): PermissaoInspecao[] {
    if (!Array.isArray(data)) return []; return data.map(item => {
        let inspecoes: string = '';
        if (item.inspecoes !== undefined && item.inspecoes !== null) {
            inspecoes = String(item.inspecoes);
        }

        return {
            operador: item.operador?.toString() || '',
            nome_operador: item.nome_operador || '',
            situacao: (item.situacao === 'I' ? 'I' : 'A') as 'A' | 'I',
            inspecoes: inspecoes,
        };
    });
}

export const updatePermissaoInspecao = async (
    permissao: PermissaoInspecao
): Promise<PermissaoInspecao> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/inspecao/operadores`, {
        method: 'PUT',
        body: JSON.stringify({
            operador: parseInt(permissao.operador),
            inspecoes: permissao.inspecoes
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erro ao atualizar: ${response.status}`;
        if (errorText && (errorText.startsWith('{') || errorText.startsWith('['))) {
            try {
                const errorData: { message?: string } = JSON.parse(errorText);
                if (errorData && errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (parseError) {
                console.error("Erro ao parsear resposta de erro:", parseError);
            }
        }

        throw new Error(errorMessage);
    }

    try {
        const text = await response.text();
        if (!text.trim()) {
            return permissao;
        }
        return JSON.parse(text) as PermissaoInspecao;
    } catch (parseError) {
        console.error("Erro ao parsear resposta:", parseError);
        return permissao;
    }
};