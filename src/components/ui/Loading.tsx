"use client";

import { motion } from "framer-motion";
import { forwardRef } from "react";

type LoadingSize = "small" | "medium" | "large";
type LoadingColor = "primary" | "secondary" | "white" | "gray";

interface LoadingSpinnerProps {
    size?: LoadingSize;
    text?: string;
    color?: LoadingColor;
    fullScreen?: boolean;
    showText?: boolean;
    className?: string;
}

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(({
    size = "medium",
    text = "Carregando...",
    color = "primary",
    fullScreen = false,
    showText = true,
    className = "",
}, ref) => {
    // Size mappings
    const sizeMap = {
        small: "h-8 w-8",
        medium: "h-12 w-12",
        large: "h-16 w-16"
    };

    // Color mappings for the spinner and text
    const colorMap = {
        primary: {
            outer: "border-t-[#09A08D]",
            inner: "border-t-[#3C787A]",
            dot: "bg-[#49BC99]",
            text: "text-[#09A08D]"
        },
        secondary: {
            outer: "border-t-indigo-600",
            inner: "border-t-indigo-400",
            dot: "bg-indigo-500",
            text: "text-indigo-600"
        },
        white: {
            outer: "border-t-white",
            inner: "border-t-gray-200",
            dot: "bg-white",
            text: "text-white"
        },
        gray: {
            outer: "border-t-gray-600",
            inner: "border-t-gray-400",
            dot: "bg-gray-500",
            text: "text-gray-600"
        }
    };

    const containerClasses = fullScreen
        ? "min-h-screen flex items-center justify-center bg-[#F3F4F6]"
        : "flex items-center justify-center py-8";

    return (
        <div className={`${containerClasses} ${className}`} ref={ref}>
            <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className={`relative ${sizeMap[size]}`}>
                    <motion.div
                        className={`absolute inset-0 border-4 border-transparent ${colorMap[color].outer} rounded-full`}
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                    />

                    <motion.div
                        className={`absolute inset-2 border-4 border-transparent ${colorMap[color].inner} rounded-full`}
                        animate={{ rotate: -360 }}
                        transition={{
                            duration: 1.5,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-2 h-2 ${colorMap[color].dot} rounded-full`} />
                    </div>
                </div>

                {showText && (
                    <motion.p
                        className={`mt-4 font-medium text-lg ${colorMap[color].text}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        {text}
                    </motion.p>
                )}
            </motion.div>
        </div>
    );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner as Loading };

