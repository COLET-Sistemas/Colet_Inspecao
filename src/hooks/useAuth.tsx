"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { setLogoutInProgress } from "../services/api/authInterceptor";

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
                credentials: 'include',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
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
                credentials: 'include',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
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
        let isMounted = true;

        const initAuth = async () => {
            try {
                // Evitar inicialização se logout estiver em progresso
                if (document.location.pathname === '/login') {
                    setIsLoading(false);
                    return;
                }

                const authStatus = await checkAuth();

                // Verifica se o componente ainda está montado antes de atualizar o estado
                if (!isMounted) return;

                setIsAuthenticated(authStatus);
                if (authStatus) {
                    // Tenta obter os dados atualizados do usuário da API
                    const userData = await getUserData();

                    // Verifica novamente se o componente está montado
                    if (!isMounted) return;

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
            } catch (error) {
                console.error('Erro ao inicializar autenticação:', error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        initAuth();

        // Cleanup function to handle component unmounting
        return () => {
            isMounted = false;
        };
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
        // Define a flag de logout para evitar chamadas à API durante o processo
        setLogoutInProgress(true);
        setIsLoading(true);

        // Limpa qualquer possível mensagem de erro de autenticação antes do logout
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('authError');
        }

        // Primeiro desautentica o usuário no front-end para uma experiência mais responsiva
        setIsAuthenticated(false);
        setUser(null);

        // Redirecionamento imediato para a tela de login
        router.push("/login");

        // Em seguida, limpamos os cookies e localStorage em segundo plano
        setTimeout(async () => {
            try {
                // Chama a API de logout para limpar cookies HttpOnly
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
            } finally {
                // Limpeza completa dos dados do localStorage
                localStorage.removeItem('userData');
                localStorage.removeItem('colaborador');
                localStorage.removeItem('codigo_pessoa');
                localStorage.removeItem('perfil_inspecao');
                localStorage.removeItem('activeInspectionTab');

                // Finalizando o processo de logout
                setIsLoading(false);

                // Resetando a flag após o logout completo
                setTimeout(() => {
                    setLogoutInProgress(false);
                }, 200);
            }
        }, 100); // Pequeno delay para garantir que o redirecionamento inicie primeiro
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
