"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface User {
    username: string;
    name?: string;
    email?: string;
    roles?: string[];
    permissao?: string;
    perfil_inspecao?: string;
}

export const getProfileNames = (perfil_inspecao?: string): string => {
    if (!perfil_inspecao) return "";
    const profiles = [];
    if (perfil_inspecao.includes("G")) profiles.push("Gestor");
    if (perfil_inspecao.includes("Q")) profiles.push("Qualidade");
    if (perfil_inspecao.includes("O")) profiles.push("Operador");
    return profiles.join(", ");
};

interface LoginCredentials {
    username: string;
    password: string;
    remember?: boolean;
}

interface AuthError {
    message: string;
    field?: string;
}

// Função para codificar senha usando cifra XOR
const encodePassword = (password: string) => {
    const key = Math.floor(Math.random() * 255);
    const hexResult = [];
    let result = "";
    hexResult.push((key >> 4).toString(16).toUpperCase());
    hexResult.push((key & 0xf).toString(16).toUpperCase());
    result += hexResult.join("");
    for (let i = 0; i < password.length; i++) {
        const converted = password.charCodeAt(i) ^ key;
        hexResult[0] = (converted >> 4).toString(16).toUpperCase();
        hexResult[1] = (converted & 0xf).toString(16).toUpperCase();
        result += hexResult.join("");
    }
    return result;
};

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: AuthError | null;
    login: (credentials: LoginCredentials) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const providedAuth = useProvideAuth();
    return <AuthContext.Provider value={providedAuth}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

function useProvideAuth(): AuthContextType {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [error, setError] = useState<AuthError | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    const checkAuth = useCallback((): boolean => {
        return (
            localStorage.getItem("isAuthenticated") === "true" ||
            sessionStorage.getItem("isAuthenticated") === "true"
        );
    }, []);

    const getUserData = useCallback((): User | null => {
        const userDataStr = localStorage.getItem("userData") || sessionStorage.getItem("userData");
        const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (userDataStr) {
            try {
                return JSON.parse(userDataStr);
            } catch {
                return null;
            }
        } else if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    }, []);

    useEffect(() => {
        const authStatus = checkAuth();
        setIsAuthenticated(authStatus);
        if (authStatus) {
            setUser(getUserData());
        }
        setIsLoading(false);
    }, [checkAuth, getUserData]);

    const login = useCallback(
        async ({ username, password, remember }: LoginCredentials): Promise<boolean> => {
            if (isLoading) return false;
            setIsLoading(true);
            setError(null);
            const apiUrl = localStorage.getItem("apiUrl");
            if (!apiUrl) {
                setError({ message: "API não configurada. Configure o endereço da API primeiro." });
                setIsLoading(false);
                return false;
            }
            try {
                const senha_cripto = encodePassword(password);
                const response = await fetch(`${apiUrl}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ usuario: username, senha_cripto }),
                });
                const data = await response.json();
                if (response.status === 200) {
                    if (data.success === undefined || data.success) {
                        const userData: User = {
                            username: username,
                            name: data.nome || data.usuario || username,
                            permissao: data.permissao || "",
                            perfil_inspecao: data.perfil_inspecao || "",
                        };
                        if (remember) {
                            localStorage.setItem("isAuthenticated", "true");
                            localStorage.setItem("authToken", data.token || "");
                            localStorage.setItem("userData", JSON.stringify(userData));
                        } else {
                            sessionStorage.setItem("isAuthenticated", "true");
                            sessionStorage.setItem("authToken", data.token || "");
                            sessionStorage.setItem("userData", JSON.stringify(userData));
                        }
                        setIsAuthenticated(true);
                        setUser(userData);
                        setIsLoading(false);
                        router.push("/dashboard");
                        return true;
                    } else {
                        setError({
                            message:
                                data.message || "Credenciais inválidas. Por favor, verifique seu usuário e senha.",
                        });
                    }
                } else {
                    if (response.status === 401) {
                        setError({ message: "Usuário ou senha incorretos", field: "password" });
                    } else {
                        setError({
                            message:
                                data.mensagem ||
                                `Falha na autenticação (${response.status}). Por favor, tente novamente.`,
                        });
                    }
                }
            } catch {
                setError({ message: "Erro ao conectar ao servidor. Verifique sua conexão e tente novamente." });
            }
            setIsLoading(false);
            return false;
        },
        [router, isLoading]
    );

    const logout = useCallback(async (): Promise<void> => {
        setIsLoading(true);
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
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        router.push("/login");
    }, [router]);

    return {
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        checkAuth,
    };
}
