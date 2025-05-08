// filepath: c:\ColetFrontend\colet_inspecao\src\services\api\permissaoInspecaoService.ts
import { PermissaoInspecao } from "@/types/cadastros/permissaoInspecao";

export const getPermissoesInspecao = async (authHeaders: HeadersInit): Promise<PermissaoInspecao[]> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        console.error("URL da API não está configurada");
        throw new Error("URL da API não está configurada");
    }

    // Obtendo o token de autenticação
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
        console.warn("Token de autenticação não encontrado. O usuário pode não estar autenticado.");
    }

    // Adicionando o token aos headers
    const headers: HeadersInit = {
        ...authHeaders,
        "Token": authToken || ""
    };

    console.log("Chamando API:", `${apiUrl}/inspecao/operadores`);
    console.log("Headers:", headers);

    try {
        const response = await fetch(`${apiUrl}/inspecao/operadores`, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "Erro desconhecido");
            console.error(`Erro na resposta da API: ${response.status} - ${errorText}`);
            throw new Error(`Erro ao buscar dados: ${response.status}`);
        }

        const data = await response.json();
        console.log("Dados recebidos da API:", data);

        // Verifica se a resposta é um array
        if (!Array.isArray(data)) {
            console.warn("A API não retornou um array:", data);
            // Se for um objeto, tenta verificar se há uma propriedade que contenha o array
            if (data && typeof data === 'object') {
                // Procura por alguma propriedade que seja um array
                const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
                if (arrayProps.length > 0) {
                    const arrayData = data[arrayProps[0]];
                    console.log("Usando dados da propriedade:", arrayProps[0], arrayData);
                    return mapPermissoesData(arrayData);
                }
            }
            // Retorna um array vazio se não encontrar dados válidos
            return [];
        }

        return mapPermissoesData(data);
    } catch (error) {
        console.error("Erro ao buscar permissões de inspeção:", error);
        throw error;
    }
};

// Função auxiliar para mapear os dados da API para o formato esperado
function mapPermissoesData(data: any[]): PermissaoInspecao[] {
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
        operador: item.operador || '',
        nome_operador: item.nome_operador || '',
        situacao: item.situacao || 'A',
        inspecoes: item.inspecoes || '',
    }));
}

export const updatePermissaoInspecao = async (
    permissao: PermissaoInspecao,
    authHeaders: HeadersInit
): Promise<PermissaoInspecao> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetch(`${apiUrl}/inspecao/operadore`, {
        method: 'PUT',
        headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            operador: parseInt(permissao.operador), // Convert operador to integer           
            inspecoes: permissao.inspecoes
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao atualizar: ${response.status}`);
    }

    return await response.json();
};