"use client";

import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface AlertMessageProps {
    message: string | null;
    type: "success" | "error" | "warning";
    onDismiss?: () => void;
    autoDismiss?: boolean;
    dismissDuration?: number;
}

export function AlertMessage({
    message,
    type,
    onDismiss,
    autoDismiss = true,
    dismissDuration = 5000,
}: AlertMessageProps) {
    const [isVisible, setIsVisible] = useState(!!message);

    // Efeito para auto-demissão após um tempo determinado
    useEffect(() => {
        if (!message) {
            setIsVisible(false);
            return;
        }

        setIsVisible(true);

        if (autoDismiss) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                if (onDismiss) onDismiss();
            }, dismissDuration);

            return () => clearTimeout(timer);
        }
    }, [message, autoDismiss, onDismiss, dismissDuration]);

    // Se não há mensagem ou o alerta não é mais visível, não renderize nada
    if (!message || !isVisible) {
        return null;
    }

    const colorClasses = {
        success: "border-green-200 bg-green-50 text-green-700",
        error: "border-red-200 bg-red-50 text-red-700",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-700",
    };

    const iconComponent = {
        success: <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />,
        error: <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />,
        warning: <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />,
    };

    const handleClose = () => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className={`fixed top-4 z-50 w-[90%] md:w-auto md:max-w-md shadow-md rounded-lg overflow-hidden
                       left-1/2 transform -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4`}
        >
            <div className={`p-3 md:p-4 border ${colorClasses[type]} flex items-start gap-2 md:gap-3 rounded-lg`}>
                <div className="flex-shrink-0">
                    {iconComponent[type]}
                </div>

                <div className="flex-grow text-xs sm:text-sm">
                    {message}
                </div>

                <button
                    onClick={handleClose}
                    className="ml-1 md:ml-3 flex-shrink-0 hover:bg-gray-100 p-1 rounded-full transition-colors"
                >
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                </button>
            </div>
        </motion.div>
    );
}