// Tipos para a Calculadora de Preço de Venda
export interface SaleProduct {
  id: string;
  name: string;
  description: string;
  categoryId: string; 
  hardwareCostUSD: number;
  softwareCostUSD: number;
  freightCostUSD: number;
  finalSellPriceBRL: number;
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
  financialFee: number; 
  bdiFee: number; 
  marginFee: number;
  salesDiscount: number;
}

export interface SaleCategory {
  id: string;
  name: string;
}


// Tipos para o Kingsine Quote Builder
export interface QuoteCategory {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface HardwareOption {
  id: string;
  name: string;
  price: number;
}

export interface SoftwareOption {
  id: string;
  name: string;
  price: number;
}

export interface QuoteProduct {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  hardwareOptions: HardwareOption[];
  softwareOptions: SoftwareOption[];
  compatibleAccessoryIds: string[];
}

export interface QuoteAccessory {
  id: string;
  name: string;
  price: number;
  isGlobal: boolean;
}
