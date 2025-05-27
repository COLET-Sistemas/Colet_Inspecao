"use client";

// Função para tratar respostas da API e verificar erro 401
export const handleApiResponse = async (response: Response): Promise<Response> => {
    if (response.status === 401) {
        // Limpa dados de autenticação
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');

        // Armazena mensagem de sessão expirada para exibir na tela de login
        sessionStorage.setItem(
            'authError',
            'Sua sessão expirou. Faça login novamente para continuar.'
        );

        // Redireciona para a página de login
        window.location.href = '/login';

        // Lança erro para interromper execução
        throw new Error('Session expired');
    }

    return response;
};

// Função utilitária para requisições fetch com tratamento de 401
export const fetchWithAuth = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    const response = await fetch(url, options);
    return handleApiResponse(response);
};
