
interface InspectionItem {
    id: string;
    codigo: string;
    tipo: string;
    posto: string;
    responsavel: string;
    dataVencimento?: string;
    dataInicio?: string;
    dataConclusao?: string;
    dataAgendamento?: string;
    progresso?: number;
    status?: string;
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

interface CreateInspectionRequest {
    tipo: string;
    posto: string;
    responsavel: string;
    dataVencimento?: string;
    dataInicio?: string;
    dataAgendamento?: string;
    observacoes?: string;
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
     * Cria uma nova inspeção
     */
    async createInspection(inspection: CreateInspectionRequest): Promise<InspectionItem> {
        try {
            const response = await fetch(`${this.baseUrl}/inspections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(inspection),
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao criar inspeção:', error);
            throw error;
        }
    }

    /**
     * Atualiza uma inspeção existente
     */
    async updateInspection(id: string, updates: Partial<InspectionItem>): Promise<InspectionItem> {
        try {
            const response = await fetch(`${this.baseUrl}/inspections/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao atualizar inspeção:', error);
            throw error;
        }
    }

    /**
     * Atualiza o progresso de uma inspeção de qualidade
     */
    async updateProgress(id: string, progresso: number): Promise<InspectionItem> {
        try {
            const response = await fetch(`${this.baseUrl}/inspections/${id}/progress`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ progresso }),
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao atualizar progresso:', error);
            throw error;
        }
    }

    /**
     * Atualiza o status de uma inspeção
     */
    async updateStatus(id: string, status: string): Promise<InspectionItem> {
        try {
            const response = await fetch(`${this.baseUrl}/inspections/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            throw error;
        }
    }

    /**
     * Exclui uma inspeção
     */
    async deleteInspection(id: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/inspections/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error('Erro ao excluir inspeção:', error);
            throw error;
        }
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
    CreateInspectionRequest, InspectionData,
    InspectionFilters, InspectionItem
};

