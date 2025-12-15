
// Tipos para a Calculadora de Preço de Venda
export interface SaleProduct {
  id: string;
  name: string;
  description: string;
  categoryId: string; 
  
  // Novo campo para diferenciar o tipo de item
  itemType: 'HARDWARE' | 'SOFTWARE';
  
  // Custos Base em USD
  costUSD: number;
  
  // Campos específicos para Hardware
  ncm?: string;
  netWeightKg?: number;

  // Preço de referência para exibição na tabela
  finalSellPriceBRL: number; 
  
  // As taxas individuais foram removidas daqui, pois serão gerenciadas por regras globais.
}

export interface SaleCategory {
  id: string;
  name: string;
}

// Representa a regra de imposto global
export interface TaxRule {
  importTaxII: number; // II
  ipiTax: number;      // IPI
  pisTax: number;      // PIS
  cofinsTax: number;   // COFINS
  icmsTax: number;     // ICMS
  irpjTax: number;     // IRPJ + CSLL (Software)
  iofTax: number;      // IOF (Software)
  issTax: number;      // ISS (Software)
  hasSiscomex: boolean;
}

// Representa as despesas e taxas de venda
export interface GlobalSettings {
  exchangeRateUSD: number;
  
  // Despesas de Importação Fixas (BRL)
  taxaSiscomex: number;
  customsClearanceFee: number;
  technicalConsultingFee: number;
  storageFee: number;
  freteInternacionalTerceiro: number;
  freteTerceirosDA: number;
  swiftFee: number;

  // Despesas de Importação Variáveis (USD)
  desconsolidacaoUSD: number;
  freightCostUSD: number; // Custo do frete principal para o lote

  // Variáveis de Venda / Markup (percentual e fixo)
  simplesNacionalTax: number; // Imposto sobre a venda
  salesCommission: number;    // Comissão
  financialFee: number;       // Custo Financeiro Fixo (BRL)
  bdiFee: number;             // BDI / Custo Administrativo Fixo (BRL)
  marginFee: number;          // Margem de Lucro Bruta
  salesDiscount: number;      // Desconto de Venda (aplicado no final)
}

