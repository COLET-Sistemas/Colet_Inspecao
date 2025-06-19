import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Verifica se o usuário está autenticado através dos cookies
        const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';
        const userDataCookie = request.cookies.get('userData')?.value;

        if (!isAuthenticated || !userDataCookie) {
            return NextResponse.json(
                { isAuthenticated: false, user: null },
                { status: 401 }
            );
        }

        // Parse dos dados do usuário
        let userData = null;
        try {
            userData = JSON.parse(userDataCookie);
        } catch {
            return NextResponse.json(
                { isAuthenticated: false, user: null },
                { status: 401 }
            );
        }

        return NextResponse.json({
            isAuthenticated: true,
            user: userData
        });
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return NextResponse.json(
            { isAuthenticated: false, user: null },
            { status: 500 }
        );
    }
}
