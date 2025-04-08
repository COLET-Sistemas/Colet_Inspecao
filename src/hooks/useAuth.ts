"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface LoginCredentials {
    username: string;
    password: string;
    remember?: boolean;
}

interface AuthError {
    message: string;
    field?: string;
}

interface User {
    id: string;
    name: string;
    role: string;
}

// Function to encode password using XOR cipher
const encodePassword = (password: string) => {
    const key = Math.floor(Math.random() * 255);
    const hexResult = [];
    let result = '';

    // Convert key to hex
    hexResult.push((key >> 4).toString(16).toUpperCase());
    hexResult.push((key & 0xF).toString(16).toUpperCase());
    result += hexResult.join('');

    // Convert password characters to hex
    for (let i = 0; i < password.length; i++) {
        const converted = password.charCodeAt(i) ^ key;
        hexResult[0] = (converted >> 4).toString(16).toUpperCase();
        hexResult[1] = (converted & 0xF).toString(16).toUpperCase();
        result += hexResult.join('');
    }

    return result;
};

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<AuthError | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check if there's a user in localStorage when the hook mounts
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                // Handle parsing error
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = useCallback(
        async ({ username, password, remember }: LoginCredentials): Promise<boolean> => {
            setIsLoading(true);
            setError(null);

            // Check if API URL is configured
            const apiUrl = localStorage.getItem("apiUrl");
            if (!apiUrl) {
                setError({ message: "API não configurada. Configure o endereço da API primeiro." });
                setIsLoading(false);
                return false;
            }

            try {
                // Encrypt the password
                const senha_cripto = encodePassword(password);

                console.log(`Tentando login na API: ${apiUrl}/login`);

                // Real API call to login endpoint
                const response = await fetch(`${apiUrl}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username,
                        password: senha_cripto
                    }),
                });

                const data = await response.json();
                console.log('Dados completos da resposta:', data);

                // Status 200 means the API call was successful
                if (response.ok) {
                    // Store user data and token
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('token', data.token);

                    setUser(data.user);

                    if (remember) {
                        localStorage.setItem("isAuthenticated", "true");
                    } else {
                        sessionStorage.setItem("isAuthenticated", "true");
                    }

                    router.push("/dashboard");
                    return true;
                } else {
                    // Handle non-200 status codes
                    console.log(`Falha no login (status ${response.status}): ${data.message || "Sem mensagem de erro"}`);
                    setError({
                        message: data.message || `Falha na autenticação (${response.status}). Por favor, tente novamente.`
                    });
                    return false;
                }
            } catch (err) {
                console.error("Login error:", err);
                setError({ message: "Erro ao conectar ao servidor. Verifique sua conexão e tente novamente." });
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [router]
    );

    const logout = useCallback(() => {
        // Clear all authentication data from both localStorage and sessionStorage
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("user");
        localStorage.removeItem("userName");
        localStorage.removeItem("authToken");
        localStorage.removeItem("token");
        sessionStorage.removeItem("isAuthenticated");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("userName");
        sessionStorage.removeItem("authToken");

        setUser(null);

        // Force immediate redirection to login page
        router.push("/login");
    }, [router]);

    const checkAuth = useCallback((): boolean => {
        return !!localStorage.getItem('user') ||
            localStorage.getItem("isAuthenticated") === "true" ||
            sessionStorage.getItem("isAuthenticated") === "true";
    }, []);

    return {
        user,
        loading,
        login,
        logout,
        checkAuth,
        isLoading,
        error
    };
}
