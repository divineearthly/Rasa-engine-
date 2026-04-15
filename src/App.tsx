import { useState, useEffect, useRef } from "react";
import { 
  Send, 
  History, 
  Share2, 
  AlertCircle, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2,
  Loader2,
  ChevronLeft,
  Heart,
  Laugh,
  Users,
  Flame,
  Sword,
  Ghost,
  Skull,
  Eye,
  Wind,
  Download,
  Trash2,
  ExternalLink,
  Coffee,
  Globe,
  Moon,
  Sun,
  X,
  Twitter,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  CloudRain,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI, Type } from "@google/genai";
import html2canvas from "html2canvas";

interface RasaResult {
  name: string;
  confidence: number;
  explanation: string;
}

interface HallucinationResult {
  score: number;
  severity: string;
  problematic_statements: string[];
}

interface AnalysisResult {
  rasa: RasaResult;
  hallucination: HallucinationResult;
  summary: string;
  text: string;
  timestamp: number;
}

const RASA_ICONS: Record<string, any> = {
  "Love": Heart,
  "Laughter": Laugh,
  "Compassion": Users,
  "Fury": Flame,
  "Heroism": Sword,
  "Fear": Ghost,
  "Disgust": Skull,
  "Wonder": Eye,
  "Peace": Wind,
  "Surprise": Sparkles,
  "Sadness": CloudRain,
  "Calm": Sun,
  "Courage": ShieldCheck,
  "Mystery": Moon,
  "Wisdom": BookOpen
};

