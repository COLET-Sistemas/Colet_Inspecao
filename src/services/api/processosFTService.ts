import { fetchWithAuth } from "./authInterceptor";

export const getProcessosFT = async (referencia: string) => {
    if (!referencia) throw new Error("Referência não informada");
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) throw new Error("API URL não configurada");
    const path = `/inspecao/processos_ft?referencia=${encodeURIComponent(referencia.trim())}`;
    const response = await fetchWithAuth(apiUrl + path, {
        method: 'GET',
    });
    if (!response.ok) {
        let errorMessage = `Erro na requisição: ${response.status} - ${response.statusText}`;
        if (response.status === 409) {
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.erro || errorMessage;
            } catch {
                errorMessage = 'Conflito na requisição - dados em conflito ou referência duplicada';
            }
        }
        throw new Error(errorMessage);
    }
    return response.json();
};
