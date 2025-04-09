"use client";

import { useCallback, useEffect, useState } from "react";

export function useApiConfig() {
    const [apiUrl, setApiUrl] = useState<string>("");
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

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
        try {
            // Add a timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // Use the specified API endpoint to test the connection
            const response = await fetch(`${url}/parametros?chave=NOME-EMP&sistema=CLT&estabelecimento=1`, {
                signal: controller.signal,
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            clearTimeout(timeoutId);
            const isOk = response.ok;
            setIsConnected(isOk);
            return isOk;
        } catch (error) {
            console.error("API connection test failed:", error);
            setIsConnected(false);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        apiUrl,
        isConnected,
        isLoading,
        saveApiUrl,
        testApiConnection
    };
}
