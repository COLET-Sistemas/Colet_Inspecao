
import { fetchWithAuth } from "./authInterceptor";

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
}

interface InspectionItem {
    id: string;
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
}

interface InspectionData {
    processo: InspectionItem[];
    qualidade: InspectionItem[];
    outras: InspectionItem[];
    naoConformidade: InspectionItem[];
}

interface InspectionFilters {
    tipo?: string;
    posto?: string;
    responsavel?: string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
}



class InspecaoService {
    private baseUrl: string;

    constructor(baseUrl: string = '/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * Busca todas as inspeções organizadas por categoria
     */
    async getAllInspections(): Promise<InspectionData> {
        try {
            const response = await fetch(`${this.baseUrl}/inspections`);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao buscar inspeções:', error);
            throw error;
        }
    }

    /**
     * Busca inspeções com filtros específicos
     */
    async getFilteredInspections(filters: InspectionFilters): Promise<InspectionData> {
        try {
            const params = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, value);
                }
            });

            const response = await fetch(`${this.baseUrl}/inspections?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao buscar inspeções filtradas:', error);
            throw error;
        }
    }

    /**
     * Busca uma inspeção específica por ID
     */
    async getInspectionById(id: string): Promise<InspectionItem> {
        try {
            const response = await fetch(`${this.baseUrl}/inspections/${id}`);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao buscar inspeção:', error);
            throw error;
        }
    }

   /**
     * Busca fichas de inspeção por aba específica
     * @param codigosPostos - Array de códigos de posto ou string com códigos separados por vírgula
     * @param aba - Aba da inspeção (processo, qualidade, outras, nc)
     */    async getFichasInspecaoPorAba(codigosPostos: string[] | string, aba: string): Promise<InspectionItem[]> {
        try {
            const apiUrl = localStorage.getItem("apiUrl");
            if (!apiUrl) {
                throw new Error("URL da API não está configurada");
            }            // Se for array, junta com vírgula; se já for string, usa diretamente
            const postosParam = Array.isArray(codigosPostos)
                ? codigosPostos.join(',')
                : codigosPostos;

            const response = await fetchWithAuth(`${apiUrl}/inspecao/fichas_inspecao?codigo_posto=${postosParam}&aba=${aba}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            } const data: ApiInspectionItem[] = await response.json();
            const mappedData = Array.isArray(data) ? data.map(item => this.mapApiDataToInspectionItem(item)) : [];
            return mappedData;
        } catch (error) {
            console.error(`Erro ao buscar fichas de inspeção da aba ${aba}:`, error);
            throw error;
        }
    }    /**
     * Mapeia os dados da API para o formato InspectionItem
     */
    private mapApiDataToInspectionItem(apiItem: ApiInspectionItem): InspectionItem {
        return {
            // Dados originais da API
            id: apiItem.id_ficha_inspecao?.toString() || '',
            id_ficha_inspecao: apiItem.id_ficha_inspecao || 0,
            numero_ordem: apiItem.numero_ordem || 0,
            referencia: apiItem.referencia || '',
            roteiro: apiItem.roteiro || '',
            numero_lote: apiItem.numero_lote || '',
            processo: apiItem.processo || 0,
            operacao: apiItem.operacao || 0,
            codigo_posto: apiItem.codigo_posto || '',
            origem: apiItem.origem || '',
            situacao: apiItem.situacao || '',
            data_hora_situacao: apiItem.data_hora_situacao || '',
            data_hora_criacao: apiItem.data_hora_criacao || '',
            codigo_pessoa_criacao: apiItem.codigo_pessoa_criacao || '',
            nome_pessoa_criacao: apiItem.nome_pessoa_criacao || '',
            obs_criacao: apiItem.obs_criacao || '',
            data_hora_prevista: apiItem.data_hora_prevista,
            codigo_pessoa_inspecao: apiItem.codigo_pessoa_inspecao,
            nome_pessoa_inspecao: apiItem.nome_pessoa_inspecao,
            qtde_produzida: apiItem.qtde_produzida,
            qtde_inspecionada: apiItem.qtde_inspecionada,
            resultado_inspecao: apiItem.resultado_inspecao || '',
            observacao_inspecao: apiItem.observacao_inspecao,
            codigo_pessoa_conclusao: apiItem.codigo_pessoa_conclusao,
            nome_pessoa_conclusao: apiItem.nome_pessoa_conclusao,
            id_ficha_origem: apiItem.id_ficha_origem,
        };
    }

    /**
     * Busca estatísticas das inspeções
     */
    async getInspectionStats(): Promise<{
        total: number;
        porTipo: Record<string, number>;
        porStatus: Record<string, number>;
        atrasadas: number;
        concluidas: number;
    }> {
        try {
            const response = await fetch(`${this.baseUrl}/inspections/stats`);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            throw error;
        }
    }
}

// Instância singleton do serviço
const inspecaoService = new InspecaoService();

export default inspecaoService;
export type {
    InspectionData,
    InspectionFilters, InspectionItem
};

