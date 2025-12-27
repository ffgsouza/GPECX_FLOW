import type { SaleProduct, SaleCategory, TaxRule, GlobalSettings, ProductType, HardwareTaxRule, SoftwareTaxRule } from './types';

// REGRAS DE IMPOSTO GLOBAIS
export const TAX_RULES: { HARDWARE: HardwareTaxRule; SOFTWARE: SoftwareTaxRule } = {
  HARDWARE: {
    importTaxII: 0.096,
    ipiTax: 0.0325,
    pisTax: 0.021,
    cofinsTax: 0.0965,
    icmsTax: 0.18,
  },
  SOFTWARE: {
    irpjTax: 0.15,    // Alíquota nominal do IRRF
    pisTax: 0.0165,   // PIS sobre importação de serviço
    cofinsTax: 0.076, // COFINS sobre importação de serviço
    iofTax: 0.0038,   // IOF Câmbio
    issTax: 0.05,     // ISS da cidade do prestador (pode variar)
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
