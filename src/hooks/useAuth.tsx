"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useApiConfig } from "../hooks/useApiConfig";

// Define types for our hook
interface User {
    username: string;
    name?: string;
    email?: string;
    roles?: string[];
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

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: AuthError | null;
    login: (credentials: LoginCredentials) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<AuthError | null>(null);
    const { apiUrl } = useApiConfig();
    const router = useRouter();

    // Check if user is authenticated by looking at local storage
    const checkAuth = useCallback(() => {
        const token = localStorage.getItem("authToken");
        const userData = localStorage.getItem("userData");

        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                return true;
            } catch (e) {
                return false;
            }
        }

        return false;
    }, []);

    // Initialize authentication state on load
    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            const isAuth = checkAuth();
            setIsLoading(false);

            // If not authenticated and not on login page, redirect to login
            if (!isAuth && window.location.pathname !== "/login") {
                router.push("/login");
            }
        };

        initialize();
    }, [checkAuth, router]);

    // Login function
    const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            if (!apiUrl) {
                throw new Error("API URL not configured");
            }

            const response = await fetch(`${apiUrl}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    usuario: credentials.username,
                    senha: credentials.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle different error cases
                if (response.status === 401) {
                    setError({ message: "Usuário ou senha incorretos", field: "password" });
                } else if (data.message) {
                    setError({ message: data.message });
                } else {
                    setError({ message: "Erro ao fazer login. Tente novamente." });
                }
                return false;
            }

            // Store auth token and user data
            localStorage.setItem("authToken", data.token);

            // Create a user object from the response
            const userData: User = {
                username: credentials.username,
                name: data.nome || credentials.username,
                // Add any other user data from the response
            };

            // Store user data in localStorage
            localStorage.setItem("userData", JSON.stringify(userData));

            setUser(userData);

            // Redirect to dashboard on successful login
            router.push("/dashboard");

            return true;
        } catch (error) {
            console.error("Login error:", error);
            setError({ message: "Erro de conexão. Verifique sua conexão e tente novamente." });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, router]);

    // Logout function
    const logout = useCallback(async (): Promise<void> => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        setUser(null);
        router.push("/login");
    }, [router]);

    // Provide context value
    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        checkAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
