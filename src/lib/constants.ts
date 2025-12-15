import type { SaleProduct, SaleCategory } from './types';

// --- DADOS PARA A CALCULADORA DE PREÇO DE VENDA ---
export const INITIAL_SALE_CATEGORIES: SaleCategory[] = [
  { id: '1', name: 'Equipamento de Teste' },
  { id: '2', name: 'Software de Análise' },
];

// Valores de exemplo para um produto. No sistema final, isso viria de um painel de configurações.
export const INITIAL_SALE_PRODUCTS: SaleProduct[] = [
  { 
    id: '1', 
    name: 'UTS 500', 
    description: 'Sistema ultrassônico para detecção de defeitos em materiais.', 
    categoryId: '1', 
    hardwareCostUSD: 2490, 
    softwareCostUSD: 5810, 
    freightCostUSD: 575, 
    finalSellPriceBRL: 150000, // Usado como preço de referência para calcular as despesas de venda
    
    // Configurações
    exchangeRateUSD: 5.4,
    exchangeRateCNY: 0.75,
    exchangeClosingFee: 0.015, // Não usado no novo cálculo
    diRate: 0.01, // Não usado no novo cálculo
    
    // Despesas Aduaneiras e Frete (BRL e USD)
    taxaSiscomex: 154.23,
    customsClearanceFee: 1050,
    technicalConsultingFee: 350,
    storageFee: 989.54,
    freteInternacionalTerceiro: 300,
    freteTerceirosDA: 300,
    desconsolidacaoUSD: 65,

    // Impostos de Importação (%)
    importTaxII: 0.096, 
    ipiTax: 0.0325,
    pisTax: 0.021,
    cofinsTax: 0.0965,
    icmsTax: 0.18,

    // Impostos sobre Software (%)
    irpjTax: 0.18, // IRPJ + CSLL
    iofTax: 0.0038, // IOF Câmbio
    issTax: 0.05,
    swiftFee: 100, // Taxa bancária fixa

    // Markup de Venda (%)
    simplesNacionalTax: 0.155, // Imposto sobre a venda
    salesCommission: 0.03,     // Comissão
    financialFee: 1500,        // Custo financeiro fixo na venda
    bdiFee: 2500,              // Despesas e Benefícios Indiretos fixo
    marginFee: 0.15,           // Margem de Lucro desejada
    salesDiscount: 0.05,       // Desconto padrão
  },
];
