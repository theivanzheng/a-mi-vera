import React, { createContext, useState, useEffect } from 'react';
import initialProducts from '../data/products.json';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const MAESTRAS_CATEGORIAS = [
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
    'Vivan los novios'
  ];

  useEffect(() => {
    // Load from local storage or from initial JSON
    const storedProducts = localStorage.getItem('amivera_products_v4');
    if (storedProducts) {
      const parsed = JSON.parse(storedProducts);
      setProducts(parsed);
      extractCategories(parsed);
    } else {
      setProducts(initialProducts);
      extractCategories(initialProducts);
      localStorage.setItem('amivera_products_v4', JSON.stringify(initialProducts));
    }
  }, []);

  const extractCategories = (productList) => {
    // We enforce the WhatsApp categories but also include any new ones someone might ad-hoc add
    const usedCategories = new Set(productList.map(p => p.category));
    let finalCategories = [...MAESTRAS_CATEGORIAS];
    
    usedCategories.forEach(c => {
      if (!finalCategories.includes(c)) {
        finalCategories.push(c);
      }
    });
    setCategories(finalCategories);
  };

  const addProduct = (newProduct) => {
    // Ensure images property is an array and filter out empty strings
    const imagesArray = [
      newProduct.image1,
      newProduct.image2,
      newProduct.image3,
      newProduct.image4
    ].filter(img => img && img.trim() !== '');

    const productWithId = {
      title: newProduct.title,
      price: parseFloat(newProduct.price),
      category: newProduct.category,
      description: newProduct.description,
      images: imagesArray.length > 0 ? imagesArray : ['https://via.placeholder.com/600?text=Sin+Imagen'],
      id: Date.now()
    };

    const updatedProducts = [productWithId, ...products];
    setProducts(updatedProducts);
    extractCategories(updatedProducts);
    localStorage.setItem('amivera_products_v4', JSON.stringify(updatedProducts));
  };

  return (
    <ProductContext.Provider value={{ products, categories, addProduct }}>
      {children}
    </ProductContext.Provider>
  );
};
