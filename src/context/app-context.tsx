
"use client";

import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type { SaleProduct, SaleCategory, GlobalSettings, ProductType } from '@/lib/types';
import { GLOBAL_SETTINGS } from '@/lib/constants';
import { db } from '@/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

interface AppContextType {
  products: SaleProduct[];
  categories: SaleCategory[];
  productTypes: ProductType[];
  globalSettings: GlobalSettings;
  loading: boolean;
  setGlobalSettings: (settings: GlobalSettings) => void;
  addProduct: (product: Omit<SaleProduct, 'id'>) => Promise<void>;
  updateProduct: (product: SaleProduct) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addCategory: (category: Omit<SaleCategory, 'id'>) => Promise<void>;
  updateCategory: (category: SaleCategory) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addProductType: (productType: Omit<ProductType, 'id'>) => Promise<void>;
  updateProductType: (productType: ProductType) => Promise<void>;
  deleteProductType: (productTypeId: string) => Promise<void>;
  getCategoryNameById: (categoryId: string) => string;
  getProductTypeNameById: (productTypeId: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [categories, setCategories] = useState<SaleCategory[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(GLOBAL_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!db) return;
    setLoading(true);
    try {
        const [productsSnapshot, categoriesSnapshot, productTypesSnapshot] = await Promise.all([
            getDocs(collection(db, 'products')),
            getDocs(collection(db, 'categories')),
            getDocs(collection(db, 'product_types')),
        ]);

        const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleProduct));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleCategory));
        const productTypesData = productTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductType));

        setProducts(productsData);
        setCategories(categoriesData);
        setProductTypes(productTypesData);

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
    const uniqueId = `${product.productTypeId.slice(0,2)}-${product.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
    const newProduct = { ...product, id: uniqueId };
    await setDoc(doc(db, 'products', newProduct.id), product);
    await fetchData();
  };

  const updateProduct = async (updatedProduct: SaleProduct) => {
    const { id, ...data } = updatedProduct;
    await updateDoc(doc(db, 'products', id), data);
    await fetchData();
  };

  const deleteProduct = async (productId: string) => {
    await deleteDoc(doc(db, 'products', productId));
    await fetchData();
  };

  const addCategory = async (category: Omit<SaleCategory, 'id'>) => {
    const uniqueId = `cat-${category.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
    const newCategory = { ...category, id: uniqueId };
    await setDoc(doc(db, 'categories', newCategory.id), category);
    await fetchData();
  };

  const updateCategory = async (updatedCategory: SaleCategory) => {
    const { id, ...data } = updatedCategory;
    await updateDoc(doc(db, 'categories', id), data);
    await fetchData();
  };

  const deleteCategory = async (categoryId: string) => {
    await deleteDoc(doc(db, 'categories', categoryId));
    await fetchData();
  };

  const addProductType = async (productType: Omit<ProductType, 'id'>) => {
    const uniqueId = `pt-${productType.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
    const newProductType = { ...productType, id: uniqueId };
    await setDoc(doc(db, 'product_types', newProductType.id), productType);
    await fetchData();
  };

  const updateProductType = async (updatedProductType: ProductType) => {
    const { id, ...data } = updatedProductType;
    await updateDoc(doc(db, 'product_types', id), data);
    await fetchData();
  };

  const deleteProductType = async (productTypeId: string) => {
    await deleteDoc(doc(db, 'product_types', productTypeId));
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
