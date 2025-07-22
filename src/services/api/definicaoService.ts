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
     * @param codigosPostos - Array de códigos de posto ou string com códigos separados por vírgula
     */
    async getFichasInspecaoDefinicoes(codigosPostos: string[] | string): Promise<InspectionItem[]> {
        try {
            // Verificar se o usuário tem a letra Q no perfil_inspecao
            let hasPerfilQ = false;
            try {
                const userDataStr = localStorage.getItem("userData");
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    if (userData && userData.perfil_inspecao) {
                        if (typeof userData.perfil_inspecao === 'string') {
                            hasPerfilQ = userData.perfil_inspecao.includes('Q');
                        } else if (Array.isArray(userData.perfil_inspecao)) {
                            hasPerfilQ = userData.perfil_inspecao.some((p: string) => p.includes('Q'));
                        }
                    }
                }
            } catch (error) {
                console.error('Erro ao verificar perfil de inspeção:', error);
            }

            let postos: string[];
            if (hasPerfilQ) {
                postos = ['CQ'];
            } else {
                postos = Array.isArray(codigosPostos) ? codigosPostos : codigosPostos.split(',').map(p => p.trim());
            }

            // Junta os postos com vírgula
            const postosParam = postos.join(',');

            const response = await fetchWithAuth(`${this.apiUrl}/inspecao/fichas_inspecao?codigo_posto=${postosParam}&aba=definicoes`, {
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
     * Busca uma ficha de inspeção específica por ID usando filtro de postos
     * (usado na listagem para manter consistência com os filtros)
     */
    async getFichaInspecaoById(id: number, codigosPostos?: string[] | string): Promise<InspectionItem | null> {
        try {
            // Se codigosPostos não for fornecido, busca diretamente pelo ID
            if (!codigosPostos || (Array.isArray(codigosPostos) && codigosPostos.length === 0)) {
                return this.getFichaInspecaoByIdDireto(id);
            }

            // Caso contrário, usa o método antigo para manter compatibilidade
            const allFichas = await this.getFichasInspecaoDefinicoes(codigosPostos);
            return allFichas.find(ficha => ficha.id_ficha_inspecao === id) || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Busca uma ficha de inspeção diretamente pelo ID sem filtro de postos
     * (usado na tela de detalhes)
     */
    async getFichaInspecaoByIdDireto(id: number): Promise<InspectionItem | null> {
        try {
            const apiUrl = localStorage.getItem("apiUrl");
            if (!apiUrl) {
                throw new Error("URL da API não está configurada");
            }

            // Aqui fazemos uma chamada direta para buscar apenas a ficha específica pelo ID
            // Usar o formato correto da URL conforme a API espera
            const response = await fetchWithAuth(`${apiUrl}/inspecao/fichas_inspecao?id_ficha_inspecao=${id}`, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar ficha de inspeção: ${response.status}`);
            }

            const data = await response.json();
            if (!data) return null;

            // Log para debug - verificar a estrutura dos dados recebidos
            console.log("Dados recebidos da API fichas_inspecao:", data);

            // Verifica se a API retornou um array e pega o primeiro item
            // Isso é comum quando a API retorna uma lista, mesmo que seja apenas um item
            if (Array.isArray(data) && data.length > 0) {
                return this.mapApiDataToInspectionItem(data[0]);
            } else if (typeof data === 'object' && data !== null) {
                // Se não for array, assume que é diretamente o objeto
                return this.mapApiDataToInspectionItem(data);
            }

            console.error("Formato de dados não esperado:", data);
            return null;
        } catch (error) {
            console.error("Erro ao buscar ficha de inspeção por ID:", error);
            throw error;
        }
    }
}

const definicaoService = new DefinicaoService();
export default definicaoService;
