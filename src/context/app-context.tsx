"use client";

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Product, Settings, Category } from '@/lib/types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_CATEGORIES } from '@/lib/constants';

interface AppContextType {
  products: Product[];
  settings: Settings;
  categories: Category[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  getCategoryNameById: (categoryId: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);

  const addProduct = (product: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...product, id: Date.now().toString() }]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: Date.now().toString() }]);
  };

  const updateCategory = (updatedCategory: Category) => {
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
    settings,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    updateSettings,
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
