import { LoadingSpinner } from '@/components/ui/Loading';
import inspecaoService, { InspectionItem } from '@/services/api/inspecaoService';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, KeyRound, User, X } from 'lucide-react';
import React, { useState } from 'react';
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
    // Propriedades opcionais para controle de contexto de não conformidade
    isNaoConformidadeContext?: boolean;
    onNaoConformidadeSuccess?: (quantidade: number, inspection: InspectionItem) => void;

}

export const ColaboradorLoginModal: React.FC<ColaboradorLoginModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    inspection,
    isNaoConformidadeContext = false,
    onNaoConformidadeSuccess,

}) => {
    const [codigo, setCodigo] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showQuantidadeModal, setShowQuantidadeModal] = useState(false);    // Função para verificar se o usuário tem permissão para registrar não conformidade
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
        // Limpar form após sucesso
        setCodigo('');
        setSenha('');
        setError('');
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!codigo || !senha) {
            setError('Preencha todos os campos');
            return;
        }

        setError('');
        setIsLoading(true); try {
            const senhaCriptografada = encodePassword(senha);
            const response = await inspecaoService.authColaborador(codigo, senhaCriptografada);            // Salvar dados do colaborador no localStorage em ambos os formatos (colaborador e userData)
            const colaboradorData = {
                codigo_pessoa: response.codigo_pessoa,
                nome: response.nome,
                setor: response.setor,
                funcao: response.funcao,
                registrar_ficha: response.registrar_ficha,
                encaminhar_ficha: response.encaminhar_ficha
            };

            // Salva no formato 'colaborador'
            localStorage.setItem('colaborador', JSON.stringify(colaboradorData));

            // Também salva no formato 'userData' para compatibilidade com o resto do sistema
            // Mantém os campos existentes em userData, se houver
            try {
                const existingUserData = localStorage.getItem('userData') ?
                    JSON.parse(localStorage.getItem('userData') || '{}') : {};

                localStorage.setItem('userData', JSON.stringify({
                    ...existingUserData,
                    codigo_pessoa: response.codigo_pessoa,
                    nome: response.nome,
                }));
            } catch (e) {
                console.error('Erro ao salvar em userData:', e);
            }            // Callback de sucesso com os dados do usuário e a inspeção selecionada
            // Se estamos no contexto de não conformidade, verificar permissão
            if (isNaoConformidadeContext && onNaoConformidadeSuccess) {
                const hasPermission = hasNaoConformidadePermission(response.registrar_ficha);

                if (hasPermission) {
                    // Usuário tem permissão - abrir modal de quantidade
                    setShowQuantidadeModal(true);
                } else {
                    // Usuário não tem permissão - mostrar erro
                    setError('Você não possui permissão para registrar não conformidades.');
                    setIsLoading(false);
                    return;
                }
            } else {
                // Contexto normal - prosseguir com callback padrão
                onSuccess({
                    ...response,
                    inspection
                });
            }
        } catch (err) {
            console.error('Erro ao autenticar:', err);
            setError('Código ou senha inválidos. Por favor, tente novamente.');
        } finally {
            setIsLoading(false);
        }
    }; return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 w-full h-full bg-slate-900/60 backdrop-blur-lg backdrop-saturate-150"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Autenticação de Colaborador
                            </h2>
                            <button
                                onClick={onClose}
                                className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                aria-label="Fechar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-600">
                                Para acessar os detalhes da inspeção, por favor informe seu código e senha
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        id="codigo"
                                        placeholder="Código do colaborador"
                                        value={codigo}
                                        onChange={(e) => setCodigo(e.target.value)}
                                        disabled={isLoading}
                                        className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm placeholder-gray-400 transition-colors focus:border-[#1ABC9C] focus:bg-white focus:outline-none"
                                        required
                                    />
                                </div>                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <KeyRound size={18} />
                                    </div>
                                    <input
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
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff size={18} aria-label="Ocultar senha" />
                                        ) : (
                                            <Eye size={18} aria-label="Mostrar senha" />
                                        )}
                                    </button>
                                </div>

                                {error && (
                                    <div className="rounded-lg bg-red-50 p-3">
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`
                    relative w-full rounded-lg px-4 py-3 font-medium shadow-sm transition-all duration-200
                    ${isLoading
                                            ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                                            : 'bg-[#1ABC9C] text-white hover:bg-[#16A085] hover:shadow-md'
                                        }
                  `}
                                >
                                    {isLoading ? (
                                        <LoadingSpinner size="small" text="Autenticando..." color="gray" showText={true} />
                                    ) : (
                                        'Acessar Inspeção'
                                    )}                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Modal de Quantidade de Não Conformidade */}
            <QuantidadeInputModal
                isOpen={showQuantidadeModal}
                onClose={() => setShowQuantidadeModal(false)}
                onConfirm={handleQuantidadeConfirm}
                title="Registrar Não Conformidade"
            />
        </AnimatePresence>
    );
};
