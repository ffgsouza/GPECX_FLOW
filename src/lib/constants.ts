import type { SaleProduct, SaleCategory } from './types';

// --- DADOS PARA A CALCULADORA DE PREÇO DE VENDA ---
export const INITIAL_SALE_CATEGORIES: SaleCategory[] = [
  { id: '1', name: 'Equipamento de Teste' },
  { id: '2', name: 'Software de Análise' },
];

export const INITIAL_SALE_PRODUCTS: SaleProduct[] = [
  { 
    id: '1', 
    name: 'UTS 500', 
    description: 'Sistema ultrassônico para detecção de defeitos em materiais.', 
    categoryId: '1', 
    hardwareCostUSD: 2490, 
    softwareCostUSD: 5810, 
    freightCostUSD: 575, 
    finalSellPriceBRL: 150000,
    exchangeRateUSD: 6.5,
    exchangeRateCNY: 0.75,
    exchangeClosingFee: 0,
    diRate: 0.01,
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
    irpjTax: 0.18,
    iofTax: 0.035,
    issTax: 0.05,
    swiftFee: 100,
    simplesNacionalTax: 0.155,
    salesCommission: 0.0,
    financialFee: 5,
    bdiFee: 1000,
    marginFee: 0,
    salesDiscount: 0,
  },
];
