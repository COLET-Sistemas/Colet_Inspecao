import { fetchWithAuth } from "./authInterceptor";

// Add interface for collaborator response
interface ColaboradorResponse {
    codigo_pessoa: string;
    nome: string;
    setor: string;
    funcao: string;
    registrar_ficha: boolean;
    encaminhar_ficha: boolean;
}

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
    tipo_inspecao: string;
    id_tipo_inspecao?: number;
    tipo_acao?: string | null;
    produto?: string | null;
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

interface InspectionSpecificationResponse {
    id_ficha_inspecao: number;
    id_tipo_inspecao: number | null;
    descricao_tipo_inspecao?: string | null;
    situacao: string | null;
    qtde_produzida: number | null;
    qtde_inspecionada: number | null;
    exibe_faixa: string;
    exibe_resultado: string;
    especificacoes: InspectionSpecification[];
}

interface InspectionSpecification {
    id_especificacao: number;
    ordem: number;
    id_tipo_instrumento: number;
    tipo_instrumento: string;
    id_caracteristica: number;
    descricao_caracteristica: string;
    svg_caracteristica: string | null;
    id_cota: number;
    descricao_cota: string;
    svg_cota: string | null;
    local_inspecao: string;
    complemento_cota: string | null;
    valor_minimo: number | null;
    valor_maximo: number | null;
    unidade_medida: string;
    tipo_valor: string; // F (Float), U (Unit), A (Aprovado/Reprovado), C (Conforme/Não Conforme), S (Sim/Não), L (Liberdade/Retido)
    valor_encontrado?: number | null;
    conforme?: boolean | null;
    observacao?: string | null;
    ocorrencias_nc?: Array<{
        quantidade: number;
        maior_menor: string;
        menor_valor: number | null;
        maior_valor: number | null;
    }>;
}

class InspecaoService {
    private baseUrl: string;

    constructor(baseUrl: string = '/api') {
        this.baseUrl = baseUrl;
    }

    async getAllInspections(): Promise<InspectionData> {
        try {
            const response = await fetch(`${this.baseUrl}/inspections`, {
                credentials: 'include'
            });

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

    async getFilteredInspections(filters: InspectionFilters): Promise<InspectionData> {
        try {
            const params = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, value);
                }
            });

            const response = await fetch(`${this.baseUrl}/inspections?${params.toString()}`, {
                credentials: 'include'
            });

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

