import {
  fetchBackendProductByHandle,
  fetchBackendProducts,
  type BackendProduct,
  type BackendVariant,
} from "@/lib/backend";

const CART_STORAGE_KEY = "divine-arts-connector-cart";
const CHECKOUT_PATH = "/checkout";

export interface CatalogProduct {
  node: CatalogProductNode;
}

export interface CatalogProductNode {
  id: string;
  title: string;
  description: string;
  handle: string;
  tags: string[];
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
        weight: number | null;
        weightUnit: string | null;
        selectedOptions: Array<{
          name: string;
          value: string;
        }>;
      };
    }>;
  };
  options: Array<{
    name: string;
    values: string[];
  }>;
  tagline?: string;
  longDescription?: string;
  deityName?: string | null;
  mantra?: string | null;
  vastuPlacement?: string | null;
  chakra?: string | null;
  element?: string | null;
  isAddon?: boolean;
  dimensions?: BackendProduct["dimensions"];
  published?: boolean;
}

export interface CommerceCartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: { amount: string; currencyCode: string };
    product: {
      id: string;
      handle: string;
      title: string;
      images: {
        edges: Array<{ node: { url: string; altText: string | null } }>;
      };
    };
  };
}

export interface CommerceCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
    totalTaxAmount: { amount: string; currencyCode: string } | null;
  };
  lines: {
    edges: Array<{ node: CommerceCartLine }>;
  };
}

const productCache = new Map<string, BackendProduct>();
const variantProductCache = new Map<string, BackendProduct>();
const variantCache = new Map<string, BackendVariant>();

function cacheProducts(products: BackendProduct[]) {
  for (const product of products) {
    productCache.set(product.id, product);
    for (const variant of product.variants) {
      variantProductCache.set(variant.id, product);
      variantCache.set(variant.id, variant);
    }
  }
}

function toImageEdges(product: BackendProduct) {
  return {
    edges: product.images.map((image) => ({
      node: {
        url: image.url,
        altText: image.alt ?? null,
      },
    })),
  };
}

function mapVariant(variant: BackendVariant) {
  return {
    id: variant.id,
    title: variant.title,
    price: {
      amount: String(variant.priceInr),
      currencyCode: "INR",
    },
    availableForSale: variant.availableForSale,
    weight: variant.weight ? parseFloat(variant.weight) || null : null,
    weightUnit: variant.weight?.split(" ")[1] ?? null,
    selectedOptions: [],
  };
}

function mapProduct(product: BackendProduct): CatalogProductNode {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    handle: product.handle,
    tags: product.tags,
    priceRange: {
      minVariantPrice: {
        amount: String(product.variants[0]?.priceInr ?? 0),
        currencyCode: "INR",
      },
    },
    images: toImageEdges(product),
    variants: {
      edges: product.variants.map((variant) => ({
        node: mapVariant(variant),
      })),
    },
    options: [],
    tagline: product.tagline,
    longDescription: product.longDescription,
    deityName: product.deityName,
    mantra: product.mantra,
    vastuPlacement: product.vastuPlacement,
    chakra: product.chakra,
    element: product.element,
    isAddon: product.isAddon,
    dimensions: product.dimensions,
    published: product.published,
  };
}

function readStoredCart(): CommerceCart | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CommerceCart;
  } catch {
    return null;
  }
}

