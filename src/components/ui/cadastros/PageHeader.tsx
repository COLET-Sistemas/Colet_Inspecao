import { motion } from "framer-motion";
import { Plus, RefreshCw } from "lucide-react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    infoSubtitle?: string;
    buttonLabel?: string;
    buttonIcon?: React.ReactNode;
    onButtonClick?: () => void;
    showButton?: boolean;
    buttonDisabled?: boolean;
    showRefreshButton?: boolean;
    onRefreshClick?: () => void;
    lastRefresh?: Date;
    isRefreshing?: boolean;
}

export function PageHeader({
    title,
    subtitle,
    infoSubtitle,
    buttonLabel = "Novo Item",
    buttonIcon = <Plus className="mr-2 h-4 w-4" />,
    onButtonClick,
    showButton = true,
    buttonDisabled = false,
    showRefreshButton = false,
    onRefreshClick,
    lastRefresh,
    isRefreshing = false,
}: PageHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h1>
                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
                {infoSubtitle && <p className="text-sm text-gray-500 mt-1">{infoSubtitle}</p>}
            </div>
            <div className="flex gap-3 items-center">
                {showRefreshButton && (
                    <>
                        {lastRefresh && (
                            <div className="hidden sm:flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <span className="mr-1.5">Última atualização:</span>
                                <span className="font-medium text-gray-700">{lastRefresh.toLocaleTimeString('pt-BR')}</span>
                            </div>
                        )}
                        <motion.button
                            whileHover={{ scale: isRefreshing ? 1 : 1.02 }}
                            whileTap={{ scale: isRefreshing ? 1 : 0.98 }}
                            disabled={isRefreshing}
                            className={`
                                hidden sm:flex relative items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm
                                ${isRefreshing
                                    ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                                    : "border-gray-200 bg-white text-gray-700 hover:border-[#1ABC9C] hover:bg-[#1ABC9C] hover:text-white hover:shadow-md"
                                }
                            `}
                            onClick={onRefreshClick}
                            title="Atualizar dados"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                            />
                            <span>
                                {isRefreshing ? "Atualizando..." : "Atualizar"}
                            </span>
                        </motion.button>
                    </>
                )}
                {showButton && (
                    <motion.button
                        whileHover={{ scale: buttonDisabled ? 1 : 1.02 }}
                        whileTap={{ scale: buttonDisabled ? 1 : 0.98 }}
                        className={`flex items-center ${buttonDisabled
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-[#1ABC9C] hover:bg-[#16A085] text-white cursor-pointer"
                            } px-3 sm:px-4 py-1.5 sm:py-2 rounded-md shadow-sm transition-colors duration-200 w-full sm:w-auto justify-center focus:outline-none ${buttonDisabled ? "" : "focus:ring-2 focus:ring-[#1ABC9C]/70 focus:ring-offset-2"
                            }`}
                        onClick={buttonDisabled ? undefined : onButtonClick}
                        disabled={buttonDisabled}
                    >
                        {buttonIcon}
                        <span>{buttonLabel}</span>
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}
