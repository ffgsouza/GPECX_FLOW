import type { Product, Category, QuoteItem } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Equipamento de Teste' },
  { id: '2', name: 'Software de Análise' },
];

export const INITIAL_PRODUCTS: Product[] = [
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
    iofTax: 0.035, // 3.5%
    issTax: 0.05, // 5%
    swiftFee: 100, // R$ 100
    simplesNacionalTax: 0.155, // 15.5%
    salesCommission: 0.0, // 0%
    financialFee: 5, // Valor Fixo BRL
    bdiFee: 1000, // Valor Fixo BRL
    marginFee: 0,
    salesDiscount: 0,
  },
];


export const QUOTE_ITEMS: QuoteItem[] = [
  // KF85P
  { id: 'q1', model: 'KF85P(6x35A,4x310V)', description: 'Device host, including basic software function and accessories.', priceUSD: 20000, type: 'main', appliesTo: [] },
  { id: 'q2', model: 'Upgrade to KF85P(6U6I)', description: 'Upgrade the device from KF85P(4U6I) to KF85P(6U6I)', priceUSD: 1100, type: 'optional', appliesTo: ['q1'] },
  { id: 'q3', model: 'IEC61850 Software licence', description: 'The hardware facility should be installed ahead of software activation', priceUSD: 4640, type: 'optional', appliesTo: ['q1'] },
  { id: 'q4', model: 'Low-Level Output License', description: 'No hardware pre-install, to be activated at factory', priceUSD: 1037, type: 'optional', appliesTo: ['q1'] },
  { id: 'q5', model: 'Transducer Calibration License', description: 'No hardware pre-install, to be activated at factory', priceUSD: 1200, type: 'optional', appliesTo: ['q1'] },
  { id: 'q6', model: 'Energy Meter Software licence', description: 'Hardware pre-install without extra charge', priceUSD: 1200, type: 'optional', appliesTo: ['q1'] },
  { id: 'q7', model: 'IEC61850 pre-install hardware', description: 'IEC61850 pre-install hardware', priceUSD: 560, type: 'optional', appliesTo: ['q1'] },
  // KFA320
  { id: 'q8', model: 'KFA320 (6x20A,4x300V)', description: 'Device host, including advanced package and accessories.', priceUSD: 18000, type: 'main', appliesTo: [] },
  { id: 'q9', model: 'KFA320 (without display) (6x20A,4x300V)', description: 'Device host, including advanced package and accessories.', priceUSD: 17000, type: 'main', appliesTo: [] },
  { id: 'q10', model: 'KFA320 (3x20A,4x300V)', description: 'Device host and accessories, including basic software function (AC, Ramping, etc)', priceUSD: 10900, type: 'main', appliesTo: [] },
  { id: 'q11', model: 'KFA320 (without display) (3x20A,4x300V)', description: 'Device host and accessories, including basic software function (AC, Ramping, etc)', priceUSD: 10300, type: 'main', appliesTo: [] },
];
