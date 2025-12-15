
"use client";

import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type { SaleProduct, SaleCategory, GlobalSettings, ProductType } from '@/lib/types';
import { GLOBAL_SETTINGS } from '@/lib/constants';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch, type Firestore } from 'firebase/firestore';

// This will be initialized on the client
let db: Firestore | null = null;


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
    if (!db) {
        // Initialize Firebase on the client
        const firebase = initializeFirebase({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        });
        db = firebase.db;
    }
      
    if (!db) {
        console.error("Firestore is not initialized.");
        setLoading(false);
        return;
    };

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
    if (!db) return;
    const docRef = doc(collection(db, 'products'));
    const newProduct = { ...product, id: docRef.id };
    await setDoc(docRef, product);
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
    const docRef = doc(collection(db, 'categories'));
    const newCategory = { ...category, id: docRef.id };
    await setDoc(docRef, category);
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
    const docRef = doc(collection(db, 'product_types'));
    const newProductType = { ...productType, id: docRef.id };
    await setDoc(docRef, productType);
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
