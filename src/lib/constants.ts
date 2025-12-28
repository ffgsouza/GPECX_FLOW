import type { GlobalSettings } from './types';

// VALORES PADRÃO PARA CONFIGURAÇÕES GLOBAIS
export const GLOBAL_SETTINGS: GlobalSettings = {
  exchangeRateUSD: 5.4,
  
  // Impostos Hardware
  hardware_importTaxII: 0.096,
  hardware_ipiTax: 0.0325,
  hardware_pisTax: 0.021,
  hardware_cofinsTax: 0.0965,
  hardware_icmsTax: 0.18,

  // Impostos Software
  software_irpjTax: 0.15,
  software_pisTax: 0.0165,
  software_cofinsTax: 0.076,
  software_iofTax: 0.0038,
  software_issTax: 0.05,

  // Despesas Fixas (BRL)
  taxaSiscomex: 154.23,
  customsClearanceFee: 1050,
  technicalConsultingFee: 350,
  storageFee: 989.54,
  freteInternacionalTerceiro: 300,
  freteTerceirosDA: 300,
  swiftFee: 100,

  // Despesas Variáveis (USD)
  desconsolidacaoUSD: 65,
  freightCostUSD: 575,

  // Markup de Venda
  simplesNacionalTax: 0.155,
  salesCommission: 0.03,
  financialFee: 1500,
  bdiFee: 2500,
  marginFee: 0.15,
  salesDiscount: 0.05,
};
