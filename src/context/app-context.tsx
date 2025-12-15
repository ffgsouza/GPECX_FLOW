
"use client";

import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type { SaleProduct, SaleCategory, GlobalSettings, ProductType } from '@/lib/types';
import { INITIAL_SALE_PRODUCTS, INITIAL_SALE_CATEGORIES, GLOBAL_SETTINGS, INITIAL_PRODUCT_TYPES } from '@/lib/constants';
import { initializeFirebase } from '@/firebase';

// Dummy config for server-side rendering
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface AppContextType {
  products: SaleProduct[];
  categories: SaleCategory[];
  productTypes: ProductType[];
  globalSettings: GlobalSettings;
  setGlobalSettings: (settings: GlobalSettings) => void;
  addProduct: (product: Omit<SaleProduct, 'id'>) => void;
  updateProduct: (product: SaleProduct) => void;
  deleteProduct: (productId: string) => void;
  addCategory: (category: Omit<SaleCategory, 'id'>) => void;
  updateCategory: (category: SaleCategory) => void;
  deleteCategory: (categoryId: string) => void;
  addProductType: (productType: Omit<ProductType, 'id'>) => void;
  updateProductType: (productType: ProductType) => void;
  deleteProductType: (productTypeId: string) => void;
  getCategoryNameById: (categoryId: string) => string;
  getProductTypeNameById: (productTypeId: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
        initializeFirebase(firebaseConfig);
    }
  }, []);

  const [products, setProducts] = useState<SaleProduct[]>(INITIAL_SALE_PRODUCTS);
  const [categories, setCategories] = useState<SaleCategory[]>(INITIAL_SALE_CATEGORIES);
  const [productTypes, setProductTypes] = useState<ProductType[]>(INITIAL_PRODUCT_TYPES);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(GLOBAL_SETTINGS);

  const addProduct = (product: Omit<SaleProduct, 'id'>) => {
    const uniqueId = `${product.productTypeId.slice(0,2)}-${product.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
    setProducts(prev => [...prev, { ...product, id: uniqueId }]);
  };

  const updateProduct = (updatedProduct: SaleProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const addCategory = (category: Omit<SaleCategory, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: `cat-${Date.now()}` }]);
  };

  const updateCategory = (updatedCategory: SaleCategory) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };

  const deleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
  };

  const addProductType = (productType: Omit<ProductType, 'id'>) => {
    setProductTypes(prev => [...prev, { ...productType, id: `pt-${Date.now()}` }]);
  };

  const updateProductType = (updatedProductType: ProductType) => {
    setProductTypes(prev => prev.map(pt => pt.id === updatedProductType.id ? updatedProductType : pt));
  };

  const deleteProductType = (productTypeId: string) => {
    setProductTypes(prev => prev.filter(pt => pt.id !== productTypeId));
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
    globalSettings,
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
