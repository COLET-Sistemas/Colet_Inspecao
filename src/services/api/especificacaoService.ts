import { EspecificacaoInspecao } from "@/types/cadastros/processo";

/**
 * Atualiza a ordem das especificações
 * @param especificacoes Array de especificações com a nova ordem
 * @param headers Cabeçalhos de autenticação
 * @returns Promise com confirmação da atualização
 */
export const atualizarOrdemEspecificacoes = async (
    especificacoes: Pick<EspecificacaoInspecao, 'id' | 'ordem'>[],
    headers: HeadersInit
): Promise<{ success: boolean; message: string }> => {
    const apiUrl = localStorage.getItem("apiUrl");
    try {
        const response = await fetch(`${apiUrl}/inspecao/especificacoes_inspecao_ft_ordem`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: JSON.stringify(especificacoes),
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
 * @param headers Cabeçalhos de autenticação
 * @returns Promise com confirmação da exclusão
 */
export const deleteEspecificacaoInspecao = async (
    id: number,
    headers: HeadersInit
): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/especificacoes/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
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
