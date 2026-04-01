import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, X, ChevronDown } from "lucide-react";
import { fetchCatalogProducts, type CatalogProduct } from "@/lib/commerceConnector";
import { matchProductToDeity, allChakras, allElements, deities } from "@/data/deities";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { formatMoneyAmount } from "@/lib/pricing";

const uniqueDeityNames = [...new Set(deities.map(d => d.name))];

interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

function FilterDropdown({ label, options, selected, onSelect }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel = options.find(o => o.value === selected)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-body tracking-wider border transition-all duration-300 min-w-[160px] justify-between ${
          selected
            ? "border-gold bg-gold/10 text-gold"
            : "border-ivory/15 text-ivory/50 hover:border-ivory/30 hover:text-ivory/70"
        }`}
      >
        <span>{selected ? selectedLabel : label}</span>
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-full bg-[#1a1a16] border border-ivory/15 z-50 shadow-xl max-h-64 overflow-y-auto">
          {selected && (
            <button
              onClick={() => { onSelect(""); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-xs font-body text-ivory/30 hover:text-ivory/60 hover:bg-ivory/5 transition-colors border-b border-ivory/10 flex items-center gap-2"
            >
              <X size={11} /> Clear filter
            </button>
          )}
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onSelect(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-xs font-body tracking-wider transition-colors ${
                selected === opt.value
                  ? "text-gold bg-gold/10"
                  : "text-ivory/50 hover:text-ivory/80 hover:bg-ivory/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Collection() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const addItem = useCartStore(state => state.addItem);
  const isLoading = useCartStore(state => state.isLoading);

  const selectedChakra = searchParams.get("chakra") || "";
  const selectedElement = searchParams.get("element") || "";
  const selectedDeity = searchParams.get("deity") || "";

  useEffect(() => {
    fetchCatalogProducts(50).then(p => {
      setProducts(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter(p => {
    if (p.node.tags?.includes('addon')) return false;
    const deity = matchProductToDeity(p.node.title);
    if (!deity) {
      if (selectedChakra || selectedElement || selectedDeity) return false;
    } else {
      if (selectedChakra && deity.chakraKey !== selectedChakra) return false;
      if (selectedElement && deity.element !== selectedElement) return false;
      if (selectedDeity && deity.name !== selectedDeity) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = p.node.title.toLowerCase().includes(q);
      const deityMatch = deity ? deity.name.toLowerCase().includes(q) : false;
      const tagMatch = p.node.tags?.some(t => t.toLowerCase().includes(q));
      if (!titleMatch && !deityMatch && !tagMatch) return false;
    }
    return true;
  });

  const handleAddToCart = async (product: CatalogProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;
    await addItem(variant.id, 1);
    toast.success("Added to cart", { description: product.node.title });
  };

  return (
    <div className="bg-charcoal min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="font-display text-5xl md:text-6xl text-ivory mb-4">The Collection</h1>
            <p className="text-ivory/40 font-body max-w-lg mx-auto">
              Every piece is chosen for the role it plays in your space.
            </p>
          </motion.div>

          {/* Search */}
          <div className="mb-8 max-w-md mx-auto">
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3 text-ivory/30 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products, deities, tags..."
                className="w-full bg-transparent border border-ivory/15 text-ivory placeholder-ivory/25 font-body text-sm py-2.5 pl-9 pr-9 focus:outline-none focus:border-gold/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 text-ivory/30 hover:text-ivory/60 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-12 flex flex-wrap gap-3">
            <FilterDropdown
              label="By Deity"
              options={uniqueDeityNames.map(n => ({ value: n, label: n }))}
              selected={selectedDeity}
              onSelect={v => {
                const params = new URLSearchParams(searchParams);
                v ? params.set("deity", v) : params.delete("deity");
                setSearchParams(params);
              }}
            />
            <FilterDropdown
              label="By Chakra"
              options={allChakras.map(c => ({ value: c.key, label: c.name }))}
              selected={selectedChakra}
              onSelect={v => {
                const params = new URLSearchParams(searchParams);
                v ? params.set("chakra", v) : params.delete("chakra");
                setSearchParams(params);
              }}
            />
            <FilterDropdown
              label="By Element"
              options={allElements.map(e => ({ value: e, label: e }))}
              selected={selectedElement}
              onSelect={v => {
                const params = new URLSearchParams(searchParams);
                v ? params.set("element", v) : params.delete("element");
                setSearchParams(params);
              }}
            />
          </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ivory/40 font-body">No products match the selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product, i) => {
              const deity = matchProductToDeity(product.node.title);
              const variant = product.node.variants.edges[0]?.node;
              const price = variant?.price || product.node.priceRange.minVariantPrice;
              return (
                <motion.div
                  key={product.node.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="group"
                >
                  <Link to={`/product/${product.node.handle}`}>
                    <div className="relative aspect-[3/4] overflow-hidden bg-charcoal-light mb-3">
                      {product.node.images.edges[0] && (
                        <img
                          src={product.node.images.edges[0].node.url}
                          alt={product.node.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      )}
                      {deity && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-charcoal/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="font-display text-gold/70 text-xs italic">{deity.mantra}</p>
                        </div>
                      )}
                    </div>
                    <h3 className="font-display text-lg text-ivory group-hover:text-gold transition-colors">{product.node.title}</h3>
                    {deity && <p className="text-ivory/40 font-body text-xs mt-1">{deity.tagline}</p>}
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-gold font-display">
                      {formatMoneyAmount(price.amount, price.currencyCode)}
                    </p>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isLoading}
                      className="text-xs font-body text-ivory/40 hover:text-gold border border-ivory/10 hover:border-gold/30 px-3 py-3 min-h-[44px] transition-all"
                    >
                      Add to Cart
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
