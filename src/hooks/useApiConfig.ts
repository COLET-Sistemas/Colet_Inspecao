'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Hook para gerenciar a configuração da API.
 * 
 * NOTA IMPORTANTE: A chamada /parametros?chave=NOME-EMP&sistema=CLT&estabelecimento=1
 * é feita diretamente à API externa, sem passar pelo proxy e sem enviar cookies ou credenciais.
 * Isso é intencional e necessário para testar a conexão com a API sem depender de autenticação.
 */
export function useApiConfig() {
    const [apiUrl, setApiUrl] = useState<string>('');
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const savedApiUrl = localStorage.getItem('apiUrl');
        if (savedApiUrl) {
            setApiUrl(savedApiUrl);
            setIsConnected(!!savedApiUrl);
        }
    }, []);

    const getAuthHeaders = useCallback((): HeadersInit => {
        // Não precisamos mais obter o token do storage, já que usamos o cookie httpOnly
        // que será enviado automaticamente com credentials: 'include'
        return {
            'Content-Type': 'application/json',
        };
    }, []); const testApiConnection = useCallback(async (url: string): Promise<boolean> => {
        if (!url) return false;
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // Chamada direta à API externa sem proxy e sem cookies
            const targetUrl = `${url}/parametros?chave=NOME-EMP&sistema=CLT&estabelecimento=1`;

            // Log para depuração
            if (process.env.NODE_ENV === 'development') {
                console.log(`🔌 Testando conexão direta com a API: ${targetUrl}`);
                console.log(`🔑 Credenciais: omitidas intencionalmente`);
            }

            const response = await fetch(
                targetUrl,
                {
                    signal: controller.signal,
                    method: 'GET',
                    // Não envia cookies nem credenciais
                    credentials: 'omit',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                },
            );
            clearTimeout(timeoutId);
            const isOk = response.ok;
            setIsConnected(isOk);

            // Log do resultado
            if (process.env.NODE_ENV === 'development') {
                if (isOk) {
                    console.log(`✅ Conexão com API bem-sucedida: ${response.status} ${response.statusText}`);
                } else {
                    console.error(`❌ Falha na conexão com API: ${response.status} ${response.statusText}`);
                }
            }

            if (!isOk) {
                setErrorMessage(`O servidor retornou: ${response.status}: ${response.statusText}`);
            }
            return isOk;
        } catch (error: unknown) {
            setIsConnected(false);
            // Log do erro completo em desenvolvimento
            if (process.env.NODE_ENV === 'development') {
                console.error('❌ Erro ao testar conexão com API:', error);
            }

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    setErrorMessage('Tempo de conexão esgotado. O servidor pode estar indisponível ou muito lento para responder.');
                } else if (error.message.includes('NetworkError')) {
                    setErrorMessage('Erro de rede. Verifique sua conexão com a internet e o URL da API.');
                } else if (error.message.includes('CORS')) {
                    setErrorMessage('Erro de CORS. O servidor da API não permite requisições desta origem.');
                } else if (error.message.includes('Failed to fetch')) {
                    setErrorMessage('Falha na conexão. Verifique se o URL da API está correto e se o servidor está online.');
                } else {
                    setErrorMessage(`Falha na conexão: ${error.message || 'Erro desconhecido'}`);
                }
            } else {
                setErrorMessage('Falha na conexão: Erro desconhecido');
            }
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveApiUrl = useCallback(
        async (url: string, forceConnected = false): Promise<boolean> => {
            setIsLoading(true);
            setErrorMessage(null);
            try {
                const trimmedUrl = url.trim().replace(/\/+$/, '');
                // Apenas testa a conexão mas não impede de salvar se forceConnected for true
                const isValid = await testApiConnection(trimmedUrl);

                // Salva a URL independente da conexão se forceConnected for true
                if (isValid || forceConnected) {
                    localStorage.setItem('apiUrl', trimmedUrl);
                    setApiUrl(trimmedUrl);
                    setIsConnected(isValid);
                }

                return isValid || forceConnected;
            } finally {
                setIsLoading(false);
            }
        },
        [testApiConnection],
    );

    const clearApiConfig = useCallback(() => {
        localStorage.removeItem('apiUrl');
        setApiUrl('');
        setIsConnected(false);
        setErrorMessage(null);
    }, []);

    return {
        apiUrl,
        isConnected,
        isLoading,
        errorMessage,
        saveApiUrl,
        testApiConnection,
        clearApiConfig,
        getAuthHeaders,
    };
}
