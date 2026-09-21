// Serviço de consulta de CNPJ via BrasilAPI pública
// Endpoint: https://brasilapi.com.br/api/cnpj/v1/{cnpj}

export interface CnpjLookupResult {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  situacaoCadastral?: string;
  email?: string;
  phone?: string;
  municipio?: string;
  uf?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
}

export const cnpjService = {
  // Consulta dados públicos de CNPJ na BrasilAPI com timeout de 5 segundos
  lookup: async (cnpj: string): Promise<CnpjLookupResult | null> => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      return null;
    }

    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
        {
          signal: AbortSignal.timeout(5000),
        },
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      return {
        cnpj: data.cnpj || cleanCnpj,
        razaoSocial: data.razao_social || '',
        nomeFantasia: data.nome_fantasia || '',
        situacaoCadastral: data.descricao_situacao_cadastral || '',
        email: data.email ? String(data.email).toLowerCase() : undefined,
        phone: data.ddd_telefone_1 || undefined,
        municipio: data.municipio || undefined,
        uf: data.uf || undefined,
        logradouro: data.logradouro || undefined,
        numero: data.numero || undefined,
        bairro: data.bairro || undefined,
        cep: data.cep || undefined,
      };
    } catch {
      // Resiliente: nunca bloqueia a interface ou lança exceções
      return null;
    }
  },
};