    async getInspectionById(id: string): Promise<InspectionItem> {
        try {
            const response = await fetch(`${this.baseUrl}/inspections/${id}`, {
                credentials: 'include'
            });

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
            }
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

            const response = await fetchWithAuth(`${apiUrl}/inspecao/fichas_inspecao?codigo_posto=${postosParam}&aba=${aba}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            } const data: ApiInspectionItem[] = await response.json();
            const mappedData = Array.isArray(data) ? data.map(item => this.mapApiDataToInspectionItem(item)) : [];
            return mappedData;
        } catch (error) {
            throw error;
        }
    }
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
            tipo_inspecao: apiItem.tipo_inspecao || '',
            id_tipo_inspecao: apiItem.id_tipo_inspecao || 0,
            tipo_acao: apiItem.tipo_acao || null,
            produto: apiItem.produto || null,
        };
    }

    async getInspectionSpecifications(id: number): Promise<{
        specifications: InspectionSpecification[],
        fichaDados: Omit<InspectionSpecificationResponse, 'especificacoes'>
    }> {
        try {
            if (!id) {
                throw new Error("ID da ficha de inspeção é obrigatório");
            }

            const apiUrl = localStorage.getItem("apiUrl");
            if (!apiUrl) {
                throw new Error("URL da API não está configurada");
            }

            console.log(`Buscando especificações para ID: ${id}`);
            const response = await fetchWithAuth(`${apiUrl}/inspecao/especificacoes_inspecao?id=${id}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            if (data && data.especificacoes) {
                const response = data as InspectionSpecificationResponse;
                return {
                    specifications: response.especificacoes || [], fichaDados: {
                        id_ficha_inspecao: response.id_ficha_inspecao,
                        id_tipo_inspecao: response.id_tipo_inspecao,
                        descricao_tipo_inspecao: response.descricao_tipo_inspecao || null,
                        situacao: response.situacao,
                        qtde_produzida: response.qtde_produzida,
                        qtde_inspecionada: response.qtde_inspecionada || null,
                        exibe_faixa: response.exibe_faixa,
                        exibe_resultado: response.exibe_resultado
                    }
                };
            }
            return {
                specifications: Array.isArray(data) ? data : [], fichaDados: {
                    id_ficha_inspecao: id,
                    id_tipo_inspecao: null,
                    descricao_tipo_inspecao: null,
                    situacao: null,
                    qtde_produzida: null,
                    qtde_inspecionada: null,
                    exibe_faixa: 'S',
                    exibe_resultado: 'S'
                } as Omit<InspectionSpecificationResponse, 'especificacoes'>
            };
        } catch (error) {
            console.error(`Erro ao buscar especificações da ficha ${id}:`, error);
            throw error;
        }
    }
    async updateInspectionSpecification(idEspecificacao: number, data: {
        valor_encontrado: number | string;
        conforme: boolean | null;
        observacao?: string | null;
        tipo_valor?: string;
    }): Promise<InspectionSpecification> {
        try {
            const apiUrl = localStorage.getItem("apiUrl");
            if (!apiUrl) {
                throw new Error("URL da API não está configurada");
            }
            const processedData: {
                valor_encontrado: number | string | null;
                conforme: boolean | string | null;
                observacao?: string | null;
                tipo_valor?: string;
            } = { ...data };

            // Para os tipos A, C, S, L (Aprovado/Reprovado, Conforme/Não Conforme, etc)
            if (data.tipo_valor && ['A', 'C', 'S', 'L'].includes(data.tipo_valor)) {
                if (data.conforme === true) {
                    processedData.conforme = 'S';
                } else if (data.conforme === false) {
                    processedData.conforme = 'N';
                } else {
                    processedData.conforme = null;
                }
                processedData.valor_encontrado = null;
            }

            delete processedData.tipo_valor;

            const response = await fetchWithAuth(`${apiUrl}/inspecao/especificacoes/${idEspecificacao}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(processedData)
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const updatedData: InspectionSpecification = await response.json();
            return updatedData;
        } catch (error) {
            console.error(`Erro ao atualizar especificação ${idEspecificacao}:`, error);
            throw error;
        }
    }


    async getInspectionStats(): Promise<{
        total: number;
        porTipo: Record<string, number>;
        porStatus: Record<string, number>;
        atrasadas: number;
        concluidas: number;
    }> {
        try {
            const response = await fetch(`${this.baseUrl}/inspections/stats`, {
                credentials: 'include'
            });

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
    async startInspection(idFichaInspecao: number): Promise<void> {
        try {
            const apiUrl = localStorage.getItem("apiUrl");
            if (!apiUrl) {
                throw new Error("URL da API não está configurada");
            }

            let codigo_pessoa = null;
            const userDataStr = localStorage.getItem("userData");
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    if (userData && userData.codigo_pessoa) {
                        codigo_pessoa = userData.codigo_pessoa;
                    }
                } catch (e) {
                    console.error("Erro ao parsear userData do localStorage:", e);
                }
            }

            // Se não encontrou no userData, busca diretamente no localStorage
            if (!codigo_pessoa) {
                codigo_pessoa = localStorage.getItem("codigo_pessoa");
            }

            // Convertendo o código de pessoa para número (pode ser null)
            const codigo_pessoa_num = codigo_pessoa ? parseInt(codigo_pessoa) : null;

            const response = await fetchWithAuth(`${apiUrl}/inspecao/especificacoes_inspecao`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_ficha_inspecao: idFichaInspecao,
                    acao: "iniciar",
                    codigo_pessoa: codigo_pessoa_num
                })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error('Erro ao iniciar inspeção:', error);
            throw error;
        }
    }

    async authColaborador(codigoPessoa: string, senhaCriptografada: string): Promise<ColaboradorResponse> {
        try {
            const apiUrl = localStorage.getItem("apiUrl");
            if (!apiUrl) {
                throw new Error("URL da API não está configurada");
            }

            const response = await fetchWithAuth(`${apiUrl}/inspecao/colaboradores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    codigo_pessoa: codigoPessoa,
                    senha_criptografada: senhaCriptografada
                })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data: ColaboradorResponse = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao autenticar colaborador:', error);
            throw error;
        }
    }    /**
     * Encaminha uma ficha de inspeção para o CQ (Controle de Qualidade)
     * @param idFichaInspecao - ID da ficha de inspeção
     */
    async forwardToCQ(idFichaInspecao: number): Promise<void> {
        try {
            const apiUrl = localStorage.getItem("apiUrl");
            if (!apiUrl) {
                throw new Error("URL da API não está configurada");
            }

            // Tenta obter o código da pessoa, mas não é mais obrigatório
            let codigo_pessoa = null;
            const userDataStr = localStorage.getItem("userData");
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    if (userData && userData.codigo_pessoa) {
                        codigo_pessoa = userData.codigo_pessoa;
                    }
                } catch (e) {
                    console.error("Erro ao parsear userData do localStorage:", e);
                }
            }

            // Se não encontrou no userData, busca diretamente no localStorage
            if (!codigo_pessoa) {
                codigo_pessoa = localStorage.getItem("codigo_pessoa");
            }

            // Convertendo o código de pessoa para número (pode ser null)
            const codigo_pessoa_num = codigo_pessoa ? parseInt(codigo_pessoa) : null;

            const response = await fetchWithAuth(`${apiUrl}/inspecao/especificacoes_inspecao`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_ficha_inspecao: idFichaInspecao,
                    acao: "encaminhar",
                    codigo_pessoa: codigo_pessoa_num
                })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error('Erro ao encaminhar inspeção para CQ:', error);
            throw error;
        }
    }

    async confirmReceipt(idFichaInspecao: number): Promise<void> {
        try {
            const apiUrl = localStorage.getItem("apiUrl");
            if (!apiUrl) {
                throw new Error("URL da API não está configurada");
            }

            let codigo_pessoa = null;
            const userDataStr = localStorage.getItem("userData");
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    if (userData && userData.codigo_pessoa) {
                        codigo_pessoa = userData.codigo_pessoa;
                    }
                } catch (e) {
                    console.error("Erro ao parsear userData do localStorage:", e);
                }
            }

            // Se não encontrou no userData, busca diretamente no localStorage
            if (!codigo_pessoa) {
                codigo_pessoa = localStorage.getItem("codigo_pessoa");
            }

            // Convertendo o código de pessoa para número (pode ser null)
            const codigo_pessoa_num = codigo_pessoa ? parseInt(codigo_pessoa) : null;

            const response = await fetchWithAuth(`${apiUrl}/inspecao/especificacoes_inspecao`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_ficha_inspecao: idFichaInspecao,
                    acao: "receber",
                    codigo_pessoa: codigo_pessoa_num
                })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error('Erro ao confirmar recebimento da inspeção:', error);
            throw error;
        }
    }

    async interruptInspection(
        idFichaInspecao: number,
        apontamentos: Array<{
            id_especificacao: number;
            valor_encontrado: string | number | null;
            conforme: boolean | null;
            observacao: string | null;
            ocorrencias_nc?: Array<{
                quantidade: number;
                maior_menor: string;
                menor_valor: number | null;
                maior_valor: number | null;
            }>;
        }>,
        qtdeProduzida: number | null = null,
        qtdeInspecionada: number | null = null): Promise<void> {
        try {
            const apiUrl = localStorage.getItem("apiUrl");
            if (!apiUrl) {
                throw new Error("URL da API não está configurada");
            }
            let codigo_pessoa = null;
            const userDataStr = localStorage.getItem("userData");
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    if (userData && userData.codigo_pessoa) {
                        codigo_pessoa = userData.codigo_pessoa;
                    }
                } catch (e) {
                    console.error("Erro ao parsear userData do localStorage:", e);
                }
            }

            if (!codigo_pessoa) {
                codigo_pessoa = localStorage.getItem("codigo_pessoa");
            }

            const codigo_pessoa_num = codigo_pessoa ? parseInt(codigo_pessoa) : null;

            const apontamentosProcessados = apontamentos.map(item => {
                const ocorrenciasNc = Array.isArray(item.ocorrencias_nc) ? item.ocorrencias_nc : [];

                if (item.conforme === true || item.conforme === false) {
                    return {
                        id_especificacao: item.id_especificacao,
                        valor_encontrado: null,
                        conforme: item.conforme === true ? 'S' : 'N',
                        observacao: item.observacao,
                        ocorrencias_nc: ocorrenciasNc
                    };
                }
                return {
                    ...item,
                    ocorrencias_nc: ocorrenciasNc
                };
            });

            const apontamentosPreenchidos = apontamentosProcessados;

            const response = await fetchWithAuth(`${apiUrl}/inspecao/especificacoes_inspecao`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_ficha_inspecao: idFichaInspecao,
                    apontamentos: apontamentosPreenchidos,
                    acao: "interromper",
                    codigo_pessoa: codigo_pessoa_num,
                    qtde_produzida: qtdeProduzida,
                    qtde_inspecionada: qtdeInspecionada
                })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error('Erro ao interromper inspeção:', error);
            throw error;
        }
    }

    async finalizeInspection(
        idFichaInspecao: number,
        apontamentos: Array<{
            id_especificacao: number;
            valor_encontrado: string | number | null;
            conforme: boolean | null;
            observacao: string | null;
            ocorrencias_nc?: Array<{
                quantidade: number;
                maior_menor: string;
                menor_valor: number | null;
                maior_valor: number | null;
            }>;
        }>,
        qtdeProduzida: number | null = null,
        isTipoInspecao9: boolean = false,
        qtdeInspecionada: number | null = null): Promise<{ mensagem?: string; erro?: string }> {
        try {
            const apiUrl = localStorage.getItem("apiUrl");
            if (!apiUrl) {
                throw new Error("URL da API não está configurada");
            }

            // Tenta obter o código da pessoa do localStorage
            let codigo_pessoa = null;
            const userDataStr = localStorage.getItem("userData");
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    codigo_pessoa = userData.codigo_pessoa;
                } catch (e) {
                    console.error("Erro ao analisar dados do usuário:", e);
                }
            }

            // Se não encontrou no userData, busca diretamente no localStorage
            if (!codigo_pessoa) {
                codigo_pessoa = localStorage.getItem("codigo_pessoa");
            }
            // Convertendo o código de pessoa para número (pode ser null)
            const codigo_pessoa_num = codigo_pessoa ? parseInt(codigo_pessoa) : null;

            // Processar os apontamentos antes de enviá-los
            const apontamentosProcessados = apontamentos.map(item => {
                // Preservar ocorrencias_nc sempre - para tipo 9 é essencial
                // Garantir que ocorrencias_nc seja sempre um array, mesmo que vazio
                const ocorrenciasNc = Array.isArray(item.ocorrencias_nc) ? item.ocorrencias_nc : [];

                // Não temos acesso direto às especificações, mas podemos verificar 
                // se conforme é boolean e converter para S/N
                if (item.conforme === true || item.conforme === false) {
                    return {
                        id_especificacao: item.id_especificacao,
                        valor_encontrado: null,
                        conforme: item.conforme === true ? 'S' : 'N',
                        observacao: item.observacao,
                        ocorrencias_nc: ocorrenciasNc
                    };
                }
                return {
                    ...item,
                    ocorrencias_nc: ocorrenciasNc
                };
            });

            // Para tipo 9, não filtrar nenhum apontamento, todos são importantes
            // principalmente os que têm ocorrencias_nc
            const apontamentosPreenchidos = isTipoInspecao9
                ? apontamentosProcessados
                : apontamentosProcessados.filter(
                    item => item.valor_encontrado !== null || item.observacao || item.conforme !== null || item.ocorrencias_nc.length > 0
                );

            const response = await fetchWithAuth(`${apiUrl}/inspecao/especificacoes_inspecao`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_ficha_inspecao: idFichaInspecao,
                    apontamentos: apontamentosPreenchidos,
                    acao: "finalizar",
                    codigo_pessoa: codigo_pessoa_num,
                    qtde_produzida: qtdeProduzida,
                    qtde_inspecionada: isTipoInspecao9 ? qtdeInspecionada : undefined
                })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            // Retornar os dados da resposta para que possamos acessar a mensagem/erro
            return await response.json();
        } catch (error) {
            console.error('Erro ao finalizar inspeção:', error);
            throw error;
        }
    }

    /**
     * Atualiza as quantidades de uma ficha de inspeção
     */
    async updateQuantities(idFicha: number, data: {
        qtde_produzida: number | null;
        qtde_inspecionada: number | null;
    }): Promise<{ success: boolean; message?: string }> {
        try {
            const apiUrl = localStorage.getItem("apiUrl");
            if (!apiUrl) {
                throw new Error("URL da API não está configurada");
            }

            // Obter código da pessoa do localStorage
            const userData = localStorage.getItem("userData");
            if (!userData) {
                throw new Error("Dados do usuário não encontrados");
            }

            const { codigo_pessoa } = JSON.parse(userData);
            if (!codigo_pessoa) {
                throw new Error("Código da pessoa não encontrado");
            }

            const response = await fetchWithAuth(`${apiUrl}/inspecao/fichas/${idFicha}/quantidades`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    codigo_pessoa
                })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            return { success: true, message: "Quantidades atualizadas com sucesso" };
        } catch (error) {
            console.error(`Erro ao atualizar quantidades da ficha ${idFicha}:`, error);
            throw error;
        }
    }
}

// Instância singleton do serviço
const inspecaoService = new InspecaoService();

export default inspecaoService;
export type {
    ColaboradorResponse, InspectionData,
    InspectionFilters,
    InspectionItem,
    InspectionSpecification
};

