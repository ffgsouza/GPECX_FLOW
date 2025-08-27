import type { Product, Settings } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '2', name: 'UTS 500', description: 'Sistema ultrassônico para detecção de defeitos em materiais.', category: 'Equipamento de Teste', hardwareCostUSD: 2490, softwareCostUSD: 5810, freightCostUSD: 575, finalSellPriceBRL: 150000 },
];

export const INITIAL_SETTINGS: Settings = {
  exchangeRateUSD: 6.5,
  exchangeRateCNY: 0.75,
  exchangeClosingFee: 0, // 0%
  diRate: 0.01, // 1%
  taxaSiscomex: 154.23,
  customsClearanceFee: 1050,
  technicalConsultingFee: 350,
  storageFee: 989.54,
  freteInternacionalTerceiro: 300,
  freteTerceirosDA: 300,
  desconsolidacaoUSD: 65,
  importTaxII: 0.096, 
  ipiTax: 0.0325,
  pisTax: 0.021,
  cofinsTax: 0.0965,
  icmsTax: 0.18,
  irpjTax: 0.18, // 18%
  iofTax: 0.0038, // 0.38%
  issTax: 0.05, // 5%
  swiftFee: 100, // R$ 100
  simplesNacionalTax: 0.155, // 15.5%
  salesCommission: 0.0, // 0%
  financialFee: 5, // Valor Fixo BRL
  bdiFee: 1000, // Valor Fixo BRL
  marginFee: 0,
  salesDiscount: 0,
};
