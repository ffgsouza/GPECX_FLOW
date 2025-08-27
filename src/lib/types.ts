export interface Product {
  id: string;
  name: string;
  hardwareCostUSD: number;
  softwareCostUSD: number;
}

export interface Settings {
  exchangeRate: number;
  diRate: number;
  customsClearanceFee: number;
  technicalConsultingFee: number;
  storageFee: number;
  importTaxII: number;
  ipiTax: number;
  pisTax: number;
  cofinsTax: number;
  icmsTax: number;
  simplesNacionalTax: number;
  salesCommission: number;
}
