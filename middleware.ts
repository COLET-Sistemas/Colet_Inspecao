import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Lista de rotas que não precisam de autenticação
    const publicRoutes = ['/login', '/api/auth/login', '/api/auth/logout'];

    // Lista de rotas da API que precisam de autenticação
    const protectedApiRoutes = ['/api/auth/me', '/api/proxy'];

    // Verifica se é uma rota pública
    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    // Verifica se é uma rota de assets (imagens, CSS, JS, etc.)
    if (pathname.startsWith('/_next/') ||
        pathname.startsWith('/images/') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.includes('.')) {
        return NextResponse.next();
    }

    // Obtém o cookie de autenticação e valida de forma mais robusta
    const isAuthenticatedCookie = request.cookies.get('isAuthenticated');
    const authToken = request.cookies.get('authToken');
    const isAuthenticated = isAuthenticatedCookie?.value === 'true' && authToken?.value;

    // Log para depuração em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
        console.log(`Middleware: Path=${pathname}, isAuthenticated=${isAuthenticated}, hasToken=${!!authToken?.value}`);
    }

    // Para rotas da API protegidas
    if (protectedApiRoutes.some(route => pathname.startsWith(route))) {
        if (!isAuthenticated) {
            return NextResponse.json(
                { isAuthenticated: false, message: 'Não autenticado', hasToken: !!authToken?.value },
                { status: 401 }
            );
        }
        return NextResponse.next();
    }

    // Para rotas da aplicação
    if (!isAuthenticated) {
        // Se não estiver autenticado, redireciona para login
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Se autenticado, permite acesso
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth/login (login público)
         * - api/auth/logout (logout público)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
