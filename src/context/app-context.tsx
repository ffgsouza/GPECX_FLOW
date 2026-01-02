"use client";

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { SaleProduct, SaleCategory, GlobalSettings, ProductType, Company, Quote, Customer } from '@/lib/types';
import { GLOBAL_SETTINGS } from '@/lib/constants';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, getDoc, type Firestore } from 'firebase/firestore';

// This will be initialized on the client
let db: Firestore | null = null;

const percentFields: (keyof GlobalSettings)[] = [
    'hardware_importTaxII', 'hardware_ipiTax', 'hardware_pisTax', 'hardware_cofinsTax', 'hardware_icmsTax',
    'software_irpjTax', 'software_pisTax', 'software_cofinsTax', 'software_iofTax', 'software_issTax',
    'simplesNacionalTax', 'salesCommission', 'marginFee', 'salesDiscount'
];

interface AppContextType {
  products: SaleProduct[];
  categories: SaleCategory[];
  productTypes: ProductType[];
  companies: Company[];
  customers: Customer[];
  quotes: Quote[];
  globalSettings: GlobalSettings;
  loading: boolean;
  setGlobalSettings: (settings: GlobalSettings) => Promise<void>;
  // Products
  addProduct: (product: Omit<SaleProduct, 'id'>) => Promise<void>;
  updateProduct: (product: SaleProduct) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  // Categories
  addCategory: (category: Omit<SaleCategory, 'id'>) => Promise<void>;
  updateCategory: (category: SaleCategory) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  // Product Types
  addProductType: (productType: Omit<ProductType, 'id'>) => Promise<void>;
  updateProductType: (productType: ProductType) => Promise<void>;
  deleteProductType: (productTypeId: string) => Promise<void>;
  // Companies
  addCompany: (company: Omit<Company, 'id'>) => Promise<void>;
  updateCompany: (company: Company) => Promise<void>;
  deleteCompany: (companyId: string) => Promise<void>;
  // Customers
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  // Quotes
  addQuote: (quote: Omit<Quote, 'id'>) => Promise<void>;
  // Helpers
  getCategoryNameById: (categoryId: string) => string;
  getProductTypeNameById: (productTypeId: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const convertSettingsToDecimal = (settings: GlobalSettings): GlobalSettings => {
    const newSettings = { ...settings };
    percentFields.forEach(field => {
        if (typeof newSettings[field] === 'number') {
            (newSettings[field] as number) /= 100;
        }
    });
    return newSettings;
};

const convertSettingsToPercent = (settings: GlobalSettings): GlobalSettings => {
    const newSettings = { ...settings };
    percentFields.forEach(field => {
        if (typeof newSettings[field] === 'number') {
            (newSettings[field] as number) *= 100;
        }
    });
    return newSettings;
};


export function AppContextProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [categories, setCategories] = useState<SaleCategory[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [globalSettings, setGlobalSettingsState] = useState<GlobalSettings>(GLOBAL_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (forceReloadSettings = false) => {
    if (!db) {
        const { db: firestoreDb } = initializeFirebase();
        db = firestoreDb;
    }
      
    if (!db) {
        console.error("Firestore is not initialized.");
        setLoading(false);
        return;
    };

    setLoading(true);
    try {
        const [productsSnapshot, categoriesSnapshot, productTypesSnapshot, companiesSnapshot, customersSnapshot, quotesSnapshot] = await Promise.all([
            getDocs(collection(db, 'products')),
            getDocs(collection(db, 'categories')),
            getDocs(collection(db, 'product_types')),
            getDocs(collection(db, 'companies')),
            getDocs(collection(db, 'customers')),
            getDocs(collection(db, 'quotes')),
        ]);

        setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleProduct)));
        setCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleCategory)));
        setProductTypes(productTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductType)));
        setCompanies(companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
        setCustomers(customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
        setQuotes(quotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote)));
        
        if (forceReloadSettings) {
            const settingsDoc = await getDoc(doc(db, "settings", "global"));
            if (settingsDoc.exists()) {
                setGlobalSettingsState(settingsDoc.data() as GlobalSettings);
            }
        }
    } catch (error) {
        console.error("Error fetching initial data:", error);
    } finally {
        setLoading(false);
    }
  }, []);

  // Load settings from firestore on initial mount
  useEffect(() => {
    const loadInitialSettings = async () => {
        if (!db) {
            const { db: firestoreDb } = initializeFirebase();
            db = firestoreDb;
        }
        if (!db) return;
        
        const settingsDoc = await getDoc(doc(db, "settings", "global"));
        if (settingsDoc.exists()) {
            setGlobalSettingsState(settingsDoc.data() as GlobalSettings);
        } else {
            setGlobalSettingsState(GLOBAL_SETTINGS);
        }
        fetchData();
    }
    loadInitialSettings();
  }, [fetchData]);

  // Function to update settings
  const setGlobalSettings = async (settingsFromForm: GlobalSettings) => {
    if (!db) return;
    const settingsInDecimal = convertSettingsToDecimal(settingsFromForm);
    await updateDoc(doc(db, 'settings', 'global'), settingsInDecimal);
    setGlobalSettingsState(settingsInDecimal);
  };


  const addProduct = async (product: Omit<SaleProduct, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'products'), product);
    await fetchData();
  };

  const updateProduct = async (updatedProduct: SaleProduct) => {
    if (!db) return;
    const { id, ...data } = updatedProduct;
    await updateDoc(doc(db, 'products', id), data);
    await fetchData();
  };

  const deleteProduct = async (productId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'products', productId));
    await fetchData();
  };

  const addCategory = async (category: Omit<SaleCategory, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'categories'), category);
    await fetchData();
  };

  const updateCategory = async (updatedCategory: SaleCategory) => {
    if (!db) return;
    const { id, ...data } = updatedCategory;
    await updateDoc(doc(db, 'categories', id), data);
    await fetchData();
  };

  const deleteCategory = async (categoryId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'categories', categoryId));
    await fetchData();
  };

  const addProductType = async (productType: Omit<ProductType, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'product_types'), productType);
    await fetchData();
  };

  const updateProductType = async (updatedProductType: ProductType) => {
    if (!db) return;
    const { id, ...data } = updatedProductType;
    await updateDoc(doc(db, 'product_types', id), data);
    await fetchData();
  };

  const deleteProductType = async (productTypeId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'product_types', productTypeId));
    await fetchData();
  };

  const addCompany = async (company: Omit<Company, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'companies'), company);
    await fetchData();
  };

  const updateCompany = async (updatedCompany: Company) => {
    if (!db) return;
    const { id, ...data } = updatedCompany;
    await updateDoc(doc(db, 'companies', id), data);
    await fetchData();
  };

  const deleteCompany = async (companyId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'companies', companyId));
    await fetchData();
  };

  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    if (!db) return;
    await addDoc(collection(db, 'customers'), { ...customer, createdAt: Date.now() });
    await fetchData();
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    if (!db) return;
    const { id, ...data } = updatedCustomer;
    await updateDoc(doc(db, 'customers', id), data);
    await fetchData();
  };

  const deleteCustomer = async (customerId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'customers', customerId));
    await fetchData();
  };

  const addQuote = async (quote: Omit<Quote, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'quotes'), quote);
    await fetchData();
  };
  
  const getCategoryNameById = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name ?? 'N/A';
  }

  const getProductTypeNameById = (productTypeId: string) => {
    return productTypes.find(pt => pt.id === productTypeId)?.name ?? 'N/A';
  }

  // A "view" que converte os settings para percentual para os componentes da UI
  const settingsForUI = useMemo(() => convertSettingsToPercent(globalSettings), [globalSettings]);

  const value = {
    products,
    categories,
    productTypes,
    companies,
    customers,
    quotes,
    globalSettings: settingsForUI, // Fornece os valores já em percentual para a UI
    loading,
    setGlobalSettings, // A função de salvar já espera os valores em percentual
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addProductType,
    updateProductType,
    deleteProductType,
    addCompany,
    updateCompany,
    deleteCompany,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addQuote,
    getCategoryNameById,
    getProductTypeNameById,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
