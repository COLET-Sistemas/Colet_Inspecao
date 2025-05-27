"use client";

import { useAuth } from '@/hooks/useAuth';
import {
    Activity,
    Award,
    BarChart3,
    Calendar,
    CheckCircle,
    ChevronRight,
    Clock,
    FileText,
    Settings,
    Shield,
    Target,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth(); 
    const stats = [
        {
            title: 'Inspeções Realizadas',
            value: '128',
            change: '+12%',
            trend: 'up',
            icon: CheckCircle,
            color: '#6B7280',
            bgColor: '#F8FAFC',
            description: 'Este mês'
        },
        {
            title: 'Inspeções Pendentes',
            value: '42',
            change: '-8%',
            trend: 'down',
            icon: Clock,
            color: '#6B7280',
            bgColor: '#F8FAFC',
            description: 'Aguardando'
        },
        {
            title: 'Taxa de Conformidade',
            value: '96.8%',
            change: '+2.1%',
            trend: 'up',
            icon: Shield,
            color: '#6B7280',
            bgColor: '#F8FAFC',
            description: 'Qualidade'
        },
        {
            title: 'Equipes Ativas',
            value: '24',
            change: '+3',
            trend: 'up',
            icon: Users,
            color: '#6B7280',
            bgColor: '#F8FAFC',
            description: 'Em campo'
        },
    ]; const quickActions = [
        {
            title: 'Nova Inspeção',
            description: 'Iniciar processo de inspeção',
            icon: CheckCircle,
            color: '#1F2937',
            bgColor: '#F3F4F6',
            onClick: () => console.log('Nova inspeção')
        },
        {
            title: 'Relatórios',
            description: 'Gerar relatórios detalhados',
            icon: FileText,
            color: '#1F2937',
            bgColor: '#F3F4F6',
            onClick: () => console.log('Gerar relatório')
        },
        {
            title: 'Analytics',
            description: 'Análises e métricas',
            icon: BarChart3,
            color: '#1F2937',
            bgColor: '#F3F4F6',
            onClick: () => console.log('Ver análises')
        },
        {
            title: 'Agendamento',
            description: 'Programar inspeções',
            icon: Calendar,
            color: '#1F2937',
            bgColor: '#F3F4F6',
            onClick: () => console.log('Agendar')
        },
        {
            title: 'Configurações',
            description: 'Gerenciar sistema',
            icon: Settings,
            color: '#1F2937',
            bgColor: '#F3F4F6',
            onClick: () => console.log('Configurações')
        },
        {
            title: 'Certificações',
            description: 'Gerenciar certificados',
            icon: Award,
            color: '#1F2937',
            bgColor: '#F3F4F6',
            onClick: () => console.log('Certificações')
        },
    ];

    const recentActivities = [{
        id: 1,
        action: 'Inspeção #INS-2025-128 concluída com êxito',
        time: '2 min atrás',
        type: 'success',
        user: user?.name || user?.username || "Usuário",
        location: 'Unidade São Paulo'
    },
    {
        id: 2,
        action: 'Relatório de conformidade #REL-087 gerado',
        time: '15 min atrás',
        type: 'info',
        user: 'Maria Santos',
        location: 'Sede Central'
    },
    {
        id: 3,
        action: 'Inspeção #INS-2025-127 em andamento',
        time: '1h atrás',
        type: 'warning',
        user: 'Carlos Oliveira',
        location: 'Unidade Rio de Janeiro'
    },
    {
        id: 4,
        action: 'Nova equipe de inspeção cadastrada',
        time: '2h atrás',
        type: 'info',
        user: 'Admin Sistema',
        location: 'Sistema'
    },
    {
        id: 5,
        action: 'Alerta: Equipamento requer calibração',
        time: '3h atrás',
        type: 'alert',
        user: 'Sistema Automático',
        location: 'Laboratório Central'
    },
    ]; const performanceMetrics = [
        { label: 'Conformidade Geral', value: 96.8, target: 95, color: '#1F2937', icon: Shield },
        { label: 'Eficiência Operacional', value: 89.5, target: 85, color: '#1F2937', icon: Target },
        { label: 'Satisfação Cliente', value: 94.2, target: 90, color: '#1F2937', icon: Award },
    ];

    const upcomingInspections = [
        { id: 1, title: 'Inspeção Estrutural - Torre A', date: '27/05/2025', time: '09:00', priority: 'high' },
        { id: 2, title: 'Auditoria de Segurança - Planta 2', date: '28/05/2025', time: '14:30', priority: 'medium' },
        { id: 3, title: 'Verificação de Equipamentos', date: '29/05/2025', time: '10:15', priority: 'low' },
    ];    // Get current time for greeting
    const currentHour = new Date().getHours();
    let greeting = "Bom dia";
    if (currentHour >= 12 && currentHour < 18) greeting = "Boa tarde";
    else if (currentHour >= 18) greeting = "Boa noite";

    const userName = user?.name || user?.username || "Usuário"; return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-6 space-y-8">{/* Header Section */}
                <header className="mb-8">
                    <div className="flex items-center justify-between">                        <div>
                        <h1 className="text-4xl font-bold text-gray-900">
                            Dashboard Colet
                        </h1>
                        <p className="text-gray-600 mt-2 text-lg">
                            {greeting}, {userName}! Aqui está o resumo das suas inspeções.
                        </p>
                    </div>                        <div className="hidden md:flex items-center space-x-4">
                            <div className="bg-white rounded-lg px-6 py-3 shadow-sm border border-gray-200">
                                <div className="text-center">
                                    <p className="font-medium text-gray-700 text-sm">
                                        Última atualização: {new Date().toLocaleString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>                {/* Statistics Cards */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Visão Geral</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <div key={index} className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="p-3 rounded-lg"
                                        style={{ backgroundColor: stat.bgColor }}
                                    >
                                        <stat.icon
                                            className="h-6 w-6"
                                            style={{ color: stat.color }}
                                        />
                                    </div>
                                    <div className={`flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${stat.trend === 'up'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                        }`}>
                                        <TrendingUp className={`h-3 w-3 mr-1 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                                    <p className="text-sm font-medium text-gray-700">{stat.title}</p>
                                    <p className="text-xs text-gray-500">{stat.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">                    {/* Quick Actions */}
                    <section className="xl:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                <Zap className="h-6 w-6 mr-3 text-gray-700" />
                                Ações Rápidas
                            </h2>
                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                                Ver todas <ChevronRight className="h-4 w-4 ml-1" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {quickActions.map((action, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-lg shadow border border-gray-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300"
                                    onClick={action.onClick}
                                >
                                    <div className="space-y-4">
                                        <div
                                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: action.bgColor }}
                                        >
                                            <action.icon
                                                className="h-6 w-6"
                                                style={{ color: action.color }}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                                            <p className="text-sm text-gray-600">{action.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>                    {/* Upcoming Inspections */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                            <Calendar className="h-6 w-6 mr-3 text-gray-700" />
                            Próximas Inspeções
                        </h2>
                        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 space-y-4">
                            {upcomingInspections.map((inspection) => (
                                <div key={inspection.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 mb-1">{inspection.title}</h4>
                                        <p className="text-sm text-gray-600">{inspection.date} às {inspection.time}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${inspection.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                        inspection.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            'bg-green-50 text-green-700 border-green-200'
                                        }`}>
                                        {inspection.priority === 'high' ? 'Alta' :
                                            inspection.priority === 'medium' ? 'Média' : 'Baixa'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">                    {/* Recent Activities */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                            <Activity className="h-6 w-6 mr-3 text-gray-700" />
                            Atividades Recentes
                        </h2>
                        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                            <div className="space-y-4">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className={`w-3 h-3 rounded-full mt-2 ${activity.type === 'success' ? 'bg-green-500' :
                                            activity.type === 'warning' ? 'bg-yellow-500' :
                                                activity.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'
                                            }`}></div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <span>{activity.user}</span>
                                                <span>•</span>
                                                <span>{activity.location}</span>
                                                <span>•</span>
                                                <span>{activity.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>                    {/* Performance Metrics */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                            <Target className="h-6 w-6 mr-3 text-gray-700" />
                            Indicadores de Performance
                        </h2>
                        <div className="space-y-4">
                            {performanceMetrics.map((metric, index) => (
                                <div key={index} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className="p-2 rounded-lg bg-gray-100"
                                            >
                                                <metric.icon
                                                    className="h-5 w-5 text-gray-700"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{metric.label}</h3>
                                                <p className="text-xs text-gray-500">Meta: {metric.target}%</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {metric.value}%
                                            </span>
                                            <p className={`text-xs font-medium ${metric.value >= metric.target ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {metric.value >= metric.target ? 'Acima da meta' : 'Abaixo da meta'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full transition-all duration-1000 relative bg-gray-700"
                                            style={{
                                                width: `${metric.value}%`
                                            }}
                                        >
                                            <div
                                                className="absolute top-0 w-0.5 h-2 bg-gray-400"
                                                style={{ left: `${(metric.target / 100) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
