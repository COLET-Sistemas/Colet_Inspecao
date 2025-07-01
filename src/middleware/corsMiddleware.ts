import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Middleware para adicionar cabeçalhos CORS necessários para permitir credenciais
 * cross-origin e garantir que os cookies sejam enviados corretamente.
 */
export function corsMiddleware(request: NextRequest) {
    // Verifica se é uma requisição de origem cruzada (CORS)
    const origin = request.headers.get('origin');

    // Obtém o response do handler seguinte na cadeia
    const response = NextResponse.next();

    // Adiciona cabeçalhos CORS necessários
    if (origin) {
        // Em produção, você deve especificar as origens permitidas em vez de '*'
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-url, x-target-path');

        // Cache dos resultados do preflight por 1 hora (3600 segundos)
        response.headers.set('Access-Control-Max-Age', '3600');
    }

    // Para requisições preflight OPTIONS, retorna 200 OK diretamente
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: response.headers,
        });
    }

    return response;
}
