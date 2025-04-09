"use client";

import { useAuth } from "@/hooks/useAuth";
import {
    ChevronDown, ClipboardCheck, ClipboardList, Drill,
    FileSearch, FileText, LayoutDashboard, Loader2, LogOut,
    Menu, Ruler, Settings, User, X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Track scroll position to add shadow effect when scrolling
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navItems: NavItem[] = [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: "Inspeções", href: "/inspecoes", icon: <ClipboardCheck className="w-4 h-4" /> },
        { label: "Consultas", href: "/consultas", icon: <FileSearch className="w-4 h-4" /> },
        { label: "Relatórios", href: "/relatorios", icon: <FileText className="w-4 h-4" /> },
        {
            label: "Cadastros",
            href: "#",
            icon: <Settings className="w-4 h-4" />,
            submenu: [
                { label: "Tipo de Inspeção", href: "/cadastros/tipos_inspecoes", icon: <ClipboardList className="w-4 h-4" /> },
                { label: "Instrumentos de Medição", href: "/cadastros/instrumentos", icon: <Ruler className="w-4 h-4" /> },
                { label: "Máquinas", href: "/cadastros/maquinas", icon: <Drill className="w-4 h-4" /> }
            ]
        }
    ];

    const handleShowLogoutModal = (e?: React.MouseEvent) => {
        // If event exists, prevent default and stop propagation
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        console.log("Opening logout modal");
        setUserMenuOpen(false);
        setShowLogoutModal(true);
    };

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            console.log("Logging out");
            await logout();
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const toggleSubmenu = (label: string) => {
        setOpenSubmenu(openSubmenu === label ? null : label);
    };

    const isActive = (href: string) => {
        if (href === '#') return false;
        return pathname === href || pathname?.startsWith(href + '/');
    };

    // Check if any submenu item is active for parent menu highlighting
    const hasActiveSubmenu = (item: NavItem) => {
        if (!item.submenu) return false;
        return item.submenu.some(subItem => isActive(subItem.href));
    };

    const handleSubItemClick = () => {
        setTimeout(() => {
            setMobileMenuOpen(false);
            setOpenSubmenu(null);
        }, 100); 
    };

    return (
        <nav className={`bg-[#3A3A3A] fixed w-full z-20 transition-all duration-300 ${scrolled ? 'shadow-md' : ''}`}>
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo section */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/dashboard" className="hover:opacity-90 transition-opacity flex items-center">
                            <Image
                                src="/images/logoColet.png"
                                alt="Colet Logo"
                                width={160}
                                height={50}
                                className="h-8 w-auto brightness-105"
                                priority
                            />
                            <span className="text-white font-medium ml-2">
                                Colet <span className="text-[#1ABC9C] font-light">Sistemas</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop navigation */}
                    <div className="hidden md:flex md:items-center md:justify-center flex-1">
                        <div className="flex items-center justify-center space-x-1">
                            {navItems.map((item) => (
                                <div key={item.label} className="relative group">
                                    {item.submenu ? (
                                        <button
                                            onClick={() => toggleSubmenu(item.label)}
                                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out relative ${openSubmenu === item.label || hasActiveSubmenu(item)
                                                ? 'text-[#1ABC9C]'
                                                : 'text-gray-300 hover:text-white'
                                                }`}
                                            aria-expanded={openSubmenu === item.label}
                                        >
                                            <span className="flex items-center">
                                                <span className="mr-2">
                                                    {item.icon}
                                                </span>
                                                {item.label}
                                            </span>
                                            <ChevronDown className={`ml-1 h-3 w-3 transition-transform duration-200 ${openSubmenu === item.label ? 'transform rotate-180' : ''}`} />
                                            {/* Add underline if submenu has active item */}
                                            {hasActiveSubmenu(item) && (
                                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1ABC9C]"></span>
                                            )}
                                        </button>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out relative ${isActive(item.href)
                                                ? 'text-[#1ABC9C]'
                                                : 'text-gray-300 hover:text-white'
                                                }`}
                                        >
                                            <span className="mr-2">
                                                {item.icon}
                                            </span>
                                            {item.label}
                                            {isActive(item.href) && (
                                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1ABC9C]"></span>
                                            )}
                                        </Link>
                                    )}

                                    {item.submenu && openSubmenu === item.label && (
                                        <div className="absolute z-30 left-0 mt-1 w-52 rounded-md shadow-lg bg-[#3A3A3A] border border-gray-700/50 py-1 animate-fadeIn">
                                            {item.submenu.map((subItem) => (
                                                <Link
                                                    key={subItem.label}
                                                    href={subItem.href}
                                                    className={`flex items-center px-4 py-2 text-sm hover:bg-gray-700/30 transition-colors duration-200 relative ${isActive(subItem.href)
                                                        ? 'text-[#1ABC9C]'
                                                        : 'text-gray-300 hover:text-white'
                                                        }`}
                                                    onClick={() => setOpenSubmenu(null)}
                                                >
                                                    <span className="mr-2">
                                                        {subItem.icon}
                                                    </span>
                                                    {subItem.label}
                                                    {/* Add left border indicator for active submenu item */}
                                                    {isActive(subItem.href) && (
                                                        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#1ABC9C]"></span>
                                                    )}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* User profile section - Desktop */}
                    <div className="hidden md:flex md:items-center md:justify-end">
                        <div className="relative">
                            <div>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-2 text-gray-300 hover:text-white focus:outline-none"
                                >
                                    <div className="h-8 w-8 rounded-full bg-[#1ABC9C]/20 flex items-center justify-center text-[#1ABC9C]">
                                        {user?.username?.charAt(0).toUpperCase() || <User size={16} />}
                                    </div>
                                    <div className="text-sm font-medium hidden lg:block">
                                        {user?.username || "Usuário"}
                                    </div>
                                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${userMenuOpen ? 'transform rotate-180' : ''}`} />
                                </button>
                            </div>

                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#3A3A3A] border border-gray-700/50 py-1 animate-fadeIn z-30">
                                    <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700/50">
                                        <p>Logado como</p>
                                        <p className="font-medium text-white text-sm">{user?.username}</p>
                                    </div>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setUserMenuOpen(false);
                                            // Add profile action here if needed
                                            console.log("Profile clicked");
                                        }}
                                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/30 hover:text-white transition-colors duration-200"
                                    >
                                        <User className="mr-2 h-4 w-4" />
                                        Perfil
                                    </a>
                                    <button
                                        type="button"
                                        onClick={(e) => handleShowLogoutModal(e)}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/30 hover:text-white transition-colors duration-200"
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
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white focus:outline-none"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Abrir menu principal</span>
                            {mobileMenuOpen ? (
                                <X className="block h-5 w-5" />
                            ) : (
                                <Menu className="block h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute w-full bg-[#3A3A3A] shadow-lg z-20 animate-slideDown border-t border-gray-700/50">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navItems.map((item) => (
                            <div key={item.label} className="relative">
                                {item.submenu ? (
                                    <>
                                        <button
                                            onClick={() => toggleSubmenu(item.label)}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-base font-medium transition-colors duration-200 relative ${openSubmenu === item.label || hasActiveSubmenu(item) ? 'text-[#1ABC9C]' : 'text-gray-300 hover:text-white'
                                                }`}
                                        >
                                            <span className="flex items-center">
                                                <span className="mr-3">
                                                    {item.icon}
                                                </span>
                                                {item.label}
                                            </span>
                                            <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${openSubmenu === item.label ? 'rotate-180' : ''}`} />
                                            {hasActiveSubmenu(item) && (
                                                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#1ABC9C]"></span>
                                            )}
                                        </button>

                                        {openSubmenu === item.label && (
                                            <div className="pl-4 space-y-1 mt-1 border-l border-gray-700/50 ml-3 animate-fadeIn">
                                                {item.submenu.map((subItem) => (
                                                    <Link
                                                        key={subItem.label}
                                                        href={subItem.href}
                                                        className={`flex items-center px-3 py-2 text-sm transition-colors duration-200 relative ${isActive(subItem.href) ? 'text-[#1ABC9C]' : 'text-gray-300 hover:text-white'
                                                            }`}
                                                        onClick={handleSubItemClick}
                                                    >
                                                        <span className="mr-2">
                                                            {subItem.icon}
                                                        </span>
                                                        {subItem.label}
                                                        {isActive(subItem.href) && (
                                                            <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#1ABC9C]"></span>
                                                        )}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={`flex items-center px-3 py-2 text-base font-medium transition-colors duration-200 relative ${isActive(item.href) ? 'text-[#1ABC9C]' : 'text-gray-300 hover:text-white'
                                            }`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <span className="mr-3">
                                            {item.icon}
                                        </span>
                                        {item.label}
                                        {isActive(item.href) && (
                                            <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#1ABC9C]"></span>
                                        )}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Mobile user menu */}
                    <div className="pt-4 pb-3 border-t border-gray-700/50">
                        <div className="flex items-center px-4">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-[#1ABC9C]/20 flex items-center justify-center text-[#1ABC9C]">
                                    {user?.username?.charAt(0).toUpperCase() || <User size={16} />}
                                </div>
                            </div>
                            <div className="ml-3">
                                <div className="text-base font-medium text-white">
                                    {user?.username || "Usuário"}
                                </div>
                                <div className="text-xs font-medium text-gray-400">
                                    {user?.email || ""}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1 px-2">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMobileMenuOpen(false);
                                    // Add profile action here if needed
                                    console.log("Mobile profile clicked");
                                }}
                                className="flex items-center px-3 py-2 text-base font-medium text-gray-300 hover:text-white transition-colors duration-200"
                            >
                                <User className="mr-3 h-4 w-4" />
                                Perfil
                            </a>
                            <button
                                type="button"
                                onClick={(e) => handleShowLogoutModal(e)}
                                className="w-full flex items-center px-3 py-2 text-base font-medium text-gray-300 hover:text-white transition-colors duration-200"
                            >
                                <LogOut className="mr-3 h-4 w-4" />
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Backdrop for clicking outside to close menus */}
            {(userMenuOpen || openSubmenu) && (
                <div
                    className="fixed inset-0 z-20 bg-black/10"
                    onClick={() => {
                        setUserMenuOpen(false);
                        setOpenSubmenu(null);
                    }}
                ></div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowLogoutModal(false);
                        }}
                    ></div>
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#3A3A3A] rounded-md shadow-lg z-50 w-80 animate-fadeIn">
                        <div className="p-5">
                            <h3 className="text-lg font-medium text-white mb-2">Confirmar saída</h3>
                            <p className="text-gray-300 mb-5">Tem certeza que deseja sair do sistema?</p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowLogoutModal(false);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-600 rounded-md hover:bg-gray-700/30 transition-colors"
                                    disabled={isLoggingOut}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLogout();
                                    }}
                                    disabled={isLoggingOut}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#1ABC9C] rounded-md hover:bg-[#16a085] transition-colors flex items-center justify-center min-w-[80px]"
                                >
                                    {isLoggingOut ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saindo...
                                        </>
                                    ) : (
                                        "Sim, sair"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
}