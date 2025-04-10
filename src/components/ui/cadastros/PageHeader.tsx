import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface PageHeaderProps {
    title: string;
    buttonLabel?: string;
    buttonIcon?: React.ReactNode;
    onButtonClick?: () => void;
    showButton?: boolean;
    buttonDisabled?: boolean;
}

export function PageHeader({
    title,
    buttonLabel = "Novo Item",
    buttonIcon = <Plus className="mr-2 h-4 w-4" />,
    onButtonClick,
    showButton = true,
    buttonDisabled = false,
}: PageHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h1>
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
        </motion.div>
    );
}
