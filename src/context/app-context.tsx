"use client";

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { SaleProduct, SaleCategory } from '@/lib/types';
import { INITIAL_SALE_PRODUCTS, INITIAL_SALE_CATEGORIES } from '@/lib/constants';

interface AppContextType {
  products: SaleProduct[];
  categories: SaleCategory[];
  addProduct: (product: Omit<SaleProduct, 'id'>) => void;
  updateProduct: (product: SaleProduct) => void;
  deleteProduct: (productId: string) => void;
  addCategory: (category: Omit<SaleCategory, 'id'>) => void;
  updateCategory: (category: SaleCategory) => void;
  deleteCategory: (categoryId: string) => void;
  getCategoryNameById: (categoryId: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<SaleProduct[]>(INITIAL_SALE_PRODUCTS);
  const [categories, setCategories] = useState<SaleCategory[]>(INITIAL_SALE_CATEGORIES);

  const addProduct = (product: Omit<SaleProduct, 'id'>) => {
    setProducts(prev => [...prev, { ...product, id: Date.now().toString() }]);
  };

  const updateProduct = (updatedProduct: SaleProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const addCategory = (category: Omit<SaleCategory, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: Date.now().toString() }]);
  };

  const updateCategory = (updatedCategory: SaleCategory) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };

  const deleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
  };
  
  const getCategoryNameById = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name ?? 'N/A';
  }

  const value = {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryNameById,
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
