import type { SaleProduct, SaleCategory, QuoteCategory, QuoteProduct, QuoteAccessory } from './types';

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


// --- DADOS PARA O KINGSINE QUOTE BUILDER ---

export const QUOTE_CATEGORIES: QuoteCategory[] = [
  {
    id: 'universal-test-set',
    name: 'Universal Test Set',
    description: 'Equipamentos de teste de relés de proteção universal.',
    imageUrl: 'https://picsum.photos/seed/uts/600/400'
  },
  {
    id: 'ct-pt-analyser',
    name: 'CT/PT Analyser',
    description: 'Analisadores de transformadores de corrente e potencial.',
    imageUrl: 'https://picsum.photos/seed/ctpt/600/400'
  },
  {
    id: 'amplifier',
    name: 'Voltage & Current Amplifier',
    description: 'Amplificadores de potência para simulação em tempo real.',
    imageUrl: 'https://picsum.photos/seed/amp/600/400'
  },
  {
    id: 'power-meters',
    name: 'Power Meters',
    description: 'Medidores de potência e qualidade de energia.',
    imageUrl: 'https://picsum.photos/seed/meters/600/400'
  },
  {
    id: 'accessories',
    name: 'Accessories',
    description: 'Acessórios para venda avulsa e compatíveis.',
    imageUrl: 'https://picsum.photos/seed/acc/600/400'
  },
];

export const QUOTE_ACCESSORIES: QuoteAccessory[] = [
  // Globais
  { id: 'acc_bag', name: 'All-in-one Bag', price: 50.00, isGlobal: true },
  { id: 'acc_gps', name: 'GPS Antenna', price: 43.00, isGlobal: true },
  { id: 'acc_wire', name: 'Ordinary testing wire pack', price: 142.00, isGlobal: true },
  { id: 'acc_energy_sw', name: 'Energy Meter Software License', price: 1200.00, isGlobal: true },

  // Específicos KF85P
  { id: 'upg_6u6i', name: 'Upgrade to 6U6I', price: 1100.00, isGlobal: false },
  { id: 'lic_iec61850', name: 'IEC61850 Software', price: 4640.00, isGlobal: false },
  { id: 'lic_low_lvl', name: 'Low-Level Output License', price: 1037.00, isGlobal: false },
  { id: 'lic_transducer', name: 'Transducer Calibration', price: 1200.00, isGlobal: false },
  { id: 'hw_iec61850', name: 'IEC61850 Hardware', price: 560.00, isGlobal: false },

  // Específicos KFA320
  { id: 'hw_extend', name: 'Hardware Extend (3x20A to 6x20A)', price: 2900.00, isGlobal: false },
  { id: 'pkg_adv', name: 'Advanced Package Software', price: 5000.00, isGlobal: false },
  { id: 'mod_dist', name: 'Module Distance', price: 1500.00, isGlobal: false },
  { id: 'mod_diff', name: 'Module Differential', price: 1500.00, isGlobal: false },
  { id: 'mod_sync', name: 'Module Synchronizer', price: 1200.00, isGlobal: false },
  { id: 'lpit', name: 'Low Power Instrument Transformer', price: 3100.00, isGlobal: false },

  // Específicos KFA310
  { id: 'upg_310_20a', name: 'Upgrade to 3x20A', price: 800.00, isGlobal: false },
  { id: 'hw_low_lvl', name: 'Low-level Output Hardware', price: 910.00, isGlobal: false },
  
  // Específicos KT210
  { id: 'box_kt210', name: 'Extension Test Box', price: 1760.00, isGlobal: false },
];