function writeStoredCart(cart: CommerceCart | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!cart || cart.totalQuantity <= 0) {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function buildCartLine(
  product: BackendProduct,
  variant: BackendVariant,
  quantity: number,
): CommerceCartLine {
  return {
    id: `line:${variant.id}`,
    quantity,
    merchandise: {
      id: variant.id,
      title: variant.title,
      price: {
        amount: String(variant.priceInr),
        currencyCode: "INR",
      },
      product: {
        id: product.id,
        handle: product.handle,
        title: product.title,
        images: toImageEdges(product),
      },
    },
  };
}

function buildCart(lines: CommerceCartLine[], existingId?: string): CommerceCart {
  const subtotal = lines.reduce((sum, line) => {
    const unit = parseFloat(line.merchandise.price.amount) || 0;
    return sum + unit * line.quantity;
  }, 0);

  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const cart: CommerceCart = {
    id: existingId ?? `cart:${crypto.randomUUID()}`,
    checkoutUrl: CHECKOUT_PATH,
    totalQuantity,
    cost: {
      subtotalAmount: {
        amount: String(subtotal),
        currencyCode: "INR",
      },
      totalAmount: {
        amount: String(subtotal),
        currencyCode: "INR",
      },
      totalTaxAmount: null,
    },
    lines: {
      edges: lines.map((line) => ({ node: line })),
    },
  };

  writeStoredCart(cart);
  return cart;
}

function filterProducts(products: BackendProduct[], query?: string) {
  if (!query?.trim()) {
    return products;
  }

  const normalized = query.trim().toLowerCase();
  if (normalized.startsWith("tag:")) {
    const tag = normalized.slice(4);
    return products.filter(
      (product) =>
        product.tags.some((entry) => entry.toLowerCase().includes(tag)) ||
        (tag === "addon" && product.isAddon),
    );
  }

  return products.filter((product) => {
    const haystack = [
      product.title,
      product.handle,
      product.description,
      product.longDescription,
      product.deityName ?? "",
      ...product.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

async function ensureVariant(variantId: string) {
  const cachedVariant = variantCache.get(variantId);
  const cachedProduct = variantProductCache.get(variantId);
  if (cachedVariant && cachedProduct) {
    return { product: cachedProduct, variant: cachedVariant };
  }

  const products = await fetchBackendProducts();
  cacheProducts(products);

  const product = variantProductCache.get(variantId);
  const variant = variantCache.get(variantId);
  if (!product || !variant) {
    throw new Error(`Missing variant ${variantId}`);
  }

  return { product, variant };
}

function findStoredCartById(cartId: string) {
  const cart = readStoredCart();
  if (!cart || cart.id !== cartId) {
    return null;
  }
  return cart;
}

export async function fetchCatalogProducts(
  first = 50,
  query?: string,
): Promise<CatalogProduct[]> {
  const products = filterProducts(await fetchBackendProducts(), query).slice(0, first);
  cacheProducts(products);
  return products.map((product) => ({ node: mapProduct(product) }));
}

export async function fetchCatalogProductByHandle(handle: string) {
  const product = await fetchBackendProductByHandle(handle);
  if (!product) {
    return null;
  }
  cacheProducts([product]);
  return mapProduct(product);
}

export function resolveCheckoutUrl(checkoutUrl: string): string {
  if (typeof window === "undefined") {
    return checkoutUrl;
  }

  if (checkoutUrl.startsWith("http")) {
    return checkoutUrl;
  }

  return new URL(checkoutUrl, window.location.origin).toString();
}

export async function createCart(item: {
  variantId: string;
  quantity: number;
}): Promise<CommerceCart | null> {
  const { product, variant } = await ensureVariant(item.variantId);
  return buildCart([buildCartLine(product, variant, item.quantity)]);
}

export async function addCartLine(
  cartId: string,
  item: { variantId: string; quantity: number },
): Promise<{ cart: CommerceCart | null; cartNotFound: boolean }> {
  const cart = findStoredCartById(cartId);
  if (!cart) {
    return { cart: null, cartNotFound: true };
  }

  const existing = cart.lines.edges.map((edge) => edge.node);
  const line = existing.find((entry) => entry.merchandise.id === item.variantId);
  if (line) {
    line.quantity += item.quantity;
    return { cart: buildCart(existing, cart.id), cartNotFound: false };
  }

  const { product, variant } = await ensureVariant(item.variantId);
  existing.push(buildCartLine(product, variant, item.quantity));
  return { cart: buildCart(existing, cart.id), cartNotFound: false };
}

export async function updateCartLineQuantity(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<{ cart: CommerceCart | null; cartNotFound: boolean }> {
  const cart = findStoredCartById(cartId);
  if (!cart) {
    return { cart: null, cartNotFound: true };
  }

  const lines = cart.lines.edges
    .map((edge) => edge.node)
    .filter((line) => line.id !== lineId || quantity > 0)
    .map((line) => (line.id === lineId ? { ...line, quantity } : line));

  return { cart: buildCart(lines, cart.id), cartNotFound: false };
}

export async function removeCartLine(
  cartId: string,
  lineId: string,
): Promise<{ cart: CommerceCart | null; cartNotFound: boolean }> {
  const cart = findStoredCartById(cartId);
  if (!cart) {
    return { cart: null, cartNotFound: true };
  }

  const lines = cart.lines.edges.map((edge) => edge.node).filter((line) => line.id !== lineId);

  if (lines.length === 0) {
    writeStoredCart(null);
    return { cart: null, cartNotFound: false };
  }

  return { cart: buildCart(lines, cart.id), cartNotFound: false };
}

export async function fetchStoredCart(cartId: string): Promise<CommerceCart | null> {
  return findStoredCartById(cartId);
}
