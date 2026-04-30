export interface MidtransConfig {
  serverKey: string;
  clientKey: string;
  environment: "sandbox" | "production";
}

export interface PaymentData {
  transactionDetails: {
    orderId: string;
    grossAmount: number;
  };
  customerDetails?: {
    firstName: string;
    lastName?: string;
    email: string;
    phone: string;
  };
  itemDetails?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
}

/**
 * Initialize Midtrans Snap
 * Call this in your layout or on page load
 */
export function initMidtrans(
  clientKey: string,
  environment: "sandbox" | "production" = "sandbox",
) {
  if (typeof window === "undefined") return;

  // Load Snap.js dynamically
  const script = document.createElement("script");
  script.src =
    environment === "sandbox"
      ? "https://app.sandbox.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
  script.setAttribute("data-client-key", clientKey);
  script.async = true;
  document.head.appendChild(script);
}

/**
 * Open Midtrans payment popup
 */
export function openMidtransPayment(snapToken: string, options?: any) {
  if (typeof window === "undefined") return;

  const snap = (window as any).snap;
  if (!snap) {
    console.error("Midtrans Snap not loaded");
    return;
  }

  snap.pay(snapToken, options);
}

/**
 * Create transaction token (call from backend)
 * You'll need to call your backend API
 */
export async function createTransactionToken(paymentData: PaymentData) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const endpoint = `${apiUrl}/api/midtrans/create-token`;

    console.log("Creating transaction token at:", endpoint);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          `HTTP ${response.status}: Failed to create transaction token`,
      );
    }

    const data = await response.json();

    if (!data.token && !data.isCashier) {
      throw new Error("No token received from backend");
    }

    console.log("✅ Transaction response received");
    return data;
  } catch (error) {
    console.error("Error creating transaction token:", error);
    throw error;
  }
}

/**
 * Handle payment status callback
 * Call this after payment to verify status
 */
export async function verifyPaymentStatus(orderId: string) {
  try {
    const response = await fetch(`/api/midtrans/verify/${orderId}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to verify payment");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
}
