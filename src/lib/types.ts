

export interface SaleProduct {
  id: string;
  name: string;
  name_lower?: string;
  description?: string;
  fiscalDescription?: string;
  internalNotes?: string;
  categoryId: string; 
  productTypeId: string;
  
  costUSD: number;
  imageUrl?: string | null;
  
  // Campos específicos para Hardware
  ncm?: string;
  netWeightKg?: number;

  // Campo específico para Software
  isSoftwarePisCofinsFree?: boolean;

  // Preço de referência para exibição na tabela
  finalSellPriceBRL?: number; 

  // Novo campo para compatibilidades explícitas
  compatibleWith?: string[];
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
}

export interface Company {
    id: string;
    nickname: string;
    cnpj: string;
    activityType: 'COMMERCE_FOCUS' | 'SERVICE_FOCUS';
    currentRevenueYear: number;
    simplesLimit: number;
    subLimit: number;
    logoUrl?: string;
}

export interface Quote {
    id: string;
    issuingCompanyId: string;
    // ... outros campos da proposta
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
  
  // Impostos Hardware
  hardware_importTaxII: number;
  hardware_ipiTax: number;
  hardware_pisTax: number;
  hardware_cofinsTax: number;
  hardware_icmsTax: number;
  
  // Impostos Software
  software_irpjTax: number;
  software_pisTax: number;
  software_cofinsTax: number;
  software_iofTax: number;
  software_issTax: number;

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
