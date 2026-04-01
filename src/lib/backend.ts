const DEFAULT_API_BASE_URL = "https://kala-store-codex-api.vercel.app";

export const BACKEND_API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/$/, "");

export interface BackendMediaAsset {
  id: string;
  url: string;
  storageKey?: string;
  alt?: string;
  kind?: "image" | "video";
}

export interface BackendVariant {
  id: string;
  sku: string;
  title: string;
  priceInr: number;
  compareAtPriceInr?: number | null;
  availableForSale: boolean;
  stockOnHand: number;
  weight?: string | null;
}

export interface BackendProduct {
  id: string;
  handle: string;
  title: string;
  tagline: string;
  description: string;
  longDescription: string;
  deityName?: string | null;
  mantra?: string | null;
  vastuPlacement?: string | null;
  chakra?: string | null;
  element?: string | null;
  tags: string[];
  isAddon: boolean;
  dimensions?:
    | {
        height: string;
        width: string;
        depth: string;
      }
    | null;
  images: BackendMediaAsset[];
  variants: BackendVariant[];
  published: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface BackendGuideQuestion {
  id: string;
  prompt: string;
  options: Array<{
    id: string;
    label: string;
    deityTags: string[];
  }>;
}

export interface BackendShippingRule {
  id: string;
  name: string;
  zone: string;
  minSubtotalInr: number;
  flatRateInr: number;
}

export interface CheckoutAddress {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutLineInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface BackendCheckoutSessionResponse {
  checkoutSession: {
    id: string;
  };
  order: {
    id: string;
    orderNumber: string;
  };
  mockPayment: boolean;
  gatewayConfigured: boolean;
  paymentRequest?: {
    action: string;
    method: "POST";
    fields: Record<string, string>;
  } | null;
}

async function backendRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Backend request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchBackendProducts(search?: string): Promise<BackendProduct[]> {
  const url = new URL(`${BACKEND_API_BASE_URL}/store/products`);
  if (search && search.trim()) {
    url.searchParams.set("search", search.trim());
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not fetch products from backend");
  }

  return response.json() as Promise<BackendProduct[]>;
}

export async function fetchBackendProductByHandle(
  handle: string,
): Promise<BackendProduct | null> {
  const response = await fetch(
    `${BACKEND_API_BASE_URL}/store/products/${encodeURIComponent(handle)}`,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Could not fetch product ${handle}`);
  }

  return response.json() as Promise<BackendProduct>;
}

export async function fetchBackendGuideQuestions(): Promise<BackendGuideQuestion[]> {
  return backendRequest<BackendGuideQuestion[]>("/store/guide/questions");
}

export async function fetchBackendGuideRecommendations(
  answers: Record<string, string>,
): Promise<BackendProduct[]> {
  return backendRequest<BackendProduct[]>("/store/guide/recommendations", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export async function createGuideLead(input: {
  email: string;
  name?: string;
  answers: Record<string, string>;
}) {
  return backendRequest<{ id: string; email: string }>("/store/leads", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function submitContactForm(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  return backendRequest<{ id: string }>("/store/contact", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchShippingRules(): Promise<BackendShippingRule[]> {
  return backendRequest<BackendShippingRule[]>("/store/shipping-rules");
}

export async function createBackendCheckoutSession(input: {
  address: CheckoutAddress;
  lines: CheckoutLineInput[];
  couponCode?: string | null;
  shippingRuleId?: string | null;
}) {
  return backendRequest<BackendCheckoutSessionResponse>("/store/checkout/sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function completeBackendCheckoutSession(
  checkoutSessionId: string,
  outcome: "paid" | "failed" = "paid",
) {
  return backendRequest(`/store/checkout/sessions/${checkoutSessionId}/complete`, {
    method: "POST",
    body: JSON.stringify({ outcome }),
  });
}
