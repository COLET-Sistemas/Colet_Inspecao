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
    codigo_pessoa?: string;
    encaminhar_ficha?: Int16Array;
    registrar_ficha?: Int16Array;
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
    preserveRemembered?: boolean; // Nova propriedade para indicar que não deve remover o rememberedUsername
}

interface AuthError {
    message: string; field?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: AuthError | null;
    login: (credentials: LoginCredentials) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<boolean>;
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
    const router = useRouter(); const checkAuth = useCallback(async (): Promise<boolean> => {
        try {
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                return data.isAuthenticated;
            }

            return false;
        } catch {
            return false;
        }
    }, []); const getUserData = useCallback(async (): Promise<User | null> => {
        try {
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                return data.isAuthenticated ? data.user : null;
            }

            return null;
        } catch {
            return null;
        }
    }, []);
    useEffect(() => {
        const initAuth = async () => {
            const authStatus = await checkAuth();
            setIsAuthenticated(authStatus);
            if (authStatus) {
                // Tenta obter os dados atualizados do usuário da API
                const userData = await getUserData();
                if (userData) {
                    setUser(userData);
                    // Atualiza o localStorage com os dados mais recentes
                    localStorage.setItem('userData', JSON.stringify(userData));
                } else {
                    // Se não conseguir obter da API, tenta usar dados do localStorage
                    const storedUserData = localStorage.getItem('userData');
                    if (storedUserData) {
                        try {
                            const parsedUserData = JSON.parse(storedUserData);
                            setUser(parsedUserData);
                        } catch (e) {
                            console.error('Erro ao analisar dados do usuário do localStorage:', e);
                            localStorage.removeItem('userData');
                        }
                    }
                }
            } else {
                // Se não estiver autenticado, certifica-se de que os dados de usuário sejam removidos
                localStorage.removeItem('userData');
                setUser(null);
            }
            setIsLoading(false);
        };

        initAuth();
    }, [checkAuth, getUserData]); const login = useCallback(
        async ({ username, password, remember, preserveRemembered }: LoginCredentials): Promise<boolean> => {
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
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-url': apiUrl
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        username,
                        password,
                        remember
                    }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setIsAuthenticated(true);
                    setUser(data.user);
                    setIsLoading(false);
                    if (remember && username !== 'operador') {
                        localStorage.setItem('rememberedUsername', username);
                    } else if (!remember && !preserveRemembered && username !== 'operador') {
                        localStorage.removeItem('rememberedUsername');
                    }

                    if (data.user) {
                        localStorage.setItem('userData', JSON.stringify(data.user));
                    }

                    router.push("/dashboard");
                    return true;
                } else {
                    setError({
                        message: data.message || "Credenciais inválidas. Por favor, verifique seu usuário e senha.",
                        field: response.status === 401 ? "password" : undefined
                    });
                }
            } catch (error) {
                console.error('Erro no login:', error);
                setError({ message: "Erro ao conectar ao servidor. Verifique sua conexão e tente novamente." });
            }

            setIsLoading(false);
            return false;
        },
        [router, isLoading]
    ); const logout = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        try {
            // Limpa qualquer possível mensagem de erro de autenticação antes do logout
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('authError');
            }

            // Chama a API de logout para limpar cookies HttpOnly
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }

        localStorage.removeItem('userData');
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
