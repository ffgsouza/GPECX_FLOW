import type { Customer } from './types';

/**
 * Schema do EXS Locações (formato simplificado para clientes pessoa física)
 */
interface EXSCustomer {
  id?: string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  roleId?: string;
  role?: string;
  source?: string;
  active?: boolean;
  createdAt?: any;
  uid?: string;
  permissions?: any;
}

/**
 * Detecta se o documento é do formato EXS Locações
 */
export function isEXSCustomer(data: any): data is EXSCustomer {
  return (
    data &&
    typeof data === 'object' &&
    'name' in data &&
    'cpfCnpj' in data &&
    !('companyName' in data) &&
    !('tradeName' in data)
  );
}

/**
 * Detecta se o documento é do formato GPECX FLOW
 */
export function isGPECXCustomer(data: any): data is Customer {
  return (
    data &&
    typeof data === 'object' &&
    ('companyName' in data || 'tradeName' in data) &&
    'cnpj' in data
  );
}

/**
 * Converte timestamp ou string de data para número
 */
function normalizeTimestamp(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const date = new Date(value);
    return date.getTime();
  }
  if (value?.toDate && typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }
  return Date.now();
}

/**
 * Transforma um cliente do formato EXS para o formato GPECX
 */
export function adaptEXSCustomer(exsData: EXSCustomer): Customer {
  return {
    id: exsData.id || '',
    // Usar 'name' como tradeName e companyName
    tradeName: exsData.name || '',
    companyName: exsData.name || '',
    // CPF/CNPJ
    cnpj: exsData.cpfCnpj || '',
    stateRegistration: '',
    // Contato
    email: exsData.email || '',
    phone: exsData.phone || '',
    contactName: exsData.name || '',
    // Endereço vazio (EXS não tem)
    address: {
      street: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      state: '',
      zipCode: '',
    },
    createdAt: normalizeTimestamp(exsData.createdAt),
  };
}

/**
 * Normaliza qualquer formato de cliente para o formato GPECX
 */
export function normalizeCustomer(data: any): Customer {
  if (!data) {
    throw new Error('Customer data is null or undefined');
  }

  // Se já é formato GPECX, retorna como está
  if (isGPECXCustomer(data)) {
    return {
      ...data,
      createdAt: normalizeTimestamp(data.createdAt),
      // Garantir que address existe
      address: data.address || {
        street: '',
        number: '',
        complement: '',
        district: '',
        city: '',
        state: '',
        zipCode: '',
      },
    };
  }

  // Se é formato EXS, converte
  if (isEXSCustomer(data)) {
    return adaptEXSCustomer(data);
  }

  // Fallback: tentar construir um Customer válido
  console.warn('Unknown customer format, attempting to normalize:', data);
  return {
    id: data.id || '',
    tradeName: data.tradeName || data.name || '',
    companyName: data.companyName || data.name || '',
    cnpj: data.cnpj || data.cpfCnpj || '',
    stateRegistration: data.stateRegistration || '',
    email: data.email || '',
    phone: data.phone || '',
    contactName: data.contactName || data.name || '',
    address: data.address || {
      street: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      state: '',
      zipCode: '',
    },
    createdAt: normalizeTimestamp(data.createdAt),
  };
}
