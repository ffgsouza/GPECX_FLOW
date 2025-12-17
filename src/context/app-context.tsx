
"use client";

import { createContext, useContext, useState, type ReactNode, useEffect, useMemo } from 'react';
import type { SaleProduct, SaleCategory, GlobalSettings, ProductType, Company, Quote } from '@/lib/types';
import { GLOBAL_SETTINGS } from '@/lib/constants';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, type Firestore } from 'firebase/firestore';

// This will be initialized on the client
let db: Firestore | null = null;

interface AppContextType {
  products: SaleProduct[];
  categories: SaleCategory[];
  productTypes: ProductType[];
  companies: Company[];
  quotes: Quote[];
  globalSettings: GlobalSettings;
  loading: boolean;
  setGlobalSettings: (settings: GlobalSettings) => void;
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
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(GLOBAL_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
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
        const [productsSnapshot, categoriesSnapshot, productTypesSnapshot, companiesSnapshot, quotesSnapshot] = await Promise.all([
            getDocs(collection(db, 'products')),
            getDocs(collection(db, 'categories')),
            getDocs(collection(db, 'product_types')),
            getDocs(collection(db, 'companies')),
            getDocs(collection(db, 'quotes')),
        ]);

        const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleProduct));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleCategory));
        const productTypesData = productTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductType));
        const companiesData = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
        const quotesData = quotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote));

        const getCategoryName = (id: string) => categoriesData.find(c => c.id === id)?.name ?? '';
        
        const sortedProducts = [...productsData].sort((a, b) => {
            const categoryNameA = getCategoryName(a.categoryId);
            const categoryNameB = getCategoryName(b.categoryId);
            const order: { [key: string]: number } = {
                'Universal Test Set': 1,
                'Acessórios Gerais': 3,
            };

            const orderA = order[categoryNameA] || 2;
            const orderB = order[categoryNameB] || 2;

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            return categoryNameA.localeCompare(categoryNameB) || a.name.localeCompare(b.name);
        });

        setProducts(sortedProducts);
        setCategories(categoriesData);
        setProductTypes(productTypesData);
        setCompanies(companiesData);
        setQuotes(quotesData);

    } catch (error) {
        console.error("Error fetching initial data:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


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
