import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";

interface TooltipProps {
    children: React.ReactNode;
    text: string;
}

export function Tooltip({ children, text }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showTooltip = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsVisible(true), 300);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded shadow-lg -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                        style={{ pointerEvents: "none" }}
                    >
                        {text}
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
