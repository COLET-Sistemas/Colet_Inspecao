// Definir tipo de retorno para o ambiente
type Environment = {
    isProduction: boolean;
    isSecure: boolean;
    isDevelopment: boolean;
};

// Função para detectar o ambiente
export function getEnvironment(): Environment {
    if (typeof window === 'undefined') {
        // No servidor, consideramos como produção para segurança
        return {
            isProduction: true,
            isSecure: true,
            isDevelopment: false
        };
    }

    // Verifica se está em produção
    const isProduction = process.env.NODE_ENV === 'production';

    // Verifica se estamos em HTTPS
    const isSecure = window.location.protocol === 'https:';

    return {
        isProduction,
        isSecure,
        isDevelopment: !isProduction
    };
}

// Função para obter um cookie pelo nome
export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        return cookieValue || null;
    }

    return null;
}

// Função para definir um cookie
export function setCookie(name: string, value: string, days?: number): void {
    if (typeof document === 'undefined') return;

    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = `; expires=${date.toUTCString()}`;
    }

    const env = getEnvironment();

    // Em produção, sempre use SameSite=None para permitir cookies em requisições cross-origin
    // mas apenas se estivermos em HTTPS, senão use Lax
    const sameSite = env.isProduction ? 'None' : (env.isSecure ? 'None' : 'Lax');

    // Inclui Secure flag se estivermos em HTTPS ou em produção
    const secureFlag = env.isProduction || env.isSecure ? '; Secure' : '';

    // Define o domínio para compartilhar cookies entre subdomínios se necessário
    // Deixe vazio para usar o domínio atual
    const domain = '';
    const domainPart = domain ? `; domain=${domain}` : '';

    document.cookie = `${name}=${value || ''}${expires}; path=/${domainPart}; SameSite=${sameSite}${secureFlag}`;
}

// Função para remover um cookie
export function removeCookie(name: string): void {
    if (typeof document === 'undefined') return;

    const env = getEnvironment();

    // Em produção, sempre use SameSite=None para permitir cookies em requisições cross-origin
    const sameSite = env.isProduction ? 'None' : (env.isSecure ? 'None' : 'Lax');

    // Inclui Secure flag se estivermos em HTTPS ou em produção
    const secureFlag = env.isProduction || env.isSecure ? '; Secure' : '';

    // Define o domínio para garantir que o cookie seja removido do mesmo escopo onde foi criado
    const domain = '';
    const domainPart = domain ? `; domain=${domain}` : '';

    document.cookie = `${name}=; Path=/${domainPart}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=${sameSite}${secureFlag}`;
}

// Função para verificar se um cookie existe
export function hasCookie(name: string): boolean {
    return getCookie(name) !== null;
}
