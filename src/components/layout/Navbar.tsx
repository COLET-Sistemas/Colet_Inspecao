"use client";

import { useAuth } from "@/hooks/useAuth";
import {
    Archive,
    ChevronDown, ClipboardCheck, ClipboardList,
    Contact,
    Drill,
    FileSearch, FileText,
    Gauge,
    LayoutDashboard, Loader2, LogOut,
    Menu, Ruler,
    Settings, User, X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

// Check if user has the required permission
const hasPermission = (permission: string): boolean => {
    try {
        // Get userData from localStorage
        const userDataStr = localStorage.getItem("userData") || sessionStorage.getItem("userData");
        if (!userDataStr) return false;

        const userData = JSON.parse(userDataStr);
        // Check if perfil_inspecao exists and contains the required permission
        if (!userData || !userData.perfil_inspecao) return false;

        return userData.perfil_inspecao.includes(permission);
    } catch (error) {
        console.error("Error checking permissions:", error);
        return false;
    }
};

interface NavItem {
    label: string;
    href: string;
    icon?: React.ReactNode;
    submenu?: { label: string; href: string; icon?: React.ReactNode, requiredPermission?: string }[];
    requiredPermission?: string;
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

    const navItems: NavItem[] = useMemo(() => [
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
                { label: "Tipos Inst. de Medição", href: "/cadastros/tipos_instrumentos_medicao", icon: <Archive className="w-4 h-4" /> },
                { label: "Instumento Medição", href: "/cadastros/instrumentos_medicao", icon: <Gauge className="w-4 h-4" /> },
                { label: "Cotas e Caracteristicas", href: "/cadastros/cotas_caracteristicas", icon: <Ruler className="w-4 h-4" /> },
                { label: "Especif. Inspeção", href: "/cadastros/especificacoes", icon: <FileText className="w-4 h-4" /> },
                { label: "Postos Vinculados", href: "/cadastros/postos_vinculados", icon: <Drill className="w-4 h-4" />, requiredPermission: "G" },
                { label: "Permissões Inspeção", href: "/cadastros/permissoes_inspecao", icon: <Contact className="w-4 h-4" />, requiredPermission: "G" }
            ]
        }
    ], []);

    const handleShowLogoutModal = (e?: React.MouseEvent) => {
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

    const toggleSubmenu = useCallback((label: string) => {
        setOpenSubmenu(openSubmenu === label ? null : label);
    }, [openSubmenu]);

    const isActive = useCallback((href: string) => {
        if (href === '#') return false;
        return pathname === href || pathname?.startsWith(href + '/');
    }, [pathname]);

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

    const handleLinkClick = () => {
        setUserMenuOpen(false);
        setOpenSubmenu(null);
        setMobileMenuOpen(false);
    };

    // Filter submenu items based on permissions
    const getFilteredSubmenu = (item: NavItem) => {
        if (!item.submenu) return [];

        return item.submenu.filter(subItem =>
            !subItem.requiredPermission || hasPermission(subItem.requiredPermission)
        );
    };

    return (
        <nav className={`bg-gradient-to-r from-[#2C2C2C] to-[#3A3A3A] fixed w-full z-20 transition-all duration-300 ${scrolled ? 'shadow-lg shadow-black/10' : ''
            }`}>
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/dashboard" className="hover:opacity-90 transition-opacity flex items-center group">
                            <Image
                                src="/images/logoColet.png"
                                alt="Colet Logo"
                                width={160}
                                height={50}
                                className="h-8 w-auto brightness-105 transition-all duration-300 group-hover:scale-105"
                                priority
                            />
                            <span className="text-white font-medium ml-2 transition-all duration-300 group-hover:text-[#1ABC9C]">
                                Colet <span className="text-[#1ABC9C] font-light">Sistemas</span>
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex md:items-center md:justify-center flex-1">
                        <div className="flex items-center justify-center space-x-1">
                            {navItems.map((item) => (
                                <div key={item.label} className="relative group">
                                    {item.submenu ? (
                                        <button
                                            onClick={() => toggleSubmenu(item.label)}
                                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out relative
                                                ${openSubmenu === item.label || hasActiveSubmenu(item)
                                                    ? 'text-[#1ABC9C] bg-[#2c2c2c]/40'
                                                    : 'text-gray-300 hover:text-white hover:bg-[#2c2c2c]/60'
                                                }`}
                                            aria-expanded={openSubmenu === item.label}
                                        >
                                            <span className="flex items-center">
                                                <span className="mr-2 transition-transform duration-300 group-hover:scale-110">
                                                    {item.icon}
                                                </span>
                                                {item.label}
                                            </span>
                                            <ChevronDown className={`ml-1 h-3 w-3 transition-transform duration-300 ${openSubmenu === item.label ? 'transform rotate-180' : ''}`} />
                                            {(openSubmenu === item.label || hasActiveSubmenu(item)) && (
                                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-[#1ABC9C] rounded-t-full"></span>
                                            )}
                                        </button>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out relative
                                                hover:bg-[#2c2c2c]/60 ${isActive(item.href) ? 'text-[#1ABC9C] bg-[#2c2c2c]/40' : 'text-gray-300 hover:text-white'}`}
                                            onClick={handleLinkClick}
                                        >
                                            <span className="mr-2 transition-transform duration-300 group-hover:scale-110">
                                                {item.icon}
                                            </span>
                                            {item.label}
                                            {isActive(item.href) && (
                                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-[#1ABC9C] rounded-t-full"></span>
                                            )}
                                        </Link>
                                    )}

                                    {item.submenu && openSubmenu === item.label && (
                                        <div className="absolute z-30 left-0 mt-1 w-56 rounded-md shadow-xl bg-gradient-to-b from-[#2C2C2C] to-[#3A3A3A] border border-gray-700/30 py-1.5 animate-fadeIn overflow-hidden">
                                            {getFilteredSubmenu(item).map((subItem) => (
                                                <Link
                                                    key={subItem.label}
                                                    href={subItem.href}
                                                    className={`flex items-center px-4 py-2.5 text-sm hover:bg-[#1ABC9C]/10 transition-colors duration-200 relative ${isActive(subItem.href)
                                                        ? 'text-[#1ABC9C] bg-[#1ABC9C]/5'
                                                        : 'text-gray-300 hover:text-white'
                                                        }`}
                                                    onClick={() => setOpenSubmenu(null)}
                                                >
                                                    <span className="mr-2.5 opacity-80">
                                                        {subItem.icon}
                                                    </span>
                                                    {subItem.label}
                                                    {/* Left border indicator for active submenu item */}
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

                    <div className="hidden md:flex md:items-center md:justify-end">
                        <div className="relative">
                            <div>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-2 text-gray-300 hover:text-white focus:outline-none transition-all duration-200 
                                             hover:bg-[#2c2c2c]/60 rounded-full py-1 px-2"
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#1ABC9C]/30 to-[#1ABC9C]/10 
                                                  flex items-center justify-center text-[#1ABC9C] border border-[#1ABC9C]/20 shadow-sm">
                                        {user?.username?.charAt(0).toUpperCase() || <User size={16} />}
                                    </div>
                                    <div className="text-sm font-medium hidden lg:block">
                                        {user?.username || "Usuário"}
                                    </div>
                                    <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${userMenuOpen ? 'transform rotate-180' : ''}`} />
                                </button>
                            </div>

                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-52 rounded-md shadow-xl bg-gradient-to-b from-[#2C2C2C] to-[#3A3A3A] 
                                             border border-gray-700/30 py-1.5 animate-fadeIn z-30 overflow-hidden">
                                    <div className="px-4 py-3 text-xs text-gray-400 border-b border-gray-700/50">
                                        <p>Logado como</p>
                                        <p className="font-medium text-white text-sm mt-0.5">{user?.username}</p>
                                        {user?.perfil_inspecao && (
                                            <p className="text-[#1ABC9C] text-xs mt-1">
                                                Perfil: {user.perfil_inspecao}
                                            </p>
                                        )}
                                    </div>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setUserMenuOpen(false);
                                        }}
                                        className="flex items-center px-4 py-2.5 text-sm text-gray-300 
                                               hover:bg-[#1ABC9C]/10 hover:text-white transition-colors duration-200"
                                    >
                                        <User className="mr-2.5 h-4 w-4 opacity-80" />
                                        Perfil
                                    </a>
                                    <button
                                        type="button"
                                        onClick={(e) => handleShowLogoutModal(e)}
                                        className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-300 
                                               hover:bg-[#1ABC9C]/10 hover:text-white transition-colors duration-200"
                                    >
                                        <LogOut className="mr-2.5 h-4 w-4 opacity-80" />
                                        Sair
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white 
                                     hover:bg-[#2c2c2c]/60 focus:outline-none transition-colors duration-200"
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

            {mobileMenuOpen && (
                <div className="md:hidden absolute w-full bg-gradient-to-b from-[#2C2C2C] to-[#3A3A3A] shadow-xl z-20 animate-slideDown 
                               border-t border-gray-700/30 max-h-[80vh] overflow-y-auto overscroll-contain">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navItems.map((item) => (
                            <div key={item.label} className="relative">
                                {item.submenu ? (
                                    <>
                                        <button
                                            onClick={() => toggleSubmenu(item.label)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 text-base font-medium transition-colors duration-200 
                                                     rounded-lg relative ${openSubmenu === item.label || hasActiveSubmenu(item)
                                                    ? 'text-[#1ABC9C] bg-[#1ABC9C]/5'
                                                    : 'text-gray-300 hover:text-white hover:bg-[#2c2c2c]/60'
                                                }`}
                                        >
                                            <span className="flex items-center">
                                                <span className="mr-3 opacity-80">
                                                    {item.icon}
                                                </span>
                                                {item.label}
                                            </span>
                                            <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-300 ${openSubmenu === item.label ? 'rotate-180' : ''}`} />
                                            {hasActiveSubmenu(item) && (
                                                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#1ABC9C]"></span>
                                            )}
                                        </button>

                                        {openSubmenu === item.label && (
                                            <div className="pl-4 space-y-0.5 mt-1 border-l border-gray-700/30 ml-3 animate-fadeIn">
                                                {getFilteredSubmenu(item).map((subItem) => (
                                                    <Link
                                                        key={subItem.label}
                                                        href={subItem.href}
                                                        className={`flex items-center px-3 py-2.5 text-sm transition-colors duration-200
                                                                 rounded-lg relative ${isActive(subItem.href)
                                                                ? 'text-[#1ABC9C] bg-[#1ABC9C]/5'
                                                                : 'text-gray-300 hover:text-white hover:bg-[#2c2c2c]/60'
                                                            }`}
                                                        onClick={handleSubItemClick}
                                                    >
                                                        <span className="mr-2.5 opacity-80">
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
                                        className={`flex items-center px-3 py-2.5 text-base font-medium transition-colors duration-200 
                                               rounded-lg relative ${isActive(item.href)
                                                ? 'text-[#1ABC9C] bg-[#1ABC9C]/5'
                                                : 'text-gray-300 hover:text-white hover:bg-[#2c2c2c]/60'}`}
                                        onClick={handleLinkClick}
                                    >
                                        <span className="mr-3 opacity-80">
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

                    <div className="pt-4 pb-3 border-t border-gray-700/30 bg-[#2C2C2C]/30">
                        <div className="flex items-center px-4 py-2">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#1ABC9C]/30 to-[#1ABC9C]/10 
                                              flex items-center justify-center text-[#1ABC9C] border border-[#1ABC9C]/20 shadow-sm">
                                    {user?.username?.charAt(0).toUpperCase() || <User size={18} />}
                                </div>
                            </div>
                            <div className="ml-3">
                                <div className="text-base font-medium text-white">
                                    {user?.username || "Usuário"}
                                </div>
                                <div className="text-xs font-medium text-gray-400 mt-0.5">
                                    {user?.email || ""}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 space-y-0.5 px-2">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMobileMenuOpen(false);
                                }}
                                className="flex items-center px-3 py-2.5 text-base font-medium text-gray-300 hover:text-white 
                                         transition-colors duration-200 rounded-lg hover:bg-[#2c2c2c]/60"
                            >
                                <User className="mr-3 h-4 w-4 opacity-80" />
                                Perfil
                            </a>
                            <button
                                type="button"
                                onClick={(e) => handleShowLogoutModal(e)}
                                className="w-full flex items-center px-3 py-2.5 text-base font-medium text-gray-300 hover:text-white 
                                         transition-colors duration-200 rounded-lg hover:bg-[#2c2c2c]/60"
                            >
                                <LogOut className="mr-3 h-4 w-4 opacity-80" />
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(userMenuOpen || openSubmenu) && (
                <div
                    className="fixed inset-0 z-10 bg-black/15"
                    onClick={() => {
                        setUserMenuOpen(false);
                        setOpenSubmenu(null);
                    }}
                ></div>
            )}

            {showLogoutModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 z-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowLogoutModal(false);
                        }}
                    ></div>
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-[#2C2C2C] to-[#3A3A3A] 
                                 rounded-lg shadow-2xl z-50 w-80 animate-fadeIn overflow-hidden border border-gray-700/30">
                        <div className="p-5">
                            <h3 className="text-lg font-medium text-white mb-2">Confirmar saída</h3>
                            <p className="text-gray-300 mb-5">Tem certeza que deseja sair do sistema?</p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowLogoutModal(false);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-600 rounded-md 
                                           hover:bg-gray-700/30 transition-colors"
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
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#1ABC9C] rounded-md hover:bg-[#16a085] 
                                           transition-colors flex items-center justify-center min-w-[80px] shadow-lg shadow-[#1ABC9C]/20"
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