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
    finalSellPriceBRL: 150000,
    
    // Configurações Globais de Câmbio
    exchangeRateUSD: 5.4,
    exchangeRateCNY: 0.75,
    
    // Despesas Aduaneiras e Frete (Fixas em BRL e Variáveis em USD)
    taxaSiscomex: 154.23,
    customsClearanceFee: 1050,
    technicalConsultingFee: 350,
    storageFee: 989.54,
    freteInternacionalTerceiro: 300,
    freteTerceirosDA: 300,
    desconsolidacaoUSD: 65,

    // Impostos de Importação sobre HARDWARE + FRETE (%)
    importTaxII: 0.096, 
    ipiTax: 0.0325,
    pisTax: 0.021,
    cofinsTax: 0.0965,
    icmsTax: 0.18,

    // Impostos sobre SOFTWARE (Serviço) (%)
    irpjTax: 0.15, // IRPJ + CSLL (estimado)
    iofTax: 0.0038, // IOF Câmbio
    issTax: 0.05, // ISS da cidade do prestador
    swiftFee: 100, // Taxa bancária fixa (em BRL) para remessa

    // Markup de Venda (Interno) (%)
    simplesNacionalTax: 0.155, // Imposto sobre a venda (faturamento)
    salesCommission: 0.03,     // Comissão de Venda
    financialFee: 1500,        // Custo financeiro fixo na venda (em BRL)
    bdiFee: 2500,              // Benefícios e Despesas Indiretas (fixo em BRL)
    marginFee: 0.15,           // Margem de Lucro desejada
    salesDiscount: 0.05,       // Desconto padrão na venda
  },
];

    