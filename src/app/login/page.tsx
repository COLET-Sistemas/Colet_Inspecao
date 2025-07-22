"use client";

import { useApiConfig } from "@/hooks/useApiConfig";
import { useAuth } from "@/hooks/useAuth";
import { getIsLogoutInProgress } from "@/services/api/authInterceptor";
import { CheckCircle, Eye, EyeOff, Loader, Lock, Settings, User, X, XCircle } from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import packageInfo from '../../../package.json';

interface ApiTestResult {
    success: boolean;
    message: string;
}

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tempApiUrl, setTempApiUrl] = useState('');
    const [testResult, setTestResult] = useState<ApiTestResult | null>(null);
    const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);
    const [logoutInProgress, setLogoutInProgress] = useState<boolean>(false);
    const [isLandscape, setIsLandscape] = useState(false);

    const usernameInputRef = useRef<HTMLInputElement>(null);

    const { apiUrl, isConnected, isLoading: apiIsLoading, saveApiUrl, testApiConnection } = useApiConfig();
    const { login, error: authError } = useAuth();

    useEffect(() => {
        const checkOrientation = () => {
            setIsLandscape(window.matchMedia("(orientation: landscape) and (max-width: 1024px)").matches);
        };

        checkOrientation();
        const mediaQuery = window.matchMedia("(orientation: landscape) and (max-width: 1024px)");
        mediaQuery.addEventListener("change", checkOrientation);

        return () => {
            mediaQuery.removeEventListener("change", checkOrientation);
        };
    }, []);

    useEffect(() => {
        setTempApiUrl(apiUrl);

        const savedUsername = localStorage.getItem('rememberedUsername');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }

        if (typeof sessionStorage !== 'undefined') {
            const authError = sessionStorage.getItem('authError');
            if (authError) {
                setSessionExpiredMessage(authError);
                sessionStorage.removeItem('authError');
                setTimeout(() => setSessionExpiredMessage(null), 5000);
            }
        }
    }, [apiUrl]);

    // Efeito para focar automaticamente no input de usuário quando o componente é montado
    useEffect(() => {
        if (usernameInputRef.current) {
            usernameInputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        const checkLogoutStatus = () => {
            const isLogoutActive = getIsLogoutInProgress();
            setLogoutInProgress(isLogoutActive);

            if (isLogoutActive) {
                setSessionExpiredMessage("Finalizando sessão...");

                const interval = setInterval(() => {
                    if (!getIsLogoutInProgress()) {
                        setLogoutInProgress(false);
                        setSessionExpiredMessage("Sessão finalizada com sucesso.");
                        setTimeout(() => setSessionExpiredMessage(null), 3000);
                        clearInterval(interval);
                    }
                }, 200);

                setTimeout(() => clearInterval(interval), 5000);
            }
        };

        checkLogoutStatus();
        const statusCheck = setInterval(checkLogoutStatus, 500);
        return () => clearInterval(statusCheck);
    }, []);

    // Efeito para limpar o campo de senha quando aparece o erro de código de pessoa
    useEffect(() => {
        if (authError?.message?.includes('Usuário não possui código de pessoa associado')) {
            setTimeout(() => {
                setPassword('');
                setFormSubmitted(false);
            }, 100);
        }
    }, [authError]);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleRememberToggle = () => {
        setRememberMe(!rememberMe);
        if (!rememberMe) {
            localStorage.removeItem('rememberedUsername');
        }
    };

    const handleOperatorAccess = async (e: React.MouseEvent) => {
        e.preventDefault();

        const operatorUsername = "operador";
        const operatorPassword = "yp0p0th@m";

        if (!apiUrl) {
            setShowConfigModal(true);
            return;
        }

        setIsSubmitting(true);

        try {
            await login({
                username: operatorUsername,
                password: operatorPassword,
                preserveRemembered: true
            });
        } catch {
            console.error("Login como operador error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormSubmitted(true);

        if (logoutInProgress || !username || !password) {
            return;
        }

        if (!apiUrl) {
            setShowConfigModal(true);
            return;
        }

        setIsSubmitting(true);

        try {
            const loginSuccess = await login({ username, password, remember: rememberMe });
            if (loginSuccess && rememberMe) {
                localStorage.setItem('rememberedUsername', username);
            }
        } catch {
            console.error("Login error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTestApiConnection = async () => {
        if (!tempApiUrl) return;

        setTestResult(null);

        try {
            const success = await testApiConnection(tempApiUrl);
            setTestResult({
                success,
                message: success ? 'Conexão estabelecida com sucesso!' : 'Falha ao conectar com a API.'
            });
        } catch {
            setTestResult({
                success: false,
                message: 'Erro de conexão. Verifique a URL e tente novamente.'
            });
        }
    };

    const handleSaveApiConfig = async () => {
        if (!tempApiUrl) return;

        await saveApiUrl(tempApiUrl, true);

        setTestResult({
            success: true,
            message: isConnected
                ? 'Conexão estabelecida com sucesso!'
                : 'Endereço da API salvo, mas não foi possível estabelecer conexão. Verifique o servidor.'
        });

        setShowConfigModal(false);
    };

    const isLoading = apiIsLoading;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <div className={`hidden ${isLandscape ? 'lg:flex' : 'md:flex'} md:w-5/12 lg:w-1/2 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-[#08a88f] via-[#3c787a] to-[#1a5f7a] z-0"></div>

                <div className="absolute inset-0 z-0">
                    <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/10 backdrop-blur-3xl"></div>
                    <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-white/5 backdrop-blur-3xl"></div>

                    <div className="absolute top-0 left-0 w-full h-full opacity-20">
                        <svg className="absolute top-1/4 left-1/4 w-1/2 h-1/2 text-white/10" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                            <path fill="currentColor" d="M42.7,-62.2C56.1,-53.3,68.2,-41.6,73.8,-27.2C79.4,-12.8,78.4,4.4,72.8,19.5C67.2,34.5,57,47.3,44.3,56.3C31.5,65.4,15.8,70.5,0.1,70.3C-15.6,70.2,-31.1,64.7,-43.9,55.5C-56.7,46.3,-66.7,33.3,-71.8,18.2C-77,3,-77.2,-14.3,-70.1,-27.7C-63,-41.1,-48.6,-50.5,-34.8,-59C-21,-67.5,-10.5,-75,1.8,-77.7C14.2,-80.5,28.3,-78.3,42.7,-69.4Z" transform="translate(100 100)" />
                        </svg>
                    </div>

                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                    }}></div>
                </div>

                <div className="relative flex flex-col h-full z-10 px-6 md:px-8 lg:px-12 py-12 md:py-16">
                    <div className="mb-auto">
                        <Image
                            src="/images/logoLoginColet.png"
                            alt="Colet Logo"
                            width={180}
                            height={45}
                            priority
                            loading="eager"
                            className="object-contain h-10 md:h-12 lg:h-14 brightness-0 invert"
                        />
                    </div>

                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 tracking-tight leading-tight">
                            Inspeção
                            <span className="text-white/80"> Colet</span>
                        </h1>

                        <p className="text-white/80 text-lg md:text-xl max-w-md leading-relaxed mb-8 md:mb-12">
                            Plataforma integrada para gestão completa das suas inspeções técnicas
                        </p>

                        <div className="space-y-4 md:space-y-6 mt-6 md:mt-8">
                            <div className="flex items-start space-x-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex-shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-1">Segurança e Conformidade</h3>
                                    <p className="text-white/70 text-sm md:text-base">Garantia de conformidade com normas técnicas e regulamentações</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex-shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-1">Insights Estratégicos</h3>
                                    <p className="text-white/70 text-sm md:text-base">Métricas e análises avançadas para decisões inteligentes</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex-shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-1">Eficiência Operacional</h3>
                                    <p className="text-white/70 text-sm md:text-base">Aumento de produtividade com processos otimizados e automatizados</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto border-t border-white/10 pt-6">
                        <p className="text-white/60 text-sm">
                            © {new Date().getFullYear()} Colet Sistemas • Sistema de Gestão de Inspeções
                        </p>
                    </div>
                </div>
            </div>

            <div className={`w-full ${isLandscape ? '' : 'md:w-7/12 lg:w-1/2'} flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-y-auto`}>
                <div className={`w-full ${isLandscape ? 'max-w-lg' : 'max-w-md'} my-auto py-6`}>
                    <div className={`flex justify-center ${isLandscape ? '' : 'md:hidden'} mb-2`}>
                        <Image
                            src="/images/logoLoginColetMobile.png"
                            alt="Colet Logo"
                            width={400}
                            height={100}
                            priority
                            className="object-contain h-36 sm:h-40 w-auto"
                        />
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-100 relative">
                        <button
                            onClick={() => setShowConfigModal(true)}
                            className="absolute top-4 right-4 transition-colors group"
                            title="Configurar API"
                        >
                            <div className="absolute inset-0 bg-gray-100 rounded-full group-hover:bg-gray-300 transition-colors"></div>
                            <div className="relative p-2">
                                <Settings size={20} className={`${isConnected ? 'text-[#09A08D]' : 'text-gray-600'}`} />
                                <span className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                            </div>
                        </button>

                        <div className="mb-6 text-center">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Bem-vindo de volta</h2>
                            <p className="text-gray-500">Acesse sua conta para continuar</p>
                        </div>

                        {sessionExpiredMessage && (
                            <div className={`mb-6 rounded-lg p-4 ${sessionExpiredMessage.includes("expirou") || sessionExpiredMessage.includes("não tem permissão")
                                ? "bg-red-50"
                                : sessionExpiredMessage.includes("Finalizando")
                                    ? "bg-blue-50"
                                    : sessionExpiredMessage.includes("sucesso")
                                        ? "bg-green-50"
                                        : "bg-red-50"
                                }`} role="alert">
                                <div className="flex items-center">
                                    {sessionExpiredMessage.includes("Finalizando") ? (
                                        <Loader className="mr-3 h-5 w-5 text-blue-500 animate-spin" />
                                    ) : sessionExpiredMessage.includes("sucesso") ? (
                                        <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircle className="mr-3 h-5 w-5 text-red-500" />
                                    )}
                                    <div className={`text-sm font-medium ${sessionExpiredMessage.includes("expirou") || sessionExpiredMessage.includes("não tem permissão")
                                        ? "text-red-700"
                                        : sessionExpiredMessage.includes("Finalizando")
                                            ? "text-blue-700"
                                            : sessionExpiredMessage.includes("sucesso")
                                                ? "text-green-700"
                                                : "text-red-700"
                                        }`}>
                                        {sessionExpiredMessage}
                                    </div>
                                </div>
                            </div>
                        )}

                        {authError && (
                            <div className="mb-6 rounded-lg bg-red-50 p-4" role="alert">
                                <div className="flex items-center">
                                    <XCircle className="mr-3 h-5 w-5 text-red-500" />
                                    <div className="text-sm font-medium text-red-700">{authError.message}</div>
                                </div>
                            </div>
                        )}

                        <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit} noValidate>
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
                                <div className={`flex items-center border ${formSubmitted && !username ? 'border-red-300 bg-red-50' : authError?.field === 'username' ? 'border-red-300 bg-red-50' : 'border-gray-300 focus-within:border-[#09A08D] focus-within:ring-1 focus-within:ring-[#09A08D]'} rounded-lg px-4 py-2.5 sm:py-3 transition-all duration-200`}>
                                    <User className="h-5 w-5 text-gray-400 mr-2" />
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        autoComplete="username"
                                        required
                                        aria-required="true"
                                        aria-invalid={formSubmitted && !username ? "true" : "false"}
                                        className="w-full border-none bg-transparent focus:ring-0 outline-none text-gray-900 placeholder-gray-500 text-sm"
                                        placeholder="Seu usuário"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        ref={usernameInputRef}
                                    />
                                </div>
                                {formSubmitted && !username && (
                                    <p className="mt-2 text-xs text-red-600">
                                        Usuário é obrigatório
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                                <div className={`flex items-center border ${formSubmitted && !password ? 'border-red-300 bg-red-50' : authError?.field === 'password' ? 'border-red-300 bg-red-50' : 'border-gray-300 focus-within:border-[#09A08D] focus-within:ring-1 focus-within:ring-[#09A08D]'} rounded-lg px-4 py-2.5 sm:py-3 transition-all duration-200`}>
                                    <Lock className="h-5 w-5 text-gray-400 mr-2" />
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        aria-required="true"
                                        aria-invalid={formSubmitted && !password ? "true" : "false"}
                                        className="w-full border-none bg-transparent focus:ring-0 outline-none text-gray-900 placeholder-gray-500 text-sm"
                                        placeholder="Sua senha"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
                                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {formSubmitted && !password && (
                                    <p className="mt-2 text-xs text-red-600">
                                        Senha é obrigatória
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                <div className="flex items-center">
                                    <input
                                        id="remember"
                                        name="remember"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={handleRememberToggle}
                                        className="h-4 w-4 text-[#09A08D] focus:ring-[#09A08D] border-gray-300 rounded cursor-pointer transition-colors duration-200"
                                    />
                                    <label
                                        htmlFor="remember"
                                        className="ml-2 block text-sm text-gray-700 cursor-pointer"
                                        onClick={handleRememberToggle}
                                    >
                                        Lembrar-me
                                    </label>
                                </div>

                                <div>
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-[#09A08D] hover:text-[#3C787A]"
                                        onClick={handleOperatorAccess}
                                    >
                                        Acessar como operador
                                    </a>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || logoutInProgress}
                                    className="flex w-full justify-center rounded-lg bg-gradient-to-r from-[#09A08D] to-[#3C787A] px-4 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#09A08D] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center">
                                            <Loader className="mr-2 h-4 w-4 animate-spin text-white" />
                                            <span>Entrando...</span>
                                        </span>
                                    ) : logoutInProgress ? (
                                        <span className="flex items-center">
                                            <Loader className="mr-2 h-4 w-4 animate-spin text-white" />
                                            <span>Finalizando sessão...</span>
                                        </span>
                                    ) : (
                                        <span>Entrar</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-6 sm:mt-8 text-center">
                        <p className="text-xs text-gray-500">
                            © {new Date().getFullYear()} Sistema de Inspeções Colet Sistemas • Versão {packageInfo.version}
                        </p>
                    </div>
                </div>
            </div>

            {showConfigModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={() => setShowConfigModal(false)}
                    />

                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 p-6 bg-white rounded-xl shadow-xl z-50 border-t-4 border-[#09A08D]">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                <Settings className="h-5 w-5 mr-2 text-[#09A08D]" />
                                Configuração da API
                            </h3>
                            <button
                                onClick={() => setShowConfigModal(false)}
                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {testResult && (
                            <div className={`p-3 rounded-md mb-4 ${testResult.success
                                ? 'bg-[#09A08D]/10 text-[#09A08D] border border-[#09A08D]/20'
                                : 'bg-red-50 text-red-600 border border-red-100'
                                }`}>
                                <div className="flex items-center">
                                    {testResult.success ?
                                        <CheckCircle className="mr-2 flex-shrink-0" size={18} /> :
                                        <XCircle className="mr-2 flex-shrink-0" size={18} />
                                    }
                                    <span>{testResult.message}</span>
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 mb-1">
                                Endereço da API
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="apiUrl"
                                    value={tempApiUrl}
                                    onChange={(e) => setTempApiUrl(e.target.value)}
                                    placeholder="http://192.168.0.1:8000"
                                    className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#09A08D] focus:outline-none focus:ring-1 focus:ring-[#09A08D]/30"
                                />
                                {isConnected && apiUrl === tempApiUrl && (
                                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#09A08D]" />
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Exemplo: http://192.168.1.100:8000
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center">
                                <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-[#09A08D]' : 'bg-amber-500'} mr-2`}></div>
                                <span className="text-sm text-gray-600">
                                    {isConnected ? 'API Conectada' : 'Não conectado'}
                                </span>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={handleTestApiConnection}
                                    disabled={isLoading || !tempApiUrl}
                                    className="flex items-center justify-center py-2 px-4 border border-[#09A08D] rounded-md text-[#09A08D] hover:bg-[#09A08D]/5 focus:outline-none focus:ring-2 focus:ring-[#09A08D]/50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoading && <Loader className="animate-spin mr-2" size={18} />}
                                    Testar
                                </button>

                                <button
                                    onClick={handleSaveApiConfig}
                                    disabled={isLoading || !tempApiUrl}
                                    className="bg-gradient-to-r from-[#09A08D] to-[#3C787A] text-white py-2 px-4 rounded-md hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#09A08D]/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                >
                                    {isLoading ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}