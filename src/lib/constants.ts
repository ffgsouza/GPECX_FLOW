import type { Product, Settings } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'UTS 400', hardwareCostUSD: 1500, softwareCostUSD: 500, freightCostBRL: 200 },
  { id: '2', name: 'UTS 500', hardwareCostUSD: 8300, softwareCostUSD: 0, freightCostBRL: 500 },
  { id: '3', name: 'License A', hardwareCostUSD: 0, softwareCostUSD: 100, freightCostBRL: 0 },
  { id: '4', name: 'License B', hardwareCostUSD: 0, softwareCostUSD: 250, freightCostBRL: 0 },
];

export const INITIAL_SETTINGS: Settings = {
  exchangeRateUSD: 5.5,
  exchangeRateCNY: 0.75,
  exchangeClosingFee: 0.002, // 0.2%
  diRate: 0.01, // 1%
  taxaSiscomex: 154.23,
  customsClearanceFee: 1050,
  technicalConsultingFee: 350,
  storageFee: 989.54,
  freteInternacionalTerceiro: 300,
  freteTerceirosDA: 300,
  desconsolidacaoUSD: 65,
  importTaxII: 0.1, 
  ipiTax: 0.05,
  pisTax: 0.02,
  cofinsTax: 0.09,
  icmsTax: 0.18,
  simplesNacionalTax: 0.155, // 15.5%
  salesCommission: 0.0, // 0%
};
