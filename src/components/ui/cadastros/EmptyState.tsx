import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    primaryAction?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
        disabled?: boolean;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
        disabled?: boolean;
    };
}

export function EmptyState({
    icon,
    title,
    description,
    primaryAction,
    secondaryAction,
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center py-12 px-4 sm:px-6 lg:px-8"
        >
            <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    {icon}
                </div>

                <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3 text-lg font-medium text-gray-900"
                >
                    {title}
                </motion.h3>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-2 text-sm text-gray-500 max-w-sm mx-auto"
                >
                    {description}
                </motion.p>

                {(primaryAction || secondaryAction) && (
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        {secondaryAction && (
                            <motion.button
                                whileHover={{ scale: secondaryAction.disabled ? 1 : 1.03 }}
                                whileTap={{ scale: secondaryAction.disabled ? 1 : 0.97 }}
                                className={`px-4 py-2.5 text-sm font-medium rounded-lg ${secondaryAction.disabled
                                        ? "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
                                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 shadow-sm"
                                    } transition-all`}
                                onClick={secondaryAction.disabled ? undefined : secondaryAction.onClick}
                                disabled={secondaryAction.disabled}
                            >
                                {secondaryAction.icon && (
                                    <span className="mr-2">{secondaryAction.icon}</span>
                                )}
                                {secondaryAction.label}
                            </motion.button>
                        )}

                        {primaryAction && (
                            <motion.button
                                whileHover={{ scale: primaryAction.disabled ? 1 : 1.03 }}
                                whileTap={{ scale: primaryAction.disabled ? 1 : 0.97 }}
                                type="button"
                                className={`inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg text-white ${primaryAction.disabled
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-[#1ABC9C] hover:bg-[#16A085] shadow-md shadow-[#1ABC9C]/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1ABC9C]"
                                    } transition-all`}
                                onClick={primaryAction.disabled ? undefined : primaryAction.onClick}
                                disabled={primaryAction.disabled}
                            >
                                {primaryAction.icon || <Plus className="mr-2 h-4 w-4" />}
                                {primaryAction.label}
                            </motion.button>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
