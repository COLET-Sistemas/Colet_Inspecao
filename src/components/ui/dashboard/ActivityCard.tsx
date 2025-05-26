"use client";

import { ClipboardList, LucideIcon } from 'lucide-react';

interface ActivityCardProps {
    title: string;
    time: string;
    icon?: LucideIcon;
}

export function ActivityCard({
    title,
    time,
    icon: Icon = ClipboardList
}: Omit<ActivityCardProps, 'id'>) {
    return (
        <div className="flex items-center p-3 bg-white border rounded-lg">
            <div className="p-2 rounded-full bg-blue-50 mr-3">
                <Icon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-gray-500">{time}</p>
            </div>
        </div>
    );
}
