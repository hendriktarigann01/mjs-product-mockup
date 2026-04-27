export interface WilayahValue {
  provinsiId: string;
  provinsiName: string;
  kabupatenId: string;
  kabupatenName: string;
  kecamatanId: string;
  kecamatanName: string;
  kelurahanId: string;
  kelurahanName: string;
}

export interface ShippingService {
  id: string;
  name: string;
  price: number;
  estimatedDays: number;
}

export type BillingOption = "same" | "different";

export interface CheckoutFormData {
  email: string;
  newsletter: boolean;
  firstName: string;
  lastName: string;
  address: string;
  zip: string;
  phone: string;
  wilayah: WilayahValue;
  selectedShipping: ShippingService | null;
  billingOption: BillingOption;
}
