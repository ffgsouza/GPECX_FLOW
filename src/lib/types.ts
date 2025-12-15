// Tipos para a Calculadora de Preço de Venda
export interface SaleProduct {
  id: string;
  name: string;
  description: string;
  categoryId: string; 
  hardwareCostUSD: number;
  softwareCostUSD: number;
  freightCostUSD: number;
  finalSellPriceBRL: number; // Este valor agora será o ponto de referência para o cálculo
  
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

  // Taxas de Importação (percentual)
  importTaxII: number; // II
  ipiTax: number;      // IPI
  pisTax: number;      // PIS
  cofinsTax: number;   // COFINS
  icmsTax: number;     // ICMS

  // Taxas sobre Software (percentual)
  irpjTax: number;     // IRPJ + CSLL
  iofTax: number;      // IOF
  issTax: number;      // ISS

  // Despesas Fixas sobre Software (BRL)
  swiftFee: number;

  // Variáveis de Venda / Markup (percentual)
  simplesNacionalTax: number; // Imposto sobre a venda
  salesCommission: number;    // Comissão
  financialFee: number;       // Custo Financeiro (pode ser percentual ou fixo)
  bdiFee: number;             // BDI / Custo Fixo Administrativo (pode ser percentual ou fixo)
  marginFee: number;          // Margem de Lucro Bruta
  salesDiscount: number;      // Desconto de Venda (aplicado no final)

  // Campos não utilizados diretamente no novo cálculo, mas podem ser úteis para referência
  diRate: number;
  exchangeClosingFee: number;
}

export interface SaleCategory {
  id: string;
  name: string;
}
