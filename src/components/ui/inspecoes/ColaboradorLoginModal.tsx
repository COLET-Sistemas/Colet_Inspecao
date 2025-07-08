import inspecaoService, { InspectionItem } from '@/services/api/inspecaoService';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, KeyRound, User, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import QuantidadeInputModal from './QuantidadeInputModal';


// Função para codificar senha usando cifra XOR (mesma usada em useAuth)
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

interface ColaboradorLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: {
        codigo_pessoa: string;
        nome: string;
        setor: string;
        funcao: string;
        registrar_ficha: boolean;
        encaminhar_ficha: boolean;
        inspection: InspectionItem;
    }) => void;
    inspection: InspectionItem;
    isNaoConformidadeContext?: boolean;
    isQuantidadeContext?: boolean;
    onNaoConformidadeSuccess?: (quantidade: number, inspection: InspectionItem) => void;
    onShowAlert?: (message: string, type?: "success" | "error" | "warning" | "info") => void;
}

export const ColaboradorLoginModal: React.FC<ColaboradorLoginModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    inspection,
    isNaoConformidadeContext = false,
    isQuantidadeContext = false,
    onNaoConformidadeSuccess,
    onShowAlert,
}) => {
    const [codigo, setCodigo] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showQuantidadeModal, setShowQuantidadeModal] = useState(false);

    // Limpar campos quando o modal for fechado
    const handleClose = React.useCallback(() => {
        setCodigo('');
        setSenha('');
        setError('');
        setShowPassword(false);
        onClose();
    }, [onClose]);

    // Refs para controle de foco
    const codigoInputRef = useRef<HTMLInputElement>(null);
    const senhaInputRef = useRef<HTMLInputElement>(null);
    const showPasswordButtonRef = useRef<HTMLButtonElement>(null);
    const submitButtonRef = useRef<HTMLButtonElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Effect para focar no input quando o modal abrir
    useEffect(() => {
        if (isOpen && codigoInputRef.current) {
            const timer = setTimeout(() => {
                codigoInputRef.current?.focus();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Effect para trap focus dentro do modal
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                const focusableElements = modalRef.current?.querySelectorAll(
                    'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );

                if (!focusableElements || focusableElements.length === 0) return;

                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                if (e.shiftKey) {
                    // Shift + Tab (indo para trás)
                    if (document.activeElement === firstElement || !modalRef.current?.contains(document.activeElement)) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab (indo para frente)
                    if (document.activeElement === lastElement || !modalRef.current?.contains(document.activeElement)) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }

            // Fechar modal com ESC
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose]);

    // Função para verificar se o usuário tem permissão para registrar não conformidade
    const hasNaoConformidadePermission = (registrarFicha: string | number | boolean | Array<string | number>): boolean => {
        if (registrarFicha === undefined || registrarFicha === null) {
            return false;
        }

        if (typeof registrarFicha === 'string') {
            return registrarFicha.includes('4');
        } else if (Array.isArray(registrarFicha)) {
            return registrarFicha.includes(4) || registrarFicha.includes('4');
        } else if (typeof registrarFicha === 'number') {
            return registrarFicha === 4;
        } else if (typeof registrarFicha === 'boolean') {
            // Se for boolean true, consideramos que tem permissão (para compatibilidade)
            return registrarFicha;
        }

        return false;
    };

    // Handler para confirmar quantidade no modal de quantidade
    const handleQuantidadeConfirm = (quantidade: number) => {
        setShowQuantidadeModal(false);
        if (onNaoConformidadeSuccess) {
            onNaoConformidadeSuccess(quantidade, inspection);
        }
        // Fechar modal e limpar form após sucesso
        handleClose();
    }; const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!codigo || !senha) {
            setError('Preencha todos os campos');
            return;
        }

        setError('');
        setIsLoading(true); try {
            const senhaCriptografada = encodePassword(senha);
            const response = await inspecaoService.authColaborador(codigo, senhaCriptografada);

            // Salvar apenas no formato 'userData' para compatibilidade com o resto do sistema
            try {
                const existingUserData = localStorage.getItem('userData') ?
                    JSON.parse(localStorage.getItem('userData') || '{}') : {};

                let origem = "Acesso Normal";
                if (isNaoConformidadeContext) {
                    origem = "Não Conformidade";
                } else if (isQuantidadeContext) {
                    origem = "Registrar Quantidade";
                } 

                const updatedUserData = {
                    ...existingUserData,
                    codigo_pessoa: codigo,
                    nome: response.nome,
                    setor: response.setor,
                    funcao: response.funcao,
                    registrar_ficha: response.registrar_ficha,
                    encaminhar_ficha: response.encaminhar_ficha,
                    perfil_inspecao: 'O', 
                    origem: origem 
                };

                // Salvar no localStorage apenas userData
                localStorage.setItem('userData', JSON.stringify(updatedUserData));
                localStorage.setItem('isAuthenticated', 'true');

            } catch (e) {
                console.error('Erro ao salvar em userData:', e);
            }            
            if (isNaoConformidadeContext && onNaoConformidadeSuccess) {
                const hasPermission = hasNaoConformidadePermission(response.registrar_ficha);

                if (hasPermission) {
                    setShowQuantidadeModal(true);
                    setCodigo('');
                    setSenha('');
                } else {
                    setIsLoading(false);
                    handleClose();

                    if (onShowAlert) {
                        onShowAlert('Você não possui permissão para registrar não conformidades.', 'error');
                    }
                    return;
                }
            } else if (isQuantidadeContext) {
                onSuccess({
                    ...response,
                    inspection
                });
                handleClose();
            } else {
                onSuccess({
                    ...response,
                    inspection
                });
                handleClose();
            }
        } catch (err) {
            console.error('Erro ao autenticar:', err);
            setError('Código ou senha inválidos. Por favor, tente novamente.');
        } finally {
            setIsLoading(false);
         
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
                        <motion.div
                            key="colaborador-modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 w-full h-full bg-slate-900/60 backdrop-blur-lg backdrop-saturate-150"
                        // Removido onClick={handleClose} para evitar que o modal feche ao clicar fora
                        />

                        <motion.div
                            key="colaborador-modal-content"
                            ref={modalRef}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 400 }}
                            className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="modal-title"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                                    Autenticação de Colaborador
                                </h2>
                                <button
                                    ref={closeButtonRef}
                                    onClick={handleClose}
                                    className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                    aria-label="Fechar"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-gray-600">
                                    {isQuantidadeContext
                                        ? "Para registrar quantidades, por favor informe seu código e senha"
                                        : isNaoConformidadeContext
                                            ? "Para registrar não conformidade, por favor informe seu código e senha"
                                            : "Para acessar os detalhes da inspeção, por favor informe seu código e senha"
                                    }
                                </p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <User size={18} />
                                        </div>
                                        <input
                                            ref={codigoInputRef}
                                            type="text"
                                            id="codigo"
                                            placeholder="Código do colaborador"
                                            value={codigo}
                                            onChange={(e) => setCodigo(e.target.value)}
                                            disabled={isLoading}
                                            className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm placeholder-gray-400 transition-colors focus:border-[#1ABC9C] focus:bg-white focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <KeyRound size={18} />
                                        </div>
                                        <input
                                            ref={senhaInputRef}
                                            type={showPassword ? "text" : "password"}
                                            id="senha"
                                            placeholder="Senha"
                                            value={senha}
                                            onChange={(e) => setSenha(e.target.value)}
                                            disabled={isLoading}
                                            className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm placeholder-gray-400 transition-colors focus:border-[#1ABC9C] focus:bg-white focus:outline-none"
                                            required
                                        />
                                        <button
                                            ref={showPasswordButtonRef}
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1ABC9C] focus:ring-offset-1 rounded"
                                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                        >
                                            {showPassword ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>
                                    </div>

                                    {error && (
                                        <div className="rounded-lg bg-red-50 p-3">
                                            <p className="text-sm text-red-600">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        ref={submitButtonRef}
                                        type="submit"
                                        disabled={isLoading}
                                        className={`
                                        relative w-full rounded-lg px-4 py-3 font-medium shadow-sm transition-all duration-200
                                        ${isLoading
                                                ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                                                : 'bg-[#1ABC9C] text-white hover:bg-[#16A085] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1ABC9C] focus:ring-offset-2'
                                            }
                                    `}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm">Autenticando...</span>
                                            </div>
                                        ) : (
                                            'Autenticar'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>            <QuantidadeInputModal
                isOpen={showQuantidadeModal}
                onClose={() => setShowQuantidadeModal(false)}
                onConfirm={handleQuantidadeConfirm}
                onCancel={() => {
                    // Fechar o modal de colaborador também
                    setShowQuantidadeModal(false);
                    handleClose(); // Fechar o modal de colaborador e limpar campos
                }}
                title="Registrar Não Conformidade"
                // Passar os campos necessários da inspeção para o POST
                numeroOrdem={inspection.numero_ordem}
                referencia={inspection.referencia}
                roteiro={inspection.roteiro}
                processo={inspection.processo}
                codigoPostо={inspection.codigo_posto}
                operacao={inspection.operacao}
                origem="Não Conformidade" // Definir explicitamente a origem como Não Conformidade
            />
        </>
    );
};
