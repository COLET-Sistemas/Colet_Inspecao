"use client";

import { useCallback, useEffect, useState } from "react";

export function useApiConfig() {
    const [apiUrl, setApiUrl] = useState<string>("");
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Load saved API URL on component mount
    useEffect(() => {
        const savedApiUrl = localStorage.getItem("apiUrl");
        if (savedApiUrl) {
            setApiUrl(savedApiUrl);
            testApiConnection(savedApiUrl).then(setIsConnected);
        }
    }, []);

    const saveApiUrl = useCallback(async (url: string): Promise<boolean> => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const trimmedUrl = url.trim().replace(/\/+$/, "");
            const isValid = await testApiConnection(trimmedUrl);

            if (isValid) {
                localStorage.setItem("apiUrl", trimmedUrl);
                setApiUrl(trimmedUrl);
                setIsConnected(true);
            }

            return isValid;
        } catch (error) {
            console.error("Failed to save API URL:", error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const testApiConnection = useCallback(async (url: string): Promise<boolean> => {
        if (!url) return false;

        setIsLoading(true);
        setErrorMessage(null);
        try {
            // Add a timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // Use the specified API endpoint to test the connection
            const response = await fetch(`${url}/parametros?chave=NOME-EMP&sistema=CLT&estabelecimento=1`, {
                signal: controller.signal,
                method: "GET",

            });

            clearTimeout(timeoutId);
            const isOk = response.ok;
            setIsConnected(isOk);

            if (!isOk) {
                setErrorMessage(`Server returned ${response.status}: ${response.statusText}`);
            }

            return isOk;
        } catch (error: any) {
            setIsConnected(false);

            if (error.name === 'AbortError') {
                setErrorMessage('Connection timed out. The server may be down or too slow to respond.');
                console.error("API connection timed out:", error);
            } else if (error.message?.includes('NetworkError')) {
                setErrorMessage('Network error. Check your internet connection and the API URL.');
                console.error("Network error:", error);
            } else if (error.message?.includes('CORS')) {
                setErrorMessage('CORS error. The API server may not allow requests from this origin.');
                console.error("CORS error:", error);
            } else {
                setErrorMessage(`Connection failed: ${error.message || 'Unknown error'}`);
                console.error("API connection test failed:", error);
            }

            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearApiConfig = useCallback(() => {
        localStorage.removeItem("apiUrl");
        setApiUrl("");
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
        clearApiConfig
    };
}
