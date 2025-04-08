import { cn } from "@/lib/utils";
import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Card({ className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-lg border bg-white shadow-sm p-0",
                className
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: CardProps) {
    return (
        <div
            className={cn("p-6 flex flex-col space-y-1.5", className)}
            {...props}
        />
    );
}

export function CardContent({ className, ...props }: CardProps) {
    return (
        <div className={cn("p-6 pt-0", className)} {...props} />
    );
}

export function CardFooter({ className, ...props }: CardProps) {
    return (
        <div
            className={cn("flex items-center p-6 pt-0", className)}
            {...props}
        />
    );
}
