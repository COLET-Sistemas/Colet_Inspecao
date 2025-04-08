"use client";

import { LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
    title: string;
    icon: LucideIcon;
    color: string;
    onClick?: () => void;
}

export function QuickActionCard({
    title,
    icon: Icon,
    color,
    onClick
}: QuickActionCardProps) {
    return (
        <div
            className="bg-white rounded-lg shadow-sm p-6 cursor-pointer transition-all hover:shadow-md hover:translate-y-[-2px]"
            onClick={onClick}
        >
            <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-4 rounded-full bg-opacity-20`} style={{ backgroundColor: `${color}20` }}>
                    <Icon className="h-6 w-6" style={{ color }} />
                </div>
                <h3 className="font-medium">{title}</h3>
            </div>
        </div>
    );
}
