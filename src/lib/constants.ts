import type { Product, Settings } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'UTS 400', hardwareCostUSD: 1500, softwareCostUSD: 500 },
  { id: '2', name: 'UTS 500', hardwareCostUSD: 8300, softwareCostUSD: 0 },
  { id: '3', name: 'License A', hardwareCostUSD: 0, softwareCostUSD: 100 },
  { id: '4', name: 'License B', hardwareCostUSD: 0, softwareCostUSD: 250 },
];

export const INITIAL_SETTINGS: Settings = {
  exchangeRate: 6.5,
  diRate: 0.01, // 1% - Not in spreadsheet, keeping default
  taxaSiscomex: 154.23,
  customsClearanceFee: 1050,
  technicalConsultingFee: 350,
  storageFee: 989.54,
  freteInternacionalTerceiro: 300,
  freteTerceirosDA: 300,
  desconsolidacaoUSD: 65,
  importTaxII: 0, // Not in spreadsheet, assuming 0
  ipiTax: 0, // Not in spreadsheet, assuming 0
  pisTax: 0, // Not in spreadsheet, assuming 0
  cofinsTax: 0, // Not in spreadsheet, assuming 0
  icmsTax: 0, // Not in spreadsheet, assuming 0
  simplesNacionalTax: 0.155, // 15.5%
  salesCommission: 0.0, // 0%
};
