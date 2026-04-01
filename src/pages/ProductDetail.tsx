import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  fetchCatalogProductByHandle,
  fetchCatalogProducts,
  type CatalogProduct,
} from "@/lib/commerceConnector";
import { matchProductToDeity } from "@/data/deities";
import { useCartStore, CONSECRATION_VARIANT_ID } from "@/stores/cartStore";
import { toast } from "sonner";
import { Loader2, Truck, Shield, Sparkles, Play } from "lucide-react";
import { formatMoneyAmount } from "@/lib/pricing";
import certificateBackdrop from "@/assets/certificate-backdrop.jpg";

export default function ProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"vastu" | "chakra" | "element" | "care">("vastu");
  const [relatedProducts, setRelatedProducts] = useState<CatalogProduct[]>([]);
  const [addonPrices, setAddonPrices] = useState<Record<string, { amount: string; currencyCode: string }>>({});
  const addItem = useCartStore(state => state.addItem);
  const isLoading = useCartStore(state => state.isLoading);
  const cart = useCartStore(state => state.cart);
  const consecrationAdded = cart?.lines.edges.some(
    e => e.node.merchandise.id === CONSECRATION_VARIANT_ID,
  ) ?? false;
  const toggleConsecration = useCartStore(state => state.toggleConsecration);

  useEffect(() => {
    if (!handle) return;
    fetchCatalogProductByHandle(handle).then(p => {
      setProduct(p);
      setLoading(false);
    }).catch(() => setLoading(false));

    fetchCatalogProducts(50).then(products => {
      setRelatedProducts(products.filter(p => !p.node.handle.includes(handle || "")));
    }).catch(() => {});

    fetchCatalogProducts(10, "tag:addon").then(addons => {
      const map: Record<string, { amount: string; currencyCode: string }> = {};
      addons.forEach(p => {
        p.node.variants.edges.forEach((v: any) => {
          map[v.node.id] = { amount: v.node.price.amount, currencyCode: v.node.price.currencyCode };
        });
      });
      setAddonPrices(map);
    }).catch(() => {});
  }, [handle]);

  if (loading) {
    return (
      <div className="bg-charcoal min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-charcoal min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-ivory/40 font-body mb-4">Product not found</p>
          <Link to="/collection" className="text-gold font-display hover:text-gold-light">← Back to Collection</Link>
        </div>
      </div>
    );
  }

  const deity = matchProductToDeity(product.title);
  const variant = product.variants.edges[0]?.node;
  const images = product.images.edges;
  const price = variant?.price || product.priceRange.minVariantPrice;

  const handleAddToCart = async () => {
    if (!variant) return;
    await addItem(variant.id, 1);
    toast.success("Added to cart", {
      description: consecrationAdded
        ? `${product.title} + Shuddhi Poojan`
        : product.title,
    });
  };

  const tabs = [
    { key: "vastu" as const, label: "Vastu & Placement" },
    { key: "chakra" as const, label: "Chakra" },
    { key: "element" as const, label: "Element" },
    { key: "care" as const, label: "Care" },
  ];

  const relatedFiltered = relatedProducts
    .filter(p => {
      if (p.node.tags?.includes('addon')) return false;
      const d = matchProductToDeity(p.node.title);
      if (!d || !deity) return false;
      return d.element === deity.element || d.chakraKey === deity.chakraKey;
    })
    .slice(0, 3);

  return (
    <div className="bg-charcoal min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Link to="/collection" className="text-ivory/40 font-body text-sm hover:text-gold transition-colors mb-8 inline-block">
          ← Back to Collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mt-8">
          {/* LEFT COLUMN: Images + Consecration */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            {/* Product Images */}
            <div className="aspect-square bg-charcoal-light overflow-hidden mb-4">
              {images[selectedImage] && (
                <img
                  src={images[selectedImage].node.url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto mb-8">
                {images.map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 overflow-hidden border-2 transition-colors flex-shrink-0 ${
                      i === selectedImage ? "border-gold" : "border-ivory/10"
                    }`}
                  >
                    <img src={img.node.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            </motion.div>

          {/* RIGHT COLUMN: Details, Tabs, Add to Cart, then Shipping */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-ivory mb-2">{product.title}</h1>
            {deity && (
              <p className="font-display text-gold/70 text-lg italic mb-1">{deity.tagline}</p>
            )}
            {deity && (
              <p className="font-display text-ivory/30 text-sm italic mb-6">{deity.mantra}</p>
            )}

            {/* Price — served through the commerce connector */}
            <div className="mb-6">
              <p className="text-gold font-display text-3xl">
                {formatMoneyAmount(price.amount, price.currencyCode)}
              </p>
              <p className="text-ivory/30 font-body text-xs mt-1">
                Price includes shipping
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-ivory/40 font-body text-sm leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="border border-ivory/10 p-3">
                <p className="text-ivory/30 font-body text-[10px] uppercase tracking-widest">Material</p>
                <p className="text-ivory/70 font-display text-sm">Solid Brass</p>
              </div>
              <div className="border border-ivory/10 p-3">
                <p className="text-ivory/30 font-body text-[10px] uppercase tracking-widest">Finish</p>
                <p className="text-ivory/70 font-display text-sm">Antique Gold</p>
              </div>
              <div className="border border-ivory/10 p-3">
                <p className="text-ivory/30 font-body text-[10px] uppercase tracking-widest">Origin</p>
                <p className="text-ivory/70 font-display text-sm">Haridwar, India</p>
              </div>
              <div className="border border-ivory/10 p-3">
                <p className="text-ivory/30 font-body text-[10px] uppercase tracking-widest">Crafted</p>
                <p className="text-ivory/70 font-display text-sm">Hand-Cast</p>
              </div>
            </div>

              {/* Info Tabs */}
            {deity && (
              <div className="mb-8">
                <div className="flex border-b border-ivory/10 mb-6 overflow-x-auto">
                  {tabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 sm:px-4 py-3 text-xs font-body tracking-wider uppercase transition-colors whitespace-nowrap ${
                        activeTab === tab.key
                          ? "text-gold border-b-2 border-gold"
                          : "text-ivory/30 hover:text-ivory/50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="text-ivory/40 font-body text-sm leading-relaxed">
                  {activeTab === "vastu" && <p>{deity.vastuPlacement}</p>}
                  {activeTab === "chakra" && (
                    <div>
                      <p className="text-gold font-display text-lg mb-2">{deity.chakra}</p>
                      <p>This deity resonates with the {deity.chakra} energy center, supporting {deity.tagline.toLowerCase()} in your space and within yourself.</p>
                    </div>
                  )}
                  {activeTab === "element" && (
                    <div>
                      <p className="text-gold font-display text-lg mb-2">{deity.element}</p>
                      <p>Connected to the {deity.element} element from Panch Tatva. This energy influences the quality of {deity.element.toLowerCase()} in your environment and consciousness.</p>
                    </div>
                  )}
                  {activeTab === "care" && (
                    <p>Dust with a soft cotton cloth. Brass naturally oxidizes over time, acquiring a "living" patina. To restore shine, use a mixture of lemon juice and baking soda, applied gently with a soft cloth.</p>
                  )}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={isLoading || !variant?.availableForSale}
              className="w-full py-4 bg-gold text-charcoal font-display text-lg tracking-widest hover:bg-gold-light transition-all duration-500 disabled:opacity-50 mb-8"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : !variant?.availableForSale ? (
                "Sold Out"
              ) : (
                <>Add to Cart — {formatMoneyAmount(price.amount, price.currencyCode)}</>
              )}
            </button>

              {/* ========== CONSECRATION UPSELL ========== */}
              <div className={`border rounded-lg overflow-hidden transition-all duration-500 mb-8 ${
                consecrationAdded ? "border-gold/50 bg-gradient-to-br from-gold/10 to-gold/5" : "border-ivory/15 hover:border-gold/30"
              }`}>
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={20} className="text-gold" />
                    </div>
                    <div>
                      <h3 className="font-display text-ivory text-lg sm:text-xl">Consecration Service — Shuddhi Poojan</h3>
                      <p className="text-ivory/40 font-body text-sm mt-1">Added as a separate line item at checkout</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    <p className="text-ivory/50 font-body text-sm leading-relaxed">
                      Before your murti ships, our temple pandit will perform a <strong className="text-ivory/70">Prana Pratishtha</strong> (Life Infusion) ceremony — 
                      the ancient Vedic ritual that transforms brass into a living vessel of divine energy.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-body text-ivory/40">
                      <div className="flex items-start gap-2">
                        <span className="text-gold mt-0.5">✦</span>
                        <span>Full mantra chanting specific to your deity</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gold mt-0.5">✦</span>
                        <span>Ganga Jal abhishekam (sacred water bath)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gold mt-0.5">✦</span>
                        <span>Flower, kumkum & chandan offerings</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gold mt-0.5">✦</span>
                        <span>Personalized video of the full ceremony sent to you</span>
                      </div>
                    </div>
                  </div>

                  {/* Video — "What You Will Receive" */}
                  <div className="mb-5">
                    <p className="text-ivory/50 font-body text-[11px] uppercase tracking-widest mb-2">What You Will Receive</p>
                    <div className="relative aspect-video bg-charcoal-light rounded overflow-hidden border border-ivory/10">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-2">
                            <Play size={20} className="text-gold ml-0.5" />
                          </div>
                          <p className="text-ivory/40 font-body text-xs">Demo: Shuddhi Poojan Ceremony</p>
                          <p className="text-ivory/25 font-body text-[10px] mt-1">Video coming soon</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await toggleConsecration();
                      toast.success(
                        consecrationAdded ? "Consecration removed" : "Consecration service added",
                        { description: consecrationAdded ? "" : "Shuddhi Poojan will be performed before shipping" }
                      );
                    }}
                    className={`w-full py-3 text-sm font-display tracking-wider border transition-all duration-300 ${
                      consecrationAdded
                        ? "bg-gold text-charcoal border-gold"
                        : "border-gold/40 text-gold hover:bg-gold/10"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : consecrationAdded ? (
                      "Added to Order ✓"
                    ) : (
                      <>
                        Add Shuddhi Poojan
                        {addonPrices[CONSECRATION_VARIANT_ID] && (
                          <> — {formatMoneyAmount(addonPrices[CONSECRATION_VARIANT_ID].amount, addonPrices[CONSECRATION_VARIANT_ID].currencyCode)}</>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>

                {/* Certificate of Authenticity */}
              <div className="flex rounded-lg overflow-hidden border border-ivory/10 mb-8">
                <div className="w-[40%] bg-charcoal-light p-4 sm:p-5 flex flex-col justify-center">
                  <Shield size={22} className="text-gold mb-3" />
                  <p className="font-display text-ivory text-sm leading-snug mb-1">Certificate of Authenticity</p>
                  <p className="text-ivory/40 font-body text-[11px] leading-relaxed">100% original brass · Hand-cast by artisans in Haridwar</p>
                </div>
                <div className="w-[60%] relative">
                  <img src={certificateBackdrop} alt="Certificate of Authenticity" className="w-full h-full object-cover" />
                </div>
              </div>

                {/* Shipping Timeline */}
            <div className="border border-ivory/10 p-5">
              <h4 className="font-display text-ivory text-sm mb-4 flex items-center gap-2">
                <Truck size={16} className="text-gold/60" /> Shipping Timeline
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold/60 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-ivory/60 font-body text-xs font-medium">Processing & Quality Check</p>
                    <p className="text-ivory/30 font-body text-[11px]">2–3 business days</p>
                  </div>
                </div>
                {consecrationAdded && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-saffron/60 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-ivory/60 font-body text-xs font-medium">Shuddhi Poojan Ceremony</p>
                      <p className="text-ivory/30 font-body text-[11px]">1–2 business days · Video sent upon completion</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold/40 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-ivory/60 font-body text-xs font-medium">Secure Packing & Dispatch</p>
                    <p className="text-ivory/30 font-body text-[11px]">1–2 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold/30 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-ivory/60 font-body text-xs font-medium">Delivery (with tracking)</p>
                    <p className="text-ivory/30 font-body text-[11px]">India: 5–7 days · USA: 10–15 days</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedFiltered.length > 0 && (
          <section className="mt-24 border-t border-ivory/10 pt-16">
            <h2 className="font-display text-3xl text-ivory text-center mb-12">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {relatedFiltered.map((rp, i) => {
                const rd = matchProductToDeity(rp.node.title);
                const rpVariant = rp.node.variants.edges[0]?.node;
                const rpPrice = rpVariant?.price || rp.node.priceRange.minVariantPrice;
                return (
                  <motion.div
                    key={rp.node.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link to={`/product/${rp.node.handle}`} className="group block">
                      <div className="aspect-[3/4] overflow-hidden bg-charcoal-light mb-3">
                        {rp.node.images.edges[0] && (
                          <img src={rp.node.images.edges[0].node.url} alt={rp.node.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                        )}
                      </div>
                      <h3 className="font-display text-lg text-ivory group-hover:text-gold transition-colors">{rp.node.title}</h3>
                      {rd && <p className="text-ivory/40 font-body text-xs mt-1">{rd.tagline}</p>}
                      <p className="text-gold font-display mt-1">
                        {formatMoneyAmount(rpPrice.amount, rpPrice.currencyCode)}
                      </p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
