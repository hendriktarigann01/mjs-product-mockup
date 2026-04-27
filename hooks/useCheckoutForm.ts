import { useState, useCallback } from "react";
import type {
  WilayahValue,
  ShippingService,
  BillingOption,
} from "@/types/checkout";
import { EMPTY_WILAYAH } from "@/constants/checkout";

export function useCheckoutForm() {
  // Contact
  const [email, setEmail] = useState("");
  const [newsletter, setNewsletter] = useState(false);

  // Delivery form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [wilayah, setWilayah] = useState<WilayahValue>(EMPTY_WILAYAH);

  // Shipping
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingService | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Billing
  const [billingOption, setBillingOption] = useState<BillingOption>("same");

  // Derived state
  const addressComplete = !!(
    wilayah.provinsiId &&
    wilayah.kabupatenId &&
    wilayah.kecamatanId &&
    address
  );

  // Handle wilayah change with shipping reset
  const handleWilayahChange = useCallback(
    (val: WilayahValue) => {
      if (val.kecamatanId !== wilayah.kecamatanId) {
        setSelectedShipping(null);
      }
      setWilayah(val);
    },
    [wilayah.kecamatanId],
  );

  // Reset function
  const reset = useCallback(() => {
    setEmail("");
    setNewsletter(false);
    setFirstName("");
    setLastName("");
    setAddress("");
    setZip("");
    setPhone("");
    setWilayah(EMPTY_WILAYAH);
    setSelectedShipping(null);
    setBillingOption("same");
  }, []);

  return {
    // Contact
    email,
    setEmail,
    newsletter,
    setNewsletter,

    // Delivery
    firstName,
    setFirstName,
    lastName,
    setLastName,
    address,
    setAddress,
    zip,
    setZip,
    phone,
    setPhone,
    wilayah,
    handleWilayahChange,

    // Shipping
    selectedShipping,
    setSelectedShipping,
    loadingShipping,
    setLoadingShipping,

    // Billing
    billingOption,
    setBillingOption,

    // Derived
    addressComplete,

    // Methods
    reset,
  };
}
