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
  Moon,
  Sun,
  Twitter,
  Copy,
  Camera,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  CloudRain,
  BookOpen,
  Coffee,
  Globe,
  Zap,
  Star,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

interface HistoryRecord {
  id: number;
  text: string;
  rasa_name: string;
  rasa_confidence: number;
  rasa_explanation: string;
  hallucination_score: number;
  hallucination_severity: string;
  hallucination_problematic_statements: string[];
  summary: string;
  timestamp: number;
  created_at: string;
}

const RASA_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Love: Heart, Laughter: Laugh, Compassion: Users, Fury: Flame, Heroism: Sword,
  Fear: Ghost, Disgust: Skull, Wonder: Eye, Peace: Wind, Surprise: Sparkles,
  Sadness: CloudRain, Calm: Sun, Courage: ShieldCheck, Mystery: Moon, Wisdom: BookOpen,
};

const RASA_COLORS: Record<string, string> = {
  Love: "#e11d48", Laughter: "#f59e0b", Compassion: "#10b981", Fury: "#ef4444",
  Heroism: "#3b82f6", Fear: "#6366f1", Disgust: "#8b5cf6", Wonder: "#d946ef",
  Peace: "#c9922a", Surprise: "#f472b6", Sadness: "#64748b", Calm: "#06b6d4",
  Courage: "#f97316", Mystery: "#4c1d95", Wisdom: "#059669",
};

const CACHE_PREFIX = "rasa_cache_";
const CACHE_TTL = 24 * 60 * 60 * 1000;
const MAX_CHARS = 5000;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function cacheKey(text: string): string {
  return CACHE_PREFIX + btoa(encodeURIComponent(text)).slice(0, 60);
}

function getCachedResult(text: string): AnalysisResult | null {
  try {
    const raw = localStorage.getItem(cacheKey(text));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { result: AnalysisResult; cachedAt: number };
    if (Date.now() - parsed.cachedAt > CACHE_TTL) {
      localStorage.removeItem(cacheKey(text));
      return null;
    }
    return parsed.result;
  } catch {
    return null;
  }
}

function setCachedResult(text: string, result: AnalysisResult) {
  try {
    localStorage.setItem(cacheKey(text), JSON.stringify({ result, cachedAt: Date.now() }));
  } catch {
    // storage full — ignore
  }
}

