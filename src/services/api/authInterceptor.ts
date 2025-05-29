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

// Função utilitária para requisições fetch com tratamento de 401 e token automático
export const fetchWithAuth = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    // Obtém o token de autenticação
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

    // Log da requisição para debugging (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 API Request: ${options.method || 'GET'} ${url}`);
        if (authToken) {
            console.log('🔐 Token presente na requisição');
        } else {
            console.warn('⚠️ Token de autenticação não encontrado');
        }
    }

    // Prepara os headers com o token de autenticação
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(authToken && { 'Token': authToken })
    };

    try {
        // Faz a requisição com os headers atualizados
        const response = await fetch(url, {
            ...options,
            headers
        });

        // Log da resposta para debugging (apenas em desenvolvimento)
        if (process.env.NODE_ENV === 'development') {
            console.log(`📡 API Response: ${response.status} ${response.statusText}`);
        }

        return handleApiResponse(response);
    } catch (error) {
        // Log de erros de rede
        if (process.env.NODE_ENV === 'development') {
            console.error(`❌ Network Error: ${error}`);
        }
        throw error;
    }
};
