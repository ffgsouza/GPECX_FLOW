export interface Product {
  id: string;
  name: string;
  hardwareCostUSD: number;
  softwareCostUSD: number;
}

export interface Settings {
  exchangeRateUSD: number;
  exchangeRateCNY: number;
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
  simplesNacionalTax: number;
  salesCommission: number;
}
