import type { SaleProduct, SaleCategory, TaxRule, GlobalSettings } from './types';

// --- DADOS PARA A CALCULADORA DE PREÇO DE VENDA ---
export const INITIAL_SALE_CATEGORIES: SaleCategory[] = [
  { id: '1', name: 'Equipamento de Teste' },
  { id: '2', name: 'Software de Análise' },
];

// REGRAS DE IMPOSTO GLOBAIS
export const TAX_RULES: { [key: string]: TaxRule } = {
  HARDWARE: {
    importTaxII: 0.096, 
    ipiTax: 0.0325,
    pisTax: 0.021,
    cofinsTax: 0.0965,
    icmsTax: 0.18,
    irpjTax: 0,
    iofTax: 0,
    issTax: 0,
    hasSiscomex: true,
  },
  SOFTWARE: {
    importTaxII: 0, 
    ipiTax: 0,
    pisTax: 0.0165, // PIS sobre serviço
    cofinsTax: 0.076, // COFINS sobre serviço
    icmsTax: 0,
    irpjTax: 0.15, // IRPJ + CSLL (estimado)
    iofTax: 0.0038, // IOF Câmbio
    issTax: 0.05, // ISS da cidade do prestador
    hasSiscomex: false,
  }
};

// CONFIGURAÇÕES GLOBAIS DE DESPESAS E MARKUP
export const GLOBAL_SETTINGS: GlobalSettings = {
  exchangeRateUSD: 5.4,
  
  taxaSiscomex: 154.23,
  customsClearanceFee: 1050,
  technicalConsultingFee: 350,
  storageFee: 989.54,
  freteInternacionalTerceiro: 300,
  freteTerceirosDA: 300,
  desconsolidacaoUSD: 65,
  freightCostUSD: 575, // Frete principal para o lote de hardware
  swiftFee: 100, // Taxa bancária para remessa de software

  simplesNacionalTax: 0.155,
  salesCommission: 0.03,
  financialFee: 1500,
  bdiFee: 2500,
  marginFee: 0.15,
  salesDiscount: 0.05,
};

// Catálogo de Produtos e Licenças (agora como itens distintos)
export const INITIAL_SALE_PRODUCTS: SaleProduct[] = [
  { 
    id: 'HW-UTS500', 
    name: 'UTS 500 - Unidade de Hardware', 
    description: 'Sistema ultrassônico para detecção de defeitos em materiais (Apenas Hardware).', 
    categoryId: '1', 
    itemType: 'HARDWARE',
    costUSD: 2490, 
    ncm: '9031.80.99',
    netWeightKg: 15,
    finalSellPriceBRL: 0, // O preço final será calculado, não é um valor base.
  },
  { 
    id: 'SW-UTS500-BASE', 
    name: 'UTS 500 - Licença Base', 
    description: 'Licença de software para operação do UTS 500.', 
    categoryId: '2',
    itemType: 'SOFTWARE',
    costUSD: 5810, 
    finalSellPriceBRL: 0,
  },
  { 
    id: 'SW-ADDON-X', 
    name: 'Addon de Análise Avançada', 
    description: 'Módulo de software para análises complexas.', 
    categoryId: '2',
    itemType: 'SOFTWARE',
    costUSD: 1200, 
    finalSellPriceBRL: 0,
  },
];
