"use client";


type LoadingSize = "small" | "medium" | "large";
type LoadingColor = "primary" | "secondary" | "white";

interface LoadingSpinnerProps {
    size?: LoadingSize;
    text?: string;
    color?: LoadingColor;
}

export const LoadingSpinner = ({
    size = "medium",
    text,
    color = "primary",
}: LoadingSpinnerProps) => {
    // Size classes
    const sizeClasses = {
        small: "w-4 h-4",
        medium: "w-8 h-8",
        large: "w-12 h-12",
    };

    // Color classes
    const colorClasses = {
        primary: "border-[#1ABC9C] border-b-transparent",
        secondary: "border-blue-500 border-b-transparent",
        white: "border-white border-b-transparent",
    };

    return (
        <div className="flex flex-col items-center justify-center">
            <div
                className={`${sizeClasses[size]} ${colorClasses[color]
                    } border-2 rounded-full animate-spin`}
                role="status"
                aria-label="Loading"
            />
            {text && (
                <div className="mt-3 text-sm font-medium text-gray-600">{text}</div>
            )}
        </div>
    );
};
