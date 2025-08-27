import type { Product, Settings } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'UTS 400', hardwareCostUSD: 1500, softwareCostUSD: 500 },
  { id: '2', name: 'UTS 500', hardwareCostUSD: 2500, softwareCostUSD: 750 },
  { id: '3', name: 'License A', hardwareCostUSD: 0, softwareCostUSD: 100 },
  { id: '4', name: 'License B', hardwareCostUSD: 0, softwareCostUSD: 250 },
];

export const INITIAL_SETTINGS: Settings = {
  exchangeRate: 5.25,
  diRate: 0.01, // 1%
  customsClearanceFee: 500,
  technicalConsultingFee: 200,
  storageFee: 150,
  importTaxII: 0.18, // 18%
  ipiTax: 0.15, // 15%
  pisTax: 0.0165, // 1.65%
  cofinsTax: 0.076, // 7.6%
  icmsTax: 0.17, // 17%
  simplesNacionalTax: 0.06, // 6%
  salesCommission: 0.03, // 3%
};
