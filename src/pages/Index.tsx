import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchCatalogProducts, type CatalogProduct } from "@/lib/commerceConnector";
import { matchProductToDeity } from "@/data/deities";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import heroBg from "@/assets/hero-bg.jpg";
import { formatMoneyAmount } from "@/lib/pricing";

const marqueeItems = [
  "Sourced from Haridwar",
  "Heavy Solid Brass",
  "Global Shipping ✨",
  "Consecrated Upon Request",
  "Authenticity Certified",
];

const testimonials = [
  {
    text: "The weight of the Vishnu statue surprised me. It feels substantial and permanent. It has completely changed the feel of my study.",
    author: "Arjun N.",
    location: "San Francisco",
  },
  {
    text: "I was worried about shipping to London, but the packing was incredible. The Nandi looks ancient and beautiful.",
    author: "John J.",
    location: "UK",
  },
];

export default function Index() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);
  const isLoading = useCartStore(state => state.isLoading);

  useEffect(() => {
    fetchCatalogProducts(50).then(p => {
      setProducts(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Show only first 3 hero products (Ganesh, Shiva, Buddha if available)
  const heroNames = ["ganesh", "shiva", "buddha"];
  const heroProducts = heroNames
    .map(name => products.find(p => p.node.title.toLowerCase().includes(name)))
    .filter(Boolean) as CatalogProduct[];

  const handleAddToCart = async (product: CatalogProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;
    await addItem(variant.id, 1);
    toast.success("Added to cart", { description: product.node.title });
  };

  return (
    <div className="bg-charcoal min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Divine brass deity" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-hero-gradient opacity-80" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-10 text-center px-6 max-w-4xl"
        >
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-ivory tracking-wide mb-6">
            Sanctuary. <span className="text-gold-gradient">Delivered.</span>
          </h1>
          <p className="font-body text-ivory/60 text-lg md:text-xl mb-4 max-w-2xl mx-auto">
            Authentic brass deities for the modern home.
          </p>
          <p className="font-body text-ivory/40 text-sm md:text-base max-w-xl mx-auto mb-10 leading-relaxed">
            We curate heavy, hand-cast brass deities from Haridwar—not as decorations, 
            but as generational anchors for your personal sanctuary.
          </p>
          <Link
            to="/collection"
            className="inline-block px-10 py-4 border border-gold/40 text-gold font-display text-lg tracking-widest hover:bg-gold/10 transition-all duration-500"
          >
            Explore the Collection
          </Link>
        </motion.div>
      </section>

      {/* Marquee Banner */}
      <section className="bg-charcoal-light py-4 overflow-hidden border-y border-ivory/5">
        <div className="animate-marquee whitespace-nowrap flex">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="mx-8 text-ivory/30 text-sm tracking-widest uppercase font-body">
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Hero Products */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-display text-4xl md:text-5xl text-ivory text-center mb-4">Sacred Forms</h2>
          <p className="text-ivory/40 text-center font-body mb-16 max-w-lg mx-auto">
            Each deity serves a purpose in your space. Not decoration—intention.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(heroProducts.length > 0 ? heroProducts : products.slice(0, 3)).map((product, i) => {
              const deity = matchProductToDeity(product.node.title);
              const variant = product.node.variants.edges[0]?.node;
              const price = variant?.price || product.node.priceRange.minVariantPrice;
              return (
                <motion.div
                  key={product.node.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                >
                  <Link to={`/product/${product.node.handle}`} className="group block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-charcoal-light mb-4">
                      {product.node.images.edges[0] && (
                        <img
                          src={product.node.images.edges[0].node.url}
                          alt={product.node.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      )}
                      {deity && (
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-charcoal/90 to-transparent">
                          <p className="font-display text-gold/70 text-sm italic mb-1">{deity.mantra}</p>
                          <p className="font-body text-ivory/50 text-xs uppercase tracking-wider">
                            {deity.element} · {deity.chakra}
                          </p>
                        </div>
                      )}
                    </div>
                    <h3 className="font-display text-xl text-ivory group-hover:text-gold transition-colors">{product.node.title}</h3>
                    {deity && <p className="text-ivory/40 font-body text-sm mt-1">{deity.tagline}</p>}
                    <p className="text-gold font-display text-lg mt-2">
                      {formatMoneyAmount(price.amount, price.currencyCode)}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-16">
          <Link
            to="/collection"
            className="inline-block px-10 py-4 border border-gold/30 text-gold font-display tracking-widest hover:bg-gold/10 transition-all duration-500"
          >
            View Full Collection
          </Link>
        </div>
      </section>

      {/* Chakras & Elements */}
      <section className="py-24 px-6 bg-charcoal-light/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl text-ivory mb-6">Chakras & The Five Elements</h2>
            <p className="text-ivory/40 font-body leading-relaxed max-w-2xl mx-auto">
              Indian spiritual thought offers two timeless frameworks to understand balance within and around us: 
              Chakras and Panch Tatva (The Five Elements).
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <h3 className="font-display text-2xl text-gold">Seven Chakras</h3>
              <p className="text-ivory/40 font-body text-sm leading-relaxed">
                Chakras are described in yogic traditions as seven energy centers within the body—Root, 
                Sacral, Solar Plexus, Heart, Throat, Third Eye, and Crown. Each represents a dimension 
                of human experience: security, emotion, will, love, expression, insight, and awareness.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="space-y-4"
            >
              <h3 className="font-display text-2xl text-gold">Panch Tatva</h3>
              <p className="text-ivory/40 font-body text-sm leading-relaxed">
                Panch Tatva—the Five Elements—form the foundation of classical Hindu philosophy: 
                Prithvi (Earth), Jal (Water), Agni (Fire), Vayu (Air), and Akash (Ether). These are 
                seen as the building blocks of all existence, present in nature and reflected within.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vastu Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl md:text-5xl text-ivory mb-6">Vastu Shastra</h2>
            <p className="text-ivory/40 font-body leading-relaxed max-w-2xl mx-auto">
              The traditional Indian science of space and structure. Every home is a living field of energy 
              shaped by direction, form, light, and flow.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { direction: "East", meaning: "Light & Beginnings" },
              { direction: "North", meaning: "Growth & Flow" },
              { direction: "South", meaning: "Strength & Grounding" },
              { direction: "West", meaning: "Balance & Rest" },
            ].map((item, i) => (
              <motion.div
                key={item.direction}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center p-3 sm:p-6 border border-ivory/10 hover:border-gold/30 transition-colors"
              >
                <p className="font-display text-xl text-gold mb-2">{item.direction}</p>
                <p className="font-body text-ivory/40 text-xs">{item.meaning}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Guide Teaser */}
      <section className="py-24 px-6 bg-charcoal-light/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="font-display text-4xl md:text-5xl text-ivory mb-6">
            Which Energy is Your Home Missing?
          </h2>
          <p className="text-ivory/40 font-body mb-10 max-w-lg mx-auto leading-relaxed">
            You don't need to guess. Whether you seek the stability of the Root Chakra or the 
            flow of the Water element, our guide will match your current life stage with the correct deity.
          </p>
          <Link
            to="/guide"
            className="inline-block px-10 py-4 bg-gold text-charcoal font-display text-lg tracking-widest hover:bg-gold-light transition-all duration-500"
          >
            Take the Guide
          </Link>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl text-ivory text-center mb-16">What Other Devotees Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="border-l-2 border-gold/30 pl-8"
              >
                <p className="font-body text-ivory/50 text-sm leading-relaxed italic mb-4">"{t.text}"</p>
                <p className="font-display text-gold text-sm">
                  {t.author}, <span className="text-ivory/40">{t.location}</span>
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Authenticity */}
      <section className="py-24 px-6 bg-charcoal-light/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="w-20 h-20 mx-auto mb-8 rounded-full border-2 border-gold/30 flex items-center justify-center">
            <span className="font-display text-3xl text-gold">✦</span>
          </div>
          <h2 className="font-display text-3xl text-ivory mb-4">Authenticity Matters</h2>
          <p className="text-ivory/40 font-body text-sm leading-relaxed">
            Every piece ships with an Authenticity Certificate, guaranteeing that the piece 
            is made of 100% original Brass. Hand-cast by artisans in Haridwar.
          </p>
        </motion.div>
      </section>

      {/* Brand Story */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="space-y-6 text-center"
          >
            <p className="font-display text-2xl text-ivory/60 italic leading-relaxed">
              Between ancient form and modern space.<br />
              Between inner need and outer environment.<br />
              Between chaos and center.
            </p>
            <p className="text-ivory/40 font-body text-sm leading-relaxed max-w-xl mx-auto">
              Our roots are in a place where form and intention have lived together for centuries—Haridwar. 
              We curate solid brass deities that are meant to do something—not simply exist on a shelf.
            </p>
            <p className="text-ivory/30 font-body text-sm">
              Tell us what you are seeking. We will tell you what belongs.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
