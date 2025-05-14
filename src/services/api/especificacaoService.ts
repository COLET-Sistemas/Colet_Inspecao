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
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/especificacoes/ordem`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: JSON.stringify({ especificacoes }),
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