export const QUOTE_PRODUCTS: QuoteProduct[] = [
  {
    id: 'kf85p',
    name: 'KF85P Universal Test Set',
    description: 'The flagship universal relay tester, offering the highest power and accuracy for all protection testing needs.',
    imageUrl: 'https://picsum.photos/seed/kf85p/600/400',
    categoryId: 'universal-test-set',
    hardwareOptions: [
      { id: 'kf85p_std', name: 'Standard (6x35A, 4x310V)', price: 20000.00 }
    ],
    softwareOptions: [],
    compatibleAccessoryIds: ['upg_6u6i', 'lic_iec61850', 'lic_low_lvl', 'lic_transducer', 'hw_iec61850']
  },
  {
    id: 'kfa320',
    name: 'KFA320 Universal Test Set',
    description: 'A versatile and powerful relay tester for advanced protection systems, with multiple hardware and software configurations.',
    imageUrl: 'https://picsum.photos/seed/kfa320/600/400',
    categoryId: 'universal-test-set',
    hardwareOptions: [
      { id: 'kfa320_3x20', name: 'Standard (3x20A, 4x300V)', price: 10900.00 },
      { id: 'kfa320_6x20', name: 'Standard (6x20A, 4x300V)', price: 13000.00 },
      { id: 'kfa320_nd_3x20', name: 'No Display (3x20A)', price: 10300.00 },
      { id: 'kfa320_nd_6x20', name: 'No Display (6x20A)', price: 17000.00 },
    ],
    softwareOptions: [
      { id: 'kfa320_sw_basic', name: 'Basic Package', price: 0.00 },
      { id: 'kfa320_sw_adv', name: 'Advanced Package', price: 5000.00 },
    ],
    compatibleAccessoryIds: ['hw_extend', 'mod_dist', 'mod_diff', 'mod_sync', 'lpit']
  },
  {
    id: 'kfa310',
    name: 'KFA310 Protection Relay Tester',
    description: 'A compact and cost-effective solution for basic and advanced relay testing.',
    imageUrl: 'https://picsum.photos/seed/kfa310/600/400',
    categoryId: 'universal-test-set',
    hardwareOptions: [
        { id: 'kfa310_ord_wire', name: 'Standard (3x10A) with Ordinary Wire', price: 7600.00 },
        { id: 'kfa310_mc_wire', name: 'Standard (3x10A) with MC Wire', price: 7860.00 },
    ],
    softwareOptions: [],
    compatibleAccessoryIds: ['upg_310_20a', 'hw_low_lvl']
  },
  {
    id: 'kt210',
    name: 'KT210 CT/PT Analyzer',
    description: 'High-precision instrument for testing current and potential transformers according to IEEE and IEC standards.',
    imageUrl: 'https://picsum.photos/seed/kt210/600/400',
    categoryId: 'ct-pt-analyser',
    hardwareOptions: [
        { id: 'kt210_std', name: 'Standard', price: 11000.00 }
    ],
    softwareOptions: [],
    compatibleAccessoryIds: ['box_kt210']
  },
  {
    id: 'ka-series',
    name: 'KA Series Amplifier',
    description: 'High-power, portable voltage and current amplifiers for real-time simulation and testing.',
    imageUrl: 'https://picsum.photos/seed/kaseries/600/400',
    categoryId: 'amplifier',
    hardwareOptions: [
        { id: 'ka30', name: 'KA30 (3x30A, 4x130V)', price: 9350.00 },
        { id: 'ka30i', name: 'KA30i (3x30A, 4x300V)', price: 10500.00 },
        { id: 'ka60', name: 'KA60 (3x60A, 4x130V)', price: 11140.00 },
        { id: 'ka60i', name: 'KA60i (3x60A, 4x300V)', price: 12280.00 },
    ],
    softwareOptions: [],
    compatibleAccessoryIds: []
  },
  {
    id: 'pmc-series',
    name: 'PMC Power Meters',
    description: 'Panel-mounted digital power meters for monitoring and controlling power quality.',
    imageUrl: 'https://picsum.photos/seed/pmcseries/600/400',
    categoryId: 'power-meters',
    hardwareOptions: [
        { id: 'pmc200s', name: 'PMC200S', price: 80.00 },
        { id: 'pmc96s', name: 'PMC96S', price: 50.00 },
    ],
    softwareOptions: [],
    compatibleAccessoryIds: []
  },
];
