import type { SaleProduct, SaleCategory, TaxRule, GlobalSettings, ProductType } from './types';

// --- DADOS PARA A CALCULADORA DE PREÇO DE VENDA ---
export const INITIAL_SALE_CATEGORIES: SaleCategory[] = [
  { id: 'cat-1', name: 'Equipamento de Teste' },
  { id: 'cat-2', name: 'Software de Análise' },
];

export const INITIAL_PRODUCT_TYPES: ProductType[] = [
    { id: 'pt-hardware', name: 'Hardware', requiresNcm: true, requiresWeight: true, imposesIpi: true },
    { id: 'pt-software', name: 'Software', requiresNcm: false, requiresWeight: false, imposesIpi: false },
    { id: 'pt-service', name: 'Serviço', requiresNcm: false, requiresWeight: false, imposesIpi: false },
]

// REGRAS DE IMPOSTO GLOBAIS
export const TAX_RULES: { [key: string]: TaxRule } = {
  HARDWARE: {
    importTaxII: 0.096, 
    ipiTax: 0.0325,
    pisTax: 0.021,
    cofinsTax: 0.0965,
    icmsTax: 0.18,
  },
  SOFTWARE: {
    irpjTax: 0.15, // IRPJ + CSLL (estimado)
    pisTax: 0.0165, // PIS sobre serviço
    cofinsTax: 0.076, // COFINS sobre serviço
    iofTax: 0.0038, // IOF Câmbio
    issTax: 0.05, // ISS da cidade do prestador
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
    categoryId: 'cat-1', 
    productTypeId: 'pt-hardware',
    costUSD: 2490, 
    ncm: '9031.80.99',
    netWeightKg: 15,
    finalSellPriceBRL: 0,
  },
  { 
    id: 'SW-UTS500-BASE', 
    name: 'UTS 500 - Licença Base', 
    description: 'Licença de software para operação do UTS 500.', 
    categoryId: 'cat-2',
    productTypeId: 'pt-software',
    costUSD: 5810, 
    finalSellPriceBRL: 0,
  },
  { 
    id: 'SW-ADDON-X', 
    name: 'Addon de Análise Avançada', 
    description: 'Módulo de software para análises complexas.', 
    categoryId: 'cat-2',
    productTypeId: 'pt-software',
    costUSD: 1200, 
    finalSellPriceBRL: 0,
  },
];