async function analyzeText(text: string): Promise<AnalysisResult> {
  const res = await fetch(`${BASE}/api/rasa/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Analysis failed");
  }
  return res.json();
}

async function fetchHistory(): Promise<HistoryRecord[]> {
  const res = await fetch(`${BASE}/api/rasa/history?limit=20`);
  if (!res.ok) throw new Error("Failed to load history");
  return res.json();
}

async function deleteHistoryRecord(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/rasa/history/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete");
}

function MandalaBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="mandala-rotate absolute -top-48 -right-48 w-[600px] h-[600px] opacity-[0.06]">
        <svg viewBox="0 0 400 400" fill="none">
          <circle cx="200" cy="200" r="190" stroke="#c9922a" strokeWidth="1.2"/>
          <circle cx="200" cy="200" r="155" stroke="#c9922a" strokeWidth="0.6"/>
          <circle cx="200" cy="200" r="115" stroke="#c9922a" strokeWidth="1.2"/>
          <circle cx="200" cy="200" r="75" stroke="#c9922a" strokeWidth="0.6"/>
          <circle cx="200" cy="200" r="35" stroke="#c9922a" strokeWidth="1.2"/>
          {[0,22.5,45,67.5,90,112.5,135,157.5,180,202.5,225,247.5,270,292.5,315,337.5].map((a) => (
            <line key={a} x1="200" y1="10" x2="200" y2="390" stroke="#c9922a" strokeWidth="0.4" transform={`rotate(${a} 200 200)`}/>
          ))}
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((a) => (
            <ellipse key={a} cx={200 + 115 * Math.cos((a * Math.PI) / 180)} cy={200 + 115 * Math.sin((a * Math.PI) / 180)} rx="22" ry="10" stroke="#c9922a" strokeWidth="0.5" fill="none" transform={`rotate(${a} ${200 + 115 * Math.cos((a * Math.PI) / 180)} ${200 + 115 * Math.sin((a * Math.PI) / 180)})`}/>
          ))}
        </svg>
      </div>
      <div className="mandala-rotate absolute -bottom-32 -left-32 w-[380px] h-[380px] opacity-[0.04]" style={{ animationDirection: "reverse", animationDuration: "90s" }}>
        <svg viewBox="0 0 300 300" fill="none">
          <circle cx="150" cy="150" r="140" stroke="#c9922a" strokeWidth="1"/>
          <circle cx="150" cy="150" r="100" stroke="#c9922a" strokeWidth="0.5"/>
          <circle cx="150" cy="150" r="60" stroke="#c9922a" strokeWidth="1"/>
          {[0,45,90,135,180,225,270,315].map((a) => (
            <line key={a} x1="150" y1="10" x2="150" y2="290" stroke="#c9922a" strokeWidth="0.4" transform={`rotate(${a} 150 150)`}/>
          ))}
        </svg>
      </div>
    </div>
  );
}

function ConfidenceBar({ confidence, color }: { confidence: number; color: string }) {
  return (
    <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2 overflow-hidden">
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${confidence * 100}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full" style={{ backgroundColor: color }}
      />
    </div>
  );
}

function HallucinationMeter({ score, severity }: { score: number; severity: string }) {
  const color = severity === "none" ? "#10b981" : severity === "low" ? "#f59e0b" : severity === "medium" ? "#f97316" : severity === "high" ? "#ef4444" : "#dc2626";
  const label = severity === "none" ? "Grounded" : severity === "low" ? "Low Risk" : severity === "medium" ? "Moderate" : severity === "high" ? "High Risk" : "Critical";
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="opacity-70">Hallucination Score</span>
        <span className="font-bold" style={{ color }}>{label}</span>
      </div>
      <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-3 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score * 100}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full" style={{ backgroundColor: color }}/>
      </div>
      <div className="flex justify-between text-xs opacity-50">
        <span>0 — Grounded</span><span>1 — Hallucinated</span>
      </div>
    </div>
  );
}

function ValueProposition() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Heart, label: "Emotional Clarity", desc: "Know exactly which emotion drives your message" },
          { icon: ShieldCheck, label: "Fact Integrity", desc: "Catch hallucinations and unsupported claims" },
          { icon: TrendingUp, label: "Higher Engagement", desc: "Align tone to audience for better resonance" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="glass-card rounded-xl p-4 text-center space-y-2">
            <div className="w-9 h-9 rounded-xl mx-auto flex items-center justify-center" style={{ background: "rgba(201,146,42,0.15)" }}>
              <Icon size={18} style={{ color: "#c9922a" }}/>
            </div>
            <p className="text-xs font-semibold leading-tight">{label}</p>
            <p className="text-[10px] opacity-50 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
      <div className="glass-card rounded-xl p-3 flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold opacity-60 flex-shrink-0">Who is this for?</span>
        {["YouTubers", "Writers", "Marketers", "Educators"].map((tag) => (
          <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "rgba(201,146,42,0.15)", color: "#c9922a" }}>
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function MonetizationButtons() {
  return (
    <div className="flex gap-3 flex-wrap justify-center pt-2">
      <a
        href="https://buymeachai.ezee.li/divinesouljoy"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
        style={{ background: "linear-gradient(135deg,#c9922a,#a67c21)", color: "white", boxShadow: "0 4px 14px rgba(201,146,42,0.35)" }}
      >
        <Coffee size={16}/>
        <span>🇮🇳 Buy me a Chai (UPI)</span>
      </a>
      <a
        href="https://paypal.me/jdas794"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg glass-card"
        style={{ color: "#c9922a" }}
      >
        <Globe size={16}/>
        <span>🌍 PayPal (Global)</span>
      </a>
    </div>
  );
}

function ResultCard({ result, isCached }: { result: AnalysisResult; isCached: boolean }) {
  const Icon = RASA_ICONS[result.rasa.name] || Sparkles;
  const color = RASA_COLORS[result.rasa.name] || "#c9922a";
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20`, border: `2px solid ${color}40` }}>
            <Icon size={28} style={{ color }}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-2xl font-serif" style={{ color }}>{result.rasa.name}</h3>
              <span className="text-sm opacity-60 font-mono">Rasa</span>
              {isCached && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide" style={{ background: "rgba(201,146,42,0.15)", color: "#c9922a" }}>
                  ⚡ Cached
                </span>
              )}
            </div>
            <p className="text-sm opacity-70 leading-relaxed">{result.rasa.explanation}</p>
          </div>
        </div>
        <ConfidenceBar confidence={result.rasa.confidence} color={color}/>
        <div className="flex justify-between text-xs mt-1 opacity-50">
          <span>Confidence</span><span>{Math.round(result.rasa.confidence * 100)}%</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={18} className="text-rasa-gold"/>
          <h3 className="font-serif text-lg">Hallucination Analysis</h3>
        </div>
        <HallucinationMeter score={result.hallucination.score} severity={result.hallucination.severity}/>
        {result.hallucination.problematic_statements.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold opacity-70">Flagged Statements:</p>
            {result.hallucination.problematic_statements.map((stmt, i) => (
              <div key={i} className="flex items-start gap-2 text-sm opacity-70">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-orange-400"/>
                <span className="italic">&ldquo;{stmt}&rdquo;</span>
              </div>
            ))}
          </div>
        )}
        {result.hallucination.problematic_statements.length === 0 && (
          <div className="flex items-center gap-2 mt-3 text-sm text-emerald-500">
            <CheckCircle2 size={16}/><span>No problematic statements detected</span>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-rasa-gold"/>
          <h3 className="font-serif text-lg">Vedic Synthesis</h3>
        </div>
        <p className="leading-relaxed opacity-80 italic font-serif">&ldquo;{result.summary}&rdquo;</p>
      </div>
    </motion.div>
  );
}

