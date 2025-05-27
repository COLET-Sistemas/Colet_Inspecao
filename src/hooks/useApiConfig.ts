'use client';

import { useCallback, useEffect, useState } from 'react';

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
        const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            Token: authToken || '',
        };
    }, []);

    const testApiConnection = useCallback(async (url: string): Promise<boolean> => {
        if (!url) return false;
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(
                `${url}/parametros?chave=NOME-EMP&sistema=CLT&estabelecimento=1`,
                {
                    signal: controller.signal,
                    method: 'GET',
                },
            );
            clearTimeout(timeoutId);
            const isOk = response.ok;
            setIsConnected(isOk);
            if (!isOk) {
                setErrorMessage(`Server returned ${response.status}: ${response.statusText}`);
            }
            return isOk;
        } catch (error: unknown) {
            setIsConnected(false);
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    setErrorMessage('Connection timed out. The server may be down or too slow to respond.');
                } else if (error.message.includes('NetworkError')) {
                    setErrorMessage('Network error. Check your internet connection and the API URL.');
                } else if (error.message.includes('CORS')) {
                    setErrorMessage('CORS error. The API server may not allow requests from this origin.');
                } else {
                    setErrorMessage(`Connection failed: ${error.message || 'Unknown error'}`);
                }
            } else {
                setErrorMessage('Connection failed: Unknown error');
            }
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveApiUrl = useCallback(
        async (url: string): Promise<boolean> => {
            setIsLoading(true);
            setErrorMessage(null);
            try {
                const trimmedUrl = url.trim().replace(/\/+$/, '');
                const isValid = await testApiConnection(trimmedUrl);
                if (isValid) {
                    localStorage.setItem('apiUrl', trimmedUrl);
                    setApiUrl(trimmedUrl);
                    setIsConnected(true);
                }
                return isValid;
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
