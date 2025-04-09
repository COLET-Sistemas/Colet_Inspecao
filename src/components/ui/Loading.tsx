"use client";

import { motion } from "framer-motion";
import React from "react";

interface LoadingSpinnerProps {
    /**
     * The size of the spinner (small, medium, large)
     * @default "medium"
     */
    size?: "small" | "medium" | "large";

    /**
     * Custom text to display below the spinner
     * @default "Carregando..."
     */
    text?: string;

    /**
     * The color theme of the spinner
     * @default "primary"
     */
    color?: "primary" | "secondary" | "white" | "gray";

    /**
     * Whether to show the loading text
     * @default true
     */
    showText?: boolean;

    /**
     * Additional CSS classes
     */
    className?: string;

    /**
     * Whether to take up the full screen
     * @default false
     */
    fullScreen?: boolean;
}

export const LoadingSpinner = React.memo(({
    size = "medium",
    text = "Carregando...",
    color = "primary",
    showText = true,
    className = "",
    fullScreen = false
}: LoadingSpinnerProps) => {
    // Size mappings for the spinner
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

    // Container styling based on fullScreen prop
    const containerClasses = fullScreen
        ? "fixed inset-0 flex items-center justify-center bg-[#F3F4F6] z-50"
        : "flex items-center justify-center py-8";

    return (
        <div className={`${containerClasses} ${className}`}>
            <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className={`relative ${sizeMap[size]}`}>
                    {/* Outer spinning ring */}
                    <motion.div
                        className={`absolute inset-0 border-4 border-transparent ${colorMap[color].outer} rounded-full`}
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1,
                            ease: "linear",
                            repeat: Infinity,
                            repeatType: "loop"
                        }}
                    />

                    {/* Inner spinning ring (opposite direction) */}
                    <motion.div
                        className={`absolute inset-2 border-4 border-transparent ${colorMap[color].inner} rounded-full`}
                        animate={{ rotate: -360 }}
                        transition={{
                            duration: 1.5,
                            ease: "linear",
                            repeat: Infinity,
                            repeatType: "loop"
                        }}
                    />

                    {/* Center dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-2 h-2 ${colorMap[color].dot} rounded-full`} />
                    </div>
                </div>

                {showText && (
                    <motion.p
                        className={`mt-4 font-medium text-lg ${colorMap[color].text}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        {text}
                    </motion.p>
                )}
            </motion.div>
        </div>
    );
});

LoadingSpinner.displayName = "LoadingSpinner";
