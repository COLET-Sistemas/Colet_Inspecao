import { NextRequest, NextResponse } from 'next/server';

// Função para codificar senha usando cifra XOR (mesma do frontend)
const encodePassword = (password: string) => {
    const key = Math.floor(Math.random() * 255);
    const hexResult = [];
    let result = "";
    hexResult.push((key >> 4).toString(16).toUpperCase());
    hexResult.push((key & 0xf).toString(16).toUpperCase());
    result += hexResult.join("");
    for (let i = 0; i < password.length; i++) {
        const converted = password.charCodeAt(i) ^ key;
        hexResult[0] = (converted >> 4).toString(16).toUpperCase();
        hexResult[1] = (converted & 0xf).toString(16).toUpperCase();
        result += hexResult.join("");
    }
    return result;
};

export async function POST(request: NextRequest) {
    try {
        const { username, password, remember } = await request.json();

        // Validação básica
        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: 'Usuário e senha são obrigatórios' },
                { status: 400 }
            );
        }

        // Obtém a URL da API do localStorage (será enviada no corpo da requisição)
        const apiUrl = request.headers.get('x-api-url');
        if (!apiUrl) {
            return NextResponse.json(
                { success: false, message: 'URL da API não configurada' },
                { status: 400 }
            );
        }

        // Codifica a senha
        const senha_cripto = encodePassword(password);

        // Faz a requisição para a API externa
        const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario: username,
                senha_cripto
            }),
        });

        const data = await response.json();

        if (response.status === 200 && (data.success === undefined || data.success)) {
            // Prepara os dados do usuário
            const userData = {
                username: username,
                name: data.nome || data.usuario || username,
                permissao: data.permissao || "",
                perfil_inspecao: data.perfil_inspecao || "",
                codigo_pessoa: data.codigo_pessoa || "",
                encaminhar_ficha: data.encaminhar_ficha || "",
                registrar_ficha: data.registrar_ficha || "",
            };

            // Configurações do cookie
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const, // Alterado de 'strict' para 'lax' para melhor compatibilidade
                path: '/',
                maxAge: remember || username === "operador" ? 7 * 24 * 60 * 60 : 24 * 60 * 60, // 7 dias se lembrar, 1 dia se não
            };

            // Cria a resposta
            const responseData = {
                success: true,
                user: userData,
                message: 'Login realizado com sucesso'
            };

            const nextResponse = NextResponse.json(responseData, { status: 200 });

            // Define os cookies
            nextResponse.cookies.set('authToken', data.token || '', cookieOptions);
            nextResponse.cookies.set('userData', JSON.stringify(userData), cookieOptions);
            nextResponse.cookies.set('isAuthenticated', 'true', cookieOptions);

            return nextResponse;
        } else {
            // Retorna erro da API externa
            return NextResponse.json(
                {
                    success: false,
                    message: data.message || data.mensagem || 'Credenciais inválidas'
                },
                { status: response.status }
            );
        }
    } catch (error) {
        console.error('Erro no login:', error);
        return NextResponse.json(
            { success: false, message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
