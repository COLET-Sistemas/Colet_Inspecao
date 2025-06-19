import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // Cria a resposta
        const response = NextResponse.json(
            { success: true, message: 'Logout realizado com sucesso' },
            { status: 200 }
        );

        // Remove todos os cookies de autenticação
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            path: '/',
            maxAge: 0, // Remove o cookie
        };

        response.cookies.set('authToken', '', cookieOptions);
        response.cookies.set('userData', '', cookieOptions);
        response.cookies.set('isAuthenticated', '', cookieOptions);

        // Define um header especial para indicar que este é um logout intencional
        response.headers.set('X-Logout-Type', 'intentional');

        return response;
    } catch (error) {
        console.error('Erro no logout:', error);
        return NextResponse.json(
            { success: false, message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
