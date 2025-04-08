"use client";

import { Card, CardContent, CardHeader } from '@/components/ui/dashboard/card';
import { ActivityCard, QuickActionCard, StatCard } from '@/components/ui/dashboard';
import {
    BarChart,
    CheckCircle,
    ClipboardList,
    Clock
} from 'lucide-react';

export default function DashboardPage() {
    // Mock data for dashboard statistics
    const stats = [
        { title: 'Inspeções Realizadas', value: '128', icon: CheckCircle, color: 'bg-green-100 text-green-600' },
        { title: 'Inspeções Pendentes', value: '42', icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
        { title: 'Total de Relatórios', value: '187', icon: ClipboardList, color: 'bg-blue-100 text-blue-600' },
        { title: 'Métricas Coletadas', value: '1,243', icon: BarChart, color: 'bg-purple-100 text-purple-600' },
    ];

    const activities = [
        { id: 1, title: 'Inspeção #101 finalizada', time: 'Há 1 hora' },
        { id: 2, title: 'Inspeção #102 finalizada', time: 'Há 2 horas' },
        { id: 3, title: 'Inspeção #103 finalizada', time: 'Há 3 horas' },
    ];

    const quickActions = [
        { title: 'Nova Inspeção', icon: CheckCircle, color: 'bg-green-100 text-green-600', onClick: () => console.log('Nova inspeção') },
        { title: 'Gerar Relatório', icon: ClipboardList, color: 'bg-blue-100 text-blue-600', onClick: () => console.log('Gerar relatório') },
        { title: 'Ver Análises', icon: BarChart, color: 'bg-purple-100 text-purple-600', onClick: () => console.log('Ver análises') },
    ];

    // Get current time for greeting
    const currentHour = new Date().getHours();
    let greeting = "Bom dia";
    if (currentHour >= 12 && currentHour < 18) greeting = "Boa tarde";
    else if (currentHour >= 18) greeting = "Boa noite";

    return (
        <main className="p-6 bg-gray-50 min-h-screen">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-600 mt-1">{greeting}, bem-vindo ao sistema de inspeção Colet.</p>
            </header>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                    />
                ))}
            </div>

            {/* Recent Activity Section */}
            <section className="mt-8">
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-bold">Atividades Recentes</h2>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activities.map((activity) => (
                                <ActivityCard
                                    key={activity.id}
                                    id={activity.id}
                                    title={activity.title}
                                    time={activity.time}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Quick Actions */}
            <section className="mt-8 mb-6">
                <h2 className="text-xl font-bold mb-4">Ações Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => (
                        <QuickActionCard
                            key={index}
                            title={action.title}
                            icon={action.icon}
                            color={action.color}
                            onClick={action.onClick}
                        />
                    ))}
                </div>
            </section>
        </main>
    );
}
