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
            credentials: 'include',
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

            // Para requisições cross-origin funcionarem, precisamos usar:
            // - SameSite=None: Permite que o cookie seja enviado em requisições cross-origin
            // - Secure=true: Obrigatório quando SameSite=None (exceto em localhost em alguns navegadores)
            // - httpOnly=true: Previne acesso via JavaScript (segurança)

            // Determina se estamos em localhost/desenvolvimento
            const isLocalhost = request.headers.get('host')?.includes('localhost') ||
                request.headers.get('host')?.includes('127.0.0.1');

            // Em desenvolvimento local, permitimos flexibilidade para testes
            const isSecure = process.env.NODE_ENV === 'production' ||
                request.headers.get('x-forwarded-proto') === 'https';

            // CRÍTICO: Para requisições cross-origin, SEMPRE use SameSite=None
            // Exceto para testes puramente locais (mesmo domínio)
            const sameSite = 'none' as const;

            // Log para diagnóstico
            console.log(`Login: isProduction=${process.env.NODE_ENV === 'production'}, isLocalhost=${isLocalhost}, isSecure=${isSecure}, sameSite=${sameSite}`);

            // Não usamos mais cookie HTTPOnly, apenas a abordagem com token no cookie JS
            // e nos headers de requisição. Cookie de autenticação removido.

            // Cria a resposta incluindo o token para acesso via JavaScript
            const responseData = {
                success: true,
                user: userData,
                token: data.token || '',  // Incluir o token na resposta para salvar em cookie JS
                message: 'Login realizado com sucesso'
            };

            // Retornamos a resposta sem definir cookies HTTPOnly
            // O token será gerenciado apenas pelo cliente através de cookie JS
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
