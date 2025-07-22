import { fetchWithAuth } from "./authInterceptor";
import { InspectionItem } from "./inspecaoService";

// Interface para os dados recebidos da API
interface ApiInspectionItem {
    id_ficha_inspecao: number;
    numero_ordem: number;
    referencia: string;
    roteiro: string;
    numero_lote: string;
    processo: number;
    operacao: number;
    codigo_posto: string;
    origem: string;
    situacao: string;
    data_hora_situacao: string;
    data_hora_criacao: string;
    codigo_pessoa_criacao: string;
    nome_pessoa_criacao: string;
    obs_criacao: string;
    data_hora_prevista?: string | null;
    codigo_pessoa_inspecao?: string | null;
    nome_pessoa_inspecao?: string | null;
    qtde_produzida?: number | null;
    qtde_inspecionada?: number | null;
    resultado_inspecao: string;
    observacao_inspecao?: string | null;
    codigo_pessoa_conclusao?: string | null;
    nome_pessoa_conclusao?: string | null;
    id_ficha_origem?: number | null;
    tipo_inspecao: string;
    id_tipo_inspecao?: number;
    tipo_acao?: string | null;
    produto?: string | null;
}

/**
 * Service for handling definition-related API calls
 */
class DefinicaoService {
    // URL da API
    private apiUrl: string;

    constructor() {
        // Obter a URL da API do localStorage ou usar um valor padrão
        this.apiUrl = typeof window !== 'undefined'
            ? localStorage.getItem('apiUrl') || 'http://localhost:3001/api'
            : 'http://localhost:3001/api';
    }

    /**
     * Mapeia os dados da API para o formato utilizado pelo frontend
     */
    private mapApiDataToInspectionItem(item: ApiInspectionItem): InspectionItem {
        return {
            id: `${item.id_ficha_inspecao}`,
            ...item
        };
    }

    /**
     * Busca as fichas de inspeção que precisam de definição
     * Esta chamada não utiliza o parâmetro código_posto
     */
    async getFichasInspecaoDefinicoes(): Promise<InspectionItem[]> {
        try {
            const response = await fetchWithAuth(`${this.apiUrl}/inspecao/fichas_inspecao?aba=definicoes`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            const mappedData = Array.isArray(data)
                ? data.map((item: ApiInspectionItem) => this.mapApiDataToInspectionItem(item))
                : [];

            return mappedData;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Busca uma ficha de inspeção específica por ID
     */
    async getFichaInspecaoById(id: number): Promise<InspectionItem | null> {
        try {
            const allFichas = await this.getFichasInspecaoDefinicoes();
            return allFichas.find(ficha => ficha.id_ficha_inspecao === id) || null;
        } catch (error) {
            throw error;
        }
    }
}

const definicaoService = new DefinicaoService();
export default definicaoService;
