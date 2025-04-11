"use client";

import { useApiConfig } from "@/hooks/useApiConfig";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, Eye, EyeOff, Loader, Lock, Settings, User, X, XCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

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

    // API Configuration using the hook
    const { apiUrl, isConnected, isLoading: apiIsLoading, saveApiUrl, testApiConnection } = useApiConfig();

    // Add a local state to track button loading only during submission
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auth hook
    const { login, isLoading: loginIsLoading, error: authError } = useAuth();

    // Config modal state
    const [tempApiUrl, setTempApiUrl] = useState('');
    const [testResult, setTestResult] = useState<ApiTestResult | null>(null);

    const router = useRouter();

    // Add a state to detect orientation
    const [isLandscape, setIsLandscape] = useState(false);

    // Effect to detect orientation changes
    useEffect(() => {
        const checkOrientation = () => {
            setIsLandscape(window.matchMedia("(orientation: landscape) and (max-width: 1024px)").matches);
        };

        // Check orientation on mount
        checkOrientation();

        // Listen for orientation changes
        const mediaQuery = window.matchMedia("(orientation: landscape) and (max-width: 1024px)");
        mediaQuery.addEventListener("change", checkOrientation);

        return () => {
            mediaQuery.removeEventListener("change", checkOrientation);
        };
    }, []);

    useEffect(() => {
        // Set temp API URL when modal opens or URL changes
        setTempApiUrl(apiUrl);

        // Load remembered username if exists
        const savedUsername = localStorage.getItem('rememberedUsername');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, [apiUrl]);

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

        // Definindo as credenciais do operador
        const operatorUsername = "operador";
        const operatorPassword = "yp0p0th@m";

        // Check if API URL is configured
        if (!apiUrl) {
            setShowConfigModal(true);
            return;
        }

        // Set local submitting state to true
        setIsSubmitting(true);

        try {
            // Use the login method from useAuth hook with operator credentials
            const success = await login({
                username: operatorUsername,
                password: operatorPassword,
                remember: false // Não salvar credenciais do operador
            });

            if (success) {
                console.log('Login como operador realizado com sucesso!');
            }
        } catch (err) {
            console.error("Login como operador error:", err);
        } finally {
            // Always reset submitting state when done
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormSubmitted(true);

        // Validate form
        if (!username || !password) {
            return;
        }

        // Check if API URL is configured
        if (!apiUrl) {
            setShowConfigModal(true);
            return;
        }

        // Set local submitting state to true
        setIsSubmitting(true);

        try {
            // Use the login method from useAuth hook
            const success = await login({ username, password, remember: rememberMe });

            if (success) {
                if (rememberMe) {
                    localStorage.setItem('rememberedUsername', username);
                }

                // Verificar se o perfil_inspecao foi devidamente salvo
                console.log('Login realizado com sucesso! Perfil de inspeção capturado.');
            }
        } catch (err) {
            // Error handling is managed by the useAuth hook
            console.error("Login error:", err);
        } finally {
            // Always reset submitting state when done
            setIsSubmitting(false);
        }
    };

    const handleTestApiConnection = async () => {
        if (!tempApiUrl) return;

        setTestResult(null);

        try {
            const success = await testApiConnection(tempApiUrl);

            if (success) {
                setTestResult({ success: true, message: 'Conexão estabelecida com sucesso!' });
            } else {
                setTestResult({ success: false, message: 'Falha ao conectar com a API.' });
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Erro de conexão. Verifique a URL e tente novamente.'
            });
        }
    };

    const handleSaveApiConfig = async () => {
        if (!tempApiUrl) return;

        const success = await saveApiUrl(tempApiUrl);

        if (success) {
            setTestResult({ success: true, message: 'Conexão estabelecida com sucesso!' });
            setShowConfigModal(false);
        } else {
            setTestResult({
                success: false,
                message: 'Falha ao estabelecer conexão. '
            });
        }
    };


    const isLoading = apiIsLoading;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Left Panel - Modern Redesigned Layout */}
            <div className={`hidden ${isLandscape ? 'lg:flex' : 'md:flex'} md:w-5/12 lg:w-1/2 relative overflow-hidden`}>
                {/* Modern gradient background with enhanced design */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#08a88f] via-[#3c787a] to-[#1a5f7a] z-0"></div>

                {/* Decorative elements */}
                <div className="absolute inset-0 z-0">
                    {/* Circular shapes */}
                    <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/10 backdrop-blur-3xl"></div>
                    <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-white/5 backdrop-blur-3xl"></div>

                    {/* Abstract patterns */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-20">
                        <svg className="absolute top-1/4 left-1/4 w-1/2 h-1/2 text-white/10" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                            <path fill="currentColor" d="M42.7,-62.2C56.1,-53.3,68.2,-41.6,73.8,-27.2C79.4,-12.8,78.4,4.4,72.8,19.5C67.2,34.5,57,47.3,44.3,56.3C31.5,65.4,15.8,70.5,0.1,70.3C-15.6,70.2,-31.1,64.7,-43.9,55.5C-56.7,46.3,-66.7,33.3,-71.8,18.2C-77,3,-77.2,-14.3,-70.1,-27.7C-63,-41.1,-48.6,-50.5,-34.8,-59C-21,-67.5,-10.5,-75,1.8,-77.7C14.2,-80.5,28.3,-78.3,42.7,-69.4Z" transform="translate(100 100)" />
                        </svg>
                    </div>

                    {/* Light grid pattern for texture */}
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                    }}></div>
                </div>

                {/* Content layout */}
                <div className="relative flex flex-col h-full z-10 px-6 md:px-8 lg:px-12 py-12 md:py-16">
                    {/* Logo section */}
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

                    {/* Main content section */}
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 tracking-tight leading-tight">
                            Inspeção
                            <span className="text-white/80"> Colet</span>
                        </h1>

                        <p className="text-white/80 text-lg md:text-xl max-w-md leading-relaxed mb-8 md:mb-12">
                            Plataforma integrada para gestão completa das suas inspeções técnicas
                        </p>

                        {/* Feature highlights in cleaner layout */}
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

                    {/* Footer section */}
                    <div className="mt-auto border-t border-white/10 pt-6">
                        <p className="text-white/60 text-sm">
                            © {new Date().getFullYear()} Colet Sistemas • Sistema de Gestão de Inspeções
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form with Light Theme */}
            <div className={`w-full ${isLandscape ? '' : 'md:w-7/12 lg:w-1/2'} flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-y-auto`}>
                <div className={`w-full ${isLandscape ? 'max-w-lg' : 'max-w-md'} my-auto py-6`}>
                    {/* Logo only shown on mobile or landscape tablet - with responsive sizing */}
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

                    {/* Login Panel */}
                    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-100 relative">
                        {/* Settings icon with darker gray circle */}
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

                        {authError && (
                            <div className="mb-6 rounded-lg bg-red-50 p-4" role="alert">
                                <div className="flex items-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="mr-3 h-5 w-5 text-red-500"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
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
                                    disabled={isSubmitting}
                                    className="flex w-full justify-center rounded-lg bg-gradient-to-r from-[#09A08D] to-[#3C787A] px-4 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#09A08D] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center">
                                            <svg className="mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Entrando...</span>
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
                            {new Date().getFullYear()} Sistema de Inspeções Colet Sistemas • Versão {packageInfo.version}
                        </p>
                    </div>
                </div>
            </div>

            {/* API Configuration Modal with Colet Theme Colors */}
            {showConfigModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={() => setShowConfigModal(false)}
                    ></div>

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
                                    {isLoading ? <Loader className="animate-spin mr-2" size={18} /> : null}
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
