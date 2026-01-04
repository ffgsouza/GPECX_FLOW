"use client";

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import type { SaleProduct, SaleCategory, GlobalSettings, ProductType, Company, Quote, Customer, Vendor } from '@/lib/types';
import { GLOBAL_SETTINGS, PERCENT_FIELDS } from '@/lib/constants';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, getDoc, type Firestore } from 'firebase/firestore';

// This will be initialized on the client
let db: Firestore | null = null;

const convertSettingsToPercent = (settings: GlobalSettings): GlobalSettings => {
  const newSettings = { ...settings };
  for (const key in newSettings) {
    if (PERCENT_FIELDS.includes(key as keyof GlobalSettings)) {
      const value = newSettings[key as keyof GlobalSettings] as number;
      // Sanity Check: If the value is a decimal (e.g., 0.18), convert it. 
      // If it's already a whole number (e.g., 18), use it as is.
      if (value > 0 && value < 1) {
        (newSettings[key as keyof GlobalSettings] as number) = value * 100;
      }
    }
  }
  return newSettings;
};

const convertSettingsToDecimal = (settings: GlobalSettings): GlobalSettings => {
    const newSettings = { ...settings };
    for (const key in newSettings) {
        if (PERCENT_FIELDS.includes(key as keyof GlobalSettings)) {
            (newSettings[key as keyof GlobalSettings] as number) /= 100;
        }
    }
    return newSettings;
};


interface AppContextType {
  products: SaleProduct[];
  categories: SaleCategory[];
  productTypes: ProductType[];
  companies: Company[];
  customers: Customer[];
  vendors: Vendor[];
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
  // Vendors
  addVendor: (vendor: Omit<Vendor, 'id'>) => Promise<void>;
  updateVendor: (vendor: Vendor) => Promise<void>;
  deleteVendor: (vendorId: string) => Promise<void>;
  // Quotes
  addQuote: (quote: Omit<Quote, 'id'>) => Promise<void>;
  updateQuote: (quoteId: string, quote: Partial<Quote>) => Promise<void>;
  // Helpers
  getCategoryNameById: (categoryId: string) => string;
  getProductTypeNameById: (productTypeId: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [categories, setCategories] = useState<SaleCategory[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
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
        const [productsSnapshot, categoriesSnapshot, productTypesSnapshot, companiesSnapshot, customersSnapshot, vendorsSnapshot, quotesSnapshot] = await Promise.all([
            getDocs(collection(db, 'products')),
            getDocs(collection(db, 'categories')),
            getDocs(collection(db, 'product_types')),
            getDocs(collection(db, 'companies')),
            getDocs(collection(db, 'customers')),
            getDocs(collection(db, 'vendors')),
            getDocs(collection(db, 'quotes')),
        ]);

        setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleProduct)));
        setCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleCategory)));
        setProductTypes(productTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductType)));
        setCompanies(companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
        setCustomers(customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
        setVendors(vendorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor)));
        setQuotes(quotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote)));
        
        if (forceReloadSettings) {
            const settingsDoc = await getDoc(doc(db, "settings", "global"));
            if (settingsDoc.exists()) {
                const settingsFromDb = settingsDoc.data() as GlobalSettings;
                setGlobalSettingsState(convertSettingsToPercent(settingsFromDb));
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
            const settingsFromDb = settingsDoc.data() as GlobalSettings;
            setGlobalSettingsState(convertSettingsToPercent(settingsFromDb));
        } else {
            setGlobalSettingsState(GLOBAL_SETTINGS);
        }
        fetchData();
    }
    loadInitialSettings();
  }, [fetchData]);

  // Function to update settings
  const setGlobalSettings = async (settings: GlobalSettings) => {
    if (!db) return;
    const settingsForDb = convertSettingsToDecimal(settings);
    await updateDoc(doc(db, 'settings', 'global'), settingsForDb);
    setGlobalSettingsState(settings); // Keep the percentage format in the state
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

   const addVendor = async (vendor: Omit<Vendor, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'vendors'), vendor);
    await fetchData();
  };

  const updateVendor = async (updatedVendor: Vendor) => {
    if (!db) return;
    const { id, ...data } = updatedVendor;
    await updateDoc(doc(db, 'vendors', id), data);
    await fetchData();
  };

  const deleteVendor = async (vendorId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'vendors', vendorId));
    await fetchData();
  };

  const addQuote = async (quote: Omit<Quote, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'quotes'), quote);
    await fetchData();
  };
  
   const updateQuote = async (quoteId: string, quoteData: Partial<Quote>) => {
    if (!db) return;
    await updateDoc(doc(db, "quotes", quoteId), quoteData);
    await fetchData();
  };
  
  const getCategoryNameById = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name ?? 'N/A';
  }

  const getProductTypeNameById = (productTypeId: string) => {
    return productTypes.find(pt => pt.id === productTypeId)?.name ?? 'N/A';
  }

  const value = {
    products,
    categories,
    productTypes,
    companies,
    customers,
    vendors,
    quotes,
    globalSettings,
    loading,
    setGlobalSettings,
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
    addVendor,
    updateVendor,
    deleteVendor,
    addQuote,
    updateQuote,
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
