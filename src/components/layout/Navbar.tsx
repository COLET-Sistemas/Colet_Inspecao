"use client";

import { useAuth } from "@/hooks/useAuth";
import { ChevronDown, ClipboardCheck, ClipboardList, Drill, FileSearch, FileText, LayoutDashboard, LogOut, Menu, Ruler, Settings, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
    label: string;
    href: string;
    icon?: React.ReactNode;
    submenu?: { label: string; href: string; icon?: React.ReactNode }[];
}

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const { user, logout } = useAuth();
    const router = useRouter();

    // Track scroll position to add shadow effect when scrolling
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navItems: NavItem[] = [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4 mr-2" /> },
        { label: "Inspeções", href: "/inspecoes", icon: <ClipboardCheck className="w-4 h-4 mr-2" /> },
        { label: "Consultas", href: "/consultas", icon: <FileSearch className="w-4 h-4 mr-2" /> },
        { label: "Relatórios", href: "/relatorios", icon: <FileText className="w-4 h-4 mr-2" /> },
        {
            label: "Cadastros",
            href: "#",
            icon: <Settings className="w-4 h-4 mr-2" />,
            submenu: [
                { label: "Tipo de Inspeção", href: "/cadastros/tipo-inspecao", icon: <ClipboardList className="w-4 h-4 mr-2" /> },
                { label: "Instrumentos de Medição", href: "/cadastros/instrumentos", icon: <Ruler className="w-4 h-4 mr-2" /> },
                { label: "Máquinas", href: "/cadastros/maquinas", icon: <Drill className="w-4 h-4 mr-2" /> }
            ]
        }
    ];

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const toggleSubmenu = (label: string) => {
        setOpenSubmenu(openSubmenu === label ? null : label);
    };

    return (
        <nav className={`bg-[#3A3A3A] fixed w-full z-20 transition-all duration-300 ${scrolled ? 'shadow-lg shadow-black/20' : ''}`}>
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-10">
                <div className="flex justify-between items-center h-16">
                    {/* Logo section */}
                    <div className="flex-shrink-0 flex items-center pr-4">
                        <Link href="/dashboard" className="hover:opacity-90 transition-opacity flex items-center">
                            <Image
                                src="/images/logoColet.png"
                                alt="Colet Logo"
                                width={160}
                                height={50}
                                className="h-10 w-auto brightness-[1.15] contrast-[1.1]"
                                priority
                            />
                            <span className="text-white font-medium ml-2">Colet Sistemas</span>
                        </Link>
                    </div>

                    {/* Desktop navigation */}
                    <div className="hidden md:flex md:items-center md:justify-center flex-1">
                        <div className="flex space-x-1 items-center justify-center">
                            {navItems.map((item) => (
                                <div key={item.label} className="relative group">
                                    {item.submenu ? (
                                        <button
                                            onClick={() => toggleSubmenu(item.label)}
                                            className="flex items-center px-4 py-2 text-sm font-medium text-gray-200 hover:text-white hover:bg-[#4a4a4a] rounded-md transition-all duration-200 ease-in-out"
                                            aria-expanded={openSubmenu === item.label}
                                        >
                                            {item.icon}
                                            {item.label}
                                            <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${openSubmenu === item.label ? 'transform rotate-180' : ''}`} />
                                        </button>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            className="flex items-center px-4 py-2 text-sm font-medium text-gray-200 hover:text-white hover:bg-[#4a4a4a] rounded-md transition-colors duration-200 ease-in-out"
                                        >
                                            {item.icon}
                                            {item.label}
                                        </Link>
                                    )}

                                    {item.submenu && openSubmenu === item.label && (
                                        <div className="absolute z-30 left-0 mt-1 w-52 rounded-md shadow-lg bg-[#444] ring-1 ring-black ring-opacity-5 py-1 animate-fadeIn">
                                            {item.submenu.map((subItem) => (
                                                <Link
                                                    key={subItem.label}
                                                    href={subItem.href}
                                                    className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-[#555] hover:text-white transition-colors duration-200"
                                                    onClick={() => setOpenSubmenu(null)}
                                                >
                                                    {subItem.icon}
                                                    {subItem.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* User profile section - Desktop */}
                    <div className="hidden md:flex md:items-center md:justify-end pl-4">
                        <div className="relative">
                            <div>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-3 text-gray-200 hover:text-white focus:outline-none group"
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#09A08D] to-[#0a8a7a] flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all duration-200">
                                        {user?.username?.charAt(0).toUpperCase() || <User size={18} />}
                                    </div>
                                    <div className="text-sm font-medium hidden lg:block group-hover:text-white transition-colors duration-200">
                                        {user?.username || "Usuário"}
                                    </div>
                                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${userMenuOpen ? 'transform rotate-180' : ''}`} />
                                </button>
                            </div>

                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-[#444] ring-1 ring-black ring-opacity-5 z-30 animate-fadeIn">
                                    <div className="px-4 py-3 text-xs text-gray-300 border-b border-gray-600 bg-[#3f3f3f] rounded-t-md">
                                        <p className="text-xs text-gray-300">Logado como</p>
                                        <p className="font-semibold text-gray-100">{user?.username}</p>
                                    </div>
                                    <a
                                        href="#"
                                        className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-[#555] hover:text-white transition-colors duration-200"
                                    >
                                        <User className="mr-2 h-4 w-4" />
                                        Perfil
                                    </a>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-[#555] hover:text-white transition-colors duration-200"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sair
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-[#4a4a4a] focus:outline-none transition-colors duration-200"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Abrir menu principal</span>
                            {mobileMenuOpen ? (
                                <X className="block h-6 w-6" />
                            ) : (
                                <Menu className="block h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute w-full bg-[#333] shadow-lg z-20 animate-slideDown border-t border-[#444]">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => (
                            <div key={item.label} className="relative">
                                {item.submenu ? (
                                    <>
                                        <button
                                            onClick={() => toggleSubmenu(item.label)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-base font-medium text-gray-200 hover:text-white hover:bg-[#4a4a4a] rounded-md transition-colors duration-200"
                                        >
                                            <span className="flex items-center">
                                                {item.icon}
                                                {item.label}
                                            </span>
                                            <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${openSubmenu === item.label ? 'rotate-180' : ''}`} />
                                        </button>

                                        {openSubmenu === item.label && (
                                            <div className="pl-4 space-y-1 mt-1 border-l-2 border-gray-600 ml-3 animate-fadeIn">
                                                {item.submenu.map((subItem) => (
                                                    <Link
                                                        key={subItem.label}
                                                        href={subItem.href}
                                                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#4a4a4a] rounded-md transition-colors duration-200"
                                                        onClick={() => setMobileMenuOpen(false)}
                                                    >
                                                        {subItem.icon}
                                                        {subItem.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className="flex items-center px-3 py-2 text-base font-medium text-gray-200 hover:text-white hover:bg-[#4a4a4a] rounded-md transition-colors duration-200"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Mobile user menu */}
                    <div className="pt-4 pb-3 border-t border-gray-600 bg-[#2d2d2d]">
                        <div className="flex items-center px-4">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#09A08D] to-[#0a8a7a] flex items-center justify-center text-white shadow-sm">
                                    {user?.username?.charAt(0).toUpperCase() || <User size={20} />}
                                </div>
                            </div>
                            <div className="ml-3">
                                <div className="text-base font-medium text-gray-100">
                                    {user?.username || "Usuário"}
                                </div>
                                <div className="text-sm font-medium text-gray-400">
                                    {user?.email || ""}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1 px-2">
                            <a
                                href="#"
                                className="flex items-center px-3 py-2 text-base font-medium text-gray-200 hover:text-white hover:bg-[#4a4a4a] rounded-md transition-colors duration-200"
                            >
                                <User className="mr-3 h-5 w-5" />
                                Perfil
                            </a>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center px-3 py-2 text-base font-medium text-gray-200 hover:text-white hover:bg-[#4a4a4a] rounded-md transition-colors duration-200"
                            >
                                <LogOut className="mr-3 h-5 w-5" />
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Backdrop for clicking outside to close menus - Reduced blur and opacity */}
            {(userMenuOpen || openSubmenu) && (
                <div
                    className="fixed inset-0 z-10 bg-black/10 backdrop-blur-[2px]"
                    onClick={() => {
                        setUserMenuOpen(false);
                        setOpenSubmenu(null);
                    }}
                ></div>
            )}
        </nav>
    );
}
