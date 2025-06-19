/**
 * Utilitários para trabalhar com cookies no lado do cliente
 * Usado apenas para cookies não-HttpOnly
 */

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

    document.cookie = `${name}=${value || ''}${expires}; path=/; SameSite=Strict`;
}

// Função para remover um cookie
export function removeCookie(name: string): void {
    if (typeof document === 'undefined') return;

    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict`;
}

// Função para verificar se um cookie existe
export function hasCookie(name: string): boolean {
    return getCookie(name) !== null;
}
