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
  taxaSiscomex: 154.23,

  // Impostos Software
  software_irpjTax: 0.15,
  software_pisTax: 0.0165,
  software_cofinsTax: 0.076,
  software_iofTax: 0.0038,
  software_issTax: 0.05,

  // Despesas de Importação Fixas (BRL)
  customsClearanceFee: 1050, // Desembaraço
  technicalConsultingFee: 350, // Assessoria Técnica
  swiftFee: 0, // Taxa Fechamento Câmbio
  storageFee: 989.54, // Armazenagem
  freteInternacionalTerceiro: 300,
  freteTerceirosDA: 300,

  // Despesas de Importação Variáveis (USD)
  desconsolidacaoUSD: 65,
  freightCostUSD: 575, // Custo do frete principal para o lote

  // Variáveis de Venda / Markup (percentual e fixo)
  simplesNacionalTax: 0.155, // Imposto sobre a venda
  salesCommission: 0.03,    // Comissão
  financialFee: 1500,       // Custo Financeiro Fixo (BRL)
  bdiFee: 2500,             // BDI / Custo Administrativo Fixo (BRL)
  marginFee: 0.15,          // Margem de Lucro Bruta
  salesDiscount: 0.05,      // Desconto de Venda (aplicado no final)
};