function HistoryItem({ record, onSelect, onDelete }: { record: HistoryRecord; onSelect: () => void; onDelete: () => void }) {
  const Icon = RASA_ICONS[record.rasa_name] || Sparkles;
  const color = RASA_COLORS[record.rasa_name] || "#c9922a";
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
      className="glass-card rounded-xl p-4 cursor-pointer hover:border-rasa-gold/40 transition-all group" onClick={onSelect}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
            <Icon size={16} style={{ color }}/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color }}>{record.rasa_name}</p>
            <p className="text-xs opacity-60 truncate mt-0.5">{record.text.slice(0, 80)}...</p>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1">
          <Trash2 size={14}/>
        </button>
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs opacity-50">
        <span>{new Date(record.timestamp).toLocaleDateString()}</span>
        <span>·</span>
        <span>{Math.round(record.rasa_confidence * 100)}% confidence</span>
        <span>·</span>
        <span className="capitalize">Hallucination: {record.hallucination_severity}</span>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("rasa_theme");
    if (savedTheme) setIsDarkMode(savedTheme === "dark");

    // Load from share URL
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("share");
    if (shared) {
      try {
        const decoded = JSON.parse(atob(shared));
        if (decoded.text) setInputText(decoded.text);
        if (decoded.result) { setResult(decoded.result); setIsCached(false); }
        showToast("Shared analysis loaded!");
      } catch { /* invalid share param */ }
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add("dark"); localStorage.setItem("rasa_theme", "dark"); }
    else { document.documentElement.classList.remove("dark"); localStorage.setItem("rasa_theme", "light"); }
  }, [isDarkMode]);

  useEffect(() => {
    if (showHistory) { fetchHistory().then(setHistory).catch(() => {}); }
  }, [showHistory]);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setIsCached(false);

    const trimmed = inputText.trim();

    // Check cache first
    const cached = getCachedResult(trimmed);
    if (cached) {
      setResult(cached);
      setIsCached(true);
      setLoading(false);
      showToast("Result loaded from cache!");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      return;
    }

    try {
      const data = await analyzeText(trimmed);
      setResult(data);
      setIsCached(false);
      setCachedResult(trimmed, data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = () => {
    if (!result) return;
    try {
      const encoded = btoa(JSON.stringify({ result, text: inputText }));
      const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
      navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!");
    } catch { showToast("Could not copy link."); }
  };

  const handleShareImage = async () => {
    if (!captureRef.current) return;
    showToast("Capturing screenshot…");
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: isDarkMode ? "#0f0a05" : "#fdf6ec",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `rasa-${result?.rasa.name ?? "analysis"}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      showToast("Image downloaded!");
    } catch { showToast("Screenshot failed. Try again."); }
  };

  const handleTweet = () => {
    if (!result) return;
    const confidence = Math.round(result.rasa.confidence * 100);
    const text = `My content's dominant Rasa is ${result.rasa.name} with ${confidence}% confidence. Check yours: ${window.location.origin}${window.location.pathname}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleExport = () => {
    if (!result) return;
    const content = `RASA & REALITY — VEDIC ANALYSIS REPORT\n${"=".repeat(50)}\n\nANALYZED TEXT:\n${result.text}\n\n${"=".repeat(50)}\n\nDOMINANT RASA: ${result.rasa.name}\nConfidence: ${Math.round(result.rasa.confidence * 100)}%\nExplanation: ${result.rasa.explanation}\n\n${"=".repeat(50)}\n\nHALLUCINATION ANALYSIS:\nSeverity: ${result.hallucination.severity}\nScore: ${result.hallucination.score.toFixed(2)}\n${result.hallucination.problematic_statements.length > 0 ? `\nFlagged:\n${result.hallucination.problematic_statements.map((s) => `  - ${s}`).join("\n")}` : "\nNo problematic statements found."}\n\n${"=".repeat(50)}\n\nVEDIC SYNTHESIS:\n${result.summary}\n\n${"=".repeat(50)}\nAnalyzed: ${new Date(result.timestamp).toLocaleString()}\nPowered by Vedic Sutras Framework`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rasa-analysis-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    showToast("Report downloaded!");
  };

  const loadHistoryItem = (record: HistoryRecord) => {
    setInputText(record.text);
    setResult({ rasa: { name: record.rasa_name, confidence: record.rasa_confidence, explanation: record.rasa_explanation }, hallucination: { score: record.hallucination_score, severity: record.hallucination_severity, problematic_statements: record.hallucination_problematic_statements }, summary: record.summary, text: record.text, timestamp: record.timestamp });
    setIsCached(false);
    setShowHistory(false);
  };

  const deleteRecord = async (id: number) => {
    try { await deleteHistoryRecord(id); setHistory((prev) => prev.filter((r) => r.id !== id)); showToast("Deleted."); }
    catch { showToast("Failed to delete."); }
  };

  const charCount = inputText.length;
  const charPct = charCount / MAX_CHARS;

  return (
    <div className={`min-h-screen relative ${isDarkMode ? "dark" : ""}`} style={{ backgroundColor: isDarkMode ? "#0f0a05" : "#fdf6ec", color: isDarkMode ? "#fdf6ec" : "#1a1108" }}>
      <MandalaBackground/>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs font-semibold tracking-widest uppercase text-rasa-gold mb-4">
              <Sparkles size={12}/> Vedic Sutras Framework
            </div>
            <h1 className="text-5xl md:text-6xl font-serif text-rasa-gold mb-2">Rasa &amp; Reality</h1>
            <p className="text-sm opacity-60 max-w-sm mx-auto leading-relaxed">
              Uncover the emotional essence and factual integrity of any text through three ancient Vedic algorithms
            </p>
          </motion.div>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-sm hover:border-rasa-gold/40 transition-all">
              <History size={15}/> History
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-9 h-9 rounded-xl glass-card flex items-center justify-center hover:border-rasa-gold/40 transition-all">
              {isDarkMode ? <Sun size={16}/> : <Moon size={16}/>}
            </button>
          </div>
        </header>

        {/* Value proposition */}
        <ValueProposition/>

        {/* Sutras legend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-4 mb-6 grid grid-cols-3 gap-3 text-center text-xs">
          {[{ num: "13", name: "Natya Shastra", role: "Rasa Detection" }, { num: "10", name: "Yoga Sutras", role: "Attention Filter" }, { num: "3", name: "Nyaya Sutras", role: "Logic Engine" }].map((s) => (
            <div key={s.num} className="space-y-1">
              <div className="font-serif text-lg text-rasa-gold">#{s.num}</div>
              <div className="font-semibold opacity-80">{s.name}</div>
              <div className="opacity-50">{s.role}</div>
            </div>
          ))}
        </motion.div>

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold opacity-70">Enter your text</label>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(201,146,42,0.15)" }}>
                <div className="h-full rounded-full transition-all duration-200" style={{ width: `${Math.min(charPct * 100, 100)}%`, backgroundColor: charPct > 0.9 ? "#ef4444" : charPct > 0.75 ? "#f97316" : "#c9922a" }}/>
              </div>
              <span className={`text-xs font-mono ${charCount > MAX_CHARS * 0.9 ? "text-orange-400" : "opacity-40"}`}>{charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()}</span>
            </div>
          </div>
          <textarea
            className="rasa-input" rows={6}
            placeholder="Paste any text — an article, a speech, a poem, a claim — and the Vedic engine will reveal its Rasa and assess its factual grounding..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAnalyze(); }}
          />
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mt-3 text-sm text-red-400">
              <AlertCircle size={15}/> {error}
            </motion.div>
          )}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs opacity-40">⌘ + Enter to analyze</p>
            <button onClick={handleAnalyze} disabled={loading || !inputText.trim()} className="rasa-btn rasa-btn-primary flex items-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin"/> Invoking the Rasa…</> : <><Send size={16}/> Analyze</>}
            </button>
          </div>
        </motion.div>

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card rounded-2xl p-8 text-center mb-4">
              <div className="mandala-rotate w-16 h-16 mx-auto mb-4 opacity-70" style={{ animationDuration: "3s" }}>
                <svg viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="45" stroke="#c9922a" strokeWidth="1.5"/>
                  <circle cx="50" cy="50" r="30" stroke="#c9922a" strokeWidth="1"/>
                  <circle cx="50" cy="50" r="15" stroke="#c9922a" strokeWidth="1.5"/>
                  {[0,60,120,180,240,300].map((a) => (<line key={a} x1="50" y1="5" x2="50" y2="95" stroke="#c9922a" strokeWidth="0.5" transform={`rotate(${a} 50 50)`}/>))}
                </svg>
              </div>
              <p className="font-serif text-lg text-rasa-gold mb-1">Invoking the Rasa…</p>
              <p className="text-sm opacity-50">Dharana · Nyaya · Rasa</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div ref={resultsRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-serif text-xl text-rasa-gold">Analysis Complete</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={handleShareLink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card text-xs hover:border-rasa-gold/40 transition-all">
                    <Copy size={13}/> Copy Link
                  </button>
                  <button onClick={handleShareImage} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card text-xs hover:border-rasa-gold/40 transition-all">
                    <Camera size={13}/> Share Image
                  </button>
                  <button onClick={handleTweet} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card text-xs hover:border-rasa-gold/40 transition-all" style={{ color: "#1d9bf0" }}>
                    <Twitter size={13}/> Tweet
                  </button>
                  <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card text-xs hover:border-rasa-gold/40 transition-all">
                    <Download size={13}/> Export
                  </button>
                </div>
              </div>

              {/* Capture zone for screenshot */}
              <div ref={captureRef} className="space-y-4" style={{ padding: "4px" }}>
                <ResultCard result={result} isCached={isCached}/>
                <div className="glass-card rounded-xl px-5 py-3 flex items-center gap-2 text-[10px] opacity-40 justify-center">
                  <Sparkles size={10}/> Rasa &amp; Reality · Vedic Sutras Framework · divineearthly.com
                </div>
              </div>

              {/* Monetization */}
              <MonetizationButtons/>

              <div className="text-center pt-1">
                <button onClick={() => { setResult(null); setInputText(""); setError(null); setIsCached(false); }} className="text-sm opacity-50 hover:opacity-80 transition-opacity underline">
                  Analyze new text
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs opacity-30 space-y-1">
          <p className="font-serif">Vedic Sutras Framework — 72 Sutras · 13 Upa-Sutras</p>
          <p>Built by Divine Earthly · support@divineearthly.com</p>
        </footer>
      </div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)}/>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative ml-auto w-full max-w-md h-full overflow-y-auto custom-scrollbar p-6"
              style={{ background: isDarkMode ? "#0f0a05" : "#fdf6ec" }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowHistory(false)} className="p-1 rounded-lg hover:opacity-60 transition-opacity"><ChevronLeft size={20}/></button>
                  <h2 className="font-serif text-xl">Analysis History</h2>
                </div>
                <span className="text-sm opacity-50">{history.length} records</span>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-16 opacity-40">
                  <History size={40} className="mx-auto mb-3"/>
                  <p className="font-serif">No analyses yet</p>
                  <p className="text-sm mt-1">Your analyses will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {history.map((record) => (
                      <HistoryItem key={record.id} record={record} onSelect={() => loadHistoryItem(record)} onDelete={() => deleteRecord(record.id)}/>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div key={toast.id} initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
              className="px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-3 text-sm"
              style={{ background: "linear-gradient(135deg,#c9922a,#a67c21)", color: "white" }}>
              <Sparkles size={15}/> {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
