"use client";


// This function handles API responses and checks for 401 errors
export const handleApiResponse = async (response: Response): Promise<Response> => {
    if (response.status === 401) {
        // Clear authentication data
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');

        // Store the session expired message to show on login page
        sessionStorage.setItem('authError', 'Sua sessão expirou. Faça login novamente para continuar.');

        // Redirect to login page
        window.location.href = '/login';

        // Throw an error to stop execution
        throw new Error('Session expired');
    }

    return response;
};

// This utility wraps fetch requests to handle 401 responses
export const fetchWithAuth = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    try {
        const response = await fetch(url, options);
        return await handleApiResponse(response);
    } catch (error) {
        // Rethrow other errors
        throw error;
    }
};
