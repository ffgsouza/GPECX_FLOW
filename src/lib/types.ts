
export interface SaleProduct {
  id: string;
  name: string;
  description: string;
  categoryId: string; 
  productTypeId: string;
  
  costUSD: number;
  
  // Campos específicos para Hardware
  ncm?: string;
  netWeightKg?: number;

  // Preço de referência para exibição na tabela
  finalSellPriceBRL: number; 
}

export interface SaleCategory {
  id: string;
  name: string;
}

export interface ProductType {
    id: string;
    name: string;
    requiresNcm: boolean;
    requiresWeight: boolean;
    imposesIpi: boolean;
}

// Representa a regra de imposto global para HARDWARE
export interface HardwareTaxRule {
  importTaxII: number; // II
  ipiTax: number;      // IPI
  pisTax: number;      // PIS
  cofinsTax: number;   // COFINS
  icmsTax: number;     // ICMS
}

// Representa a regra de imposto global para SOFTWARE
export interface SoftwareTaxRule {
  irpjTax: number;     // IRPJ + CSLL (Software)
  pisTax: number;      // PIS sobre serviço
  cofinsTax: number;   // COFINS sobre serviço
  iofTax: number;      // IOF (Software)
  issTax: number;      // ISS (Software)
}

export type TaxRule = HardwareTaxRule | SoftwareTaxRule;

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
