'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Settings, X } from 'lucide-react';
import { useState } from 'react';

interface FloatingActionButtonProps {
    onClick: () => void;
    disabled?: boolean;
    tooltip?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    size?: 'sm' | 'md' | 'lg';
    color?: 'blue' | 'green' | 'red' | 'purple' | 'indigo';
    icon?: 'plus' | 'settings' | 'close';
    expandable?: boolean;
    actions?: Array<{
        icon: React.ReactNode;
        label: string;
        onClick: () => void;
        color?: string;
    }>;
}

export function FloatingActionButton({
    onClick,
    disabled = false,
    tooltip = 'Adicionar',
    position = 'bottom-right',
    size = 'md',
    color = 'blue',
    icon = 'plus',
    expandable = false,
    actions = []
}: FloatingActionButtonProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-14 h-14',
        lg: 'w-16 h-16'
    };

    const iconSizes = {
        sm: 'w-5 h-5',
        md: 'w-6 h-6',
        lg: 'w-7 h-7'
    }; const colorClasses = {
        blue: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 focus:ring-blue-500',
        green: 'bg-[#1ABC9C] hover:bg-[#16A085] text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 focus:ring-emerald-500',
        red: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 focus:ring-red-500',
        purple: 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 focus:ring-purple-500',
        indigo: 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 focus:ring-indigo-500'
    };

    const positionClasses = {
        'bottom-right': 'bottom-6 right-6',
        'bottom-left': 'bottom-6 left-6',
        'top-right': 'top-6 right-6',
        'top-left': 'top-6 left-6'
    };

    const getIcon = () => {
        switch (icon) {
            case 'plus':
                return <Plus className={iconSizes[size]} />;
            case 'settings':
                return <Settings className={iconSizes[size]} />;
            case 'close':
                return <X className={iconSizes[size]} />;
            default:
                return <Plus className={iconSizes[size]} />;
        }
    };

    const handleMainClick = () => {
        if (expandable && actions.length > 0) {
            setIsExpanded(!isExpanded);
        } else {
            onClick();
        }
    };

    return (
        <div className={`fixed ${positionClasses[position]} z-50`}>            {/* Expandable Actions */}
            {expandable && actions.length > 0 && (
                <AnimatePresence mode="wait">
                    {isExpanded && (<motion.div
                        initial={{ opacity: 0, scale: 0.3, y: position.includes('bottom') ? 15 : -15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.3, y: position.includes('bottom') ? 15 : -15 }}
                        transition={{
                            type: "spring",
                            stiffness: 800,
                            damping: 35,
                            duration: 0.12
                        }}
                        className={`absolute ${position.includes('bottom') ? 'bottom-16' : 'top-16'} ${position.includes('right') ? 'right-0' : 'left-0'} flex flex-col gap-2`}
                    >
                        {actions.map((action, index) => (
                            <motion.button
                                key={index}
                                initial={{
                                    opacity: 0,
                                    scale: 0.3,
                                    y: position.includes('bottom') ? 15 : -15
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.3,
                                    y: position.includes('bottom') ? 15 : -15
                                }} transition={{
                                    type: "spring",
                                    stiffness: 800,
                                    damping: 35,
                                    delay: index * 0.02,
                                    duration: 0.1
                                }}
                                onClick={action.onClick} className={`w-12 h-12 rounded-full ${action.color || 'bg-gray-600 hover:bg-gray-700'} text-white shadow-lg shadow-black/10 flex items-center justify-center transition-all duration-100 hover:shadow-xl backdrop-blur-sm`}
                                whileHover={{
                                    scale: 1.1,
                                    transition: { duration: 0.08 }
                                }}
                                whileTap={{
                                    scale: 0.95,
                                    transition: { duration: 0.03 }
                                }}
                            >
                                {action.icon}
                            </motion.button>
                        ))}
                    </motion.div>
                    )}
                </AnimatePresence>
            )}            {/* Main FAB */}
            <div className="relative">                <motion.button
                onClick={handleMainClick}
                disabled={disabled} className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full flex items-center justify-center transition-all duration-150 transform focus:outline-none focus:ring-4 focus:ring-opacity-50 backdrop-blur-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-2xl active:shadow-lg'}`}
                whileHover={{
                    scale: disabled ? 1 : 1.05,
                    transition: { duration: 0.1, type: "spring", stiffness: 600 }
                }}
                whileTap={{
                    scale: disabled ? 1 : 0.95,
                    transition: { duration: 0.06 }
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)} initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 800,
                    damping: 35,
                    duration: 0.2
                }}
            >                <motion.div
                animate={{ rotate: expandable && isExpanded ? 45 : 0 }}
                transition={{
                    duration: 0.15,
                    type: "spring",
                    stiffness: 600,
                    damping: 30
                }}
            >
                    {getIcon()}
                </motion.div>
            </motion.button>                {/* Tooltip */}
                <AnimatePresence mode="wait">
                    {showTooltip && !isExpanded && (<motion.div
                        initial={{ opacity: 0, scale: 0.8, x: position.includes('right') ? 10 : -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: position.includes('right') ? 10 : -10 }}
                        transition={{
                            type: "spring",
                            stiffness: 700,
                            damping: 35,
                            duration: 0.1
                        }}
                        className={`absolute ${position.includes('right') ? 'right-full mr-3' : 'left-full ml-3'} ${position.includes('bottom') ? 'bottom-0' : 'top-0'} mb-1 px-3 py-2 text-sm font-medium text-white bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-xl whitespace-nowrap border border-gray-700/50`}
                    >
                        {tooltip}
                        <div className={`absolute ${position.includes('right') ? 'right-0 translate-x-1' : 'left-0 -translate-x-1'} ${position.includes('bottom') ? 'bottom-3' : 'top-3'} w-2 h-2 bg-gray-900 bg-opacity-90 transform rotate-45 border-r border-b border-gray-700/50`}></div>
                    </motion.div>
                    )}
                </AnimatePresence>
            </div>            {/* Backdrop for expandable */}
            {expandable && isExpanded && (<motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-[1px] -z-10"
                onClick={() => setIsExpanded(false)}
            />
            )}
        </div>
    );
}

// Versão especializada para especificações
export function SpecificationFAB({
    onCreateSpec,
    disabled = false,
    hasOperations = false
}: {
    onCreateSpec: () => void;
    disabled?: boolean;
    hasOperations?: boolean;
}) {
    if (!hasOperations) {
        return null;
    }

    return (
        <FloatingActionButton
            onClick={onCreateSpec}
            disabled={disabled}
            tooltip="Nova Especificação"
            color="green"
            icon="plus"
        />
    );
}
