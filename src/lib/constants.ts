import type { GlobalSettings } from './types';

// VALORES PADRÃO PARA CONFIGURAÇÕES GLOBAIS
export const GLOBAL_SETTINGS: GlobalSettings = {
  exchangeRateUSD: 5.4,
  
  // Impostos Hardware
  hardware_importTaxII: 9.6,
  hardware_ipiTax: 3.25,
  hardware_pisTax: 2.1,
  hardware_cofinsTax: 9.65,
  hardware_icmsTax: 18,
  taxaSiscomex: 154.23,

  // Impostos Software
  software_irpjTax: 15,
  software_pisTax: 1.65,
  software_cofinsTax: 7.6,
  software_iofTax: 0.38,
  software_issTax: 5,
  swiftFee: 0, // Taxa Fechamento Câmbio

  // Despesas de Importação Fixas (BRL)
  customsClearanceFee: 1050, // Desembaraço
  technicalConsultingFee: 350, // Assessoria Técnica
  storageFee: 989.54, // Armazenagem
  freteInternacionalTerceiro: 300,
  freteTerceirosDA: 300,

  // Despesas de Importação Variáveis (USD)
  desconsolidacaoUSD: 65,
  freightCostUSD: 575, // Custo do frete principal para o lote

  // Variáveis de Venda / Markup (percentual e fixo)
  simplesNacionalTax: 15.5, // Imposto sobre a venda
  salesCommission: 3,    // Comissão
  financialFee: 1500,       // Custo Financeiro Fixo (BRL)
  bdiFee: 2500,             // BDI / Custo Administrativo Fixo (BRL)
  marginFee: 15,          // Margem de Lucro Bruta
  salesDiscount: 5,      // Desconto de Venda (aplicado no final)
};

export const PERCENT_FIELDS: (keyof GlobalSettings)[] = [
    'hardware_importTaxII', 'hardware_ipiTax', 'hardware_pisTax', 'hardware_cofinsTax', 'hardware_icmsTax',
    'software_irpjTax', 'software_pisTax', 'software_cofinsTax', 'software_iofTax', 'software_issTax',
    'simplesNacionalTax', 'salesCommission', 'marginFee', 'salesDiscount'
];
