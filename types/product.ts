import type { TextAreaConfig } from "./common";

export interface ShirtColor {
  name: string;
  hex: string;
}

export interface DesignItem {
  id: string;
  name: string;
  src: string;
}

export interface Product {
  id: string;
  label: string;
  file: string;
  overlayFile?: string;
  isGiftCard?: boolean;
  textArea?: TextAreaConfig;
  price: number;
  weight: number;
}
