import { NextRequest, NextResponse } from 'next/server';
import { corsMiddleware } from './src/middleware/corsMiddleware';

export function middleware(request: NextRequest) {
    // Primeiro, aplicamos o middleware CORS para garantir os cabeçalhos corretos
    const corsResponse = corsMiddleware(request);

    // Para requisições OPTIONS (preflight), retornamos imediatamente a resposta do CORS
    if (request.method === 'OPTIONS') {
        return corsResponse;
    }

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

    // Agora verificamos a autenticação pelo header de autorização
    // O cliente deve incluir o token no header x-auth-token em cada requisição
    const authToken = request.headers.get('x-auth-token');
    const isAuthenticated = !!authToken;

    // Log para depuração em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
        console.log(`Middleware: Path=${pathname}, isAuthenticated=${isAuthenticated}, hasToken=${!!authToken}`);
    }

    // Para rotas da API protegidas
    if (protectedApiRoutes.some(route => pathname.startsWith(route))) {
        if (!isAuthenticated) {
            return NextResponse.json(
                { isAuthenticated: false, message: 'Não autenticado', hasToken: !!authToken },
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

// CONFIGURAÇÃO DE COOKIES CROSS-ORIGIN:
// 1. HTTPOnly: true (para segurança, previne acesso via JavaScript)
// 2. SameSite: 'none' (obrigatório para requisições cross-origin funcionarem)
// 3. Secure: true (obrigatório quando SameSite=None)
// 4. credentials: 'include' em todas as requisições fetch/axios
// 5. Access-Control-Allow-Credentials: true no backend
//
// IMPORTANTE: Para ambiente de desenvolvimento local sem HTTPS:
// - Alguns navegadores permitem cookies SameSite=None sem HTTPS em localhost
// - Chrome: execute com --disable-web-security ou use http://127.0.0.1 em vez de http://localhost
