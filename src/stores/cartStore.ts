import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type CommerceCart,
  createCart,
  addCartLine,
  updateCartLineQuantity,
  removeCartLine,
  fetchStoredCart,
  resolveCheckoutUrl,
} from '@/lib/commerceConnector';

// Exported so CartDrawer and other consumers can derive addon state from cart
// lines without re-hardcoding the IDs.
export const CONSECRATION_VARIANT_ID = 'v-consecration-1';
export const LAMP_VARIANT_ID = 'v-diya-1';

// ─── Store interface ──────────────────────────────────────────────────────────

interface CartStore {
  // The full connector cart object is the single source of truth.
  // All pricing, quantities, and line IDs come from here — never computed locally.
  cart: CommerceCart | null;
  isLoading: boolean;
  isSyncing: boolean;

  addItem: (variantId: string, quantity?: number) => Promise<void>;
  // lineId is cart.lines.edges[n].node.id — always sourced from the connector response.
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
  toggleConsecration: () => Promise<void>;
  toggleLamp: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findLineByVariantId(cart: CommerceCart, variantId: string) {
  return cart.lines.edges.find(e => e.node.merchandise.id === variantId)?.node ?? null;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      isSyncing: false,

      addItem: async (variantId, quantity = 1) => {
        const { cart, clearCart } = get();
        set({ isLoading: true });
        try {
          if (!cart) {
            // No cart yet — create one through the connector.
            const newCart = await createCart({ variantId, quantity });
            if (newCart) set({ cart: newCart });
          } else {
            const existingLine = findLineByVariantId(cart, variantId);
            if (existingLine) {
              // Variant already in cart — increment quantity via connector update.
              const result = await updateCartLineQuantity(
                cart.id,
                existingLine.id,
                existingLine.quantity + quantity,
              );
              if (result.cart) set({ cart: result.cart });
              else if (result.cartNotFound) clearCart();
            } else {
              // New line — add to existing cart.
              const result = await addCartLine(cart.id, { variantId, quantity });
              if (result.cart) set({ cart: result.cart });
              else if (result.cartNotFound) clearCart();
            }
          }
        } catch (error) {
          console.error('Failed to add item:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (lineId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(lineId);
          return;
        }
        const { cart, clearCart } = get();
        if (!cart) return;
        set({ isLoading: true });
        try {
          const result = await updateCartLineQuantity(cart.id, lineId, quantity);
          if (result.cart) set({ cart: result.cart });
          else if (result.cartNotFound) clearCart();
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (lineId) => {
        const { cart, clearCart } = get();
        if (!cart) return;
        set({ isLoading: true });
        try {
          const result = await removeCartLine(cart.id, lineId);
          if (result.cart) {
            result.cart.totalQuantity === 0 ? clearCart() : set({ cart: result.cart });
          } else if (result.cartNotFound) {
            clearCart();
          }
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: () => set({ cart: null }),

      // Apply the channel param at read time so it is never persisted in stale form.
      getCheckoutUrl: () => {
        const url = get().cart?.checkoutUrl;
        return url ? resolveCheckoutUrl(url) : null;
      },

      syncCart: async () => {
        const { cart, isSyncing, clearCart } = get();
        if (!cart?.id || isSyncing) return;
        set({ isSyncing: true });
        try {
          const updated = await fetchStoredCart(cart.id);
          if (!updated || updated.totalQuantity === 0) {
            clearCart();
          } else {
            set({ cart: updated });
          }
        } catch (error) {
          console.error('Failed to sync cart:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // Addon toggles: derive current state from cart lines, no local flags needed.
      toggleConsecration: async () => {
        const { cart } = get();
        const line = cart ? findLineByVariantId(cart, CONSECRATION_VARIANT_ID) : null;
        if (line) {
          await get().removeItem(line.id);
        } else {
          await get().addItem(CONSECRATION_VARIANT_ID, 1);
        }
      },

      toggleLamp: async () => {
        const { cart } = get();
        const line = cart ? findLineByVariantId(cart, LAMP_VARIANT_ID) : null;
        if (line) {
          await get().removeItem(line.id);
        } else {
          await get().addItem(LAMP_VARIANT_ID, 1);
        }
      },
    }),
    {
      name: 'divine-arts-cart',
      // Keep the persisted cart key stable while the connector implementation evolves.
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cart: state.cart }),
    },
  ),
);
