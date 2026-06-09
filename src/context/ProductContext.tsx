import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { Product, ProductFormData } from '../types/product';
import { toSlug } from '../lib/slug';
import initialProducts from '../data/products.json';

interface ProductContextType {
  products: Product[];
  categories: string[];
  addProduct: (formData: ProductFormData) => void;
  updateProduct: (id: string, formData: ProductFormData) => void;
  deleteProduct: (id: string) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const MAESTRAS_CATEGORIAS: string[] = [
  'Todos',
  'Detalles con magia',
  'Regalos con foto',
  'Pasión por la madera',
  'Pasión por el vino',
  'Maestros cerveceros',
  'Especial primera comunión',
  'Regalos únicos',
  'Novedades',
  'Nuestros peques',
  'Somos de cava',
  'Vivan los novios',
];

// Tipo intermedio para datos históricos que pueden carecer de id string y slug
type StoredProduct = Omit<Product, 'id' | 'slug'> & {
  id?: number | string;
  slug?: string;
};

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const extractCategories = (productList: Product[]) => {
    const usedCategories = new Set(productList.map(p => p.category));
    const finalCategories = [...MAESTRAS_CATEGORIAS];
    usedCategories.forEach(c => {
      if (!finalCategories.includes(c)) finalCategories.push(c);
    });
    setCategories(finalCategories);
  };

  useEffect(() => {
    // v6 ya migrado — usar directamente
    const v6 = localStorage.getItem('amivera_products_v6');
    if (v6) {
      const parsed = (JSON.parse(v6) as Product[]).map(p => ({
        ...p,
        // Backfill: productos guardados antes de añadir categories[]
        categories: p.categories ?? (p.category ? [p.category] : []),
      }));
      setProducts(parsed);
      extractCategories(parsed);
      return;
    }

    // Migrar desde v5 (UUIDs, sin slugs), v4 (IDs enteros) o products.json
    const v5 = localStorage.getItem('amivera_products_v5');
    const v4 = localStorage.getItem('amivera_products_v4');

    const source: StoredProduct[] = v5
      ? (JSON.parse(v5) as StoredProduct[])
      : v4
        ? (JSON.parse(v4) as StoredProduct[])
        : (initialProducts as StoredProduct[]);

    const migrated: Product[] = source.map((p): Product => ({
      title: p.title,
      price: p.price,
      category: p.category,
      categories: p.category ? [p.category] : [],
      description: p.description,
      images: p.images,
      id: typeof p.id === 'string' ? p.id : crypto.randomUUID(),
      slug: p.slug ?? toSlug(p.title),
    }));

    setProducts(migrated);
    extractCategories(migrated);
    localStorage.setItem('amivera_products_v6', JSON.stringify(migrated));
    if (v5) localStorage.removeItem('amivera_products_v5');
    if (v4) localStorage.removeItem('amivera_products_v4');
  }, []);

  const addProduct = (formData: ProductFormData) => {
    const imagesArray = (
      [formData.image1, formData.image2, formData.image3, formData.image4] as string[]
    ).filter(img => img && img.trim() !== '');

    const newProduct: Product = {
      id: crypto.randomUUID(),
      slug: toSlug(formData.title),
      title: formData.title,
      price: parseFloat(formData.price),
      category: formData.category,
      categories: formData.category ? [formData.category] : [],
      description: formData.description,
      images: imagesArray.length > 0
        ? imagesArray
        : ['https://via.placeholder.com/600?text=Sin+Imagen'],
    };

    const updatedProducts = [newProduct, ...products];
    setProducts(updatedProducts);
    extractCategories(updatedProducts);
    localStorage.setItem('amivera_products_v6', JSON.stringify(updatedProducts));
  };

  const updateProduct = (id: string, formData: ProductFormData) => {
    const images = (
      [formData.image1, formData.image2, formData.image3, formData.image4] as string[]
    ).filter(img => img && img.trim() !== '');

    const updated: Product = {
      id,
      slug: toSlug(formData.title),
      title: formData.title,
      price: parseFloat(formData.price),
      category: formData.category,
      categories: formData.category ? [formData.category] : [],
      description: formData.description,
      images: images.length > 0
        ? images
        : ['https://via.placeholder.com/600?text=Sin+Imagen'],
    };

    const updatedProducts = products.map(p => p.id === id ? updated : p);
    setProducts(updatedProducts);
    extractCategories(updatedProducts);
    localStorage.setItem('amivera_products_v6', JSON.stringify(updatedProducts));
  };

  const deleteProduct = (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    extractCategories(updatedProducts);
    localStorage.setItem('amivera_products_v6', JSON.stringify(updatedProducts));
  };

  return (
    <ProductContext.Provider value={{ products, categories, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = (): ProductContextType => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error('useProductContext must be used inside ProductProvider');
  return ctx;
};