const RASA_COLORS: Record<string, string> = {
  "Love": "#e11d48",
  "Laughter": "#f59e0b",
  "Compassion": "#10b981",
  "Fury": "#ef4444",
  "Heroism": "#3b82f6",
  "Fear": "#6366f1",
  "Disgust": "#8b5cf6",
  "Wonder": "#d946ef",
  "Peace": "#c9922a",
  "Surprise": "#f472b6",
  "Sadness": "#64748b",
  "Calm": "#06b6d4",
  "Courage": "#f97316",
  "Mystery": "#4c1d95",
  "Wisdom": "#059669"
};

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function App() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showProModal, setShowProModal] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const [isCached, setIsCached] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load state from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("rasa_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    const savedTheme = localStorage.getItem("rasa_theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }

    // Check for shareable link
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get("share");
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(sharedData));
        setResult(decoded.result);
        setInputText(decoded.text);
        showToast("Shared analysis loaded.");
      } catch (e) {
        console.error("Failed to decode shared data", e);
      }
    }
  }, []);

  // Sync theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("rasa_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("rasa_theme", "light");
    }
  }, [isDarkMode]);

  // Save history
  useEffect(() => {
    localStorage.setItem("rasa_history", JSON.stringify(history.slice(0, 10)));
  }, [history]);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const getCachedResult = (text: string) => {
    const cache = JSON.parse(localStorage.getItem("rasa_cache") || "{}");
    const entry = cache[text];
    if (entry && Date.now() - entry.timestamp < 24 * 60 * 60 * 1000) {
      return entry.result;
    }
    return null;
  };

  const setCacheResult = (text: string, result: AnalysisResult) => {
    const cache = JSON.parse(localStorage.getItem("rasa_cache") || "{}");
    cache[text] = { result, timestamp: Date.now() };
    localStorage.setItem("rasa_cache", JSON.stringify(cache));
  };

  const handleAnalyze = async (textToAnalyze: string = inputText) => {
    const normalizedText = textToAnalyze.trim();
    if (!normalizedText) return;

    const cached = getCachedResult(normalizedText);
    if (cached) {
      setResult(cached);
      setIsCached(true);
      showToast("Loaded from cache.");
      return;
    }

    setLoading(true);
    setError(null);
    setIsCached(false);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ role: "user", parts: [{ text: normalizedText }] }],
        config: {
          systemInstruction: `You are an expert in Natya Shastra, Vedic philosophy, and factual verification. Your analysis must be strictly guided by the principles of Vedic Sutras 13, 58, and 65 to ensure profound emotional depth and absolute factual integrity. For the user’s text, return valid JSON only with the following structure:
{
  "rasa": {
    "name": "one of the Rasas (Love, Laughter, Compassion, Fury, Heroism, Fear, Disgust, Wonder, Peace, Surprise, Sadness, Calm, Courage, Mystery, Wisdom)",
    "confidence": 0.85,
    "explanation": "short reason"
  },
  "hallucination": {
    "score": 0-100,
    "severity": "low/medium/high",
    "problematic_statements": ["sentence1", "sentence2"]
  },
  "summary": "A concise, profound summary of the text (max 3 sentences)"
}`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rasa: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  explanation: { type: Type.STRING }
                },
                required: ["name", "confidence", "explanation"]
              },
              hallucination: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.NUMBER },
                  severity: { type: Type.STRING },
                  problematic_statements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["score", "severity", "problematic_statements"]
              },
              summary: { type: Type.STRING }
            },
            required: ["rasa", "hallucination", "summary"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      const newResult: AnalysisResult = {
        ...data,
        text: normalizedText,
        timestamp: Date.now(),
      };

      setResult(newResult);
      setCacheResult(normalizedText, newResult);
      setHistory(prev => {
        const filtered = prev.filter(h => h.text !== normalizedText);
        return [newResult, ...filtered].slice(0, 10);
      });
    } catch (err: any) {
      console.error("Analysis Error:", err);
      
      let userMessage = "An unexpected error occurred. Please try again.";
      const errorMsg = err.message || "";
      
      if (!navigator.onLine) {
        userMessage = "You are currently offline. Please check your internet connection.";
      } else if (errorMsg.includes("API_KEY_INVALID")) {
        userMessage = "Invalid API configuration. Please check your Vedic AI credentials.";
      } else if (errorMsg.includes("RESOURCE_EXHAUSTED")) {
        userMessage = "The cosmic wisdom is in high demand (Rate limit reached). Please wait a moment.";
      } else if (errorMsg.includes("SAFETY")) {
        userMessage = "This text contains content that our safety filters cannot process.";
      } else if (errorMsg.includes("quota")) {
        userMessage = "Daily wisdom quota exceeded. Please try again tomorrow.";
      } else if (err.status >= 500) {
        userMessage = "The celestial servers are temporarily unavailable. Please try later.";
      }

      setError(userMessage);
      showToast(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!result) return;
    const shareData = btoa(JSON.stringify({ text: inputText, result }));
    const url = `${window.location.origin}${window.location.pathname}?share=${shareData}`;
    navigator.clipboard.writeText(url);
    showToast("Shareable link copied to clipboard!");
  };

  const handleTweet = () => {
    if (!result) return;
    const text = `My content's dominant Rasa is ${result.rasa.name} with ${Math.round(result.rasa.confidence * 100)}% confidence. Find yours at ${window.location.origin}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleExportImage = async () => {
    if (!resultsRef.current) return;
    const canvas = await html2canvas(resultsRef.current, {
      backgroundColor: isDarkMode ? "#0f0a05" : "#fdf6ec",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `rasa-analysis-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("Image downloaded!");
  };

  const handleClear = () => {
    setInputText("");
    setResult(null);
    setError(null);
  };

  const RasaIcon = result ? RASA_ICONS[result.rasa.name] || Sparkles : Sparkles;

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-rasa-bg">
      {/* Mandala Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-5 dark:opacity-10">
        <svg className="w-[120vh] h-[120vh] text-rasa-gold mandala-rotate" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.2" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.2" />
          <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.2" />
          {[...Array(12)].map((_, i) => (
            <path key={i} d="M50,50 Q60,30 50,10 Q40,30 50,50" fill="none" stroke="currentColor" strokeWidth="0.5" transform={`rotate(${i * 30} 50 50)`} />
          ))}
          {[...Array(24)].map((_, i) => (
            <path key={i} d="M50,50 Q60,30 50,10 Q40,30 50,50" fill="none" stroke="currentColor" strokeWidth="0.3" transform={`rotate(${i * 15} 50 50) scale(0.7) translate(21.4 21.4)`} />
          ))}
        </svg>
      </div>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: showHistory ? "300px" : "0px" }}
        className="bg-rasa-ink text-rasa-bg overflow-hidden relative z-20 shadow-2xl"
      >
        <div className="w-[300px] p-6 h-full flex flex-col">
          <h2 className="text-xl font-serif mb-6 flex items-center gap-2">
            <History size={20} /> History
          </h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <p className="text-sm opacity-50 italic">No past analyses yet.</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.timestamp}
                  onClick={() => {
                    setResult(item);
                    setInputText(item.text);
                  }}
                  className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-rasa-gold">{item.rasa.name}</span>
                    <span className="text-[10px] opacity-40">{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs line-clamp-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    {item.text}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {/* Controls */}
        <div className="fixed top-6 right-6 z-30 flex gap-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 glass-card rounded-full hover:scale-110 transition-transform"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-3 glass-card rounded-full hover:scale-110 transition-transform"
          >
            <History size={20} />
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
          <header className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block mb-4 p-3 rounded-full bg-rasa-gold/10 text-rasa-gold"
            >
              <Sparkles size={32} />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-serif text-rasa-ink mb-4 tracking-tight"
            >
              Rasa & <span className="text-rasa-gold italic">Reality</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-rasa-ink/60 italic text-lg"
            >
              Vedic Wisdom meets Modern Intelligence.
            </motion.p>
          </header>

          {/* Value Proposition */}
          <section className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Sparkles, title: "Emotional Clarity", desc: "Understand the soul of your content through the 9 Rasas." },
              { icon: ShieldCheck, title: "Fact Integrity", desc: "Detect hallucinations and factual inconsistencies instantly." },
              { icon: TrendingUp, title: "Higher Engagement", desc: "Optimize your words for resonance and authenticity." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="p-6 rounded-2xl glass-card text-center"
              >
                <item.icon className="mx-auto mb-4 text-rasa-gold" size={32} />
                <h3 className="font-serif text-xl mb-2 text-rasa-gold">{item.title}</h3>
                <p className="text-sm text-rasa-ink/70 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </section>

          {/* Audience Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {["YouTubers", "Writers", "Marketers", "Educators", "Spiritual Leaders"].map(tag => (
              <span key={tag} className="px-4 py-1.5 rounded-full bg-rasa-gold/10 text-rasa-gold text-xs font-bold uppercase tracking-widest border border-rasa-gold/20">
                {tag}
              </span>
            ))}
          </div>

          <div className="text-center mb-12 italic text-rasa-ink/60">
            "This tool changed how I write my scripts. – Rohan, YouTuber"
          </div>

          {/* Input Section */}
          <section className="mb-12">
            <div className="relative group">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your story, script, or caption here..."
                maxLength={5000}
                className="w-full h-64 p-8 glass-card rounded-3xl focus:border-rasa-gold outline-none transition-all resize-none text-lg font-sans leading-relaxed"
              />
              <div className="absolute bottom-6 left-8 text-xs text-rasa-ink/40">
                {inputText.length} / 5000
              </div>
              <div className="absolute bottom-6 right-6 flex gap-3">
                <button
                  onClick={handleClear}
                  className="p-3 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-2xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  title="Clear Text"
                >
                  <Trash2 size={20} />
                </button>
                <button
                  onClick={() => handleAnalyze()}
                  disabled={loading || !inputText.trim()}
                  className="bg-rasa-ink text-rasa-bg px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-rasa-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Invoking the Rasa...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span className="font-bold">Analyze</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 shadow-sm"
              >
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </section>

          {/* Results Section */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div 
                key={result.timestamp}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                className="space-y-8"
              >
                <div ref={resultsRef} className="space-y-8 p-4">
                  {/* Summary Card */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 rounded-2xl bg-rasa-gold/10 text-rasa-gold">
                        <Eye size={28} />
                      </div>
                      <h3 className="text-2xl font-serif">Vedic Summary</h3>
                    </div>
                    <p className="text-xl font-serif leading-relaxed text-rasa-ink/90 italic">
                      "{result.summary}"
                    </p>
                  </motion.div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Rasa Card */}
                  <div className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden group">
                    {isCached && (
                      <div className="absolute top-4 right-4 px-2 py-1 bg-rasa-gold text-white text-[10px] font-bold rounded">
                        CACHED
                      </div>
                    )}
                    <div 
                      className="absolute top-0 right-0 w-40 h-40 -mr-10 -mt-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"
                      style={{ color: RASA_COLORS[result.rasa.name] }}
                    >
                      <RasaIcon size={160} />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-8">
                      <div 
                        className="p-4 rounded-2xl"
                        style={{ backgroundColor: `${RASA_COLORS[result.rasa.name]}15`, color: RASA_COLORS[result.rasa.name] }}
                      >
                        <RasaIcon size={28} />
                      </div>
                      <h3 className="text-2xl font-serif">Dominant Rasa</h3>
                    </div>

                    <div className="mb-8">
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-5xl font-serif" style={{ color: RASA_COLORS[result.rasa.name] }}>
                          {result.rasa.name}
                        </span>
                        <span className="text-sm font-bold opacity-40">
                          {Math.round(result.rasa.confidence * 100)}% Confidence
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${result.rasa.confidence * 100}%` }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: RASA_COLORS[result.rasa.name] }}
                        />
                      </div>
                    </div>

                    <p className="text-rasa-ink/70 leading-relaxed italic text-lg">
                      "{result.rasa.explanation}"
                    </p>
                  </div>

                  {/* Hallucination Card */}
                  <div className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-4 rounded-2xl bg-rasa-gold/10 text-rasa-gold">
                        <ShieldAlert size={28} />
                      </div>
                      <h3 className="text-2xl font-serif">Reality Check</h3>
                    </div>

                    <div className="mb-8">
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-5xl font-serif capitalize">
                          {result.hallucination.severity}
                        </span>
                        <span className="text-sm font-bold opacity-40">
                          Score: {result.hallucination.score}/100
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${result.hallucination.score}%` }}
                          className={`h-full rounded-full ${
                            result.hallucination.score > 60 ? 'bg-red-500' : 
                            result.hallucination.score > 30 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">Questionable Statements</h4>
                      {result.hallucination.problematic_statements.length > 0 ? (
                        <ul className="space-y-3">
                          {result.hallucination.problematic_statements.map((stmt, i) => (
                            <li key={i} className="flex gap-3 text-sm text-rasa-ink/80 leading-relaxed">
                              <span className="text-rasa-gold shrink-0 mt-1">•</span>
                              <span>{stmt}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="flex items-center gap-3 text-green-600 font-medium">
                          <CheckCircle2 size={20} />
                          <span>Pristine factual integrity.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

                {/* Actions */}
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 px-8 py-4 glass-card rounded-2xl hover:bg-rasa-gold hover:text-white transition-all font-bold"
                  >
                    <Share2 size={18} />
                    <span>Copy Link</span>
                  </button>
                  <button 
                    onClick={handleExportImage}
                    className="flex items-center gap-2 px-8 py-4 bg-rasa-gold text-white rounded-2xl hover:opacity-90 transition-all shadow-md font-bold"
                  >
                    <Download size={18} />
                    <span>Export PNG</span>
                  </button>
                  <button 
                    onClick={handleTweet}
                    className="flex items-center gap-2 px-8 py-4 glass-card rounded-2xl hover:bg-[#1DA1F2] hover:text-white transition-all font-bold"
                  >
                    <Twitter size={18} />
                    <span>Tweet Result</span>
                  </button>
                </div>

                {/* Monetization */}
                <div className="mt-16 text-center border-t border-rasa-ink/5 pt-12">
                  <h2 className="text-3xl font-serif mb-4">Support the Wisdom</h2>
                  <p className="text-sm text-rasa-ink/60 mb-8 italic">
                    "Your support keeps this Vedic AI tool free for all creators."
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 mb-8">
                    <a 
                      href="https://buymeachai.ezee.li/divinesouljoy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-8 py-4 bg-[#FF813F] text-white rounded-2xl hover:scale-105 transition-transform shadow-lg font-bold"
                    >
                      <Coffee size={20} />
                      <span>🇮🇳 Buy me a Chai (UPI)</span>
                    </a>
                    <a 
                      href="https://paypal.me/jdas794" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-8 py-4 bg-[#0070BA] text-white rounded-2xl hover:scale-105 transition-transform shadow-lg font-bold"
                    >
                      <Globe size={20} />
                      <span>🌍 PayPal (Global)</span>
                    </a>
                  </div>
                  <p className="text-sm">
                    Want more power?{" "}
                    <button 
                      onClick={() => setShowProModal(true)}
                      className="text-rasa-gold font-bold underline hover:opacity-80"
                    >
                      Upgrade to Pro
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Newsletter */}
          <section className="mt-20 text-center glass-card p-12 rounded-[3rem]">
            <h4 className="text-3xl font-serif mb-4">Divine Insights</h4>
            <p className="text-rasa-ink/60 mb-8">Get weekly tips on Vedic storytelling and AI integrity.</p>
            <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="your@email.com" 
                className="flex-1 px-6 py-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-rasa-gold/20 outline-none focus:border-rasa-gold transition-colors"
              />
              <button 
                onClick={() => showToast("Welcome to the community!")}
                className="px-8 py-4 bg-rasa-ink text-rasa-bg rounded-2xl font-bold hover:bg-rasa-gold transition-all"
              >
                Join
              </button>
            </div>
          </section>
        </div>

        <footer className="text-center py-12 text-rasa-ink/40 text-xs tracking-widest uppercase">
          <p>Built with Vedic Sutras (Sutra 13, 58, 65) • Divine Earthly</p>
        </footer>
      </main>

      {/* Pro Modal */}
      <AnimatePresence>
        {showProModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative glass-card p-10 rounded-[3rem] max-w-lg w-full text-center"
            >
              <button 
                onClick={() => setShowProModal(false)}
                className="absolute top-6 right-6 text-rasa-ink/40 hover:text-rasa-ink"
              >
                <X size={24} />
              </button>
              <h2 className="text-4xl font-serif mb-8">Go Pro</h2>
              <ul className="text-left space-y-4 mb-10">
                <li className="flex items-center gap-3"><CheckCircle className="text-rasa-gold" size={20} /> Bulk Analysis (up to 50,000 chars)</li>
                <li className="flex items-center gap-3"><CheckCircle className="text-rasa-gold" size={20} /> Export as Professional PDF</li>
                <li className="flex items-center gap-3"><CheckCircle className="text-rasa-gold" size={20} /> Priority API Access (No waiting)</li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-rasa-gold" size={20} /> 
                  <span>Custom Rasa Training</span>
                  <button 
                    onClick={() => showToast("Custom Rasa Training is coming soon!")}
                    className="ml-auto text-[10px] bg-rasa-gold/10 text-rasa-gold px-2 py-1 rounded-full font-bold hover:bg-rasa-gold hover:text-white transition-colors"
                  >
                    LEARN MORE
                  </button>
                </li>
              </ul>
              <div className="bg-rasa-gold text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-sm mb-4">
                Coming Soon
              </div>
              <p className="text-xs text-rasa-ink/40">Contact us at support@divineearthly.com</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div 
              key={toast.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="bg-rasa-gold text-white px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-3"
            >
              <Sparkles size={18} />
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
