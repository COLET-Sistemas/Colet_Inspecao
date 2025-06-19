"use client";

// Função para tratar respostas da API e verificar erro 401
export const handleApiResponse = async (response: Response): Promise<Response> => {
    if (response.status === 401) {
        // Faz logout via API para limpar cookies HttpOnly
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }

        // Armazena mensagem de sessão expirada para exibir na tela de login
        if (typeof sessionStorage !== 'undefined') {
            // Armazena a mensagem apenas se o logout não foi intencional
            // Verifica se a URL atual não é a página de login, o que sugere sessão expirada
            if (!window.location.pathname.includes('/login')) {
                sessionStorage.setItem(
                    'authError',
                    'Sua sessão expirou. Faça login novamente para continuar.'
                );
            }
        }

        // Redireciona para a página de login
        window.location.href = '/login';

        // Lança erro para interromper execução
        throw new Error('Session expired');
    }

    return response;
};

// Função utilitária para requisições fetch com tratamento de 401 e cookies automático
export const fetchWithAuth = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    const apiUrl = localStorage.getItem("apiUrl");

    if (!apiUrl) {
        throw new Error('API URL não configurada');
    }

    // Prepara os headers para o proxy
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-api-url': apiUrl,
        'x-target-path': url.replace(apiUrl, ''), // Remove a base URL para obter apenas o path
        ...options.headers
    };

    try {
        // Faz a requisição através do proxy
        const response = await fetch('/api/proxy', {
            ...options,
            headers,
            credentials: 'include' // Inclui cookies HttpOnly automaticamente
        });

        return handleApiResponse(response);
    } catch (error) {
        // Log de erros de rede
        if (process.env.NODE_ENV === 'development') {
            console.error(`❌ Network Error: ${error}`);
        }
        throw error;
    }
};
