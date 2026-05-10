export interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  category: string;
  description: string;
  images: string[];
}

export interface Category {
  id: string;
  slug: string;
  nombre: string;
  visible: boolean;
  orden: number;
}

// El formulario del admin mantiene price como string mientras se edita en el input
export interface ProductFormData {
  title: string;
  price: string;
  category: string;
  description: string;
  image1: string;
  image2: string;
  image3: string;
  image4: string;
}
