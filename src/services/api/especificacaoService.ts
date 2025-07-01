import { EspecificacaoInspecao } from "@/types/cadastros/processo";
import { fetchWithAuth } from "./authInterceptor";

// NOTA: O fetchWithAuth já configura automaticamente credentials: 'include' para todas as requisições,
// garantindo que os cookies (incluindo o token de autenticação) sejam enviados em chamadas cross-origin.

/**
 * Atualiza a ordem das especificações
 * @param especificacoes Array de especificações com a nova ordem
 * @returns Promise com confirmação da atualização
 */
export const atualizarOrdemEspecificacoes = async (
    especificacoes: Pick<EspecificacaoInspecao, 'id' | 'ordem'>[]
): Promise<{ success: boolean; message: string }> => {
    const apiUrl = localStorage.getItem("apiUrl");
    try {
        const response = await fetchWithAuth(`${apiUrl}/inspecao/especificacoes_inspecao_ft_ordem`, {
            method: 'PUT',
            body: JSON.stringify(especificacoes),
            // credentials: 'include' já é configurado pelo fetchWithAuth
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao atualizar a ordem das especificações');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Erro ao atualizar ordem: ${error.message}`);
        }
        throw new Error('Erro desconhecido ao atualizar ordem das especificações');
    }
};

/**
 * Exclui uma especificação de inspeção
 * @param id ID da especificação a ser excluída
 * @returns Promise com confirmação da exclusão
 */
export const deleteEspecificacaoInspecao = async (
    id: number
): Promise<{ success: boolean; message: string }> => {
    const apiUrl = localStorage.getItem("apiUrl");
    try {
        const response = await fetchWithAuth(`${apiUrl}/inspecao/especificacoes_inspecao_ft?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao excluir a especificação');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Erro ao excluir especificação: ${error.message}`);
        }
        throw new Error('Erro desconhecido ao excluir especificação');
    }
};
