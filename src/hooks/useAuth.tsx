"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Define types for our hook
interface User {
    username: string;
    name?: string;
    email?: string;
    roles?: string[];
    permissao?: string; // Add permissao field
}

interface LoginCredentials {
    username: string;
    password: string;
    remember?: boolean;
}

interface AuthError {
    message: string;
    field?: string;
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

// Create a compatibility AuthContext for existing code that uses AuthProvider
const AuthContext = createContext<any>(undefined);

// Add this AuthProvider component to maintain compatibility with existing code
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const auth = useAuth();

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    // Check if we're being used within context
    const context = useContext(AuthContext);
    if (context) return context;

    const [isLoading, setIsLoading] = useState<boolean>(true); // Start with true to check auth status
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [error, setError] = useState<AuthError | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    // Check authentication status on mount
    useEffect(() => {
        const authStatus = checkAuth();
        setIsAuthenticated(authStatus);
        if (authStatus) {
            setUser(getUserData());
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async ({ username, password, remember }: LoginCredentials): Promise<boolean> => {
        if (isLoading) return false;

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

            // API call to login endpoint
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    usuario: username,
                    senha_cripto
                }),
            });

            // Get response data
            const data = await response.json();

            // Status 200 means the API call was successful
            if (response.status === 200) {
                // If data contains success field, check it, otherwise assume success based on status code
                if (data.success === undefined || data.success) {
                    // Create user object with all returned data
                    const userData: User = {
                        username: username,
                        name: data.nome || username,
                        permissao: data.permissao || '',
                    };

                    // Store auth data
                    if (remember) {
                        localStorage.setItem("isAuthenticated", "true");
                        localStorage.setItem("authToken", data.token || "");
                        localStorage.setItem("userData", JSON.stringify(userData));
                    } else {
                        sessionStorage.setItem("isAuthenticated", "true");
                        sessionStorage.setItem("authToken", data.token || "");
                        sessionStorage.setItem("userData", JSON.stringify(userData));
                    }

                    // Update state
                    setIsAuthenticated(true);
                    setUser(userData);
                    setIsLoading(false);

                    router.push("/dashboard");
                    return true;
                } else {
                    // API returned 200 but success is explicitly false
                    setError({
                        message: data.message || "Credenciais inválidas. Por favor, verifique seu usuário e senha."
                    });
                }
            } else {
                // Handle non-200 status codes
                if (response.status === 401) {
                    setError({ message: "Usuário ou senha incorretos", field: "password" });
                } else {
                    setError({
                        message: data.mensagem || `Falha na autenticação (${response.status}). Por favor, tente novamente.`
                    });
                }
            }
        } catch (err) {
            console.error("Login error:", err);
            setError({ message: "Erro ao conectar ao servidor. Verifique sua conexão e tente novamente." });
        }

        setIsLoading(false);
        return false;
    }, [router, isLoading]);

    const logout = useCallback(async (): Promise<void> => {
        setIsLoading(true);

        // Clear all authentication data from both localStorage and sessionStorage
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("user");
        localStorage.removeItem("userName");
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        sessionStorage.removeItem("isAuthenticated");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("userName");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("userData");

        // Update state
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);

        // Force immediate redirection to login page
        router.push("/login");
    }, [router]);

    const checkAuth = useCallback((): boolean => {
        return (
            localStorage.getItem("isAuthenticated") === "true" ||
            sessionStorage.getItem("isAuthenticated") === "true"
        );
    }, []);

    // For backward compatibility with any code that might be using the user object
    const getUserData = (): User | null => {
        const userDataStr = localStorage.getItem("userData") || sessionStorage.getItem("userData");
        const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");

        if (userDataStr) {
            try {
                return JSON.parse(userDataStr);
            } catch (e) {
                return null;
            }
        } else if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }

        return null;
    };

    return {
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        checkAuth
    };
}
