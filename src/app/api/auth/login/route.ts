import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const requestData = await request.json();
        const { usuario, senha_cripto } = requestData;

        // Validação básica
        if (!usuario || !senha_cripto) {
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

        // Prepara o payload no formato correto para a API externa
        const payload = {
            usuario,
            senha_cripto
        };


        // Faz a requisição para a API externa
        const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.status === 200 && (data.success === undefined || data.success)) {
            // Prepara os dados do usuário
            const userData = {
                username: usuario,
                name: data.nome || data.usuario || usuario,
                permissao: data.permissao || "",
                perfil_inspecao: data.perfil_inspecao || "",
                codigo_pessoa: data.codigo_pessoa || "",
                encaminhar_ficha: data.encaminhar_ficha || "",
                registrar_ficha: data.registrar_ficha || "",
            };

            // Verificar se o usuário não é "operador" e não tem código_pessoa
            if (usuario !== "operador" && !userData.codigo_pessoa) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Usuário não possui código de pessoa associado. Entre em contato com o administrador.'
                    },
                    { status: 403 }
                );
            }

            // Cria a resposta incluindo o token para acesso via JavaScript
            const responseData = {
                success: true,
                user: userData,
                token: data.token || '',
                message: 'Login realizado com sucesso'
            };

            const nextResponse = NextResponse.json(responseData, { status: 200 });

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
