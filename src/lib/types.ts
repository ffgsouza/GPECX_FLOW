
// Tipos para a Calculadora de Preço de Venda
export interface SaleProduct {
  id: string;
  name: string;
  description: string;
  categoryId: string; 
  
  // Custos Base em USD
  hardwareCostUSD: number;
  softwareCostUSD: number;
  freightCostUSD: number;
  
  // Preço de referência para exibição na tabela
  finalSellPriceBRL: number; 
  
  // Configurações de Câmbio
  exchangeRateUSD: number;
  exchangeRateCNY: number;

  // Despesas de Importação Fixas (BRL)
  taxaSiscomex: number;
  customsClearanceFee: number;
  technicalConsultingFee: number;
  storageFee: number;
  freteInternacionalTerceiro: number;
  freteTerceirosDA: number;

  // Despesas de Importação Variáveis (USD)
  desconsolidacaoUSD: number;

  // Taxas de Importação sobre HARDWARE (percentual)
  importTaxII: number; // II
  ipiTax: number;      // IPI
  pisTax: number;      // PIS
  cofinsTax: number;   // COFINS
  icmsTax: number;     // ICMS

  // Taxas sobre SOFTWARE (percentual)
  irpjTax: number;     // IRPJ + CSLL
  iofTax: number;      // IOF
  issTax: number;      // ISS

  // Despesas Fixas sobre Software (BRL)
  swiftFee: number;

  // Variáveis de Venda / Markup (percentual e fixo)
  simplesNacionalTax: number; // Imposto sobre a venda
  salesCommission: number;    // Comissão
  financialFee: number;       // Custo Financeiro Fixo (BRL)
  bdiFee: number;             // BDI / Custo Administrativo Fixo (BRL)
  marginFee: number;          // Margem de Lucro Bruta
  salesDiscount: number;      // Desconto de Venda (aplicado no final)
}

export interface SaleCategory {
  id: string;
  name: string;
}

    
