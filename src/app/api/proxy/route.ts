import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return handleProxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
    return handleProxyRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
    return handleProxyRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
    return handleProxyRequest(request, 'DELETE');
}

async function handleProxyRequest(request: NextRequest, method: string) {
    try {
        // Obtém o token dos cookies
        const authToken = request.cookies.get('authToken')?.value;

        // Log para depuração em ambiente de desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            console.log(`Proxy Request: Method=${method}, Has Token=${!!authToken}`);
        }

        if (!authToken) {
            return NextResponse.json(
                { error: 'Token de autenticação não encontrado' },
                { status: 401, headers: { 'X-Auth-Status': 'token-missing' } }
            );
        }

        // Obtém a URL da API externa dos headers
        const apiUrl = request.headers.get('x-api-url');
        const targetPath = request.headers.get('x-target-path');

        if (!apiUrl || !targetPath) {
            return NextResponse.json(
                { error: 'URL da API ou caminho não especificado' },
                { status: 400 }
            );
        }

        // Constrói a URL completa
        const fullUrl = `${apiUrl}${targetPath}`;

        // Prepara os headers para a requisição externa
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Token': authToken,
        };

        // Prepara as opções da requisição
        const options: RequestInit = {
            method,
            headers,
            // Desabilita cache para requisições de API
            cache: 'no-store',
        };

        // Adiciona o body se for POST, PUT, etc.
        if (method !== 'GET' && method !== 'DELETE') {
            const body = await request.text();
            if (body) {
                options.body = body;
            }
        }

        // Faz a requisição para a API externa
        const response = await fetch(fullUrl, options);
        const data = await response.text();

        // Retorna a resposta
        return new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/json',
                'Cache-Control': 'no-store, must-revalidate',
                'X-Auth-Status': 'token-sent' // Para diagnóstico
            },
        });
    } catch (error) {
        console.error('Erro no proxy:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
