import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Rota para verificar a configuração de CORS e cookies
 * Acesse esta rota para verificar se os cabeçalhos CORS estão configurados corretamente
 * e se os cookies estão sendo enviados.
 */
export async function GET(request: NextRequest) {
    // Obtém todos os cookies da requisição
    const cookieList = request.cookies.getAll();
    const cookiesFormatted = cookieList.map(c => `${c.name}: ${c.value}`);

    // Obtém todos os headers da requisição
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
        headers[key] = value;
    });

    // Obtém a origem da requisição
    const origin = request.headers.get('origin') || 'Desconhecido';

    // Detecção de ambiente
    const isLocalhost = request.headers.get('host')?.includes('localhost') ||
        request.headers.get('host')?.includes('127.0.0.1');
    const isSecureConnection = request.headers.get('x-forwarded-proto') === 'https' ||
        request.url.startsWith('https://');

    // Monta a resposta com todas as informações relevantes
    const responseData = {
        success: true,
        message: 'Diagnóstico CORS e Cookies',
        cors: {
            origin,
            isCrossOrigin: origin !== request.headers.get('host'),
            isLocalhost,
            isSecureConnection
        },
        cookies: {
            count: cookieList.length,
            list: cookiesFormatted,
            hasAuthToken: cookieList.some(c => c.name === 'authToken'),
            hasIsAuthenticated: cookieList.some(c => c.name === 'isAuthenticated')
        },
        headers: {
            requested: headers
        },
        recommendations: [] as string[]
    };

    // Adiciona recomendações com base nas informações coletadas
    if (!responseData.cookies.hasAuthToken) {
        responseData.recommendations.push(
            'O cookie authToken não foi encontrado. Verifique se o login foi realizado corretamente.'
        );
    }

    if (!isSecureConnection && !isLocalhost) {
        responseData.recommendations.push(
            'A conexão não é segura (HTTPS) e não é localhost. Cookies com SameSite=None exigem conexão segura.'
        );
    }

    // Adiciona cabeçalhos CORS na resposta para facilitar o teste
    const response = NextResponse.json(responseData);
    if (origin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-url, x-target-path');
    }

    return response;
}

export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get('origin') || '*';

    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-url, x-target-path',
            'Access-Control-Max-Age': '3600'
        }
    });
}
