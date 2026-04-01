import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, Loader2, Sparkles, Flame } from "lucide-react";
import { useCartStore, CONSECRATION_VARIANT_ID, LAMP_VARIANT_ID } from "@/stores/cartStore";
import { fetchCatalogProducts } from "@/lib/commerceConnector";
import { formatMoneyAmount } from "@/lib/pricing";
import brassDiyaLamp from "@/assets/brass-diya-lamp.jpg";

export const CartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [addonPrices, setAddonPrices] = useState<Record<string, { amount: string; currencyCode: string }>>({});
  const {
    cart,
    isLoading,
    isSyncing,
    updateQuantity,
    removeItem,
    getCheckoutUrl,
    syncCart,
    toggleConsecration,
    toggleLamp,
  } = useCartStore();

  // Derive all display state directly from the connector cart object.
  const lines = cart?.lines.edges ?? [];

  // Addon lines are rendered in their own UI sections below the regular item list.
  const regularLines = lines.filter(
    ({ node }) =>
      node.merchandise.id !== CONSECRATION_VARIANT_ID &&
      node.merchandise.id !== LAMP_VARIANT_ID,
  );

  const consecrationAdded = lines.some(
    ({ node }) => node.merchandise.id === CONSECRATION_VARIANT_ID,
  );
  const lampAdded = lines.some(
    ({ node }) => node.merchandise.id === LAMP_VARIANT_ID,
  );

  // Regular-item quantity for the header description (addons are not counted).
  const regularQuantity = regularLines.reduce((sum, { node }) => sum + node.quantity, 0);

  // Authoritative total from the connector cart object.
  const totalAmount = cart?.cost.totalAmount ?? null;

  useEffect(() => {
    if (isOpen) {
      syncCart();
      fetchCatalogProducts(10, "tag:addon").then(addons => {
        const map: Record<string, { amount: string; currencyCode: string }> = {};
        addons.forEach(p => {
          p.node.variants.edges.forEach((v: any) => {
            map[v.node.id] = { amount: v.node.price.amount, currencyCode: v.node.price.currencyCode };
          });
        });
        setAddonPrices(map);
      }).catch(() => {});
    }
  }, [isOpen, syncCart]);

  const handleCheckout = () => {
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) {
      window.location.assign(checkoutUrl);
      setIsOpen(false);
    }
  };

  const isEmpty = regularLines.length === 0 && !consecrationAdded && !lampAdded;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="relative text-ivory/70 hover:text-gold transition-colors">
          <ShoppingCart size={20} />
          {(cart?.totalQuantity ?? 0) > 0 && (
            <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-saffron text-[10px] flex items-center justify-center text-ivory font-body">
              {cart!.totalQuantity}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full bg-charcoal border-charcoal-light">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-ivory font-display text-2xl">Your Cart</SheetTitle>
          <SheetDescription className="text-ivory/50">
            {regularQuantity === 0
              ? "Your cart is empty"
              : `${regularQuantity} item${regularQuantity !== 1 ? "s" : ""}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {isEmpty ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-ivory/20 mx-auto mb-4" />
                <p className="text-ivory/40 font-body">Your cart is empty</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                {/* ── Regular line items ─────────────────────────────────── */}
                <div className="space-y-4">
                  {regularLines.map(({ node: line }) => {
                    const { merchandise } = line;
                    const image = merchandise.product.images.edges[0]?.node ?? null;
                    return (
                      <div
                        key={line.id}
                        className="flex gap-4 p-3 rounded bg-charcoal-light/50"
                      >
                        <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-charcoal-light">
                          {image && (
                            <img
                              src={image.url}
                              alt={image.altText ?? merchandise.product.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-display text-ivory text-sm truncate">
                            {merchandise.product.title}
                          </h4>
                          {merchandise.title !== "Default Title" && (
                            <p className="text-xs text-ivory/40 font-body">
                              {merchandise.title}
                            </p>
                          )}
                          {/* Price comes directly from the cart line — never cached locally */}
                          <p className="text-gold font-display text-sm mt-1">
                            {formatMoneyAmount(
                              merchandise.price.amount,
                              merchandise.price.currencyCode,
                            )}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <button
                            onClick={() => removeItem(line.id)}
                            className="text-ivory/30 hover:text-saffron transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(line.id, line.quantity - 1)}
                              className="w-6 h-6 rounded border border-ivory/20 flex items-center justify-center text-ivory/50 hover:border-gold hover:text-gold transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center text-xs text-ivory font-body">
                              {line.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(line.id, line.quantity + 1)}
                              className="w-6 h-6 rounded border border-ivory/20 flex items-center justify-center text-ivory/50 hover:border-gold hover:text-gold transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Consecration add-on ────────────────────────────────── */}
                <div
                  className={`mt-4 border p-4 rounded transition-all duration-300 ${
                    consecrationAdded ? "border-gold/40 bg-gold/5" : "border-ivory/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-gold flex-shrink-0" />
                      <div>
                        <p className="font-display text-ivory text-sm">Shuddhi Poojan</p>
                        <p className="text-ivory/40 font-body text-[11px]">
                          Consecration service
                          {!consecrationAdded && addonPrices[CONSECRATION_VARIANT_ID] && (
                            <> · {formatMoneyAmount(addonPrices[CONSECRATION_VARIANT_ID].amount, addonPrices[CONSECRATION_VARIANT_ID].currencyCode)}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleConsecration()}
                      disabled={isLoading}
                      className={`px-3 py-1 text-xs font-display tracking-wider border transition-all ${
                        consecrationAdded
                          ? "bg-gold text-charcoal border-gold"
                          : "border-gold/40 text-gold hover:bg-gold/10"
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : consecrationAdded ? (
                        "Added ✓"
                      ) : (
                        "Add"
                      )}
                    </button>
                  </div>
                </div>

                {/* ── Lamp upsell ────────────────────────────────────────── */}
                <div
                  className={`mt-4 border p-4 rounded transition-all duration-300 ${
                    lampAdded ? "border-gold/40 bg-gold/5" : "border-ivory/10"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0 bg-charcoal-light">
                      <img
                        src={brassDiyaLamp}
                        alt="Brass Diya Lamp"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1 mb-1">
                        <Flame size={14} className="text-saffron flex-shrink-0 mt-0.5" />
                        <p className="font-display text-ivory text-sm">Traditional Brass Diya</p>
                      </div>
                      <p className="text-ivory/40 font-body text-[11px] leading-relaxed mb-2">
                        Complete your altar with a hand-cast brass diya.
                        {!lampAdded && addonPrices[LAMP_VARIANT_ID] && (
                          <> · {formatMoneyAmount(addonPrices[LAMP_VARIANT_ID].amount, addonPrices[LAMP_VARIANT_ID].currencyCode)}</>
                        )}
                      </p>
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => toggleLamp()}
                          disabled={isLoading}
                          className={`px-3 py-1 text-xs font-display tracking-wider border transition-all ${
                            lampAdded
                              ? "bg-gold text-charcoal border-gold"
                              : "border-gold/40 text-gold hover:bg-gold/10"
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : lampAdded ? (
                            "Added ✓"
                          ) : (
                            "Add to Order"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Footer: estimated total + checkout ───────────────────── */}
              <div className="flex-shrink-0 space-y-4 pt-4 border-t border-ivory/10">
                <div className="flex justify-between items-center">
                  <span className="text-ivory/60 font-body text-sm uppercase tracking-wider">
                    Estimated Total
                  </span>
                  <span className="text-gold font-display text-xl">
                    {totalAmount
                      ? formatMoneyAmount(totalAmount.amount, totalAmount.currencyCode)
                      : "—"}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={!cart || cart.totalQuantity === 0 || isLoading || isSyncing}
                  className="w-full py-3 bg-gold text-charcoal font-display text-lg tracking-wider hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {isLoading || isSyncing ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Proceed to Checkout"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
