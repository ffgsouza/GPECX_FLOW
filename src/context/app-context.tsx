"use client";

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import type { SaleProduct, SaleCategory, GlobalSettings, ProductType, Company, Quote, Customer, Vendor, RentalEquipment } from '@/lib/types';
import { handleError } from "@/lib/error-handling";
import { GLOBAL_SETTINGS, PERCENT_FIELDS } from '@/lib/constants';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, getDoc, type Firestore } from 'firebase/firestore';
import { normalizeCustomer } from '@/lib/customer-adapter';


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
  db: Firestore | null;
  products: SaleProduct[];
  categories: SaleCategory[];
  productTypes: ProductType[];
  companies: Company[];
  customers: Customer[];
  vendors: Vendor[];
  quotes: Quote[];
  rentalEquipments: RentalEquipment[];
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
  addQuote: (quote: Omit<Quote, 'id'>) => Promise<any>;
  updateQuote: (quoteId: string, quote: Partial<Quote>) => Promise<void>;
  // Rental Equipments
  addRentalEquipment: (equipment: Omit<RentalEquipment, 'id'>) => Promise<void>;
  updateRentalEquipment: (equipment: RentalEquipment) => Promise<void>;
  deleteRentalEquipment: (equipmentId: string) => Promise<void>;
  // Helpers
  getCategoryNameById: (categoryId: string) => string;
  getProductTypeNameById: (productTypeId: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Firestore | null>(null);
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [categories, setCategories] = useState<SaleCategory[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [rentalEquipments, setRentalEquipments] = useState<RentalEquipment[]>([]);
  const [globalSettings, setGlobalSettingsState] = useState<GlobalSettings>(GLOBAL_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (dbInstance: Firestore, forceReloadSettings = false) => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getDocs(collection(dbInstance, 'products')),
        getDocs(collection(dbInstance, 'categories')),
        getDocs(collection(dbInstance, 'product_types')),
        getDocs(collection(dbInstance, 'companies')),
        getDocs(collection(dbInstance, 'customers')),
        getDocs(collection(dbInstance, 'vendors')),
        getDocs(collection(dbInstance, 'quotes')),
      ]);

      const [productsRes, categoriesRes, typesRes, companiesRes, customersRes, vendorsRes, quotesRes] = results;

      if (productsRes.status === 'fulfilled') {
        const validProducts = productsRes.value.docs.reduce((acc, doc) => {
          try {
            acc.push({ id: doc.id, ...doc.data() } as SaleProduct);
          } catch (error) {
            handleError(error, `Erro ao processar produto ${doc.id}`);
          }
          return acc;
        }, [] as SaleProduct[]);
        setProducts(validProducts);
      } else console.warn('Failed to load products:', productsRes.reason);

      if (categoriesRes.status === 'fulfilled') {
        setCategories(categoriesRes.value.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleCategory)));
      } else console.warn('Failed to load categories:', categoriesRes.reason);

      if (typesRes.status === 'fulfilled') {
        setProductTypes(typesRes.value.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductType)));
      } else console.warn('Failed to load product types:', typesRes.reason);

      if (companiesRes.status === 'fulfilled') {
        const validCompanies = companiesRes.value.docs.reduce((acc, doc) => {
          try {
            acc.push({ id: doc.id, ...doc.data() } as Company);
          } catch (error) {
            handleError(error, `Erro ao processar empresa ${doc.id}`);
          }
          return acc;
        }, [] as Company[]);
        setCompanies(validCompanies);
      } else console.warn('Failed to load companies:', companiesRes.reason);

      if (customersRes.status === 'fulfilled') {
        const validCustomers = customersRes.value.docs.reduce((acc, doc) => {
          try {
            const customer = normalizeCustomer({ id: doc.id, ...doc.data() });
            acc.push(customer);
          } catch (error) {
            handleError(error, `Erro ao processar cliente ${doc.id}`);
          }
          return acc;
        }, [] as Customer[]);
        setCustomers(validCustomers);
      } else console.warn('Failed to load customers:', customersRes.reason);

      if (vendorsRes.status === 'fulfilled') {
        const validVendors = vendorsRes.value.docs.reduce((acc, doc) => {
          try {
            acc.push({ id: doc.id, ...doc.data() } as Vendor);
          } catch (error) {
            handleError(error, `Erro ao processar fornecedor ${doc.id}`);
          }
          return acc;
        }, [] as Vendor[]);
        setVendors(validVendors);
      } else console.warn('Failed to load vendors:', vendorsRes.reason);

      if (quotesRes.status === 'fulfilled') {
        const validQuotes = quotesRes.value.docs.reduce((acc, doc) => {
          try {
            acc.push({ id: doc.id, ...doc.data() } as Quote);
          } catch (error) {
            handleError(error, `Erro ao processar orçamento ${doc.id}`);
          }
          return acc;
        }, [] as Quote[]);
        setQuotes(validQuotes);
      } else console.warn('Failed to load quotes:', quotesRes.reason);

      try {
        const rentalEquipmentsSnapshot = await getDocs(collection(dbInstance, 'rental_equipments'));
        setRentalEquipments(rentalEquipmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RentalEquipment)));
      } catch (error) {
        handleError(error, "Erro ao carregar equipamentos de aluguel");
      }

    } catch (error) {
      handleError(error, "Erro ao carregar dados iniciais");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load settings from firestore on initial mount
  useEffect(() => {
    const init = async () => {
      try {
        const { db: firestoreDb } = initializeFirebase();
        setDb(firestoreDb);

        try {
          const settingsDoc = await getDoc(doc(firestoreDb, "settings", "global"));
          if (settingsDoc.exists()) {
            const settingsFromDb = settingsDoc.data() as GlobalSettings;
            setGlobalSettingsState(convertSettingsToPercent(settingsFromDb));
          } else {
            setGlobalSettingsState(GLOBAL_SETTINGS);
          }
        } catch (settingsError) {
          console.warn("Failed to load settings:", settingsError);
          // Fallback to default settings
          setGlobalSettingsState(GLOBAL_SETTINGS);
        }

        await fetchData(firestoreDb);
      } catch (e) {
        console.error("Critical error initializing context:", e);
      }
    }
    init();
  }, [fetchData]);

  // Function to update settings
  const setGlobalSettings = async (settings: GlobalSettings) => {
    if (!db) return;
    const settingsForDb = convertSettingsToDecimal(settings);
    await updateDoc(doc(db, 'settings', 'global'), settingsForDb as any);
    setGlobalSettingsState(settings); // Keep the percentage format in the state
  };


  const addProduct = async (product: Omit<SaleProduct, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'products'), product);
    await fetchData(db);
  };

  const updateProduct = async (updatedProduct: SaleProduct) => {
    if (!db) return;
    const { id, ...data } = updatedProduct;
    await updateDoc(doc(db, 'products', id), data);
    await fetchData(db);
  };

  const deleteProduct = async (productId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'products', productId));
    await fetchData(db);
  };

  const addCategory = async (category: Omit<SaleCategory, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'categories'), category);
    await fetchData(db);
  };

  const updateCategory = async (updatedCategory: SaleCategory) => {
    if (!db) return;
    const { id, ...data } = updatedCategory;
    await updateDoc(doc(db, 'categories', id), data);
    await fetchData(db);
  };

  const deleteCategory = async (categoryId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'categories', categoryId));
    await fetchData(db);
  };

  const addProductType = async (productType: Omit<ProductType, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'product_types'), productType);
    await fetchData(db);
  };

  const updateProductType = async (updatedProductType: ProductType) => {
    if (!db) return;
    const { id, ...data } = updatedProductType;
    await updateDoc(doc(db, 'product_types', id), data);
    await fetchData(db);
  };

  const deleteProductType = async (productTypeId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'product_types', productTypeId));
    await fetchData(db);
  };

  const addCompany = async (company: Omit<Company, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'companies'), company);
    await fetchData(db);
  };

  const updateCompany = async (updatedCompany: Company) => {
    if (!db) return;
    const { id, ...data } = updatedCompany;
    await updateDoc(doc(db, 'companies', id), data);
    await fetchData(db);
  };

  const deleteCompany = async (companyId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'companies', companyId));
    await fetchData(db);
  };

  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    if (!db) return;
    await addDoc(collection(db, 'customers'), { ...customer, createdAt: Date.now() });
    await fetchData(db);
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    if (!db) return;
    const { id, ...data } = updatedCustomer;
    await updateDoc(doc(db, 'customers', id), data);
    await fetchData(db);
  };

  const deleteCustomer = async (customerId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'customers', customerId));
    await fetchData(db);
  };

  const addVendor = async (vendor: Omit<Vendor, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'vendors'), vendor);
    await fetchData(db);
  };

  const updateVendor = async (updatedVendor: Vendor) => {
    if (!db) return;
    const { id, ...data } = updatedVendor;
    await updateDoc(doc(db, 'vendors', id), data);
    await fetchData(db);
  };

  const deleteVendor = async (vendorId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'vendors', vendorId));
    await fetchData(db);
  };

  const addQuote = async (quote: Omit<Quote, 'id'>) => {
    if (!db) return;
    const newDoc = await addDoc(collection(db, 'quotes'), quote);
    await fetchData(db);
    return newDoc;
  };

  const updateQuote = async (quoteId: string, quoteData: Partial<Quote>) => {
    if (!db) return;
    await updateDoc(doc(db, "quotes", quoteId), quoteData);
    await fetchData(db);
  };

  const addRentalEquipment = async (equipment: Omit<RentalEquipment, 'id'>) => {
    if (!db) return;
    await addDoc(collection(db, 'rental_equipments'), equipment);
    await fetchData(db);
  };

  const updateRentalEquipment = async (updatedEquipment: RentalEquipment) => {
    if (!db) return;
    const { id, ...data } = updatedEquipment;
    await updateDoc(doc(db, 'rental_equipments', id), data);
    await fetchData(db);
  };

  const deleteRentalEquipment = async (equipmentId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'rental_equipments', equipmentId));
    await fetchData(db);
  };

  const getCategoryNameById = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name ?? 'N/A';
  }

  const getProductTypeNameById = (productTypeId: string) => {
    return productTypes.find(pt => pt.id === productTypeId)?.name ?? 'N/A';
  }

  const value = {
    db,
    products,
    categories,
    productTypes,
    companies,
    customers,
    vendors,
    quotes,
    rentalEquipments,
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
    addRentalEquipment,
    updateRentalEquipment,
    deleteRentalEquipment,
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
