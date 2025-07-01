import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Verifica se o usuário está autenticado através do header x-auth-token
        const authToken = request.headers.get('x-auth-token');

        // Obtém os dados do usuário do localStorage (enviado nos headers)
        const userDataHeader = request.headers.get('x-user-data');

        if (!authToken || !userDataHeader) {
            return NextResponse.json(
                { isAuthenticated: false, user: null },
                { status: 401 }
            );
        }

        // Parse dos dados do usuário
        let userData = null;
        try {
            userData = JSON.parse(userDataHeader);
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
