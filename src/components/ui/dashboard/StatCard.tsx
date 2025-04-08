"use client";

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    color: string;
}

export function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold mt-1">{value}</h3>
                </div>
                <div className={`p-3 rounded-full bg-opacity-20`} style={{ backgroundColor: `${color}20` }}>
                    <Icon className="h-6 w-6" style={{ color }} />
                </div>
            </div>
        </div>
    );
}
