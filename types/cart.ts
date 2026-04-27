export interface CartItem {
  id: string;
  name: string;
  price: number;
  weight: number;
  quantity: number;
  color: string;
  pattern: string;
  photos: string;
  notes: string;
  image: string;
  sku: string;
}

export interface OrderItem extends CartItem {
  imageSrc: string;
}
