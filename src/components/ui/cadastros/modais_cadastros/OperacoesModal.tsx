'use client';

import { useApiConfig } from '@/hooks/useApiConfig';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

// Interface para os dados do modal
interface OperacaoDados {
    referencia: string;
    roteiro: number;
    processo: number;
    id?: number;
    descricao?: string;
    frequencia_minutos?: number;
}

// Props do componente
interface OperacoesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    dados: OperacaoDados | null;
    modo?: 'cadastro' | 'edicao';
}

export const OperacoesModal = ({
    isOpen,
    onClose,
    dados,
    onSuccess,
    modo = 'cadastro'
}: OperacoesModalProps) => {
    const [formData, setFormData] = useState({
        descricao: '',
        frequencia: 100
    });
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const { apiUrl, getAuthHeaders } = useApiConfig();

    // Cores baseadas no modo
    const themeColors = {
        cadastro: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-800',
            button: 'bg-emerald-600 hover:bg-emerald-700',
            lightBg: 'bg-emerald-100'
        },
        edicao: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-800',
            button: 'bg-amber-600 hover:bg-amber-700',
            lightBg: 'bg-amber-100'
        }
    };

    const currentTheme = themeColors[modo];

    // Reset form when modal opens/closes or modo changes
    useEffect(() => {
        if (isOpen) {
            // Se for edição e tiver dados, preenche o formulário
            if (modo === 'edicao' && dados?.descricao && dados?.frequencia_minutos) {
                setFormData({
                    descricao: dados.descricao,
                    frequencia: dados.frequencia_minutos
                });
            } else {
                setFormData({
                    descricao: '',
                    frequencia: 100
                });
            }
            setFormError(null);
        }
    }, [isOpen, modo, dados]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'frequencia') {
            const numValue = parseInt(value) || 0;
            setFormData(prev => ({
                ...prev,
                [name]: numValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validação
        if (!formData.descricao.trim()) {
            setFormError("A descrição da operação é obrigatória");
            return;
        }

        if (formData.frequencia <= 0) {
            setFormError("A frequência deve ser maior que zero");
            return;
        }

        if (!dados) return;

        setIsSaving(true);
        setFormError(null);

        try {
            // Garantir que roteiro seja enviado como número
            const roteiroNum = typeof dados.roteiro === 'string' ? parseInt(dados.roteiro) : dados.roteiro;

            const endpoint = modo === 'edicao'
                ? `${apiUrl}/inspecao/operacoes_processos/${dados.id}`
                : `${apiUrl}/inspecao/operacoes_processos`;

            const method = modo === 'edicao' ? 'PUT' : 'POST';

            const payload = {
                referencia: dados.referencia,
                roteiro: roteiroNum,
                processo: dados.processo,
                descricao: formData.descricao,
                frequencia_minutos: formData.frequencia
            };

            console.log(`${modo === 'edicao' ? 'Atualizando' : 'Cadastrando'} operação:`, payload);

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Erro ao ${modo === 'edicao' ? 'atualizar' : 'cadastrar'}: ${response.status}`);
            }

            const data = await response.json();

            // Chama o callback onSuccess com a mensagem de sucesso
            onSuccess(modo === 'edicao'
                ? "Operação atualizada com sucesso!"
                : "Operação cadastrada com sucesso!");

            // Fechamento do modal após salvamento
            onClose();
        } catch (error) {
            console.error(`Erro ao ${modo === 'edicao' ? 'atualizar' : 'salvar'} operação:`, error);
            setFormError(`Ocorreu um erro ao ${modo === 'edicao' ? 'atualizar' : 'salvar'} a operação. Tente novamente.`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !dados) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden border border-gray-100">
                <div className={`flex justify-between items-center px-4 py-3 ${currentTheme.bg} border-b ${currentTheme.border}`}>
                    <h3 className={`text-sm font-medium ${currentTheme.text}`}>
                        {modo === 'edicao' ? 'Editar' : 'Nova'} Operação - Processo {dados.processo}
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        aria-label="Fechar"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div className="p-5">
                    <div className="mb-5 bg-gray-50 p-3 rounded-md border border-gray-100">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                                <span className="text-gray-500 block">Referência</span>
                                <span className="font-medium">{dados.referencia}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Roteiro</span>
                                <span className="font-medium">{dados.roteiro}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Processo</span>
                                <span className="font-medium">{dados.processo}</span>
                            </div>
                        </div>
                    </div>

                    {formError && (
                        <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-md text-xs text-red-600">
                            <div className="flex items-center">
                                <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                                {formError}
                            </div>
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs font-semibold text-gray-700">
                                    {modo === 'edicao' ? 'Informações da Operação' : 'Nova Operação'}
                                </h4>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    name="descricao"
                                    value={formData.descricao}
                                    onChange={handleInputChange}
                                    className={`w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-${modo === 'edicao' ? 'amber' : 'emerald'}-500`}
                                    placeholder="Descreva a operação"
                                    disabled={isSaving}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Frequência <span className="text-xs text-gray-500">(em minutos)</span>
                                </label>
                                <input
                                    type="number"
                                    name="frequencia"
                                    value={formData.frequencia}
                                    onChange={handleInputChange}
                                    min="1"
                                    className={`w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-${modo === 'edicao' ? 'amber' : 'emerald'}-500`}
                                    placeholder="Ex: 100"
                                    disabled={isSaving}
                                />
                            </div>
                        </div>

                        <div className="py-4 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors disabled:opacity-70"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`px-4 py-1.5 text-xs font-medium text-white ${currentTheme.button} rounded-md transition-colors disabled:opacity-70 flex items-center`}
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin mr-1.5"></div>
                                        <span>Salvando...</span>
                                    </>
                                ) : (
                                    <span>{modo === 'edicao' ? 'Atualizar' : 'Salvar'}</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
