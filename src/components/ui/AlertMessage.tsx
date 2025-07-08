"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface AlertMessageProps {
    message: string | null;
    type: "success" | "error" | "warning" | "info";
    onDismiss?: () => void;
    autoDismiss?: boolean;
    dismissDuration?: number;
    title?: string;
}

export function AlertMessage({
    message,
    type,
    onDismiss,
    autoDismiss = true,
    dismissDuration = 3000,
    title,
}: AlertMessageProps) {
    const [isVisible, setIsVisible] = useState(!!message);
    const [progress, setProgress] = useState(100);

    // Efeito para auto-demissão após um tempo determinado
    useEffect(() => {
        if (!message) {
            setIsVisible(false);
            return;
        }

        setIsVisible(true);
        setProgress(100);

        if (autoDismiss) {
            // Adiciona 2 segundos extras (2000ms) para alertas do tipo info
            const finalDuration = type === "info" ? dismissDuration + 2000 : dismissDuration;
            const startTime = Date.now();
            const endTime = startTime + finalDuration;

            const timer = setTimeout(() => {
                setIsVisible(false);
                if (onDismiss) onDismiss();
            }, finalDuration);

            // Atualiza a barra de progresso a cada 50ms
            const progressInterval = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, endTime - now);
                const progressValue = (remaining / finalDuration) * 100;
                setProgress(progressValue);

                if (remaining <= 0) {
                    clearInterval(progressInterval);
                }
            }, 50);

            return () => {
                clearTimeout(timer);
                clearInterval(progressInterval);
            };
        }
    }, [message, autoDismiss, onDismiss, dismissDuration, type]);

    // Se não há mensagem ou o alerta não é mais visível, não renderize nada
    if (!message) {
        return null;
    }

    const styleConfig = {
        success: {
            background: "bg-gradient-to-r from-green-50 to-emerald-50",
            border: "border-emerald-300",
            icon: <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" />,
            progressBar: "bg-emerald-500",
            titleColor: "text-emerald-700",
            iconBackground: "bg-emerald-100",
            hover: "hover:shadow-emerald-100",
        },
        error: {
            background: "bg-gradient-to-r from-red-50 to-rose-50",
            border: "border-rose-300",
            icon: <AlertCircle className="h-6 w-6 text-rose-500 flex-shrink-0" />,
            progressBar: "bg-rose-500",
            titleColor: "text-rose-700",
            iconBackground: "bg-rose-100",
            hover: "hover:shadow-rose-100",
        },
        warning: {
            background: "bg-gradient-to-r from-amber-50 to-yellow-50",
            border: "border-amber-300",
            icon: <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0" />,
            progressBar: "bg-amber-500",
            titleColor: "text-amber-700",
            iconBackground: "bg-amber-100",
            hover: "hover:shadow-amber-100",
        },
        info: {
            background: "bg-gradient-to-r from-blue-50 to-sky-50",
            border: "border-sky-300",
            icon: <Info className="h-6 w-6 text-sky-500 flex-shrink-0" />,
            progressBar: "bg-sky-500",
            titleColor: "text-sky-700",
            iconBackground: "bg-sky-100",
            hover: "hover:shadow-sky-100",
        },
    };

    const currentStyle = styleConfig[type];
    const defaultTitle = {
        success: "Operação realizada com sucesso",
        error: "Erro na operação",
        warning: "Atenção",
        info: "Informação",
    };

    const handleClose = () => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={`fixed top-4 z-50 w-[90%] md:w-auto md:max-w-md left-1/2 transform -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4`}
                >
                    <div
                        className={`${currentStyle.background} ${currentStyle.border} border shadow-lg rounded-lg overflow-hidden ${currentStyle.hover} transition-shadow duration-200`}
                    >
                        <div className="flex items-start p-4 gap-3 relative">
                            <div className={`p-2 rounded-full ${currentStyle.iconBackground} flex-shrink-0`}>
                                {currentStyle.icon}
                            </div>

                            <div className="flex-grow">
                                <h4 className={`font-semibold text-sm ${currentStyle.titleColor}`}>
                                    {title || defaultTitle[type]}
                                </h4>
                                <p className="text-gray-700 text-sm mt-0.5">
                                    {message}
                                </p>
                            </div>

                            <button
                                onClick={handleClose}
                                className="flex-shrink-0 hover:bg-black/5 p-1.5 rounded-full transition-colors"
                                aria-label="Fechar alerta"
                            >
                                <XCircle className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                            </button>
                        </div>

                        {autoDismiss && (
                            <div className="h-1 w-full bg-gray-100">
                                <motion.div
                                    className={`h-full ${currentStyle.progressBar}`}
                                    initial={{ width: "100%" }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: "linear" }}
                                />
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}