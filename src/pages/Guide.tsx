import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  createGuideLead,
  fetchBackendGuideQuestions,
  fetchBackendGuideRecommendations,
  type BackendGuideQuestion,
  type BackendProduct,
} from "@/lib/backend";
import type { DeityInfo } from "@/data/deities";

export default function Guide() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [questions, setQuestions] = useState<BackendGuideQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<BackendProduct[]>([]);
  const [email, setEmail] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  useEffect(() => {
    fetchBackendGuideQuestions()
      .then((nextQuestions) => setQuestions(nextQuestions))
      .catch((error) => {
        toast.error("Could not load guide questions", {
          description: error instanceof Error ? error.message : "Unknown guide error",
        });
      })
      .finally(() => setLoadingQuestions(false));
  }, []);

  const questionOne = questions[0] ?? null;
  const questionTwo = questions[1] ?? null;

  const displayResults = useMemo<(DeityInfo & { handle: string })[]>(() => {
    return results.map((product) => ({
      name: product.deityName || product.title,
      mantra: product.mantra || "",
      tagline: product.tagline,
      chakra: product.chakra || "Sacred Alignment",
      chakraKey: product.chakra?.toLowerCase() ?? "sacred-alignment",
      element: product.element || "Ether",
      vastuPlacement:
        product.vastuPlacement || "Place where the form feels intentional and undisturbed.",
      handle: product.handle,
    }));
  }, [results]);

  const handleAnswer = async (questionId: string, optionId: string) => {
    const nextAnswers = { ...answers, [questionId]: optionId };
    setAnswers(nextAnswers);

    if (questionOne && questionId === questionOne.id) {
      setStep(2);
      return;
    }

    if (questionTwo && questionId === questionTwo.id) {
      try {
        const matched = await fetchBackendGuideRecommendations(nextAnswers);
        setResults(matched);
        setStep(3);
      } catch (error) {
        toast.error("Could not resolve recommendations", {
          description:
            error instanceof Error ? error.message : "Unknown recommendation error",
        });
      }
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStep(4);
      return;
    }
    setEmailSubmitting(true);
    try {
      await createGuideLead({ email: email.trim(), answers });
    } catch (error) {
      toast.error("Could not save your email", {
        description: error instanceof Error ? error.message : "Unknown lead error",
      });
    } finally {
      setEmailSubmitting(false);
      setStep(4);
    }
  };

  const restart = () => {
    setStep(1);
    setAnswers({});
    setResults([]);
    setEmail("");
  };

  const primaryCta = results.length === 1 ? `/product/${results[0].handle}` : "/collection";

  return (
    <div className="bg-charcoal min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-display text-5xl md:text-6xl text-ivory mb-4">The Guide</h1>
          <p className="text-ivory/40 font-body max-w-lg mx-auto">
            Two questions. Your deity revealed. No guesswork, no generic recommendations.
          </p>
        </motion.div>

        <div className="flex items-center justify-center gap-4 mb-16">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-lg transition-all ${
                  step >= s
                    ? "bg-gold/20 text-gold border border-gold/40"
                    : "bg-charcoal-light text-ivory/20 border border-ivory/10"
                }`}
              >
                {s === 4 ? "✦" : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-px transition-colors ${
                    step > s ? "bg-gold/40" : "bg-ivory/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {loadingQuestions ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {step === 1 && questionOne && (
              <motion.div
                key="q1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="font-display text-2xl md:text-3xl text-ivory text-center mb-10">
                  {questionOne.prompt}
                </h2>
                <div className="space-y-3">
                  {questionOne.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => void handleAnswer(questionOne.id, option.id)}
                      className="w-full text-left p-5 border border-ivory/10 hover:border-gold/40 hover:bg-gold/5 transition-all duration-300 group"
                    >
                      <span className="text-ivory/60 group-hover:text-gold font-body transition-colors">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && questionTwo && (
              <motion.div
                key="q2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="font-display text-2xl md:text-3xl text-ivory text-center mb-10">
                  {questionTwo.prompt}
                </h2>
                <div className="space-y-3">
                  {questionTwo.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => void handleAnswer(questionTwo.id, option.id)}
                      className="w-full text-left p-5 border border-ivory/10 hover:border-gold/40 hover:bg-gold/5 transition-all duration-300 group"
                    >
                      <span className="text-ivory/60 group-hover:text-gold font-body transition-colors">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="mt-6 text-ivory/30 font-body text-sm hover:text-ivory/50 transition-colors"
                >
                  ← Go back
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
                className="text-center max-w-md mx-auto"
              >
                <div className="w-16 h-16 mx-auto mb-8 rounded-full border-2 border-gold/40 flex items-center justify-center">
                  <span className="font-display text-2xl text-gold">✦</span>
                </div>
                <h2 className="font-display text-2xl md:text-3xl text-ivory mb-4">
                  Your deity has been revealed
                </h2>
                <p className="text-ivory/40 font-body mb-10 leading-relaxed">
                  Enter your email to receive your personalised guidance — deity-specific mantras,
                  placement tips, and sacred care rituals.
                </p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-5 py-4 bg-charcoal-light border border-ivory/15 text-ivory font-body placeholder:text-ivory/25 focus:outline-none focus:border-gold/40 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={emailSubmitting}
                    className="w-full py-4 bg-gold text-charcoal font-display text-lg tracking-widest hover:bg-gold-light transition-all duration-300 disabled:opacity-60"
                  >
                    {emailSubmitting ? "Saving…" : "Get My Recommendations →"}
                  </button>
                </form>
                <button
                  onClick={() => setStep(4)}
                  className="mt-4 text-ivory/30 font-body text-sm hover:text-ivory/50 transition-colors"
                >
                  Skip
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-8 rounded-full border-2 border-gold/40 flex items-center justify-center">
                  <span className="font-display text-2xl text-gold">✦</span>
                </div>
                <h2 className="font-display text-3xl text-ivory mb-4">
                  {displayResults.length === 1 ? "Your Deity" : "Your Recommended Deities"}
                </h2>
                <p className="text-ivory/40 font-body mb-12 max-w-lg mx-auto">
                  {displayResults.length === 1
                    ? "A perfect alignment between your inner need and elemental energy."
                    : "Your answers point to forms of sacred energy that fit your present space."}
                </p>

                <div
                  className={`grid gap-8 mb-12 ${
                    displayResults.length === 1
                      ? "max-w-sm mx-auto"
                      : displayResults.length === 2
                        ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto"
                        : "grid-cols-1 md:grid-cols-3"
                  }`}
                >
                  {displayResults.map((deity, i) => (
                    <motion.div
                      key={`${deity.handle}-${deity.name}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.15, duration: 0.5 }}
                      className="border border-gold/20 p-8 bg-charcoal-light/30"
                    >
                      <h3 className="font-display text-2xl text-gold mb-2">{deity.name}</h3>
                      <p className="font-display text-ivory/50 text-sm italic mb-3">
                        {deity.tagline}
                      </p>
                      <p className="font-display text-ivory/30 text-xs mb-4">{deity.mantra}</p>
                      <div className="space-y-1 text-xs font-body text-ivory/40">
                        <p>{deity.chakra}</p>
                        <p>{deity.element} Element</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="space-x-4">
                  <Link
                    to={primaryCta}
                    className="inline-block px-10 py-4 bg-gold text-charcoal font-display text-lg tracking-widest hover:bg-gold-light transition-all"
                  >
                    {displayResults.length === 1 ? "Find Your Murti" : "View Recommended Murtis"}
                  </Link>
                  <button
                    onClick={restart}
                    className="text-ivory/30 font-body text-sm hover:text-ivory/50 transition-colors"
                  >
                    Retake
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
