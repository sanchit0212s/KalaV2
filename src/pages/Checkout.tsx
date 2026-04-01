import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  completeBackendCheckoutSession,
  createBackendCheckoutSession,
  fetchShippingRules,
  type BackendShippingRule,
} from "@/lib/backend";
import { formatMoneyAmount } from "@/lib/pricing";
import { useCartStore } from "@/stores/cartStore";

type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const initialForm: CheckoutForm = {
  fullName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
};

function submitPayuForm(action: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.style.display = "none";

  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  form.remove();
}

export default function Checkout() {
  const navigate = useNavigate();
  const cart = useCartStore((state) => state.cart);
  const clearCart = useCartStore((state) => state.clearCart);
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [shippingRules, setShippingRules] = useState<BackendShippingRule[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const lines = cart?.lines.edges.map((edge) => edge.node) ?? [];

  useEffect(() => {
    fetchShippingRules().then(setShippingRules).catch(() => {
      toast.error("Could not load shipping rules");
    });
  }, []);

  const selectedShippingRule = shippingRules[0] ?? null;
  const subtotal = Number(cart?.cost.subtotalAmount.amount ?? 0);
  const shipping = selectedShippingRule?.flatRateInr ?? 0;
  const estimatedTotal = subtotal + shipping;

  const canSubmit = useMemo(() => {
    return (
      lines.length > 0 &&
      form.fullName.trim() &&
      form.email.trim() &&
      form.phone.trim() &&
      form.line1.trim() &&
      form.city.trim() &&
      form.state.trim() &&
      form.postalCode.trim()
    );
  }, [form, lines.length]);

  const handleChange = (field: keyof CheckoutForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!cart || lines.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setSubmitting(true);

    try {
      const session = await createBackendCheckoutSession({
        address: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          line1: form.line1.trim(),
          line2: form.line2.trim() || null,
          city: form.city.trim(),
          state: form.state.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim() || "IN",
        },
        lines: lines.map((line) => ({
          productId: line.merchandise.product.id,
          variantId: line.merchandise.id,
          quantity: line.quantity,
        })),
        shippingRuleId: selectedShippingRule?.id ?? null,
        couponCode: null,
      });

      if (!session.gatewayConfigured || session.mockPayment) {
        await completeBackendCheckoutSession(session.checkoutSession.id, "paid");
        clearCart();
        navigate(`/thank-you?order=${encodeURIComponent(session.order.orderNumber)}`);
        return;
      }

      const paymentRequest = session.paymentRequest;
      if (!paymentRequest) {
        throw new Error("Missing payment handoff details from backend");
      }

      submitPayuForm(paymentRequest.action, paymentRequest.fields);
    } catch (error) {
      toast.error("Checkout failed", {
        description: error instanceof Error ? error.message : "Unknown checkout error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart || lines.length === 0) {
    return (
      <div className="bg-charcoal min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="font-display text-4xl text-ivory mb-4">Your cart is empty</h1>
          <p className="text-ivory/40 font-body mb-8">
            Add a sacred form to continue to checkout.
          </p>
          <Link
            to="/collection"
            className="inline-block px-10 py-4 bg-gold text-charcoal font-display text-lg tracking-widest hover:bg-gold-light transition-all"
          >
            Explore the Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-charcoal min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-5xl text-ivory mb-4">Checkout</h1>
          <p className="text-ivory/40 font-body max-w-xl mx-auto">
            Enter your details to place your order securely through Divine Arts.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border border-ivory/10 p-6 bg-charcoal-light/30">
              <h2 className="font-display text-2xl text-ivory mb-6">Delivery Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="Full name"
                  className="bg-transparent border border-ivory/10 px-4 py-3 text-ivory font-body text-sm focus:border-gold/40 focus:outline-none transition-colors"
                />
                <input
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Email"
                  type="email"
                  className="bg-transparent border border-ivory/10 px-4 py-3 text-ivory font-body text-sm focus:border-gold/40 focus:outline-none transition-colors"
                />
                <input
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="Phone"
                  className="bg-transparent border border-ivory/10 px-4 py-3 text-ivory font-body text-sm focus:border-gold/40 focus:outline-none transition-colors"
                />
                <input
                  value={form.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  placeholder="Postal code"
                  className="bg-transparent border border-ivory/10 px-4 py-3 text-ivory font-body text-sm focus:border-gold/40 focus:outline-none transition-colors"
                />
                <input
                  value={form.line1}
                  onChange={(e) => handleChange("line1", e.target.value)}
                  placeholder="Address line 1"
                  className="md:col-span-2 bg-transparent border border-ivory/10 px-4 py-3 text-ivory font-body text-sm focus:border-gold/40 focus:outline-none transition-colors"
                />
                <input
                  value={form.line2}
                  onChange={(e) => handleChange("line2", e.target.value)}
                  placeholder="Address line 2 (optional)"
                  className="md:col-span-2 bg-transparent border border-ivory/10 px-4 py-3 text-ivory font-body text-sm focus:border-gold/40 focus:outline-none transition-colors"
                />
                <input
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="City"
                  className="bg-transparent border border-ivory/10 px-4 py-3 text-ivory font-body text-sm focus:border-gold/40 focus:outline-none transition-colors"
                />
                <input
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="State"
                  className="bg-transparent border border-ivory/10 px-4 py-3 text-ivory font-body text-sm focus:border-gold/40 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="w-full py-4 bg-gold text-charcoal font-display text-lg tracking-widest hover:bg-gold-light transition-all duration-500 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Place Order"
              )}
            </button>
          </form>

          <div className="border border-ivory/10 p-6 bg-charcoal-light/20 h-fit">
            <h2 className="font-display text-2xl text-ivory mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              {lines.map((line) => (
                <div key={line.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-ivory font-display text-sm">{line.merchandise.product.title}</p>
                    <p className="text-ivory/40 font-body text-xs">
                      {line.quantity} × {line.merchandise.title}
                    </p>
                  </div>
                  <p className="text-gold font-display text-sm">
                    {formatMoneyAmount(
                      (parseFloat(line.merchandise.price.amount) || 0) * line.quantity,
                      line.merchandise.price.currencyCode,
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-ivory/10 pt-4">
              <div className="flex items-center justify-between text-ivory/50 font-body text-sm">
                <span>Subtotal</span>
                <span>{formatMoneyAmount(subtotal, "INR")}</span>
              </div>
              <div className="flex items-center justify-between text-ivory/50 font-body text-sm">
                <span>Shipping</span>
                <span>{formatMoneyAmount(shipping, "INR")}</span>
              </div>
              <div className="flex items-center justify-between text-gold font-display text-lg pt-2 border-t border-ivory/10">
                <span>Estimated total</span>
                <span>{formatMoneyAmount(estimatedTotal, "INR")}</span>
              </div>
            </div>

            <p className="text-ivory/30 font-body text-xs mt-4 leading-relaxed">
              Final tax and payment capture are managed by the backend during checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
