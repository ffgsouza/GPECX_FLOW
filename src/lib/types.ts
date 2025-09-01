export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string; // Changed from category
  hardwareCostUSD: number;
  softwareCostUSD: number;
  freightCostUSD: number;
  finalSellPriceBRL: number;
  // Settings moved from global to per-product
  exchangeRateUSD: number;
  exchangeRateCNY: number;
  exchangeClosingFee: number;
  diRate: number;
  taxaSiscomex: number;
  customsClearanceFee: number;
  technicalConsultingFee: number;
  storageFee: number;
  freteInternacionalTerceiro: number;
  freteTerceirosDA: number;
  desconsolidacaoUSD: number;
  importTaxII: number;
  ipiTax: number;
  pisTax: number;
  cofinsTax: number;
  icmsTax: number;
  irpjTax: number;
  iofTax: number;
  issTax: number;
  swiftFee: number;
  simplesNacionalTax: number;
  salesCommission: number;
  financialFee: number; // Agora é um valor fixo em BRL
  bdiFee: number; // Agora é um valor fixo em BRL
  marginFee: number;
  salesDiscount: number;
}

export interface Category {
  id: string;
  name: string;
}
