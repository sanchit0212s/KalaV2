import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { submitContactForm } from "@/lib/backend";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await submitContactForm(form);
      toast.success("Message sent", { description: "We'll get back to you soon." });
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error("Could not send message", {
        description: error instanceof Error ? error.message : "Unknown submission error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-charcoal min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-display text-5xl md:text-6xl text-ivory mb-4">Contact Us</h1>
          <p className="text-ivory/40 font-body max-w-lg mx-auto">
            Questions about a piece, custom orders, or just want to learn more about our craft.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label className="block text-ivory/50 font-body text-xs uppercase tracking-widest mb-2">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-transparent border border-ivory/10 px-4 py-3 text-ivory font-body text-sm focus:border-gold/40 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-ivory/50 font-body text-xs uppercase tracking-widest mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                className="w-full bg-transparent border border-ivory/10 px-4 py-3 text-ivory font-body text-sm focus:border-gold/40 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-ivory/50 font-body text-xs uppercase tracking-widest mb-2">Message</label>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                required
                rows={5}
                className="w-full bg-transparent border border-ivory/10 px-4 py-3 text-ivory font-body text-sm focus:border-gold/40 focus:outline-none transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-gold text-charcoal font-display text-lg tracking-widest hover:bg-gold-light transition-all duration-500"
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            <div>
              <h3 className="font-display text-xl text-gold mb-3">Visit Our Store</h3>
              <p className="text-ivory/40 font-body text-sm leading-relaxed">
                Haridwar, Uttarakhand, India<br />
                Open daily for walk-ins and appointments
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl text-gold mb-3">Trust & Authenticity</h3>
              <div className="space-y-3 text-ivory/40 font-body text-sm">
                <p>✦ GST Registered Business</p>
                <p>✦ Physical Storefront in Haridwar</p>
                <p>✦ Certificate of Authenticity with every piece</p>
                <p>✦ Secure global shipping with full tracking</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
