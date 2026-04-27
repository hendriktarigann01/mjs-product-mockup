import type { TextAreaConfig } from "./common";
 
export interface GiftCardTemplate {
  id: string;
  name: string;
  file: string;
  textArea?: TextAreaConfig;
}
 
export interface FontOption {
  label: string;
  value: string;
}
 
export interface GiftCardState {
  text: string;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  activeTemplate: GiftCardTemplate;
}
 