"use client";

// Global flag to track when logout is in progress to prevent unnecessary API calls
let isLogoutInProgress = false;

// Function to set the logout status flag
export const setLogoutInProgress = (status: boolean) => {
    isLogoutInProgress = status;
};

// Function to get the current logout status
export const getIsLogoutInProgress = (): boolean => {
    return isLogoutInProgress;
};

// Função para tratar respostas da API e verificar erro 401
export const handleApiResponse = async (response: Response): Promise<Response> => {
    // Verifica se a resposta indica erro de autenticação
    if (response.status === 401) {
        // Verifica se é um logout intencional através do header especial
        const isIntentionalLogout = response.headers.get('X-Logout-Type') === 'intentional';

        // Evita processamento se estivermos na página de login ou se for um logout intencional
        if (isIntentionalLogout || window.location.pathname.includes('/login')) {
            return response;
        }

        // Só armazena erro de sessão expirada para logouts não intencionais
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(
                'authError',
                'Sua sessão expirou. Faça login novamente para continuar.'
            );
        }

        // Para logouts não intencionais, limpamos cookies via API
        try {
            // Evita chamadas desnecessárias se o logout já estiver em andamento
            if (!isLogoutInProgress) {
                setLogoutInProgress(true);
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include',
                    // Adiciona cache-control para evitar problemas de cache
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                });
                setLogoutInProgress(false);
            }
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            setLogoutInProgress(false);
        }

        // Limpar também localStorage para garantir que não haja dados de autenticação residuais
        localStorage.removeItem('userData');
        localStorage.removeItem('colaborador');
        localStorage.removeItem('codigo_pessoa');
        localStorage.removeItem('perfil_inspecao');

        // Verifica novamente se NÃO estamos na página de login para evitar redirecionamentos redundantes
        if (!window.location.pathname.includes('/login')) {
            // Redireciona para a página de login com um delay para garantir finalização de outras operações
            setTimeout(() => {
                window.location.href = '/login';
            }, 100);
        }

        // Lança erro para interromper execução
        throw new Error(isIntentionalLogout ? 'Logout successful' : 'Session expired');
    }

    return response;
};

// Função utilitária para requisições fetch com tratamento de 401 e cookies automático
export const fetchWithAuth = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    // Não fazer requisições se o logout estiver em progresso
    if (isLogoutInProgress) {
        throw new Error('Requisição cancelada: logout em progresso');
    }

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
        if (process.env.NODE_ENV === 'development' && !isLogoutInProgress) {
            console.error(`❌ Network Error: ${error}`);
        }
        throw error;
    }
};
